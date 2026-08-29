# AGENTS.md

## Project overview

- Two-player cribbage discard and play trainer built with Vite + React + TypeScript.
- **Architectural Constraint:** The scoring engine must rely exclusively on
  objective simulation, enumeration, or probability. AI agents are explicitly
  forbidden from introducing or using hard-coded heuristics, expert "rules of
  thumb", or subjective weighting in scoring algorithms. All expected values
  must be mathematically derived.
- Primary branch: `main`; active work often happens on feature branches.
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
  Harnesses disagree on which they display — Claude Code and Copilot in VS
  Code show the directory, while Copilot's CLI and desktop app, Antigravity,
  and Codex show the frontmatter — so a skill whose two names differ is
  called different things depending on where the user looks.
  `testing-storybook` declared `storybook-interaction-testing` and did
  exactly that. `npm run test:skill-paths` now asserts they match.
- `npm run test:skill-paths` guards that layout: each vendor path must be a
  relative symlink resolving to `skills/`, `skills/` itself must hold the
  real files, and every skill directory must contain a `SKILL.md`. Like
  `test:pages-content-merge` it runs as its own CI step rather than inside
  the Docker gate, because the Dockerfile's `COPY` allowlist deliberately
  excludes these dot-paths — so `npm run docker:build-and-test-all` alone
  will not catch a broken symlink.
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
  - Before starting work on an issue, or when you triage or draft one,
    read `skills/working-an-issue/SKILL.md`.
  - Before touching analytics consent, `gtag`, or trainer telemetry, read
    `skills/analytics-telemetry/SKILL.md`.
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
  `node --version` in each, via `docker run --platform linux/<arch>
mcr.microsoft.com/playwright:<tag>`.
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

- Name an action for its immediate effect, not a later workflow outcome. For
  example, a dialog button that commits six chosen cards but leaves the user
  to select two discards is "Use hand", not "Analyze".
- Keep visible and aria labels mutually non-substring across controls, even
  when only renaming one. Playwright's `getByRole` name match is a
  case-insensitive substring, so a new label that contains another control's
  name breaks locators in specs that were never touched (see
  `skills/testing-e2e/SKILL.md` for the collisions this has already caused).
- Preserve native form semantics when styling controls. Keep radio inputs in
  the accessibility tree and style their adjacent labels as buttons; retain
  the native role, name, checked state, and `:focus-visible` behavior.
