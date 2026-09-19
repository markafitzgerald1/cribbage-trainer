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
  A proposed exception — that text inside a scroll container (`.dynamic-ui`,
  the analysis figure) can carry an uncapped floor, because the height it
  gains stays reachable — is recorded in #802 and in `AGENTS.md`'s
  two-reviewers bullet. It is **not** in force: it rests on a desktop
  measurement, PR #797 was withdrawn before it reached a phone, and this
  rule was earned on hardware. Cap the floor until #802 settles it.
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
- The analysis figure is its own flex column, and anything added above the
  results table competes with it for height rather than sitting beside it.
  `.scored-possible-keep-discards` is `height: 100%` with `.table-container`
  taking what is left through `flex-grow: 1`, so a sibling that refuses to
  shrink can take all of it: a panel added above the table on PR #797 drove
  that share to exactly zero at 380x350 with a 26px root font, and the table
  vanished while the panel itself looked correct. That PR was withdrawn, so
  no `min-height` floor protects the table today and the next child added
  there inherits the whole hazard. `consentLayout.spec.ts`'s "preserves
  usable analysis table height" case is the nearest guard, and it did fail
  on that unfixed branch — but **read what it actually asserts before
  trusting it**: `expect(containerBounds.height).toBeGreaterThan(0)` catches
  a total collapse only, which is what that branch happened to produce. A
  sibling that leaves the table at some positive but unusably small height
  passes it. Its name promises more than its assertion delivers, so a new
  child of that figure needs a content-derived minimum asserted alongside
  it, not a green run of this one.
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
- Multi-component tradeoff captions (e.g.
  `0.61 Hand gain < 1.06 Crib + 0.42 Play loss`) wrap in mobile portrait at
  enlarged device fonts or browser zoom. Wrap each side in an inline element
  with `display: inline-block` (`.diagnostic-side`) so the break occurs cleanly
  at the comparison operator (`<`) into two self-contained clauses, rather than
  breaking mid-phrase or orphaning "loss".
