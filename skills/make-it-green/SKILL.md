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
- Before the slow Docker run, iterate with `npm run lint && npm test` — the
  lint gauntlet (eslint `--max-warnings 0`, dual spell checkers, jscpd 0%,
  `jest/no-hooks`, `assertFunctionNames` registration) catches most failures
  in seconds; see "Lint gauntlet interplay" in `AGENTS.md` for the fixes.
- After adding or changing Storybook stories, run
  `npm run storybook:test:coverage` and set the `test.coverage.thresholds`
  block in `vite.config.js` to the exact reported totals. Thresholds are
  minimums (only a drop fails the build); re-locking them to the current
  totals is a ratchet convention so any future regression fails
  immediately.
