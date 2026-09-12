---
name: ui-layout-and-interaction
description: Use before editing responsive CSS or a media query, changing the card grid, the discard/analysis results table, a control row, a modal, or a `.dynamic-ui` grid cell, or designing and debugging a control's selected, hover, disabled, or focus state — covers the two-mode layout contract, the rem-floor traps that only surface on real phones, positional-child placement, the portrait discard-table column-fit rules, and the interaction and chart-accessibility rules.
compatibility: Requires a browser preview or Playwright for rendered-layout verification.
---

# UI layout and interaction

**Description:** The layout contract this app's CSS is built on, the traps
that make an emulated check pass while a real phone fails, and the rules for
naming, styling, and freezing interactive controls. `AGENTS.md` keeps only the
four cross-domain bullets from these areas — the two label and CSS-module
rules an agent can break without knowing it is in this domain, and the two
about what emulated evidence is worth — because everything below fires only
once you are already editing layout or interaction code.

**Responsive layout invariants:**

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
- Cap **spacing** with a viewport unit in a landscape `@media` block, not
  **font size**. A first pass at the mistake-queue landscape header
  (`MistakeQueueDialog.module.css`) capped every option and legend with
  `min(0.75rem, 1.9vh)`; on a real phone `1.9vh` won and rendered the
  filter labels at ~7px, unreadable, while the emulator at 390px looked
  fine either way. The working shape: plain readable rem for type
  (`0.72rem` here), `min(rem, vh|vw)` only on padding / gap / margin, and
  drop genuinely optional text outright in landscape — the subtitle there
  went to `display: none` because the per-row "n/2 successes" badge
  already carries the same information. A short landscape phone also has
  roughly 50px less height than the emulated viewport once its address and
  gesture bars show, so guard at `phoneLandscapeViewport.height - 50`, not
  the bare 390.
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
- That same `> :nth-child(n + 2):nth-last-child(n + 2)` matches **two**
  children once a discard is chosen — the analysis figure and the tally are
  both "middle" — so both take a `grid-column: 2 / 3; grid-row: span 2`
  slot and the tally, unable to fit the two explicit rows, auto-places into
  an implicit row that runs past the bottom of `.dynamic-ui`. With no
  discard selected the tally is the lone middle child and sits high enough
  to fit, which is why "it works until I pick a discard" is the report. The
  fix is `overflow-y: auto` + `min-height: 0` on `.dynamic-ui` in the
  landscape block so that overflow is reachable inside a real scroll
  container rather than spilling past the fixed-height app box; it is inert
  at the default scale, where nothing overflows.
- A `scrollIntoViewIfNeeded()` + `toBeInViewport()` guard for that fix
  passes with **and** without it, because the emulator's `body` scrolls
  (its own `overflow: auto`) where a phone's fixed-height `html`/`body`/
  `#trainer`/`.app` chain does not. Assert the mechanism instead: at a
  short landscape viewport with a large root font, `.dynamic-ui`'s computed
  `overflow-y` is `auto` and its `scrollHeight` exceeds its `clientHeight`.
  Negative-checked, that reads `visible` and equal heights.
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

**Discard-table layout (portrait):**

- The per-row expand arrow (▸) lives inside the hand/discard cell, which is
  `overflow: hidden`. Narrowing the portrait hand column too far clips the
  arrow even when the cards still appear to fit. Keep the column wide enough
  for cards + parens + arrow; verify with
  `cell.scrollWidth - cell.clientWidth === 0`.
- Signed expected-points columns rely on the U+2212 minus (digit-width under
  tabular-nums) so positives and negatives right-align. Do not try to pad
  positives with a figure space (U+2007) — it is narrower than U+2212 and
  would also push 2-digit positives wider than the negatives. Instead size
  the column so the widest signed-negative value fits without overflowing
  into the gutter: an oversized score font makes 5-glyph negatives bleed a
  few px past 4-glyph positives, breaking decimal alignment (portrait only,
  where columns are tightest).
