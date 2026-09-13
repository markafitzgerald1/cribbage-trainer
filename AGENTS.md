# AGENTS.md

## Project overview

- Two-player cribbage discard and play trainer built with Vite + React + TypeScript.
- **Architectural Constraint:** The scoring engine must rely exclusively on
  objective simulation, enumeration, or probability. AI agents are explicitly
  forbidden from introducing or using hard-coded heuristics, expert "rules of
  thumb", or subjective weighting in scoring algorithms. All expected values
  must be mathematically derived.
- Primary branch: `main`; active work often happens on feature branches.
- **Deriving a number is not enough; its inputs have to be derived too.** The
  constraint above reads as a rule about the scoring engine, and PR #797
  followed it to the letter while still violating it: a cut panel counted a
  crib by exact enumeration over concrete cards, two of which were chosen by
  hashing the dealt six, because no derivation for the opponent's discard
  exists here. Exact arithmetic over an invented input is an invented result.
  It was also silently inconsistent with the app's own figures —
  `expectedCribPointsTable.json` is generated against an opponent whose
  discard policy is trained by iterative best response, while the hash picks
  one concrete pair for a given deal with probability one — a single
  deterministic sample drawn from a uniform opponent model, not an
  expectation over one. So the panel set a lone pseudo-sample of the wrong
  opponent beside a converged average of the right one and invited the reader
  to compare them. Note the wording matters and has been got wrong three
  times on this same subject: "uniform random draw", then "spreads evenly",
  then "amounts to a uniform draw" all smuggled a distribution into what is
  one fixed card pair per hand. Before displaying any **scoring or
  expected-value** figure, name every input it consumes and say where each
  comes from: simulation, enumeration, probability, or **observed state** —
  a direct observation of the user or the world, such as what the user
  actually did, what the clock actually reads, or what a device actually
  reported. That fourth source is legitimate and common: an attempt count, a
  drill streak, a decision date, and the number of cards currently selected
  are all observations rather than derivations, and nothing here prohibits
  them. **Storage is transport, not provenance.** A value does not become
  observed by having been written down and read back; it keeps whatever
  provenance it had when it was created, and an invented one stays invented
  however many times it round-trips through `localStorage` or a JSON
  artifact. Persisting a figure is exactly how an illegitimate input would
  launder itself into a later feature that never saw where it came from.
  The rule bites on the other kind of input entirely — a
  value that is neither derived nor observed, but invented to stand in for
  one that was unavailable. A card nobody dealt, nobody observed, and no
  table models is not an input you have. Making the choice deterministic
  does not fix this; it only hides that a choice was made.
- **Product direction:** the roadmap is gated on two things the app has not
  yet earned from its own author: stickiness and trust. It does get played from
  time to time, but not often enough to call it sticky, and many of its
  recommendations still get double-checked rather than acted on — the math is
  trusted, the recommendations only somewhat trusted as advice so far. The
  objective is voluntary play several times a week even when not testing a
  change, and acting on what the app says without re-deriving it. Finding,
  retaining, and monetizing users is deliberately deferred until that holds. The
  loop being closed is: play a game, make authentic decisions, identify the
  decisions that cost the most expected value, understand them, practice the
  weaknesses, play again. So any proposed work faces two questions: **does this
  make playing, learning, diagnosing mistakes, or measuring improvement
  meaningfully better?** and **does it close the trust gap — is a recommendation
  legible enough to act on without checking it?** Work that answers neither
  ranks below work that answers either. Be suspicious in particular of technical
  work that deepens the simulator without improving that loop: implementation
  scalability is treated as mostly solved by tests, guardrails, and agents.

## Agent Skills & Tools

- This file is the shared contract for every harness used here: Codex and
  Antigravity read `AGENTS.md` directly, Claude Code reaches it through
  `CLAUDE.md`'s `@AGENTS.md` import, and GitHub Copilot reads it on both the
  cloud coding agent and in VS Code. Keep the content harness-neutral;
  anything true of only one tool belongs in that tool's own file
  (`CLAUDE.md`, `.github/copilot-instructions.md`).
- VS Code only applies `AGENTS.md` when the `chat.useAgentsMdFile` setting is
  enabled — it is off by default and `.vscode/` is git-ignored here, so it has
  to be turned on per machine. Without it, VS Code Copilot sees only
  `.github/copilot-instructions.md`.
- The skill files live in `skills/`, and every harness's native discovery
  path — `.claude/skills`, `.github/skills`, `.agents/skills`, and
  `.codex/skills` — is a symlink to that one directory. Do not "resolve" the
  apparent duplication by deleting symlinks or moving the real files into a
  dot-directory: each symlink is what makes a harness list the skill
  natively, and the real files stay outside a dot-directory so the lint
  globs keep covering them (see the next bullet). `.gitignore` excludes
  `/.claude/*` but re-includes `!/.claude/skills` for exactly this reason.
  All four are confirmed working on hardware: Claude Code, Copilot (CLI,
  desktop, and VS Code), Antigravity (app and IDE), and Codex (CLI and
  desktop) each list the repo's skills through their symlink, so every
  harness in use follows one.
- A skill's `SKILL.md` frontmatter `name` must equal its directory name.
  At least two harnesses — Copilot in VS Code and the Antigravity IDE, both
  checked 2026-09-08 — show the directory name and the frontmatter `name`
  together, so a skill whose two names differ reads as an outright
  contradiction in the UI rather than as two tools disagreeing about which
  one to show. Which name a harness prefers when it shows only one cannot be
  established from inside this repository: `test:skill-paths` keeps `name`
  and the directory identical for every skill, so no observation here can
  tell the two apart. `testing-storybook` declared
  `storybook-interaction-testing` and shipped exactly that contradiction.
  `npm run test:skill-paths` now asserts they match.
- `npm run test:skill-paths` guards that layout: each vendor path must be a
  relative symlink resolving to `skills/`, `skills/` itself must hold the
  real files, and every skill directory must contain a `SKILL.md`. Like
  `test:pages-content-merge` it runs as its own CI step rather than inside
  the Docker gate, because the Dockerfile's `COPY` allowlist deliberately
  excludes these dot-paths — so `npm run docker:build-and-test-all` alone
  will not catch a broken symlink. Those symlinks sit at `skills/` as a
  whole, so **adding a skill adds no symlink**: a new directory's only new
  surface is its `SKILL.md` and the frontmatter `name` matching it, and the
  Dockerfile already carries both `COPY skills/ ./skills/` and the
  whole-context `COPY . .` before lint, so it needs no copy-surface change
  either.
- This file keeps only what an agent can violate _without knowing it is in
  that domain_ — build-wide invariants, contribution rules, and the shape of
  the project. Guidance whose trigger is self-evident from the task lives in
  `skills/` and is loaded on demand, so a session pays for the areas it
  actually touches. Put a new durable learning wherever its trigger is: in a
  skill when the task announces itself (dependency work, e2e, telemetry,
  Pages), here when it does not. Decide that per **bullet**, not per
  section: a task-shaped section still carries rules that bind every PR, and
  extracting it wholesale buries them behind a trigger the agent who needs
  them never hits. The Dockerfile copy-surface rule (it fires for any new
  root-level config, not just dependency work) and the push-timing rules
  below (they fire for any PR, not just Pages work) were both extracted that
  way and had to come back.
