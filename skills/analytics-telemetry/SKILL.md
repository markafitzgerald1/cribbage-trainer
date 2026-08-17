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
  and `analysis_index === 1`), not merely the first interactive exposure: a
  deep link, a history hydration, or a selection made before consent all
  reveal the full answer key, so any analysis after one of those is informed
  and must never be counted as first instinct. `analysis_shown` fires
  immediately when a complete discard exposes the answer, and
  `analysis_unshown` fires immediately when the panel closes; delaying either
  event would let an answer-influenced choice look unaided.
  `card_selected`/`card_unselected` (keep-toggle semantics: un-keeping selects
  for discard) are also immediate.
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
- The nonce resets on any hand replacement. Consent-gated `hand_started`
  records each new telemetry scope, including the initial hand, with its
  `initial`/`deal`/`manual`/`deeplink`/`history` source; if consent is granted
  after the initial hand appears, it records the current hand once at that
  point. `deal_clicked` remains specific to the Deal button. Payloads stay
  card-free: counts, indices, source, and the nonce only.
- The telemetry nonce must not consume the injected seeded generator, or
  seeded deep links would deal different hands.
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
- Jest enforces 100% branch coverage, so an unreachable defensive branch
  fails the build: `split("=")[0] ?? ""` cannot yield the fallback and cost a
  Docker run to discover, since `npm test -- --coverage=false` hides it.
  Prefer formulations with no dead branch (compute `indexOf` and `substring`
  from the same string) over a nullish fallback that can never fire.
- Analytics Settings must remain available after the first choice. Withdrawal
  stores `false`, removes visible `_ga*` cookies, and reloads the page so the
  previously loaded Google runtime is gone. Verifying events end to end needs a
  real `VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID`: before consent and after decline,
  verify there is no tag, data layer, Google request, or analytics cookie.
  After accepting, verify the consent update precedes `/g/collect` trainer
  events and an analytics cookie may be created.
