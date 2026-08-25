---
name: testing-e2e
description: Use before writing or debugging a Playwright spec, regenerating screenshot baselines, or diagnosing a rendered-layout bug in the browser — covers locator pitfalls, measurement techniques, and how snapshot updates actually land.
compatibility: Requires Playwright and docker for baseline regeneration.
---

# Playwright end-to-end and visual regression testing

**Description:** Locator and measurement pitfalls when writing Playwright
specs or debugging rendered layout, plus the rules for regenerating screenshot
baselines so CI agrees with what was generated locally.

**Playwright and UI-layout debugging:**

- Analysis-row text (e.g. `K♥Q♠10♦9♣(6♠5♠)`) is rendered in the **active
  sort order**; a deep link or click that sets `sort=ascending` reverses the
  row text (`9♣10♦Q♠K♥(5♠6♠)`). Don't reuse row-text constants across tests
  with different sort orders.
- `locator.innerText()` captures per-element newlines, but `toHaveText()`
  compares normalized text — comparing one against the other fails even when
  content matches. Assert against explicit expected strings instead of
  captured `innerText`.
- `getByRole(role, { name })` matches the accessible name as a
  **case-insensitive substring**, not an exact string. A header/button label
  that is a substring of another control's name causes strict-mode collisions
  (e.g. a sort label containing "crib" also matched the "Crib" button; "Deal" is
  a substring of "dealer"; "Net"/"Hand"/"Play" likewise collide if reused in
  prose). Keep visible and aria labels mutually non-substring. Note Testing
  Library's `getByRole` uses exact/regex matching, so the same name can pass in
  Jest yet fail the Playwright strict-mode locator.
- CSS-module class names are hashed at build time, so a `page.evaluate`-injected
  `<style>` that targets literal selectors like `.hand-column` silently no-ops.
  To trial layout variants, edit the real `*.module.css` (Vite HMR applies it
  live) and re-measure — do not inject literal-class overrides.
- To diagnose numeric-column alignment, measure rendered glyph bounds with a
  `Range` over the cell (`range.selectNodeContents(td)` then
  `getBoundingClientRect().right`) and compare a positive vs a negative row; the
  `td`'s own right edge will not reveal the gap.
- The six hand cards are `<label>` elements inside the hand `<ul>` and expose
  the ARIA role `generic`, not `listitem`; locate them with CSS locators such
  as `page.locator("ul").first().locator("label")`.
- When fixing a rendering bug, add a Playwright guard for it and negative-check
  the guard: stash the fix, confirm the new test fails against the broken CSS,
  then restore. A guard that was never seen failing proves nothing.
- No Playwright project reproduces a phone browser's box model: the `webkit`
  and `Mobile Safari` projects both run the desktop WebKit build, which
  differs from iOS Safari. When a bug is engine-specific and no headless
  browser reproduces it, guard the invariant the fix establishes rather than
  the broken rendering. The iPhone controls-row overflow became testable
  everywhere once the fix made spacing stylesheet-declared:
  `sortControlSpacing.spec.ts`
  asserts each control wrapper is exactly as wide as its visible button and
  each rendered gap equals the computed `column-gap`, which fails in every
  engine if any hidden box returns. Guard the cause, not the symptom.
- The controls row and the six cards below it are within 3-4% of each other in
  both modes (measured max-content width of the row versus the hand: 356 vs
  368 portrait, 392 vs 410 landscape at phone sizes). That is the whole
  tolerance for cross-engine font and box metrics, so any width the stylesheet
  does not intend overflows the viewport in stacked mode and widens the
  `min-content` left column past the cards in side-by-side mode, stranding
  dead space before the analysis table. Measure the row's max-content width
  (clone it with `width: max-content`) before adding anything to it.
- Analysis tables are lazy-loaded. E2E tests that select a complete discard or
  hydrate one from a deep link must wait for `Loading analysis...` to become
  hidden and for the table to become visible before locating a result row;
  relying on the assertion's default timeout creates WebKit races under load.
- eslint's jest rule blocks cover `**/*.test.ts*` and `**/*.stories.ts*` but
  not `tests-e2e/**/*.spec.ts`, so e2e helpers that wrap `expect` need no
  `assertFunctionNames` registration (other rules such as `no-undefined`
  still apply there).
- To reproduce device font-scaling bugs (e.g. Android Chrome's font-size
  accessibility setting, which scales rem), inject
  `page.addStyleTag({ content: "html { font-size: 28px; }" })` after `goto`
  and assert layout bounds; emulated devices at default font scale will not
  show these overflows.
- Add a visual regression viewport with the exact width, height, and resulting
  aspect ratio that exposed a layout bug. Portrait and phone-landscape
  baselines alone do not cover near-square windows or other breakpoint edges.
- In multi-browser runs under containerized or CI environments, launching
  multiple browser engines concurrently to compile and parse multi-megabyte
  bundle chunks can cause extreme cold-start CPU contention. Without an explicit
  test timeout, the default 30s timeout intermittently aborts initial
  `page.goto` calls (e.g. `has title`). Keep an explicit 60s `timeout` in
  `playwright.config.ts`, cap CI workers (e.g. 2 on standard GitHub Actions
  runners), and point `webServer.url` at the actual served route rather than a
  redirect.

