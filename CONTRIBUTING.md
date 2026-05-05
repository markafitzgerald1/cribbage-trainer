# Contributing

## Architecture and Core Philosophy

- **No Heuristic Scoring:** The app's value proposition depends on the scoring
  engine relying entirely on objective simulation and probability. It is strictly
  forbidden to use arbitrary heuristic scoring, expert "rules of thumb", or
  subjective weighting in the scoring algorithms. All expected values must be
  mathematically derived from simulation, enumeration, or probability.

## Coding conventions

- Every React component should have a corresponding Storybook story file
  (`ComponentName.stories.ts` or `.tsx`).
- When suppressing duplication (`jscpd`), only ignore import/include statements
  and only for the minimum necessary lines; do not blanket-ignore larger code
  sections.
- Only comment on the "why" behind code; strongly prefer meaningful test names,
  function names, and variable names to comments in code.

## Dependency Maintenance

- Keep dependencies current in PRs: include minor and patch bumps, and take
  major upgrades when they do not overshadow the PR's primary purpose.
- `npm run deps:update:minor`: Updates all npm dependencies to their latest
  **minor** and **patch** versions (avoiding major updates), then installs them.
  Use a dedicated PR for large major upgrades when they would dominate the
  change set.

## Handling visual regression test screenshot differences

When the Playwright e2e (end to end) fail due to screenshot differences, compare
expected and actual screenshots via `npx --no-install playwright show-report` to
determine if the changes are visually acceptable. If acceptable, regenerate the
expected screenshots in Docker:

```sh
npm run docker:update-snapshots
```

## Husky/hooks

- Some git commands may invoke Docker-based test hooks. For doc-only changes,
  prefer skipping them (`HUSKY=0` or `--no-verify`) to avoid long runs; for code
  changes, only skip hooks if absolutely sure they are not needed (i.e., a build
  and all tests have been performed on the current uncommitted code). Keep GPG
  signing enabled for commits. Do not create unsigned commits.

## CI workflow notes

- Workflow: `.github/workflows/npm-build-test-upload-artifact-and-deploy.yml`.
- On non-`main` branches: builds Docker test image and runs Playwright e2e via
  `npm run docker:run-e2e-only`.
- On main: installs deps from `.nvmrc`, builds app and Storybook, uploads Pages
  artifact, deploys to GitHub Pages.

## Commit messages

- Follow the 50/72 Git commit message convention: subject line ≤ 50 chars, then
  blank line, body wrapped at 72 chars.
- Prefer semantic prefixes (e.g., feat, fix, chore, docs, refactor, test, ci, build).

## Gotchas & Lessons Learned

- **React Keys in Mapping Functions:** When rendering lists of cards or similar
  ephemeral state in React components, React keys must use stable card identity
  (e.g., combining rank and suit labels) rather than ephemeral array indices or
  `dealOrder`. This prevents UI state expansion bugs and unnecessary re-renders
  between deals.
- **Hidden Linter Failures and Globbing:** When using `npm-run-all` or `concurrently`
  to run multiple linting scripts, a failure in one script (like `markdownlint`)
  might be buried in the output. Always verify that linting scripts use exact,
  quoted globbing (e.g., `'**/*.md'`) to ensure they run correctly across platforms.
- **Bypassing Husky Hooks:** Bypassing local Husky pre-commit hooks
  (`--no-verify`) will hide linting and test failures until they hit the CI
  pipeline. If hooks must be bypassed locally, the agent MUST run the full Docker
  CI loop manually to verify compliance before pushing.
