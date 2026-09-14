---
name: make-it-green
description: An autonomous execution loop to ensure the project maintains a green build status. Use this whenever code changes require validation via the Docker test suite.
compatibility: Requires docker and npm.
---

# Make it Green

**Description:** An autonomous execution loop to ensure the project maintains a
green build status.

**Execution Loop:**

1. Run `npm run docker:build-and-test-all` in the terminal, redirecting to a
   log file so the exit code is observable (`... > run.log 2>&1; echo $?`).
   Never pipe the run through `tail`/`grep` — that masks a nonzero exit and
   the passed-count line can appear below a failed-tests list.
2. Read the log's test summary (failed list first, then counts).
3. Surgically fix any coverage gaps, linting errors, or build failures.
4. Iterate on this process without human intervention until the build exits with
   code 0.

**Learnings:**

- For focused Jest checks, use
  `npm test -- --runTestsByPath ... --coverage=false` when you only need
  targeted signal; global coverage thresholds can make passing targeted suites
  exit nonzero.
- If `npm run docker:build-and-test-all` is interrupted after the Docker image
  build, lint, and Storybook coverage have passed, rerun
  `npm run docker:run-e2e-only` to verify the remaining Playwright tail before
  reporting final validation.
- **A jest failure whose stack frame points at the `it(...)` line is a
  timeout, not the assertion the code frame shows.** Jest prints a code frame
  around the `it`, so the last context line — often an `expect` a few lines
  below — reads like the failure while being nothing but context. #804 was
  filed and triaged as a lazy-analysis race on exactly that misreading: its
  quoted `76 | expect(view.queryByRole("table")).toBeNull();` is the frame's
  last context line and its `at …:73:5` is the `it` call site. The whole
  output reproduces on a **passing** tree with:

  ```bash
  npx jest --expand --coverage=false --testTimeout=1 \
    --runTestsByPath src/ui-react/TrainerPracticeDrill.test.tsx
  ```

  A budget of 1ms rather than something near the real one because the point
  is the output shape, and any threshold a passing test can still beat makes
  the demonstration depend on how busy the machine is. Against that spec as
  it stood at #804 the two strings matched character-for-character; the
  numbers have since moved with the file, so compare the shape rather than
  the lines. Line 76 was never reached. Read the stack frame, not the code
  frame.

- **The heavy jsdom Trainer specs run near jest's per-test budget whenever
  the machine is contended, and which one crosses first is luck.** Reproduce
  by starving jest — spin up more CPU hogs than there are cores and run
  `nice -n 20 npx jest`. Two settings, and keep their figures apart: at 40
  hogs on an eight-core host `TrainerPracticeDrill.test.tsx` took 17565ms,
  against the 17.815s recorded in #804, and passed with its worst test at
  4218ms of the 5000ms budget. At 72 hogs that file took 24047ms and the
  run failed, with the worst per-test times — 5855ms, 5237ms and 5155ms —
  spread across `TrainerUrlState`, `TrainerTelemetry` and
  `TrainerPracticeDrill`. `testTimeout` is therefore
  set to 15000 in `jest.config.json`: jest's 5000 default assumes a process
  that owns the machine, while `verify:fast` runs jest concurrently with
  eleven other tasks and jest itself forks one worker fewer than the machine
  has cores — on the eight-core host these numbers come from, twenty-odd
  CPU-hungry processes for eight cores. The ratio is what travels, not the
  count. Do not scope a fix like this to whichever spec happened to fail,
  and do not reach
  for a `maxWorkers` cap to get the same effect — the full suite passes
  under that starvation at 15000 with workers uncapped, and a cap would slow
  a dedicated `npm test` on a many-core CI or Docker machine.
- **Re-measure the budget on the branch that changes the specs, not the one
  that found the problem.** The 5855/5237/5155ms figures above are the
  pre-fix suite; PR #810, which fixed #804, made `TrainerPracticeDrill` wait
  for the pre-drill analysis, and that added work to it. Eleven further
  72-hog runs on that branch put per-run worst tests at 6676, 6749, 6996,
  7282, 7507, 7572, 7795, 8375, 8588, 8839 and 10818ms — so the real margin
  at 15000 is 1.39x, not the 3x the pre-fix numbers implied, and a budget of
  10000 would have failed one of those eleven runs outright. Tightening a
  timeout is worth doing, but a number taken from a measurement of different
  code is not evidence about the code being shipped, and one run is not a
  margin.
- Before the slow Docker run, iterate with `npm run verify:fast` — the
  `npm install`-only checks, concurrently, in about 20 seconds. It is also
  the pre-commit hook, but do not treat a landed commit as proof it ran:
  `--no-verify`, `HUSKY=0`, and some worktree setups all skip it (see
  `CLAUDE.md` on worktree hooks). It catches most of the lint gauntlet;
  see "Lint gauntlet interplay" in `AGENTS.md` for the fixes.
- **A green fast pass is not a green build.** `npm run verify:fast` is a
  subset; `npm run verify:gap` prints what the Docker gate runs that it
  does not, computed from the `Dockerfile` so it stays correct as either
  side drifts. Do not write that set down — a prose version was wrong
  three times during #763. A change touching stories, CSS, build config,
  dependencies, or user-visible copy is exactly the one whose fast pass
  proves least.
- When CI fails after a green hook, `npm run verify:gap` names which check
  it was. Run that check directly if your checkout can — but several of the
  gate's steps cannot run on a plain `npm install` tree: `lint:actionlint`
  exits 127 without the Docker-only binary, `lint:outdated` needs the
  network, Storybook coverage varies with the
  container's Node rather than the local one (not an arch split — see the
  Storybook-coverage bullet under Tests and quality in `AGENTS.md`), and
  the screenshots are genuinely arch-/rendering-sensitive. Reproduce those
  through `npm run docker:build-and-test-all` (or
  `npm run docker:run-e2e-only` for the Playwright tail). Fix it, then
  re-run `npm run verify:fast` plus that check before pushing, so the next
  CI run is not a third round-trip.
- `lint:audit` needs the network but not Docker, so when `verify:gap` names
  it, run `npm run lint:audit` directly and fix what it finds per
  `skills/dependency-maintenance/SKILL.md`. Each attempt is capped by
  `ATTEMPT_TIMEOUT_MS`, so a network that hangs rather than refusing cannot
  stall it for npm's five-minute fetch timeout. An advisory published
  between a commit and its run reddens CI on a change that touched no
  dependency, so read the failure before assuming the tree moved.

- After adding or changing Storybook stories, run
  `npm run storybook:test:coverage` and set the `test.coverage.thresholds`
  block in `vite.config.js` to the exact reported totals. Thresholds are
  minimums (only a drop fails the build); re-locking them to the current
  totals is a ratchet convention so any future regression fails
  immediately.