- In stacked mode during practice drill review, the drill panel sits directly
  above the analysis table in Trainer's column. Unwrapped outcome lines,
  excessive vertical margins or gaps, and wrapping captions steal vertical space
  from the flex-child results table until only a single discard row remains
  visible. Scoping tightened padding, gaps, and modest font reductions to
  practice mode (`.in-drill`) keeps the classification label on a single line
  and preserves multiple visible discard rows without modifying the main view's
  typography (owned by #802).

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
- Hiding a visual layout from assistive technology makes the replacement text
  the **only** source of every fact it carried, and it is easy to leave one
  out. A CSS-grid panel on PR #797 (withdrawn) gave each row a single spoken
  sentence with the grid itself `aria-hidden`; the first version named the
  columns and the numbers but not the two cards the row was about, so a
  screen reader user was told the top choice scored more without being told
  what it was. When you `aria-hidden` a region, list what a sighted reader
  gets from it — headers, labels, identity, ordering — and check the
  replacement carries each one. Assert the whole sentence in a test rather
  than a fragment, or the omission reappears silently.
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
  interactive boundaries: button borders, role chips, and filter options must
  be told apart from the adjacent surface by **some** color at 3:1 or better
  (e.g. #43a047 reaching 3.96:1 against the #10381b modal surface; an earlier
  revision of this line said 3.47:1). Usually that color is the border, and
  then the border is what has to clear 3:1. It is not always: the checked
  sort-order chip documented below pairs a #34c754 fill with a deliberately
  dark #08200d border, and the fill carries the boundary at 3.18:1 against
  the felt while that border sits at 2.43:1 against the same felt.
  So measure the color that actually separates the control from its
  surroundings rather than the `border-color` declaration by reflex — an
  earlier revision of this line demanded 3:1 from every border against both
  its fill and the surface, which condemned a chip this same file documents
  as correct. **Measure against the surface the
  control actually renders on, not the one its stylesheet neighbors use** —
  #6c8f74 passes at 3.63:1 on that modal surface and fails at 1.96:1 on the
  #1f6536 felt and at 2.86:1 on the chart's #22482e detail panel. #793 cleared
  that same color against the wrong surface **twice** — `PracticeDrillPanel`'s
  "Exit drill" and `DecisionQualityChart`'s `.detail-close` — so a shared
  border color is a standing invitation to audit the stylesheet rather than
  the screen. Both now use #a7c7ad, which clears 3:1 on every ground it
  meets. One control is knowingly below the floor and is not yet fixed:
  `ScoredPossibleKeepDiscards`'s `.retry-button` (#dc3545 fill and border)
  reaches 1.56:1 against the felt.
  It is an error-path control, it was worse before the felt change (1.13:1
  against the old `green`), and it deserves its own issue — so treat this
  bullet as the standard to hold new work to rather than a description of a
  repository that already satisfies it everywhere. In modals,
  elevated dialog surfaces must maintain distinct visual separation from the
  felt ground behind the dimmed overlay (color-mix 50% black): thin 1px borders
  or surfaces that closely match the dimmed backdrop leave dialogs looking
  flat and unanchored. Frame dark modals with a crisp boundary border (e.g. 2px
  solid #43a047) and distinct elevation.
- Every modal action bar that sticks to the top (`position: sticky; top: 0`)
  reserves clearance for the absolutely positioned close button, and the
  button carries `z-index: 10`. Both `MistakeQueueDialog` and
  `EnterCardsDialog` do this; the shared `Modal` contributes the stacking rule
  and the clearance token but has no sticky bar of its own. **Reserve it in
  px, not rem.** `.close` does not scale with the device font setting — its
  `font-size: medium` is 16px and its `right` inset 15px whatever the root is
  — so it measures a constant 26.7px wide and needs 43.7px of corner at every
  root font. The `3.5rem` this replaced reserved 56px at the default and 126px
  at a 36px root, taking width from the action row exactly where a phone has
  least to spare. `--close-clearance` in `Modal.module.css` is the single
  value; a sticky bar pairs it with `flex-wrap: wrap` so a large device font
  wraps the buttons instead of clipping them.

  This was an open question for most of #793 and is now closed by hardware: on
  a real phone the close button scrolled away with the picker, so the clearance
  is load-bearing rather than defensive. See the modal-scroll bullet below for
  the structural fix and the two traps that came with it.

- Primary action buttons across both the main felt ground and elevated modals
  (such as Deal, Use hand, Start drill, and Practice actions) must maintain
  at least 3:1 non-text boundary contrast against their fill (e.g. #72d572
  border reaching 3.15:1 against #197536 fill) and against adjacent grounds
  (3.86:1 against #1f6536 table felt, 7.16:1 against #10381b dialog surface).
  Because dark grounds compress luminance, darker borders cannot reach 3:1;
  high-luminance borders are mathematically required to establish legible
  component boundaries for low-vision players.
- Persistent links rendered directly on the felt table ground (such as the
  collapsed Privacy Policy and Analytics Settings links) must maintain at
  least 4.5:1 normal-text contrast under WCAG 2.1 SC 1.4.3 (e.g. #b8e5be
  reaching 5.04:1 against #1f6536 ground, brightening to #def8e2 at 6.27:1
  on hover and focus).
- Radio selections and filter chips (such as Dealer/Pone role selectors and
  dialog filter groups) must distinguish their active/checked state through
  both non-color visual indicators (such as an inline radio circle or dot
  pseudo-element that avoids altering accessible text names) and distinct state
  colors where the selected fill contrasts at least 3:1 against the unselected
  state (e.g. #34c754 reaching 4.92:1 against unselected #1a4524 and 5.89:1
  against the #10381b modal ground, paired with high-contrast #08200d text at
  7.72:1).
- **Wrapping filter chips are not automatically a defect; the test is
  reachability, and a single row is required only where vertical space is
  scarce.** The mistake queue's four Loss-severity options are the case that
  earned the rule — its header (title, action bar, subtitle, summary cards,
  four filter groups) pushed the top mistake off a real phone in landscape, so
  a wrap there costs a row of content. What that bought in the end is
  narrower than it sounds: `.severity-group` is declared only in the portrait
  (`< 6/5`) block, where it takes the modal's full width and tightens padding,
  gaps and marker sizing so the four chips fit **when they can** — and then
  wraps when they cannot. It is not held to one row. The `nowrap` +
  `overflow-x: auto` version that was is gone, because it cropped the last
  threshold's final digit; landscape has always let `.filter-group` wrap.
  The Decision Quality Trend dialog is the counter-case and ships wrapping on
  purpose: measured on a
  375px viewport, its five Granularity chips take two rows at a 16px root font
  and four at 28px, and its three Crib role chips take two at 28px, but no
  group escapes the viewport at either size so every chip stays reachable.
  Do not add single-row treatment to a group without a demonstrated need — the
  cure is capped markers and tighter padding, which costs legibility, and on
  narrow screens with large accessibility fonts inline radio markers add width
  to every chip at once.
- Hover and focus states for primary action buttons must maintain at least
  3:1 contrast between the border and the interactive fill (e.g. #8cee8c border
  reaching 3.17:1 against #218838 fill, 4.95:1 against #1f6536 felt, and 9.18:1
  against #10381b modal ground) to ensure interactive boundaries remain legible
  under WCAG 2.1 SC 1.4.11 during interaction.
- Do not use positional selectors like `:last-child` for filter groups whose
  presence depends on conditional data (such as the mistake queue's
  Loss-severity group, which is omitted when fewer than three distinct loss
  values exist). Scoping multi-chip portrait sizing to a dedicated class (e.g.
  `.severity-group`) prevents child-shift regressions where other controls
  (like Crib role) are inadvertently shrunk.
- The analytics consent dialog and settings panel use the dark modal surface
  (#10381b, border 2px solid #43a047, box-shadow, and #eef8ef text) rather than
  light backgrounds. Action buttons within the consent dialog use consistent
  dark theme action button styling (#197536 fill with #72d572 border,
  transitioning to #218838 fill with #8cee8c border on hover and focus).
- Active/pressed states for primary action buttons must retain a distinct,
  high-contrast border (such as `border-color: #8cee8c;` or
  `var(--hover-border-color)`) against darker active fills (e.g. #0f5527),
  preventing the boundary contrast from collapsing to 1:1 when pressed.
- When styling dialog action buttons that host nested modals (such as
  `AnalyticsConsentDialog` hosting `Modal` for the privacy policy), scope button
  rules to direct children (`> button`) or dedicated classes rather than
  descendant `button` selectors so the nested modal's `.close` button is not
  inadvertently restyled with primary action borders and backgrounds.
- In striped data tables with hover rows, place the `tr:nth-child(even)` rule
  before the `tbody tr:hover` rule with equal or greater selector specificity so
  hover highlights apply consistently to all rows rather than being masked on
  even rows.
- Action buttons resting directly on the felt table ground (such as "Quality
  trend" and "Mistake queue" in `DiscardTallyView`) use the high-contrast
  primary button palette (#197536 fill with 2px solid #72d572 border,
  transitioning to #218838 fill with #8cee8c border on hover/focus) so their
  boundaries exceed 3:1 contrast against both their fill and the #1f6536 table
  felt.
- **A transparent fill is not a missing color; it is the ground, and changing
  the ground silently retires the border that used to pass.** The sort-order
  toggles (`SortOrderInput.module.css`) carried a `black` border that reached
  4.09:1 against the old `green` (#008000) ground and fell to 2.97:1 against
  the #1f6536 felt without one line of their own stylesheet changing — so no
  diff, no gate, and no review of the touched files could surface it. When a
  ground color moves, enumerate every control that draws its boundary in a
  dark color against it, not merely the files the change touched. The felt
  ground now carries `#72d572` at 3.86:1 unselected, `#245830` fill with an
  `#8cee8c` border (5.86:1 against the fill, 4.95:1 against the felt) on
  hover, and `#34c754` fill with `#08200d` border and text on the checked
  toggle, where the fill itself carries the boundary at 3.18:1 against the
  felt and the text reaches 7.72:1. Retuning one state of such a control
  forces the others: leaving the old `#5fa7d7` hover fill under a new
  `#72d572` border would have collapsed the hover boundary to 1.44:1, and the
  old `#81c784` checked fill to 1.10:1 — a fix for the reported state
  creating two unreported ones.
- **`overflow-x: auto` on a flex item does nothing until `min-width: 0` joins
  it.** A flex item's automatic minimum size is its `min-content` width, so
  the box grows to fit its children and never overflows itself — the
  declaration is present, the scrollbar never appears, and the row pushes the
  page sideways instead. When a row is meant to absorb its own overflow,
  assert the container's own box against the viewport rather than trusting
  the declaration. **The measurements that taught this came from a
  `.severity-group` treatment that no longer exists** — at a 28px root font on
  a 375px viewport it rendered 550px wide with `scrollWidth === clientWidth`
  without `min-width: 0`, and 325px with `scrollWidth` 498px once it had it.
  That row now wraps instead, because scrolling cropped a label; see the
  wrapping bullet above. The CSS mechanic is what to keep here, not the
  treatment it was learned on.
- **A modal's close button must not live inside the box that scrolls, and
  moving the scroll off that box detaches every absolutely positioned thing
  inside it.** `Modal`'s `.close` was `position: absolute` against `.content`,
  which was also the `overflow-y: auto` scroll container, so scrolling the
  card picker carried the only visible way out of the dialog off the top of
  the screen — confirmed on a real phone in #793, after emulated measurements
  had already shown the close button reaching y = -279px at a 16px root font
  and -1169px at 28px. The fix is a `.body` wrapper that scrolls while
  `.content` stays put, and it has two consequences worth knowing before
  repeating it. First, the scrolling element must carry `position: relative`:
  the
  dialogs hide their radio inputs with `position: absolute`, and once
  `.content` stopped scrolling those inputs stayed anchored to it — after a
  300px scroll the Pone radio sat at y = 118.9 while its own label was at
  -184.1, hovering over the card grid and eating clicks meant for the tiles.
  Second, the scrolling element must have **no top padding**: a sticky child
  sticks to the content-box edge, so top padding becomes a strip of content
  showing above the stuck bar — 22px of card picker, also reported from the
  phone. Put that spacing on its children, where it scrolls away
  with them.
- **A scrolling strip hides content more thoroughly than a wrapped row does.**
  The mistake queue's Loss-severity chips were kept on one line with
  `flex-wrap: nowrap` plus `overflow-x: auto`, which satisfied a one-row guard
  while cropping "Low < 0.31" to "Low < 0.3" — the threshold's last digit sat
  behind a scroll affordance most people never notice. Wrapping costs a row of
  vertical space; cropping costs the number. Prefer the wrap, and write guards
  that assert each chip is **whole inside its group** rather than that the
  chips share a row, because the row assertion is what the cropping mechanism
  was invented to satisfy.
- **In a wrapping chip row, source order decides the row count, and the
  cheapest fix for a row too many is to move the new chip rather than
  shrink it.** Flex wrapping is greedy and first-fit, never best-fit, so a
  narrow chip appended after the widest one always starts a fresh row even
  when it would have fitted beside the first. Adding the #824 cause chip to
  the analysis caption took it from two rows to three at a 28px root font in
  portrait — 86px against the 65px cap `practiceDrill.spec.ts` enforces for
  drill review, which also dropped the table container to 83px against its
  95px floor, so both halves of that guard failed in all five projects.
  Moving the same chip to sit between the points-lost badge and the
  decomposition returned the caption to 56px and the container to 111px with
  no styling change at all: the decomposition is 342px of a 365px row and
  therefore always takes a row of its own, while the badge and the cause are
  212px and 141px and share one. Measure the children's boxes
  (`element.children` with `getBoundingClientRect`) before reaching for a
  smaller font or a shorter label. Note the slack, though, because
  reordering only buys what is left on the row: 8px in that case, which a
  couple of extra characters in any earlier chip would have eaten, and the
  shipped #824 change went on to fold the new text into the badge that
  already carried one of its two numbers rather than live on that margin.
  The order: measure, reorder if it fits comfortably, merge into an existing
  chip if it does not, and only then shrink anything.
- **Once a chip is merged into, emphasis inside it has to cost no layout.**
  With #824's pair folded into the sub-optimal badge, that badge measured
  331px of a 365px row in exactly the case the #802 guard samples — drill
  review at a 28px root font in portrait — so 34px was the entire budget for
  marking one of its two figures. That is less than it sounds: an inline
  pill like the trend dialog's zero-loss treatment costs roughly 11px of
  padding, a leading glyph about as much again, and the string's own width
  varies across engines by more than either, so a marker measured as fitting
  in Chromium can still start a third row in WebKit. `color` and
  `text-decoration` change neither dimension and are what to reach for.
  Measure the badge rather than the caption: the guard asserts the caption's
  height, but it is the badge's width against its row that decides it.
- **Reuse the zero-loss green rather than picking a hue, and never ship it
  alone.** A loss of exactly zero already reads green here — the trend
  dialog's `.loss-pill-optimal` fills at #1b732f — so a second marker for
  the same fact in some other color would read as a different fact. The
  color is only half of the signal, though: #824's marked figure carries a
  2px underline as well, because it sits inside a badge whose other text is
  near-white and nothing else tells them apart. Contrast is per ground and
  these badges are opaque, so measure against the badge fill, not the felt
  behind it: #7ee68a reaches 8.55:1 on the caption badge's #4a270f and
  7.87:1 on the queue badge's #123b40, and clears 4.5:1 on the #1f6536 felt
  as well, which is the ground it would inherit if either fill were dropped.
- **A palette shift is not a focus indicator.** Eleven controls on the dark
  grounds _used to_ suppress the native outline and lean on their hover
  treatment to double as focus — they no longer do, so read this as the
  reasoning behind `--focus-ring` rather than as a description of the current
  selectors. A hover treatment moves the fill and border by roughly 1.28:1
  each —
  and where a shadow was added instead, `rgb(52 208 88 / 30%)` reaches only
  1.52:1 against the felt. With four consent actions side by side, or Deal
  next to Enter cards, a keyboard user cannot tell which one they are on.
  `--focus-ring` in `vars.css` is the shared answer: `2px solid #def8e2` at a
  2px offset, 11.62:1 on the `#10381b` dialog surface and 6.27:1 on the
  `#1f6536` felt. Use it rather than `outline: none` plus a palette change;
  the palette change is still worth keeping, but as reinforcement rather than
  as the signal. Both reviewers found this independently on #793, one control
  at a time — when a focus rule anywhere turns out to have no real indicator,
  audit all of them rather than fixing the one you were shown. Grepping
  `outline: none` is not that audit and will miss the commonest shape: four
  mistake-queue buttons had focus sharing a single rule with hover, so the two
  states rendered identically and nothing was ever suppressed. Walk every
  `:focus` and `:focus-visible` rule and ask what a keyboard user actually
  sees. The one that
  legitimately keeps it is `CardGridPicker`'s `.card`, which sits on a
  near-white tile and has its own visible `:focus-visible` treatment.
  A clipped radio is the other case worth knowing: it cannot show an outline
  itself, so the ring goes on the label it is paired with.
- **Hang the ring on `:focus-visible`, never bare `:focus`.** A touch browser
  focuses a button when it is tapped, so a ring on `:focus` fires on every
  tap — and the hover-and-focus rules these grounds are full of make that
  easy to do by accident, since swapping one `outline: none` for the ring
  silently promotes a shared `:hover, :focus` rule into a tap indicator.
  `DealButton` showed the shape at its sharpest: a
  `@media (hover: none) and (pointer: coarse)` block existed precisely to
  drop the ring on touch, cleared `box-shadow`, and could not clear an
  `outline` that had not existed when it was written, so the comment
  promising no ring on a tap sat directly above a rule that produced one.
  `:focus-visible` is what that block was approximating, so the fix retired
  it: the keyboard user on a touch device now gets the real ring instead of
  a border swap stood in for it. Four rules here carried the ring on bare
  `:focus` — Deal, Enter cards, Use hand / Clear, and the modal close — and
  only one had a comment to contradict, so grep the selectors rather than
  trusting the prose.
- **And do not let hover share the ring's rule.** The mirror image: four
  rules gave `outline: var(--focus-ring)` to a combined
  `:hover, :focus-visible` selector, so hovering one drill action while
  tabbing to another ringed both and the focus target stopped being
  identifiable — the one job the token has. Share the fill and border if
  you like, since those are reinforcement; the outline goes in a rule of
  its own. Both reviewers found this independently, and Copilot carried it
  further: a bare `:focus` leaves the **hover palette** stuck on a tapped
  button even where the ring is already keyed correctly, so these controls
  now key their whole focus treatment — palette, shadow, and ring — to
  `:focus-visible`. Two greps cover the family: any rule whose body has
  `outline: var(--focus-ring)` and whose selector mentions `:hover`, and
  any `:focus` not spelled `:focus-visible`.
- **One _dialog-level_ vertical scroll container per modal.** A dialog that
  sets its own `overflow-y: auto` inside `Modal`'s scrolling `.body` chains
  the two: at a
  340px-high landscape viewport the panel caps at 308px while a `94vh` dialog
  reached 319.6px, so scrolling the inner one to its end carried on into the
  outer and dragged the sticky action bar 39.5px up the panel — sticky in
  name only. The queue and trend dialogs now declare neither `overflow-y` nor
  a `vh` height cap and let `.body` do the scrolling; with 265px of real
  scroll the bar pins flush with nothing showing above it. A `vh` cap on a
  child of a panel that is itself capped in `vh` is the shape to watch for,
  since the two are measured against the same viewport but not against each
  other. A capped region inside the flow is a different thing and is fine:
  the trend dialog's `.table-wrapper` keeps its own `overflow: auto` under a
  220px `max-height` deliberately, because it cannot chain the whole panel
  the way a second full-height dialog scroll container does.