- A phone-width portrait viewport cannot fit enlarged scores alongside six
  mini-cards, the arrow, and four numeric columns. Meaningful score-size
  increases need the horizontal-mini-card redesign, not portrait font bumps.

**Interaction design and visual-state debugging:**

- Name an action for its immediate effect, not a later workflow outcome. For
  example, a dialog button that commits six chosen cards but leaves the user
  to select two discards is "Use hand", not "Analyze".
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
- On short screens, place a modal's primary and secondary actions before a
  long scrolling picker and keep the action row sticky. Users should see how
  to complete the dialog without first discovering an off-screen footer.
- `role="img"` on an `<svg>` makes every descendant presentational, so
  focusable controls inside it (the decision-quality chart's per-mistake
  marker buttons) never reach assistive tech even with working keyboard
  handlers. An interactive chart SVG needs `role="group"` (keep the
  `aria-label` / `aria-describedby`), and tests then query
  `getByRole("group", { name })`, not `"img"` — check `tests-e2e/` for
  `getByRole("img")` too, a `src/`-only sweep misses it.
- A transparent SVG overlay only catches a pointer where it is the topmost
  painted element: a hit layer drawn before the trend path and the final
  data dot lets those swallow taps in their pixels. Paint hit targets last.
  When one shape's identity must survive a filter that renumbers the series
  (the chart's crib-role filter), key any stored selection by a genuinely
  unique field — the record's monotonic `recencyAt`, never the chart
  ordinal or wall-clock `at` — and clear it outright (render-time reset,
  like `usePracticeDrill`) once its item leaves the filtered list, or
  restoring the filter silently reopens the panel.
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
  `drill.clearDrill()` in its non-merge branch — the bare state reset,
  not `drill.onExit()`, which also deals a fresh hand and would
  overwrite the hand Back just restored. The hook's own render-time
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
- Dark themes must satisfy WCAG 2.1 SC 1.4.11 (non-text contrast) across all
  interactive boundaries: button borders, role chips, and filter options need
  at least 3:1 contrast against both their own fill and the adjacent surface
  (e.g. #43a047 reaching 3.47:1 against dark modal surfaces). In modals,
  elevated dialog surfaces must maintain distinct visual separation from the
  felt ground behind the dimmed overlay (color-mix 50% black): thin 1px borders
  or surfaces that closely match the dimmed backdrop leave dialogs looking
  flat and unanchored. Frame dark modals with a crisp boundary border (e.g. 2px
  solid #43a047) and distinct elevation.
- Modal action bars that stick to the top (e.g. `position: sticky; top: 0`)
  must explicitly reserve clearance for absolute-positioned header controls
  like the top-right close button (`padding-right: 3.5rem`), and the close
  button itself must carry an elevated stacking context (`z-index: 10`). Without
  both, sticky action bars paint across the top-right corner when scrolled,
  partially obscuring or entirely swallowing clicks intended for the close
  action.
- Primary controls on the main table ground (such as the Deal button and Enter
  cards) must maintain at least 3:1 non-text boundary contrast against the felt
  ground (e.g. #72d572 reaching 3.86:1 against #1f6536) and against their own
  fill (#197536 reaching 3.15:1). Because dark grounds compress luminance,
  darker borders cannot reach 3:1 against a dark felt ground; high-luminance
  borders are mathematically required to establish legible component
  boundaries for low-vision players.
- Radio selections and filter chips (such as Dealer/Pone role selectors and
  dialog filter groups) must distinguish their active/checked state through
  both non-color visual indicators (such as an inline radio circle or dot
  pseudo-element that avoids altering accessible text names) and distinct state
  colors where the selected fill contrasts at least 3:1 against the unselected
  state (e.g. #34c754 reaching 4.92:1 against unselected #1a4524 and 5.89:1
  against the #10381b modal ground, paired with high-contrast #08200d text at
  7.72:1).