- Read the file named below when its trigger applies rather than waiting for
  a skill listing to surface it. Symlink-following is not guaranteed in
  every harness, so these pointers are the floor that works everywhere —
  they load the same file the native path would. Read the skill **before**
  starting the work, not after a gate fails.
  - Before validating a build or chasing CI compliance, read
    `skills/make-it-green/SKILL.md`.
  - Before adding or changing Storybook stories or interaction coverage, read
    `skills/testing-storybook/SKILL.md`.
  - Before bumping dependencies, taking a major upgrade, or fixing an
    `npm run lint:audit` advisory, read
    `skills/dependency-maintenance/SKILL.md`.
  - Before writing or debugging a Playwright spec, regenerating screenshot
    baselines, or diagnosing a rendered-layout bug in the browser, read
    `skills/testing-e2e/SKILL.md`.
  - Before editing responsive CSS or a media query, changing the card
    grid, the discard/analysis results table, a control row, a modal, or
    a `.dynamic-ui` grid cell, or designing or debugging a control's
    selected, hover, disabled, or focus state, read
    `skills/ui-layout-and-interaction/SKILL.md`.
  - Before starting work on an issue, or when you triage or draft one,
    read `skills/working-an-issue/SKILL.md`.
  - Before touching analytics consent, `gtag`, or trainer telemetry, read
    `skills/analytics-telemetry/SKILL.md`.
  - Before shipping a user-facing feature whose usage you would want to know
    about, read `skills/analytics-telemetry/SKILL.md`, even when no analytics
    code is in scope.
  - Before changing the Pages workflows, the PR preview deploy, the
    `pages-content` branch, or `scripts/pagesContentMerge.mjs`, read
    `skills/pages-preview/SKILL.md`.
- A task that touches another of this author's repositories (for example
  `simulate-cribbage-games`, which generates the vendored tables below) must
  begin by reading **that** repository's `AGENTS.md`, and its `skills/` if it
  has them. Only this repository's contract is auto-loaded, so a sibling's
  tooling is invisible until read — and it usually already contains the thing
  you were about to build. A dependency-bump validation harness was written
  from scratch in `simulate-cribbage-games` before its own
  `scratch/verify_upgrade.py`, documented in its AGENTS.md, turned up doing
  the same job better.
- Keep authored guidance out of dot-directories. The lint gauntlet's globs
  (`cspell '**'`, `markdownlint .`, `prettier --check .`) silently skip them:
  a `SKILL.md` with two misspellings is flagged under `skills/` and passes
  unnoticed under `.agents/skills/`. Relocating docs to a tool-native dot
  path therefore costs spell and Markdown coverage unless those globs are
  widened in the same change.

## Setup

- Node: use version specified in `.nvmrc` (install via `nvm install` if available).
- Install deps: `npm install`.
- Run that install on the pinned Node. An older npm rewrites
  `package-lock.json` as a side effect of installing — npm 10 strips the
  `libc` fields npm 11 wrote, 75 lines of them, with no warning and no
  prompting from the task at hand. Check `git status` after installing and
  restore the file unless the lockfile change is the point of the work.

## Core commands

