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
- `lint:audit` also needs the network, but the hook runs it, so a CI-only
  audit failure means the advisory was published between your commit and
  the run rather than that you skipped a check. Re-run `npm run lint:audit`
  directly — no Docker needed — and fix it per
  `skills/dependency-maintenance/SKILL.md`. Each attempt is capped by
  `ATTEMPT_TIMEOUT_MS`, so a network that hangs rather than refusing cannot
  stall the hook the way npm's own five-minute fetch timeout would.

- After adding or changing Storybook stories, run
  `npm run storybook:test:coverage` and set the `test.coverage.thresholds`
  block in `vite.config.js` to the exact reported totals. Thresholds are
  minimums (only a drop fails the build); re-locking them to the current
  totals is a ratchet convention so any future regression fails
  immediately.
