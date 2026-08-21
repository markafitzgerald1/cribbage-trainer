---
name: analytics-telemetry
description: Use before touching analytics consent, `gtag`, or trainer telemetry — `loadGoogleAnalytics`, `trackEvent`, `useDiscardTelemetry`, the consent-gated event contract, and the e2e guards that keep it honest.
compatibility: Requires a VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID for end-to-end verification.
---

# Google Analytics interaction events (issue #250)

**Description:** The consent-mode contract, the per-hand telemetry
bookkeeping that GA4 cannot reconstruct after the fact, and the two
load-bearing halves of the e2e setup that make "nothing was sent" assertions
mean anything.

Before creating, changing, querying, or auditing the GA4 BigQuery export, read
[`references/bigquery-export.md`](references/bigquery-export.md). It is the
operator runbook and decision record for region, retention, costs, ownership,
failure detection, and verification SQL; those console-only outcomes must never
be inferred from repository changes.

**Learnings:**

- `src/ui/loadGoogleAnalytics.ts` implements basic consent mode. Unanswered or
  declined consent must leave `dataLayer` undefined, inject no Google script,
  and send no Google request. Only accepted consent may initialize the tag; it
  queues denied defaults for analytics storage and all advertising consent
  types, grants analytics storage only, then queues `js` and the sanitized
  `config`. `src/ui/trackEvent.ts` remains the only path to
  `gtag("event", …)` and independently gates trainer events on
  `consented === true`. It also converts camelCase parameter keys to snake_case,
  keeping call sites clean under the `camelcase` lint rule. `src/ui/gtag.ts`
  pushes `arguments` objects — Google's tag silently ignores plain arrays.
- `src/ui-react/useDiscardTelemetry.ts` stamps the per-hand `deal_nonce`,
  1-based `analysis_index`, `is_first_analysis`, and `source`
  (`interactive`/`deeplink`/`history`) at emit time; GA4 cannot reconstruct
  "first analysis exposure per hand" after the fact, and #665's EV-loss metric
  keys off `is_first_analysis`. That flag means the _first exposure of this
  hand's ranked answers was this interactive one_ (`source === "interactive"`
  and no analysis of this hand has rendered yet), not merely the first
  interactive exposure: a deep link, a history hydration, or a selection made
  before consent all reveal the full answer key once they render, so any
  analysis after one of those is informed and must never be counted as first
  instinct. `analysis_shown` fires
  immediately when a complete discard exposes the answer, and
  `analysis_unshown` fires immediately when the panel closes; delaying either
  event would let an answer-influenced choice look unaided.
  `card_selected`/`card_unselected` (keep-toggle semantics: un-keeping selects
  for discard) are also immediate.
