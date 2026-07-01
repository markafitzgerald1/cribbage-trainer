---
name: make-it-green
description: An autonomous execution loop to ensure the project maintains a green build status. Use this whenever code changes require validation via the Docker test suite.
compatibility: Requires docker and npm.
---

# Make it Green

**Description:** An autonomous execution loop to ensure the project maintains a
green build status.

**Execution Loop:**

1. Run `npm run docker:build-and-test-all` in the terminal.
2. Read the terminal output.
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