**Visual regression updates:**

- `tests-e2e/index.screenshots.spec.ts` is ignored by the Firefox, WebKit, and
  Mobile Safari projects. Keep that file focused on visual baselines; put
  functional guards that need cross-browser coverage in a non-screenshot spec.
- When Playwright snapshot diffs are acceptable:
  - Regenerate screenshots in Docker:
    `npm run docker:build-and-test-all -- -- --update-snapshots`.
  - In PRs, explicitly note the screenshot updates and ensure expected images
    are updated to match the current actuals (these will be human reviewed).
  - `npm run docker:update-screenshots` expands to
    `docker build ... && docker run ... --update-snapshots`. If the build's
    lint/Storybook-coverage step fails, the `&&` short-circuits and the
    baselines are silently NOT rewritten. Confirm the build passed (or that
    `git status` actually shows changed `tests-e2e` images) before assuming the
    regeneration took effect.
  - On an Apple Silicon (arm64) host, Docker runs the test image as arm64,
    whose text antialiasing differs from CI's native amd64 by a few pixels,
    so every locally generated baseline carries a small cross-arch delta.
    `maxDiffPixels` (`playwright.config.ts`) must therefore sit above that
    noise floor, not below it, or CI flakes on baselines that look correct
    locally. The global threshold is 800. A modal shot is far noisier
    because `Modal`'s overlay is translucent (`rgb(0 0 0 / 50%)`), so the
    dimmed hand behind the panel shows through the margins and its
    antialiasing swings ~1100px across arch. Screenshot the opaque panel
    itself (`getByRole("button", { name: "Close modal" }).locator("..")`),
    not the whole `page`, so that incidental show-through is never captured —
    prefer that over a per-shot `maxDiffPixels` override. Do **not** chase
    exact CI-matching baselines by regenerating under qemu
    (`--platform linux/amd64`): its rendering is a third variant matching
    neither arm64 nor CI's amd64, and the emulated browser is too
    slow/flaky for the interaction tests. Generate baselines natively on
    arm64 and let the threshold absorb the delta.
  - A cloud session (Claude Code on the web) renders differently again, in
    exactly the sense above, so run e2e there with the pixel comparison
    switched off, inside the test image:

    ```bash
    docker run --rm cribbage-trainer-integration-tests \
      npx playwright test --ignore-snapshots
    ```

    That exits 0 with all 167 tests passing; comparing the pixels instead
    exits 1, with 29 of them failing on screenshot diffs and 138 passing.
    Those counts are as of writing and drift as specs are added, so judge
    the run by its exit code rather than by the totals.

  - Be exact about what `--ignore-snapshots` leaves running, because it is
    less than it looks. Each spec's setup still executes — `goto`, the
    clicks, and the waits inside `renderThenSelectTwoDiscards` — so a break
    there still fails the run. But `toHaveScreenshot` returns before it
    resolves its locator, waits for visual stability, or captures anything,
    so whatever is reached only through that call goes unexercised: the
    `modalPanel` locator in `index.screenshots.spec.ts` is never resolved,
    leaving that test covering just the `goto` and the "Enter cards" click.
    Confirmed by pointing `toHaveScreenshot` at a locator matching nothing,
    which fails on the missing element normally and passes under
    `--ignore-snapshots`. Read a green cloud run as evidence about the
    interactions, not about the assertions those shots stand in for; CI
    adjudicates the pixels against baselines it matches.

  - `--ignore-snapshots` makes a **new** screenshot shot pass vacuously:
    with no baseline written and no comparison run, a visual guard added in
    a cloud session goes green while proving nothing. Landing it does not
    validate it either. Without a committed baseline Playwright's default
    `missing` mode writes the actual image and fails, so that run reports
    the absent baseline rather than any comparison — a new shot run without
    `--update-snapshots` fails with "A snapshot doesn't exist at
    ..., writing actual." The guard is proven only once a baseline
    generated where baselines are owned has been reviewed, committed, and
    compared by a later run, so author new visual cases there rather than
    in a cloud session. Add them to `index.screenshots.spec.ts` too:
    its snapshots directory is the only one the `docker:` scripts mount
    back, so a new spec file's generated baseline is written inside the
    container and lost.
  - Do not raise `maxDiffPixels` to make a cloud session's pixels pass, and
    do not regenerate baselines there. Measured on that host: its glyph
    antialiasing needs roughly 47,000 against the configured 800, while a
    real 1%-card-width regression (`1.212em` to `1.2em`) peaks at 23,514px
    and a card-border thickening (`0.022em` to `0.03em`) at 4,171px — both
    would sit under the raised threshold and stop being caught. Playwright's
    per-pixel `threshold` does not rescue it either: at 0.7 the noise is
    still 23,116px across 13 of 16 shots, because the differing pixels are
    full text-versus-background swings at glyph edges rather than soft
    gradients. Baselines regenerated on that host encode its own rendering
    rather than CI's, so CI would reject them.