- What ends first-instinct status is an analysis the user could actually
  see, not one that was emitted. `analysis_shown` fires the moment a complete
  discard exists — deliberately, since delaying it would let an
  answer-influenced choice look unaided — but `ScoredPossibleKeepDiscards`
  reports through `onAnalysisRendered` only once ranked results are on
  screen, and the flag reads `source === "interactive" && !hasRenderedAnalysis`
  (#687). An exposure stuck on `Loading analysis...` or ending in
  `Failed to load analysis.` therefore leaves the next discard unaided, which
  is what it was. Ordering is what makes this safe: an exposure is emitted
  synchronously in the interaction handler while the reveal arrives from an
  effect after commit, so the exposure that causes a render is always stamped
  before that render can consume the flag.
- A consequence to carry into any consumer: more than one `analysis_shown` per
  hand can now be `is_first_analysis: true`, because a hand whose answers
  never rendered can hold several genuinely unaided discards. The flag means
  _this decision was unaided_, not _this is the one row per hand_. Take the
  lowest `analysis_index` among true rows for a `deal_nonce` when one row per
  hand is wanted.
- The measurement rule those flags exist to serve, agreed for #19/#719/#665:
  score the **first complete discard per hand, and only that**. Analysis
  fires only once two cards are committed, so with auto-analyze the first
  choice is already made before any ranked answer for that hand is visible —
  uncontaminated by construction, which is why measuring discard quality does
  not depend on #14 (opt-in deferred analysis). Exclude, or segment
  separately, any later discard on the same hand, any hand whose answers were
  revealed before the user chose at all (deep link, history hydration), and
  any seeded hand. The denominator is _hands chosen unaided_, not _hands
  seen_, so counted hands lag played hands for anyone who deep links or
  replays — surface that wherever the count is shown. Local statistics
  (#24/#19/#719) need the same rule against browser storage, since they must
  work with analytics declined: share this logic rather than duplicating it,
  because jscpd runs at 0%.
- Telemetry bookkeeping advances even while consent withholds transmission,
  because an unsent exposure still informs the next choice. Each tracked
  exposure therefore records whether it actually reached Google Analytics, and
  `analysis_unshown` is emitted only for an exposure whose `analysis_shown`
  was sent. Without that pairing, accepting consent mid-hand ships an
  `analysis_unshown` for an analysis GA4 never saw begin, and unshown counts
  exceed shown ones. The resulting index gap (the first transmitted
  `analysis_shown` of such a hand starts at 2) is intentional and honest: it
  records that an earlier exposure happened without transmitting anything
  about the pre-consent interaction itself.
- The identifier resets on any hand replacement. Consent-gated `hand_started`
  records each new telemetry scope, including the initial hand, with its
  `initial`/`deal`/`manual`/`deeplink`/`history` source; if consent is granted
  after the initial hand appears, it records the current hand once at that
  point. `deal_clicked` remains specific to the Deal button, and is emitted
  **after** the `hand_started` it belongs to: the event that opens a hand
  scope should be the first one carrying that scope's identifier, so "first
  event per hand" is a question about the data rather than about which call
  site ran first (#689). Payloads stay card-free: counts, indices, source,
  provenance, and the identifier only.
- `TrainerEventParams` is keyed by event name, so each event carries exactly
  its own parameters and `TrainerEventName` is `keyof` that map — a new event
  cannot be declared without declaring what it sends (#688). This is what
  makes `hand_started` with an `AnalysisSource`, or `analysis_shown` with a
  `HandStartSource`, a type error rather than merely wrong; both type-checked
  before. The name and its parameters travel as one correlated tuple
  (`TrainerEvent`), not as a generic pair: a generic infers the name as the
  whole union whenever a caller holds a widened `TrainerEventName`, which
  re-admits exactly the mismatch this prevents (Codex caught that on #731).
  The tuple is `readonly`, or a forwarder could assign a different name to
  index 0 and pass the pair on; and `trackEvent` takes the tuple apart inside
  its body rather than naming the parts as parameters, since naming them
  widens the pair back into independent types. Consumers forward the tuple
  rather than re-declaring a name and a payload; the hook's `emit` takes it as
  a rest parameter.
- Each payload also bans the parameters its event does not carry, as optional
  `never` fields derived from the union of every parameter key. Structural
  typing alone would let a larger payload stand in for a smaller one — an
  `analysis_shown` payload satisfies `deal_clicked`, and `Object.entries`
  would forward the surplus fields to Google Analytics — and an excess-property
  check does not catch it, because that only applies to fresh object literals
  and not to a payload held in a variable (Codex again, on #731).
- No type survives a payload built from a widened source — a spread of
  `Record<string, unknown>`, an `Object.assign`, a cast — so `trackEvent`
  also filters at runtime to the parameters its event declares. That list
  lives as correlated entries rather than an object keyed by event name,
  because those names are snake_case and would each need a `camelcase`
  exemption as literal keys, and it is applied by filtering rather than
  lookup so a name with no entry sends nothing instead of leaving a branch
  that can never run under the 100% coverage gate. The card-free payload
  invariant is now enforced, not merely declared. An event missing from that
  list would silently send nothing, so a type assertion makes its absence a
  compile error, and the spec proves its own payload table covers every event
  by comparing against the exported list rather than a second hand-written
  one.
- A consequence in the specs: `toHaveBeenLastCalledWith` cannot take an event
  name held in a variable any more, because its typed arguments cannot satisfy
  a correlated tuple. Compare the recorded call instead
  (`expect(trackEvent.mock.calls.at(-1)).toStrictEqual([...])`), and type a
  helper that covers only some events with the narrow union it means, such as
  `CardToggleEventName`. Both are the contract working: a helper claiming any
  event name can carry a discard count is claiming something untrue.
- `deal_nonce` is a `crypto.randomUUID()` value and identifies one telemetry
  hand **globally**, not merely within a browser session, so warehouse
  analysis may key on it across sessions and devices. The parameter name
  predates that contract and is kept for schema continuity. `randomUUID` is
  secure-context only, which every context this app runs in satisfies (HTTPS
  Pages, `localhost` dev and preview, jsdom's `http://localhost/`), so there
  is deliberately no fallback branch — one would be unreachable in production
  under the 100% branch-coverage gate. Serving the app from a plain-`http`
  LAN address would break it; use a PR preview for device testing.
- `generated_from_seed` marks hands a seeded session generated, because a
  seeded sequence can be replayed or memorized and its decisions would bias
  population skill statistics. The rule: a hand is seed-derived when the
  session was opened with a non-empty `seed` **and** the injected generator
  produced its cards — the initial hand when the URL carried no `hand`, and
  every Deal afterwards. A deep-linked or manually entered hand is not, even
  while the URL still carries `seed`; neither disturbs the generator, so the
  next Deal is seed-derived again. Derive it from the hand's lifecycle, never
  from the URL at emit time. The seed value itself never reaches this layer:
  `isSeededSession` in `randomNumberGenerator.ts` defines what counts as a
  seed for both the generator and telemetry, and only that boolean is passed
  in.
- Cards are not an identity for a hand. A seeded deal and a later hand-entry
  of the same six cards are two hands under one key, so anything keyed by
  cards answers one of them wrongly — both a card-keyed provenance record and
  the "same hand, keep the identifier" fast path in
  `reportHistoryNavigation`. `Trainer` therefore stamps the hook's
  `currentHandScope()` — `{ generatedFromSeed, handId }`, the handId being
  the hand's `deal_nonce` — into `history.state` beside `previousUrl` on
  every push and replace, and the `popstate` handler hands that record back
  to `reportHistoryNavigation`. A restore continues the current hand only
  when the entry names it (`entry.handId === state.dealNonce`); otherwise it
  starts a new scope carrying the entry's own provenance.
- Codex caught both halves of this on PR #728, one per review round: first
  the card-keyed provenance record, then the card-keyed fast path, which
  attributed a restored seeded hand to the manual scope that had replaced it.
  Reaching either takes only a normal workflow — retyping the hand you just
  played is what the Enter cards dialog is for, and
  `isUnchangedEnteredHand` only no-ops that when the role matches and nothing
  is discarded. Do not reintroduce a cards comparison in either place.
- An entry written before this document loaded records nothing, and a seeded
  session then assumes its own seed rather than guessing unseeded, which can
  only over-exclude from population statistics. Never invert that default.
  Why any of this matters: Back can land on a zero-discard state whose next
  complete discard is stamped `analysis_index` 1 with source `interactive` —
  `is_first_analysis` true — so a restored hand can still enter the
  first-instinct population and must carry its true provenance.
- Filtering contract for #665: population performance statistics take only
  rows with `is_first_analysis` true, `generated_from_seed` false, and
  `hand_start_source` in `initial` or `deal`. The first two conditions alone
  admit manually typed hands, which can also be unaided and unseeded. Seeded,
  deep-linked, manual, and history-restored hands are kept only as separately
  segmented practice data.
- GA4 BigQuery export stores a numeric parameter in `int_value` when its value
  is a whole number and in `double_value` otherwise. Every warehouse numeric
  read, after `UNNEST(event_params) AS param`, must use
  `COALESCE(param.value.double_value, CAST(param.value.int_value AS FLOAT64))`.
  Reading only `double_value` silently removes every zero-loss optimal discard,
  the largest single decision-quality group, as well as integer schema
  versions.
- `deal_nonce` belongs in BigQuery joins but never in GA4 custom definitions.
  Its per-hand UUID cardinality would immediately exceed dimension guidance and
  collapse GA4 reports into `(other)` rows.
- A repository runbook does not prove the export exists. A production operator
  must record the link, expiration, budget, query safeguards, first daily-table
  result, owner, and a negative-checked missing-table alert. GA4 cannot
  re-export data missed while billing or the link is unavailable, so detecting
  a gap is part of the data contract rather than optional operations work.
- Telemetry must not consume the injected seeded generator for identifiers or
  anything else, or seeded deep links would deal different hands. The hook
  has no access to it, and a `Trainer` test pins the generator to exactly six
  card draws plus one crib-role draw per render.
- The e2e build gets a test measurement ID from `playwright.config.ts`'s
  `webServer.env`, and `tests-e2e/blockGoogleAnalytics.ts` aborts every
  request to the Google hosts. Both halves are load-bearing. Without an ID
  `loadGoogleAnalytics` returns at its `!measurementId` check before reaching
  the consent check, so a "nothing was sent" assertion passes even when
  consent gating is completely broken; without the blocking, any test that
  stores consent would send CI traffic to Google. `analyticsConsent.spec.ts`
  therefore also asserts the tag _does_ load after Accept, which is what
  makes its silence assertions meaningful. Negative-check any change here by
  deleting the `consented !== true` condition and confirming the unanswered
  and declined tests fail.
- Analytics Settings must remain available after the first choice. Withdrawal
  stores `false`, removes visible `_ga*` cookies, and reloads the page so the
  previously loaded Google runtime is gone. Verifying events end to end needs a
  real `VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID`: before consent and after decline,
  verify there is no tag, data layer, Google request, or analytics cookie.
  After accepting, verify the consent update precedes `/g/collect` trainer
  events and an analytics cookie may be created.