- `appearance: none` unstyles a control but leaves it in flow, and what
  remains is UA-stylesheet dependent: the hidden sort radios reserved 8px
  each in Chromium, 4px in desktop WebKit, and roughly 20px on a real
  iPhone. Hide a control that must stay focusable with the absolute-plus-
  clip pattern (`Hand.module.css`'s `.figcaption`, plus `margin: 0`) so it
  contributes no layout width anywhere, and space the visible labels with an
  explicit `gap`. Never let a wrapper's spacing come from a hidden control's
  box. When you take a control out of flow, move its focus ring to the
  adjacent label (`.input:focus-visible + .label`) — stylelint's
  `no-descending-specificity` wants that rule after the plain `.label` and
  `.label:hover` rules.
- When a deselected control still looks selected, inspect state selectors
  independently before changing React logic: check `aria-pressed`,
  `:focus-visible`, and `:hover`. An unselected hover style that resembles the
  selected style can make correct application state appear stale.
- A declared color transition is insufficient if its endpoints are visually
  indistinguishable. Review both entering and leaving hover in the rendered UI
  and use a target color with a perceptible contrast change consistent with
  peer controls.
- CSS modules scope only class selectors: a bare element selector in any
  `*.module.css` (e.g. `button + button`) compiles to a global rule that
  leaks into every other component. One such rule indented all but the
  first card-grid button, making the Ace of Spades look wider than its
  peers. When one element of a repeated set renders offset or sized unlike
  its siblings, diff `getComputedStyle` margins between siblings first,
  then hunt for element-only rules in unrelated module files and qualify
  them with a component class.
- On short screens, place a modal's primary and secondary actions before a
  long scrolling picker and keep the action row sticky. Users should see how
  to complete the dialog without first discovering an off-screen footer.
- Freezing a control by swallowing its `onChange` leaves it focusable, still
  showing a pointer cursor, and announced as editable — a control that lies
  about being interactive. Lock it with the native `disabled` attribute
  (thread a prop down to the `<input>`) and a `cursor` override on its
  label. The practice drill's post-commit card lock does this through
  `Hand`/`HandCard`'s `disabled`; a test then asserts `checkbox.disabled`,
  not just that the handler went uncalled.
- A transient board-scoped mode (the practice drill) cannot self-detect a
  history restore of its own hand: `Back` onto the drilled six cards under
  the same role reads identically to an in-drill card selection —
  `serializeHand` ignores `kept`, and in the choosing phase the discard
  count carries no signal either. The component that owns the navigation
  must end the mode explicitly. `Trainer`'s `popstate` handler calls
  `drill.onExit()` in its non-merge branch; the hook's own render-time
  reset only covers what it _can_ see (the cards or role differ, or a
  committed discard was cleared). Guard the exit with the same
  `!isInternalMerge` check the history-navigation report uses, or a
  mind-change settle inside the drill ends it.
- A field snapshotted into a UI mode (the drill's `activeItem`, taken from
  the queue when the drill starts) goes stale against `localStorage`
  another tab can mutate. `recordPracticeAttempt` merges against the
  stored record as it stands at write time, so the streak it persists is
  not one more than the snapshot's. Derive anything shown after such a
  write by re-reading storage for that record, never from the snapshot —
  otherwise a concurrent miss elsewhere lets this tab show two successes
  and declare mastery over a stored streak of one. But do not then assume
  the re-read `find` succeeds: `recordPracticeAttempt` deliberately
  refuses to write when a newer-build tally is in storage (the version
  guard), and `readTallyForDisplay()` returns the empty fallback there, so
  the record is genuinely absent. Fall back to the local estimate rather
  than asserting the record non-null — the whole tally is read-only in
  that tab until reload anyway.

## Responsive layout invariants

- Exactly two responsive modes exist, keyed off a single boundary:
  `@media (aspect-ratio < 6 / 5)` (stacked) and
  `@media (aspect-ratio >= 6 / 5)` (side-by-side). Never use `orientation`
  media queries — they re-create a hybrid band between ratios 1 and 6/5 with
  stacked layout but side-by-side sizing — and never let both blocks match a
  shared boundary value: exactly 6/5 belongs to the side-by-side mode only.
- The six hand cards render one card design in both layout modes and at
  every viewport size — rotating a phone only rescales the cards. The whole
  card (5/7 `aspect-ratio` box, `em` width, border, checkbox, rank, and
  suit) is defined once in card-font-relative units in
  `HandCard.module.css` and `CardLabel.module.css`; each mode sets only the
  font scale (container-relative `cqw` in stacked mode, `vw` in
  side-by-side, whose width also sets the grid column, the Deal-button
  alignment, and the analysis table's share). Do not add per-mode overrides
  of the card's interior or reintroduce viewport-unit clamps whose fixed
  caps flatten cards as the window widens; e2e guards compare the card
  shape and its rank-glyph fill across widths and across the rotation
  boundary. Form controls do not inherit font size, so the checkbox needs
  `font-size: inherit` for its `em` sizes to track the card font.
- Never size nowrap control rows with rem floors. Mobile browsers scale rem
  with the device font-size setting, so rem-floored controls overflow the
  screen edge on real phones while emulators at default font scale look
  fine (the tell: `cqw`-sized parts fit while rem-floored parts overflow).
  Stacked-mode controls are sized entirely in container units; an e2e guard
  asserts they fit the portrait viewport at a 28px root font.
- The rem-floor trap is not only about control rows: any rem **lower
  bound** inflates on a phone whose font-size setting is above default,
  including `clamp(1rem, …)`. In side-by-side mode the app title and the
  consent cell were floored that way, and on real hardware the consent
  banner had to be scrolled to reach its buttons while every emulated check
  at the default scale passed. Cap such a floor with a viewport unit —
  `clamp(min(1rem, 2vw), …)`, `min(0.8rem, 1.5vw)` — which leaves every
  default-scale size unchanged, and guard it the way portrait already does:
  the same measurement repeated at a 28px root font. That guard failed on
  all five browser projects before the fix and passes after it.
- Anything new added below the controls and cards in the side-by-side
  left column inherits that trap. The practice-drill panel
  (`PracticeDrillPanel.module.css`) went in with every gap, margin,
  padding, and font in bare rem; inside Trainer's fixed-height,
  non-scrolling column a 28px root font grew it until Check/Exit dropped
  below a 844x390 viewport (measured at y425). Its landscape `@media`
  block now caps each rem with a `min(…rem, …vw)` sized to leave the
  default scale untouched, and `practiceDrill.spec.ts` asserts both drill
  buttons stay within the landscape viewport at a 28px root — negative-
  checked to fail against the uncapped CSS.
- `line-height: normal` is not proportional across font sizes (font-metric
  pixel rounding differs), so pin an explicit line-height wherever an
  aspect-ratio invariant depends on text height.
- In side-by-side mode the left grid column is `min-content`-sized by the
  wider of the controls row and the six cards. The controls must stay
  narrower than the cards — that is why "Enter cards" wraps to two lines
  there — or they widen the column, steal width from the analysis table,
  and make the buttons shift when the role label changes between Dealer and
  Pone. Do not spread the cards (`justify-content: space-between`) to chase
  the Deal button's right edge; keep fixed gaps and narrow the controls
  instead (an e2e guard asserts Deal/last-card alignment).
- The app-title/tagline header sits above the grid, so its height is stolen
  from the height-tightest side-by-side left column (controls + cards +
  first-run consent banner). On a short phone-landscape viewport that pushes
  the consent Accept/Decline off-screen — worst in WebKit, which renders the
  banner ~27px taller than Chromium, so the screenshot baselines (Chromium
  and Mobile Chrome only) never catch it. Keep the landscape header compact
  and shrink the consent banner from its grid cell — the `font-size` on
  `.dynamic-ui > :last-child`, which its text and `em` padding both track —
  rather than editing `AnalyticsConsentDialog`. A non-screenshot e2e guard
  asserts Accept stays within a 844x390 viewport across all browsers.
- `.dynamic-ui` places its children by **position**, and one of them is
  conditionally rendered, so those selectors do not mean what they read as.
  The analysis element exists only once two cards are discarded
  (`discardIsComplete(dealtCards) && <ScoredPossibleKeepDiscards …>`), so
  with no discard selected every positional selector after it shifts by one.
  In side-by-side mode `> :nth-child(n + 2):nth-last-child(n + 2)` hands the
  middle child the analysis's own slot — `grid-column: 2 / 3` with
  `grid-row: span 2` — so whichever child lands there inherits a full-height
  cell and stretches to fill it. The discard tally did exactly that: 753px
  tall around 56px of content, its rows spread down the whole column, with
  nothing wrong in its own CSS. A new child added to this container needs an
  explicit placement of its own, anchored the way the stacked layout already
  anchors one (`.dynamic-ui.with-tally > :nth-last-child(2)`), and the
  conditional class driving it must come from the same predicate the child's
  own render uses or the two diverge.
- Aligning such a child to the **end** of its cell is not the safe way to
  stop it stretching. Items placed after the consent cell's row sit below the
  privacy links once pushed to their cell's end: `align-self: end` put the
  tally at y675 against the links' y670 and failed
  `discardTally.spec.ts`'s ordering assertion in all three landscape
  projects, while looking correct in a single hand-checked viewport.
  `align-self: start` removes the stretch and leaves the geometry with an
  analysis on screen byte-identical, which is why it is the smaller change.
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
- Measure on hardware first before changing the app box's height unit.
  `100svh` was tried (#701, PR #702) on the theory that Chrome for Android
  resolves the percentage-height chain against the large viewport, so the
  bottom grid row — the analytics consent controls — hid under the toolbar.
  The theory is accurate about Chrome, but `svh` also shrinks the box by
  roughly the toolbar height: device testing showed controls that were
  clickable on `main` becoming unreachable in landscape with it applied, and
  it was reverted. The reported symptom turned out to be resolved by #696's
  controls-row fix instead. Every automated gate passed on that branch, so a
  change here is worth exactly as much as its phone test.
- A guard that passes on the branch introducing the regression is guarding
  the wrong invariant. The `svh` change shipped with a new e2e assertion that
  the app root does not render past the viewport; it passed on the broken
  branch, because `svh` made the box smaller rather than larger. When adding
  a guard alongside a fix, check it fails for the bug being fixed, not merely
  that it fails for some sabotage of the code under it.

## Discard-table layout (portrait)

- The per-row expand arrow (▸) lives inside the hand/discard cell, which is
  `overflow: hidden`. Narrowing the portrait hand column too far clips the arrow
  even when the cards still appear to fit. Keep the column wide enough for
  cards + parens + arrow; verify with
  `cell.scrollWidth - cell.clientWidth === 0`.
- Signed expected-points columns rely on the U+2212 minus (digit-width under
  tabular-nums) so positives and negatives right-align. Do not try to pad
  positives with a figure space (U+2007) — it is narrower than U+2212 and
  would also push 2-digit positives wider than the negatives. Instead size the
  column so the widest signed-negative value fits without overflowing into the
  gutter: an oversized score font makes 5-glyph negatives bleed a few px past
  4-glyph positives, breaking decimal alignment (portrait only, where columns
  are tightest).
- A phone-width portrait viewport cannot fit enlarged scores alongside six
  mini-cards, the arrow, and four numeric columns. Meaningful score-size
  increases need the horizontal-mini-card redesign, not portrait font bumps.

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

## Lint gauntlet interplay (agent checklist)

- Every lint task is glob-driven, so a file the Docker image never received is
  not an error: it matches nothing and the task still reports success. That is
  how `tests-e2e/` and `playwright.config.ts` went unchecked for the life of
  the gate (#703) while all ten tasks printed green. Never infer coverage from
  a passing run — compare file sets. `cspell '**' --gitignore --verbose` prints
  an `n/total` line per file, and the image's total must equal a clean
  checkout's (208 when #703 was fixed). Build that reference checkout with
  `git archive HEAD | tar --extract --directory <tmp>`, because in a
  `.claude/worktrees` checkout the parent repo's `.gitignore` makes
  `--gitignore` skip everything.
- Two spell checkers with **different base dictionaries** run in lint:
  eslint's `spellcheck/spell-checker` (`skipWords` in `eslint.config.mjs`;
  `--max-warnings 0` makes its warnings fail CI) and cspell (`.cspell.json`,
  honors `.gitignore`). A new word may trip one, both, or neither — run each
  checker and add the word only where it is actually flagged.
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
- Request that review yourself rather than asking permission first, and keep
  requesting it: address every finding, re-request on the new head, and repeat
  until a round reports no issues. The budget here is deliberately large
  because Codex is the adversarial check on agent work, and successive rounds
  earn their cost — on #728 the second round found a defect in code the first
  round had passed, and only the third came back clean. Copilot's low-effort
  reviews are similarly plentiful; its medium-effort reviews are the scarce
  resource, so spend those deliberately.
- A Copilot review request via the REST `requested_reviewers` endpoint can
  succeed while the eventual "review" is only a COMMENTED stub saying the
  requester reached their Copilot quota. Read the review body before
  claiming a Copilot review happened.
- To find PR review threads without individual review URLs, use any available
  GitHub integration or the `gh` CLI for the repository and PR number.
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

- Some git commands may invoke Docker-based test hooks. **For doc-only changes,
  skip hooks** (`HUSKY=0` or `--no-verify`) to avoid unnecessary Docker/test
  runs. For code changes, only skip hooks if absolutely sure they are not needed
  (i.e., a build and all tests have been performed on the current uncommitted
  code). Keep GPG signing enabled for commits. Autonomous AI agents MUST bypass
  GPG signing using the `--no-gpg-sign` flag for intermediate commits. The human
  engineer assumes cryptographic accountability via the final Squash and Merge
  signature.
- If an agent uses `--no-verify` or `HUSKY=0` to bypass local git hooks, it MUST
  execute `npm run docker:build-and-test-all` to explicitly ensure full CI
  compliance before pushing.
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
- On non-main branches: builds Docker test image and runs Playwright e2e via
  `npm run docker:run-e2e-only`, then (same workflow) resolves whether an
  open, same-repository, non-Dependabot PR exists for the branch and, if so,
  publishes a PR preview.
- On main: installs deps from `.nvmrc`, builds app and Storybook, uploads Pages
  artifact, deploys to GitHub Pages.
- Order branch work so the PR exists before the push you want previewed.
  `gh pr create` needs the branch on the remote, so the PR cannot literally
  come first; instead push the branch as soon as it has one commit (or an
  empty one), open the PR immediately — `--draft` is fine — and only then
  push the commits to preview. Pushing a finished branch and opening the PR
  afterwards always burns a cycle: that push's `resolve-preview-pr` logs "No
  open pull request found ...; skipping preview deploy" and nothing publishes
  until the next push.
- The workflow's top-level concurrency group is
  `${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`,
  so any push to a branch cancels that branch's running build. Never push to
  a PR branch while waiting on its preview or CI result — including a
  doc-only follow-up commit — or the run producing that result dies and the
  wait restarts. Land such commits before the run starts, or after it ends.
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
  review rounds missed exactly that on #730 before Copilot caught it.

  ```bash
  diff <(git show <base>:<file> | grep -E '^#{1,6} ') \
    <(grep -E '^#{1,6} ' <file>)
  ```

- Triage test, CI, and infrastructure issues into the current/active milestone
  and fix them ASAP, keeping the tree green for maximum feature-work velocity.

## Commit messages

- Follow the 50/72 Git commit message convention: subject line ≤ 50 chars, then
  blank line, body wrapped at 72 chars.
- Prefer semantic prefixes (e.g., feat, fix, chore, docs, refactor, test, ci, build).