- Dev server: `npm start` (opens <http://localhost:5173>).
- Build: `npm run build`.
- Prod preview server: `npm run build` then
  `npm run start:production-preview` (opens <http://localhost:4173>).
- Storybook: `npm run storybook`; static build `npm run storybook:build`; serve
  static `npm run storybook:serve`.

## Tests and quality

- Full suite (lint + unit + e2e via Docker): `npm run docker:build-and-test-all`
  (preferred before merge).
- Unit/logic tests: `npm test` (uses Jest/Vitest as configured).
- Playwright e2e report viewer: `npx --no-install playwright show-report`.
- Lint: `npm run lint` (if present) or rely on the Docker test-all command above.
- Storybook coverage: run `npm run storybook:test:coverage`, then update the
  Vite `test.coverage.thresholds` block to the exact reported totals — the
  totals **Docker** reports, not the local run's. The two disagree by a
  branch or so, and a threshold set from the local number fails the build
  during `storybook:test:coverage` — a _build_ step, before any test runs —
  which reads as an unrelated breakage.
  **Not an arm64/amd64 split**, despite an earlier version of this bullet
  claiming one: `docker build --platform linux/amd64` (QEMU-emulated on an
  Apple Silicon host) reproduced the plain local number exactly, on the
  identical commit, while the ordinary arm64-native Docker build reported a
  branch lower — and both the amd64 and arm64 variants of the Playwright
  base image ship the identical Node build — checked directly by running
  `node --version` in each, via
  `docker run --platform linux/<arch> mcr.microsoft.com/playwright:<tag>`.
  Architecture cannot be the variable when both architectures agree with
  each other and disagree with the one thing that changed: whether Node ran
  inside this Dockerfile's container at all. The container's Node (baked
  into the base image, not `nvm`-selected from `.nvmrc`) was one patch
  behind the locally installed one when this was checked. Retune from
  whatever your own Docker build reports; do not assume a rerun will match
  a previous one exactly, and do not extrapolate a cause from a single
  comparison the way this bullet originally did.
- For focused Jest/debug runs, pass `--coverage=false` when you only need
  targeted test signal; global coverage thresholds can make otherwise passing
  `--runTestsByPath` suites exit nonzero.
- If `npm run docker:build-and-test-all` is interrupted after build, lint, and
  Storybook coverage have passed, rerun `npm run docker:run-e2e-only` against
  the built image to verify the Playwright tail before reporting final status.
- Never judge a validation run by piping through `| tail` or `| grep`: the
  pipe masks the command's exit code and a "61 passed" line can sit directly
  below a failed-tests list. Redirect to a log file, echo `$?`, and read the
  full summary (or use the shell's pipe-status array).
- A Docker build failing with `ENOSPC: no space left on device` (often
  surfacing mid-way, e.g. during `storybook:test:coverage`) usually means
  Docker Desktop's build cache has grown unbounded across many local rebuilds,
  not that the host disk is full. Check `docker system df`; if `Build Cache`
  reclaimable is many GB, `docker builder prune -af` (safe: only removes
  unused build layers, not tagged images or anything from other projects)
  typically frees tens of GB and lets the build proceed.

## Expected crib points table (vendored)

- `src/game/expectedCribPointsTable.json` is **not authored here**. It is a lean
  artifact generated by the sibling `simulate-cribbage-games` repo and published
  to its rolling `expected-crib-points` GitHub release.
- Refresh it with `npm run table:update`; never hand-edit or regenerate it in
  this repo.
- After refreshing, regenerate Jest snapshots (`npx jest -u`) and, if displayed
  values changed, the Playwright screenshots
  (`npm run docker:update-screenshots`), then review the diff.

## Expected play points table (vendored)

- `src/game/expectedPlayPointsTable.json` is generated by the sibling
  `simulate-cribbage-games` repository and published to its rolling
  `expected-play-points` release.
- Refresh both tables with `npm run table:update`, or use
  `npm run table:update:play` for only the pegging artifact.
- The browser may look up and combine the shipped means, but must not perform
  pegging Monte Carlo, game-tree search, or policy improvement.
- Shared expected-points table loaders use `null` to represent absence. Do not
  use truthiness checks for cached or injected tables, because generic loader
  callers may validly load falsy values such as `0`, `""`, or `false`.

## Interaction design and visual-state debugging

Control naming, native form semantics, hiding a control that must stay
focusable, chart SVG roles and hit testing, locking a control with
`disabled`, and the practice drill's history and storage-staleness rules
moved to `skills/ui-layout-and-interaction/SKILL.md`. These two stay because
an agent breaks them without knowing it has entered this domain.

- Keep visible and aria labels mutually non-substring across controls, even
  when only renaming one. Playwright's `getByRole` name match is a
  case-insensitive substring, so a new label that contains another control's
  name breaks locators in specs that were never touched (see
  `skills/testing-e2e/SKILL.md` for the collisions this has already caused).
- CSS modules scope only class selectors: a bare element selector in any
  `*.module.css` (e.g. `button + button`) compiles to a global rule that
  leaks into every other component. One such rule indented all but the
  first card-grid button, making the Ace of Spades look wider than its
  peers. When one element of a repeated set renders offset or sized unlike
  its siblings, diff `getComputedStyle` margins between siblings first,
  then hunt for element-only rules in unrelated module files and qualify
  them with a component class.

## Responsive layout invariants

The two-mode aspect-ratio contract, the single card design, the rem-floor
traps, `.dynamic-ui` positional-child placement, and the hardware-first
measurement rules moved to `skills/ui-layout-and-interaction/SKILL.md`.
These two stay because they govern what a measurement is evidence for, so
they bind any PR that makes a claim about a phone or ships a guard.

- Desktop engines do not model the mobile viewport, in two independent ways,
  and each has already produced a wrong fix. First, Chrome for Android has a
  toolbar that shows and hides; no desktop engine does, so `100%`, `100svh`,
  and `100dvh` all resolve to the same number in every project CI runs, and
  no headless test can distinguish them. Second, Android Chrome scrolls
  content that overflows the app box while this repo's fixed-height chain
  (`html`, `body`, `#trainer`, `.app` all set `height`) does not on desktop:
  at 839x323 with a 26px root font the consent controls overflow the viewport
  by 72px and `scrollTo` moves nothing on desktop, yet the same overflow
  scrolls into view and stays clickable on a Pixel 9a. Treat any emulated
  measurement of scroll behavior or viewport height as evidence about
  desktop only. Reproduce on hardware before concluding anything about a
  phone, and say in the PR which claims rest on emulation.
- A guard that passes on the branch introducing the regression is guarding
  the wrong invariant. The reverted `100svh` app-box change (#701, PR #702,
  recounted in `skills/ui-layout-and-interaction/SKILL.md`) shipped with a
  new e2e assertion that the app root does not render past the viewport; it
  passed on the broken branch, because `svh` made the box smaller rather
  than larger. When adding a guard alongside a fix, check it fails for the
  bug being fixed, not merely that it fails for some sabotage of the code
  under it.

## URL analysis state (deep linking)

- `src/ui/urlAnalysisState.ts` is the single source of truth for the
  URL-parameter contract (`hand`, `role`, `discard`, `sort`, `analysis-sort`,
  `seed`). Its parse functions validate strictly but fail soft (return
  `null`, never throw), and serialization writes normalized card text (rank
  label + suit letter) in deal order — never generated object identity or
  sort-dependent keys.
- URL param values are a public compatibility surface: shared links must keep
  working. Change them only additively and keep parsing backward compatible.
- History semantics in `Trainer`: before changing state, interactions check
  whether the _current_ state is stable (`isStableDiscardState`: zero
  discards or a complete discard). Stable states are preserved with
  `pushState`; transient single-card selections are `replaceState`d away, so
  history only ever holds stable states and Back steps 2 discards → 0 →
  prior hand. Analysis-table sort changes can only happen in a stable
  (complete-discard) state, so each pushes. Each pushed entry stores the
  covered entry's URL in `history.state.previousUrl`; when a transient
  settle converges back onto that URL, `Trainer` calls `history.back()`
  instead of `replaceState` so a mind-change toggle does not leave an
  adjacent duplicate entry that turns Back into a no-op (the abandoned
  transient survives only as a Forward entry). `replaceState` must pass
  `window.history.state` through — not `null` — so `previousUrl` survives
  settling. `replaceState` also normalizes the URL on initial mount, and a
  `popstate` listener re-hydrates full state. Do not replace-away a state
  the user could want to Back to:
  replacing on the first interaction overwrote the only history entry and
  made Back exit the site. The role random draw is skipped only when a valid
  `role` param is present, preserving seeded-workflow behavior.
- `discard` values intentionally repeat cards that are also in `hand`:
  `hand` stays the full six dealt cards so deal order (and deal-order sort)
  survives, `hand` remains valid standalone if `discard` is dropped, and the
  subset check turns any drift between the two params into a rejected
  `discard` instead of a silent error.
- **The injected `generateRandomNumber` is one shared positional stream, and
  several places already draw from it.** Every draw advances it, so a
  consumer changes what a seeded link deals from that point on, and nothing
  fails loudly when it does. Known call sites, as a starting inventory
  rather than a closed list: `Trainer`'s own `useState` initializer, which
  calls `dealHand(generator)` and then `randomCribRole(generator)` on a
  non-deep-linked first render; `useDealHand`, which repeats that pair for
  every later deal; and `usePracticeDrill`'s `drawNext`, which samples the
  mistake queue. So starting an automatic drill really does shift the next
  seeded deal, and that is shipped behavior rather than a latent bug: state
  the exception rather than writing this rule as an absolute, which an
  earlier draft did and which the shipped flow already contradicted.
  **Re-derive that inventory by grep before relying on it** — an earlier
  draft named two of the three and would have sent a seed-contract audit
  past the startup draws entirely.
  The rule for anything **new** is therefore not "never draw" but "do not
  add another consumer without deciding what that does to the seed
  contract". Two ways to avoid it: the telemetry `deal_nonce` takes its own
  source (`crypto.randomUUID`, see `skills/analytics-telemetry/SKILL.md`),
  and **deriving** a value from the six dealt cards avoids the stream while
  also making the value stable per hand. A memoized draw's value depends on
  where the shared stream happens to sit when it draws, and that position is
  not persisted anywhere. On a fully serialized seeded link — `hand`, `role`
  and `seed` all present — `Trainer` short-circuits both startup draws, so a
  reload rebuilds the same generator at position zero and a memoized
  consumer at a fixed call site does come back the same; the earlier claim
  here that F5 is a re-roll button was wrong about exactly the case the seed
  contract is for. What moves the value is the position moving: Back
  navigation, or the first transition from a seed-only URL to a serialized
  hand, where `dealHand(generator)` runs and advances the stream. A pure
  function of the six dealt cards has no position to depend on, so it
  settles the same value across a reload, a shared link, a Back, and a
  practice-drill replay alike. Determinism alone does not make a derived value
  legitimate, though — see the derived-inputs rule under Project overview,
  which is what withdrew PR #797 after its derivation had solved exactly
  this hazard. Guard a new consumer with an e2e test that deals twice under
  one seed with that feature exercised and again without it, and
  negative-check the guard against a build that does consume a draw. Keep
  the practice drill out of that comparison, or it fails on shipped
  behavior instead of on the feature under test.

## Lint gauntlet interplay (agent checklist)

- Every lint task is glob-driven, so a file the Docker image never received is
  not an error: it matches nothing and the task still reports success. That is
  how `tests-e2e/` and `playwright.config.ts` went unchecked for the life of
  the gate (#703) while all ten tasks printed green. Never infer coverage from
  a passing run — compare file sets. `npm run lint:cspell -- --verbose`
  prints an `n/total` line per file; the image's total must **match** a
  clean checkout's (built with `git archive HEAD | tar --extract` into a
  temp dir), not any fixed number — it was 208 at #703, 308 at #763, and
  grows with the repo. When scripting that comparison: cspell right-aligns
  the counter (strip leading whitespace, or an `^[0-9]` anchor drops files
  numbered below 100) and `--no-progress` hides the per-file lines
  entirely — both yield a plausible wrong count rather than an error.
- Two spell checkers with **different base dictionaries** run in lint:
  eslint's `spellcheck/spell-checker` (`skipWords` in `eslint.config.mjs`;
  `--max-warnings 0` makes its warnings fail CI) and cspell (`.cspell.json`,
  whose `ignorePaths` — not `.gitignore` — sets its sweep). A new word may
  trip one, both, or neither — run each checker and add the word only where
  it is actually flagged.
- `jest/no-hooks` forbids `beforeEach`/`afterEach`. Use setup helpers called
  at the top of each test, and `try`/`finally` with `spy.mockRestore()` for
  spies (see `index.test.tsx` for the established idiom).
- Custom `expect*` test helpers must be registered in `eslint.config.mjs`
  under **both** `jest/expect-expect` and `jest/prefer-ending-with-an-expect`
  `assertFunctionNames`, or tests using them fail lint.
- `sort-imports` orders declarations case-sensitively by first imported
  member (uppercase before lowercase) with multi-member imports before
  singles; merging a member into an existing import can force reordering.
- With jscpd at 0% and `minTokens: 22` (roughly two repeated statements),
  near-identical test blocks are the most common trip-up: as soon as a
  setup or assertion pattern of two-plus statements appears twice, extract
  it into a named helper (e.g. a click-and-assert or render-with-props
  function) rather than waiting for the jscpd failure.
- jscpd normalizes identifiers and literal values, so two blocks whose only
  differences are variable names or string/number/boolean literals still
  count as clones — enumerated `<Trainer …={…}>` prop lists in two files, or
  two tests differing only in hand strings and expected flags, all trip it.
  Break clones structurally: extract param-builder or scenario helpers,
  derive prop types with `Partial<Pick<…>>` instead of re-declaring members,
  merge near-identical tests into `it.each` (object cases with `$name`
  titles stay within `max-params`), or vary one mid-list expression (e.g. a
  genuinely needed `?? null`) to split the token run.
- `max-lines` caps a file at 520, tests included, so a long-lived spec
  eventually has to split rather than grow. Splitting one means extracting
  its setup and assertion helpers into a `*.test.common.ts` module both
  specs import, because jscpd at 0% rejects re-declaring them; the new
  module must also join `jest.config.json`'s `collectCoverageFrom`
  exclusions, or its helpers count toward the 100% function threshold from
  whichever spec happens not to use them.
- Treat that 520 as frozen: a `max-lines` failure means split the file, never
  raise the cap. It has already ratcheted 343 → 517 → 520, each bump riding
  along inside a feature commit, so the number now equals the largest file in
  the repo exactly and has no slack left. Raising it is invisible in review
  and buys one file's growth at the cost of the only pressure that produces
  the extraction above. The same applies to `max-lines-per-function`
  (266 → 473 → 490).
- Jest enforces 100% branch coverage, so an unreachable defensive branch
  fails the build: `split("=")[0] ?? ""` cannot yield the fallback and cost a
  Docker run to discover, since `npm test -- --coverage=false` hides it.
  Prefer formulations with no dead branch (compute `indexOf` and `substring`
  from the same string) over a nullish fallback that can never fire.
- The Dockerfile builds its lint surface and its test/build surface from
  different copies. `COPY . .` immediately before `RUN npm run lint` hands lint
  the entire build context, so no file can be missing from the gate; the
  earlier allowlisted `COPY`s exist only to keep the `npm test` and
  `npm run build` layers cacheable, so a new root-level config those two steps
  need (`babel.config.json`-class, not `.nsprc`-class) still has to join that
  line. Two placement rules keep this working: lint stays the last step, so the
  whole-context copy invalidates nothing but the lint layer, and anything
  `.gitignore` ignores must be listed in `.dockerignore` too, or local-only
  junk lints inside Docker while never reaching CI.
- **A generated directory needs more exclusions than it looks, and the
  count is not the useful part — the inventory is.** The ignore lists are
  `.gitignore`, `.dockerignore`, `.prettierignore`, `.stylelintignore`,
  `.markdownlintignore`, `.cspell.json`'s `ignorePaths`, and
  `eslint.config.mjs`'s `ignores`; **`tsconfig.json`'s `exclude` belongs on
  the same list and is not an ignore file at all.** It currently includes
  `**/*.ts` and `**/*.tsx` while excluding only `dist`, so a generated
  directory holding any TypeScript fails `lint:tsc` — and therefore
  `verify:fast` — no matter how many ignore files name it. Treat the list
  above as a starting inventory to check against the verification commands
  themselves, not as a closed set of seven: two successive drafts of this
  bullet called it exhaustive and it was not either time. Add an entry
  wherever that tool can reach inside the directory. Do not infer the rule
  from the lists already here, which are not exhaustive: `dist/` and
  `storybook-static/` are each absent from lists whose tool never matches
  anything inside them, so a missing entry is not evidence that one is
  unnecessary. Err toward adding, because the costs are lopsided. A
  redundant entry is dead config; a missing one broke `verify:fast`, and
  therefore the pre-commit hook, on one developer's machine — leaving
  `playwright-report/` and `test-results/` unlisted meant running the e2e
  suite locally produced thousands of lint errors out of Playwright's
  bundled third-party JavaScript and CSS. No gate can catch that, because
  the `Dockerfile` excludes both paths from Docker and CI alike.
- `no-bitwise` is on across `src/`, so hashing and mixing arithmetic cannot
  reach for `^`, `>>>` or friends the way the reference implementations all
  do. Stay in modular arithmetic instead: a multiplier and prime modulus
  whose largest intermediate product still fits an exact double needs no
  bit-level step. Reformulating beats a disable, which is prohibited here
  anyway.
- `react/hook-use-state` rejects `const [x] = useState(init)`. For
  initialize-once mutable hook state, seed an eager
  `useRef(create(...))` instead (re-render results are discarded), and keep
  latest-prop reads for timer callbacks in a ref updated by an effect.
- `no-undefined` is on everywhere, so an optional prop cannot default to the
  `undefined` literal. With `plugin:react/all` also demanding a `defaultProps`
  entry, the working idiom is `prop?: T | null` with `= null` in the
  destructure and `defaultProps: { prop: null }`. Intersecting or `extends`-ing
  a shared props interface confuses the plugin's prop-types detection
  (`default-props-match-prop-types` fires with "no corresponding propTypes");
  keep the members inline and collapse a jscpd clone between two such prop
  lists by naming the field types (`type StartDrillHandler = …`) and ordering
  the two members differently in each file.
- `react/jsx-handler-names` only checks handler values that are **member
  expressions** (`props.onFoo`, `drill.onFoo`) passed to a JSX `onX` attribute
  — it wants those to start with `handle`. A plain local identifier is not
  checked (`checkLocalVariables` defaults off), so destructure the handler
  into a local, or return it from a hook already named `handleX`, before the
  JSX. Building a plain object literal from `drill.onFoo` fields is fine; only
  JSX attributes are inspected.
- The test/story ESLint override (`files: ["**/*.test.ts*", …]`) turns off
  `react/jsx-no-bind` but **not** `react/jsx-props-no-spreading`. Inline
  arrows in JSX are fine in specs and stories; `{...props}` spreads are not,
  even in a render helper — build the element with explicit attributes.
- Every new `*.module.css` needs a hand-written `*.module.css.d.ts` sidecar
  listing the camelCased class names. There is no generator in
  `vite.config.js`; the `declare module "*.css"` fallback in `styles.d.ts`
  types the import as `any`, which `@typescript-eslint/no-unsafe-member-access`
  then rejects on every `classes.x`.
- Storybook coverage (`vite.config.js` `test.coverage.thresholds`, ~88%) is a
  gate separate from Jest's 100%. A hook or helper covered only by Jest drags
  the browser-mode aggregate below threshold; the fix is a story that drives
  the feature end to end — a `Trainer` story whose `play` seeds `localStorage`
  and clicks through the flow lifted `usePracticeDrill` 45%→80% and
  `practiceLedger` 19%→80%. Retune the numbers only from a Docker
  `storybook:test:coverage` run, never the local one.

## Code style and conventions

- TypeScript/React with Vite; keep types sound.
- Avoid single unconstrained generic arrow functions such as `<T>(...) => ...`
  in `.ts` files: with Babel's React and TypeScript presets both enabled,
  Babel 8 parses the type parameter as JSX, the repo's Prettier removes the
  TSX-style disambiguating comma from `.ts`, and lint rejects a neutral
  `extends unknown` constraint. Prefer a named generic function expression or
  declaration, which every Babel generation parses consistently.
- Every React component should have a corresponding Storybook story file
  (`ComponentName.stories.ts` or `.tsx`).
- Follow existing ESLint/Prettier configs; avoid introducing non-ASCII unless justified.
- Prefer `--fix` flags (e.g., `eslint --fix`, `prettier --write`) over manual
  code fixes for auto-fixable lint and formatting issues.
- **ESLint:** There is a strict prohibition against file-scoped `eslint-disable`
  comments. If a rule is violated, the agent must fix the code or update the
  global config. Do not automate disabling lint rules; only a human developer
  may request disables.
- **Duplicate Code (`jscpd`):** Duplication must be resolved via general
  architectural refactoring (e.g., extracting helper functions, extracting React
  components, or interface inheritance via `extends`/`Omit`). Explicitly forbid
  using `/* jscpd:ignore */` for business logic or UI rendering; reserve ignores
  strictly for unavoidable boilerplate like import blocks.
- **React Depth:** To satisfy strict `react/jsx-max-depth` limits without
  violating `react/no-multi-comp`, agents must extract layout markup into
  internal `renderX` helper functions (e.g., `renderTableBody()`) rather than
  declaring multiple React components in a single file.
- Never use inline `CSpell:ignore` comments; instead add words to `.cspell.json`.
- Prefer small, focused commits; summarize why changes are needed.
- Prefer a long autonomous run to frequent check-ins. Work through review
  rounds, gate failures, and the follow-up fixes they produce rather than
  reporting each one and waiting; batch anything you genuinely need answered
  into one message. Interrupt only when proceeding would be unsafe, or when a
  wrong assumption would waste the work rather than cost an edit. The time an
  agent runs unattended is time its human spends on something else, so a
  question that could have been an assumption plus a note in the PR is more
  expensive than it looks.
- Only comment on the "why" behind code; strongly prefer meaningful test names,
  function names, and variable names to comments in code. Do not add redundant
  comments explaining self-evident code.
- Extract duplicated object literals (like `{ exact: true }`) into variables to
  reduce code duplication.
- When formatting signed expected values, round to display precision before
  applying sign or minus-glyph formatting (whether a leading `+` or `-`), so
  values that round to zero display as a plain `0.00`, never `+0.00` or `-0.00`.
- Use long-form flags for command-line tools (e.g., `git commit --message` not
  `git commit -m`, `ls --all` not `ls -a`) to improve readability and
  understanding.
- Hard-wrap Markdown to 80 characters per line **only in files committed to
  this repository** (`AGENTS.md`, `README.md`, `skills/*/SKILL.md`, …), where
  strict markdownlint rules require it.
- **Never hard-wrap anything written into the GitHub UI**: issue bodies, PR
  bodies and descriptions, issue/PR comments, and review-thread replies. Write
  each paragraph and each list item as one long line and let GitHub wrap it.
  Manual breaks there render as ragged half-width text that is harder to read
  and painful to edit. This is the single most repeated agent mistake in this
  repository, because the 80-column habit carries over from the committed
  Markdown rule directly above; the two rules apply to disjoint sets of text,
  so decide which you are writing before the first line. Only commit messages
  share the wrapped style (72 columns, per the commit convention below).
- When comparing numbers for readers (e.g. before/after coverage
  thresholds), label each value and align the comparison (a small table or
  `name: old → new` lines); never two bare slash-separated lists.

## GitHub PR Reviews

- When resolving GitHub PR feedback, use thread-aware review data instead of
  relying only on flat PR comments.
- The Codex GitHub connector reviews the current head when a PR comment says
  `@codex review` (post it with an agent-attribution prefix). When Codex
  quota is exhausted it replies "usage limits reached" instead of reviewing.
- Codex auto review and automatic Copilot review are on (since 2026-09-07),
  so the per-head Codex round fires on its own and you rarely post
  `@codex review` yourself. The discipline is unchanged: iterate until a
  round reports no issues, address every finding, resolve every thread.
  Before asking a human to look, confirm a clean Codex round landed on the
  exact head they will read, and request one by hand if it is missing (smart
  detect skips heads unpredictably). The wait-for-CI ordering in the gate
  rule binds your manual requests, not the automatic round. The budget here
  is deliberately large because Codex is the adversarial check on agent
  work, and successive rounds earn their cost — on #728 the second round
  found a defect in code the first round had passed, and only the third came
  back clean. Copilot's low-effort reviews are similarly plentiful; its
  medium-effort reviews are the scarce resource, so spend those
  deliberately.
- A Copilot review request via the REST `requested_reviewers` endpoint can
  succeed while the eventual "review" is only a COMMENTED stub saying the
  requester reached their Copilot quota. Read the review body before
  claiming a Copilot review happened.
- To find PR review threads without individual review URLs, use any available
  GitHub integration or the `gh` CLI for the repository and PR number.
- **The two reviewers can contradict each other. Reach for this repository's
  own written rule before the more recent comment — but a measurement beats
  both.** On PR #797 Copilot objected to a `rem` floor on a font size as the
  rem-floor trap, while Codex asked for that same element to be `rem`-sized
  so it would follow the device font-size setting. The tie first went to
  `skills/ui-layout-and-interaction/SKILL.md`, which records rem-floored
  sizing overflowing real phones, and the element got an absolute floor.
  Measuring it showed that was the wrong call: in side-by-side mode a larger
  root font widens the `min-content` left column, which narrows the container
  a right-hand panel's `cqw` sizes read, so an enlarged accessibility setting
  made the explanatory copy _smaller_ — 13.78px to 12.11px at a 28px root.
  **That measurement is where this bullet stops, and it must not be read as
  overturning the skill.** `skills/ui-layout-and-interaction/SKILL.md` still
  says that _any_ uncapped rem lower bound inflates on a phone above default
  font size, `clamp(1rem, …)` included, and to cap it with a viewport unit —
  and that rule was earned on real hardware, where an uncapped floor put the
  consent buttons out of reach while every emulated check passed. The
  scroll-container argument for exempting scrollable explanatory text is
  plausible and was never tested on a phone, because PR #797 was withdrawn
  before it got there. So the skill's rule stands, this paragraph records a
  measurement that complicates it, and **#802 is what decides between them**
  — against a hardware measurement, which neither of these has for the
  exception. An agent doing responsive work should follow the skill and
  treat this as an open question, not as permission. **Do not summarize what the
  app does today as a list of surfaces that scale and surfaces that do
  not** — two drafts of this paragraph tried, and both were wrong in
  opposite directions. The behavior is per **declaration**, and often per
  **mode**, so read the rule rather than guessing from the component:
  - a plain `rem` size always follows the setting (most dialogs, the card
    picker, the practice panel in portrait);
  - `clamp(1rem, <cqw>, <vw>)` follows it **above a threshold**, because
    `clamp` returns its minimum whenever that minimum exceeds its maximum —
    so the analysis rows and headers in side-by-side mode do grow once a
    scaled `1rem` passes `--medium-text-font-size-landscape`;
  - `min(<rem>, <vw>)` **stops** following as soon as the viewport term is
    the smaller — the practice drill panel in landscape;
  - a size derived only from `--medium-text-font-size-portrait` or
    `-landscape` never follows, both being `vw`;
  - a fixed `px` size never follows either (the decision-quality chart's
    axis labels).

  One component can appear in several of those lists at different viewport
  sizes, which is exactly why the per-surface summary keeps coming out
  false.
  Two things to take from it. Answer the loser on its thread with the rule
  you followed, so the next round does not re-raise it as if unconsidered.
  And when a durable note like this one records a decision that a later round
  reverses, go back and rewrite it rather than leaving both versions
  standing: Codex caught an earlier draft of this very paragraph still
  describing the superseded absolute floor.

- A bot's login differs between the two GitHub APIs: REST reports
  `chatgpt-codex-connector[bot]` where GraphQL reports
  `chatgpt-codex-connector`. Filtering REST results on the GraphQL spelling
  matches nothing and returns a confident zero, which reads as "no review
  yet" rather than as a broken filter. When polling for a review round, also
  bound the query by time or comment id: counting a bot's comments without one
  matches a round from days ago and reports a reply that never happened.
- With the `gh` CLI, use `gh api graphql` to query review thread fields such as
  `isResolved`, `isOutdated`, and nested comments.
- After replying to addressed review threads, use the GraphQL
  `resolveReviewThread` mutation and then reread thread state to confirm
  `isResolved: true`.
- Inspect each thread's resolved/outdated state, path, line, and comments before
  deciding whether it still needs code, a reply, or resolution.
- GitHub enforces unresolved review threads as merge blockers in this repo.
  Treat all unresolved threads as blocking until addressed and resolved.
  Outdated unresolved threads may already be fixed by newer commits, but they
  still need a reply and explicit resolution.
- When posting GitHub issue, PR, or review-thread comments on behalf of a human,
  agents must attribute the comment to the agent unless the human explicitly
  reviewed and approved the exact text before posting. Use an explicit prefix
  naming the harness, model, and reasoning effort so readers can distinguish
  delegated agent comments from human-authored ones — for example
  `Claude Code (Opus 4.8, High effort):` or `Codex GPT-5.5 agent:`.
- Reply to addressed comments with an attributed agent prefix.
- Resolve pull request review threads after addressing and responding to them.
- Agents should not need individual review URLs once the repository and PR
  number are known.
- A closing keyword fires wherever it appears in a PR body or commit
  message — qualified in prose, inside quotation marks, or offered as an
  example. Both happened here: #720 wrote one with an "only if" qualifier
  and closed #712 on merge, then #722 quoted that same phrase to document
  the trap and closed #712 again. Confine it to one position: the **last
  line of a PR body**, and only when merging that PR closes the issue
  outright. Anywhere else in a body or commit message — mid-prose, quoted,
  or shown as an example — write the bare number (`#712`) and state the
  closing decision in words. When one issue spans several PRs, no PR
  carries the keyword until the final one, because an earlier merge would
  close the issue with work still outstanding. Quoting it inside a
  repository file is safe — only PR bodies and commit messages are parsed.
- The `gh` binary may not be on PATH inside piped or compound subshells (e.g. a
  `while` loop fed by a pipe), failing with `gh: command not found`. Use the
  absolute path (`/opt/homebrew/bin/gh`) and drive loops from a file
  (`done < file`) rather than a pipe.

## Husky/hooks

- `.husky/pre-commit` runs `npm run verify:fast` — the `npm install`-only
  checks, concurrently, in roughly 20 seconds. It is a filter, not the gate:
  let it run rather than reaching for `--no-verify` out of habit. Keep GPG
  signing enabled for commits. Autonomous AI agents MUST bypass GPG signing
  with `--no-gpg-sign` for intermediate commits; the human engineer assumes
  cryptographic accountability via the final Squash and Merge signature.
- **Every check in the hook must come from `npm install`, never from your
  `PATH`.** A tool merely present on one machine makes the hook pass locally
  and exit 127 on a fresh clone, blocking every commit there. `lint:actionlint`
  lasted one review round in the hook for exactly this: the `Dockerfile`
  installs it, `npm install` does not. Confirm a new check's binary is in
  `devDependencies` before adding it.
- **Do not write down what the hook omits; run `npm run verify:gap`.** It
  reads the `Dockerfile` and expands nested scripts on both sides, so the
  answer stays correct as the hook and gate drift. A prose list of it was
  wrong four times running during #763 — including two attempts at a
  "shorter, for-reference" version. There is no correct short version.
- **`lint:cspell` uses `.cspell.json`'s `ignorePaths`, not `--gitignore`.**
  `--gitignore` resolved against the **parent** repo's `.gitignore`, whose
  `/.claude/*` line hid every file in a worktree — it checked zero and
  exited 1. `ignorePaths` resolves against cspell's own root. Do not restore
  `--gitignore`; if you change the ignore list or `.gitignore`, keep them in
  step and verify by **file set**, not a passing run (a glob task matching
  nothing still exits 0 — see the #703 bullet under Lint gauntlet interplay).
- **One authoritative full gate per pushed head.** Required CI normally is
  it, since it validates the PR head and leaves shared evidence — do not
  request a fresh Codex or Copilot review until it is green for the head
  under review. CI runs per `pull_request` event (open / reopen / push to
  the PR), so it needs an open PR: run `npm run docker:build-and-test-all`
  locally when there is none yet, when the work will stay unpushed, or for
  a failure that only reproduces inside Docker.
- A `--no-verify` or `HUSKY=0` commit skipped `verify:fast`, not the gate.
  Run `npm run verify:fast` by hand before pushing, then let CI run the full
  gate on that head — via the PR (open it if it is not yet).
- Documentation-only changes need only `lint:markdownlint`, `lint:prettier`,
  and `lint:cspell`, not the full Docker suite.
- `rebase` needs its own `--no-gpg-sign`, passed when the rebase **starts**.
  Git stores the signing choice in `.git/rebase-merge/gpg_sign_opt`, so a
  rebase begun without it dies at the first replayed commit with "gpg failed
  to sign the data", and neither `git rebase --continue` nor
  `git -c commit.gpgsign=false rebase --continue` can rescue it. Abort and
  restart as `git rebase --no-gpg-sign --onto ...`.
- Rebasing a stacked branch after its parent PR was **squash**-merged needs
  `--onto`, not a plain rebase: main carries one new commit whose content
  matches the parent's several, so git replays those originals and reports
  conflicts against its own merged result. Replay only the child's commits
  with `git rebase --no-gpg-sign --onto origin/main <last-parent-commit>`.
- Never rebase or force-push a branch whose PR has already been reviewed, even
  when the content survives the rewrite unchanged. GitHub anchors its
  changes-since-your-last-review diff to commit SHAs, so rewriting them costs
  the reviewer the delta and makes them re-read the whole branch. That cost is
  invisible from the agent's side, where a verified-identical rebase looks
  clean, which is why it needs a rule rather than judgement. To clear a
  `BEHIND` merge state, use GitHub's **Update branch** instead: this repository
  squash-merges, so the merge commit disappears at merge and the outcome is
  identical, while the SHAs and every review anchor survive. Rebase only a
  branch nobody has read yet. If history has already been rewritten, recover
  the delta with `compare/<old-head>...<new-head>`, which still resolves
  because force-pushed objects stay reachable by SHA, and offer it without
  being asked.

## CI workflow notes

- Workflow: .github/workflows/npm-build-test-upload-artifact-and-deploy.yml.
- `push` triggers the workflow **only for `main`** (`branches: [main]`) —
  that is the production deploy. Everything for a branch runs on
  `pull_request` — `opened`, `reopened`, `synchronize`: it builds the
  Docker test image, runs Playwright e2e via `npm run docker:run-e2e-only`,
  resolves from the event payload whether the PR is same-repository and
  not Dependabot, and if so publishes a PR preview. A branch pushed with
  **no open PR gets no CI** — open the PR (the flow already says to, right
  after the first push) and it all runs.
- On main: installs deps from `.nvmrc`, builds app and Storybook, uploads Pages
  artifact, deploys to GitHub Pages. Pinned to
  `github.event_name == 'push'`, and `push` is main-only, so only a push to
  main ever deploys production.
- Opening the PR publishes its first preview and runs its first CI — no
  second push needed. `gh pr create` needs the branch on the remote first,
  so push one commit (an empty one is fine), then open the PR. Because a
  feature-branch push starts no run, opening the PR right after a push
  leaves exactly one run (the `pull_request` one) doing test and preview,
  and merge state goes CLEAN with a single commit. This replaced an earlier
  design (#700/#784) where the push run and the PR-open run raced: it
  deduped them with concurrency, but the cancelled push run left an orphan
  `CANCELLED` `build-and-test` check-run on the PR head that kept merge
  BLOCKED until the next push (#786).
- The workflow's top-level concurrency group: a `push` (main only) keys on
  `main-deploy`; a `pull_request` keys on `branch-<head repo>-<branch>`.
  The `branch-` prefix is unreachable by any ref name, so a fork PR from a
  branch called `main` gets `branch-<fork>/cribbage-trainer-main` and
  cannot cancel a production deploy; the head-repo segment keeps two fork
  PRs sharing a branch name from cancelling each other. `cancel-in-progress`
  is on, so pushing a new commit to a PR cancels its in-flight run — but
  every cancellation now lands on a superseded SHA, never the current PR
  head, so it cannot orphan a required check. Still, do not push to a PR
  branch while waiting on a preview or CI result you need — the run
  producing it dies and the wait restarts.
- A scheduled workflow's execution clock is not the time it was scheduled
  for, and the gap can exceed the whole interval. GitHub delays scheduled
  runs under load, a queued job may reach a runner much later, and a re-run
  keeps `event_name` at `schedule` while its clock reads whenever a human
  clicked. Anything that dates work by `date` at run time therefore attributes
  it to the wrong period, silently. Derive the period from the run's
  `created_at` instead, which is unambiguous on a first attempt; refuse when
  `run_attempt` is above 1, since GitHub documents neither `created_at` nor
  `run_started_at` as preserved or reset across a re-run. Refusing beats
  guessing here, because a wrong period is invisible while a refusal is loud
  and recoverable. The export canary in `.github/workflows` carries the worked
  example, and four review rounds were spent finding the variants of this one
  bug, each hiding inside the fix for the last.
- Never retry a failed Pages deploy with a single-job rerun: rerunning a
  job that already uploaded a `github-pages` artifact adds a second one to
  the same run, and `actions/deploy-pages` then always fails with
  "Multiple artifacts named github-pages" — for every attempt on that run.
  Push a new commit (fresh run) instead.
- Preview eligibility, the shared `pages-content` tree, the two Pages
  environments, and the guard that keeps a bad publish from taking production
  down are in `skills/pages-preview/SKILL.md`; read it before editing either
  workflow.

## Contribution notes

- Add/adjust tests alongside code changes.
- Keep dependencies current in PRs: include minor and patch bumps, and take major
  upgrades when they do not overshadow the PR's primary purpose. How to do that
  safely — audit advisories, caret `overrides`, `.nsprc` waivers — is in
  `skills/dependency-maintenance/SKILL.md`.
- **Falsify a claim before writing it down as guidance.** Documentation here
  is instruction an agent will follow without re-deriving, so a confident
  sentence that happens to be false is worse than silence — and no gate can
  see it, because markdownlint, prettier, and cspell check lines rather than
  truth. #803 is the worked example and it is not close: **at least
  seventeen distinct findings — excluding duplicate comments that named one
  defect twice — across at least eight review rounds, still climbing as this
  was written**,
  every one correct and **none of them in the code**. The large majority
  landed on `AGENTS.md` itself, the rest on two skills; the source change was
  twelve added lines against five removed and drew no comment at all. The
  tally is written as a floor on purpose — two successive rounds corrected it,
  and each correcting round added findings of its own, so any frozen number
  was stale before the commit fixing it landed. A count of an ongoing thing,
  quoted inside that thing, cannot be kept true; that is the closed-list
  failure below wearing a different hat.
  Two shapes accounted for nearly all of them, and both are cheap to check:
  - **An absolute this repository already contradicts.** "Nothing may draw
    from the injected generator" while `usePracticeDrill` does. "A generated
    directory must join all seven ignore lists" while `dist/` and
    `storybook-static/` are missing from several. "Nothing tracks the device
    font-size setting" while the dialogs and card picker are `rem`-sized.
    Before writing _never_, _always_, or _must_, run the grep that would
    disprove it — then decide which kind of claim it was, because the two
    kinds need opposite responses and conflating them is dangerous:
    - A **descriptive** claim says what the code does. If the repository
      disagrees, the claim is simply wrong: correct it, and prefer stating
      the mechanism over the summary, since summaries are what drift.
    - A **normative** claim says what the code must do — but first establish
      whether the rule is **established** or one you are **proposing right
      now**. **Establishment is decided by provenance, never by age**, and
      an owner-approved rule is established the moment they approve it, new
      or not — that branch wins whenever both could apply. A requirement is
      established when it is present on an **owner-approved baseline** — the
      target branch, not the working tree — or when the owner asked for it.
      Anchoring to the baseline matters: a rule an agent added in an earlier
      commit of the same PR before review is "already written" in the file it is
      reading and still carries no authority, so commit ordering inside a
      branch must never be what decides this. The established set here is
      therefore: the architectural constraint, the `max-lines` cap, the
      no-`eslint-disable` prohibition, and equally a rule they requested
      five minutes ago. Repository disagreement with one of those is a
      **violation, not an exception** — fix it, or escalate it, and say so
      in the PR. A rule **you** invented, that no owner has ruled on, has no
      such standing however authoritative it sounds, and code contradicting
      it is evidence about the rule at least as much as about the code:
      check it against an existing requirement, narrow or drop it when the
      design it condemns turns out to be legitimate, and put the conflict to
      the owner rather than settling it yourself. Do not manufacture a
      violation by writing a `must` wider than the case warrants and then
      obeying it. This very bullet is the worked example of the ambiguity:
      the owner asked for it, so it is established despite being written in
      the same PR. Only write a
      divergence down as a documented exception when it is deliberate and you
      can defend it;
      `usePracticeDrill`'s draw is one, because a drill shifting the next
      seeded deal is intended behavior. Finding hard-coded heuristics in the
      scoring engine would be the other kind entirely: the architectural
      constraint at the top of this file is normative, and a heuristic found
      in the code is something to remove, never a reason to soften the rule.
      A rule the codebase violates on its own page teaches the next agent to
      discount rules — but weakening a rule to match a violation is worse than
      the stale rule was.
  - **A closed list that is not closed.** Three separate inventories fell to
    this in one PR: the ignore lists, the RNG call sites, and the bare
    `getByRole("table")` locators, which named two of six. A count invites an
    agent to tick it off and stops them looking. Prefer the search command
    that regenerates the list over the list, or write both and say plainly
    which one is authoritative.

  Both failures come from the same place: asserting a property of the whole
  from the part you were already reading. The derived-inputs rule under
  Project overview is a special case of this one, and writing that one down
  did not prevent a single one of those findings — none of which targeted that
  rule — so treat this as
  a checking discipline to execute, not a principle to agree with. Two claims
  in this very bullet were wrong on first draft, both caught by running the
  check it prescribes: the source diff was called nine lines, and the
  derived-inputs rule was called the one immediately above when it sits 810
  lines earlier in a different section.

- Capture each session's durable, non-obvious learnings — new invariants,
  debugging techniques, tooling or review-workflow gotchas — in `AGENTS.md`
  (or the matching `skills/*/SKILL.md` when the learning is task-shaped) as
  part of the same PR as the code change, not as a follow-up. When a change
  set produced no such learnings, say so in the PR description.
- When a PR touches a domain that lives in `skills/`, state in the
  description whether the skill was read before the work started and whether
  it covered what came up. "Did not read it, and here is what that cost" is
  the most useful answer of the set, so record it plainly rather than as a
  confession. Progressive disclosure is a bet that a pointer is enough, and
  these lines are the only evidence the bet is paying: a skill that went
  unread leaves no other trace, so the gap cannot be reconstructed later.
- In-code comments must document only the non-obvious _why_ — invariants,
  the rationale for a surprising call, consequences/trade-offs, or guards
  against "simplifying" an argument that looks redundant. Never restate the
  _how_/_what_ of the adjacent code; cut any comment that paraphrases the
  condition or call next to it. The `capitalized-comments` ESLint rule
  requires every `//` line to start with a capital, so write one full
  sentence per line.
- For visual changes, update Playwright snapshots when the new visuals are
  correct, following `skills/testing-e2e/SKILL.md` so the regeneration
  actually lands.
- Keep README and docs in sync when changing workflows or commands.
- After editing any long Markdown file here — `AGENTS.md`, `CLAUDE.md`,
  `README.md`, a skill — diff that file's heading list against the branch it
  is based on, which is `origin/main` for most work and the parent branch for
  a stacked PR. Compare every heading level: a skill's title is level one and
  README subsections are level three. An edit that splices by index can
  swallow any of them while every gate stays green, because markdownlint,
  prettier, and cspell check lines rather than structure; four adversarial
  review rounds missed exactly that on #730 before Copilot caught it. That
  diff only catches damage a branch is about to do, so run it once against a
  much older base when auditing a file's structure: the
  `## Code style and conventions` heading had been missing since #646 spliced
  it away, leaving 61 style and contribution bullets reading as part of the
  lint checklist for two months, and only a diff against the file's first
  commit surfaced it.

  ```bash
  diff <(git show <base>:<file> | grep -E '^#{1,6} ') \
    <(grep -E '^#{1,6} ' <file>)
  ```

- Keep an inline code span short enough to fit one wrapped line. Prettier
  reflows prose at 80 columns but never breaks inside a span, so an
  over-long one lands whole on the next line at column zero, breaking its
  backticks and de-indenting the list item under it. markdownlint,
  prettier, and cspell all pass on the wreckage — the same
  lines-not-structure blind spot as the heading rule above. Two instances
  existed here at once, one of them live for months.
- Triage test, CI, and infrastructure issues into the current/active milestone
  and fix them ASAP, keeping the tree green for maximum feature-work velocity.

## Commit messages

- Follow the 50/72 Git commit message convention: subject line ≤ 50 chars, then
  blank line, body wrapped at 72 chars.
- Prefer semantic prefixes (e.g., feat, fix, chore, docs, refactor, test, ci, build).
