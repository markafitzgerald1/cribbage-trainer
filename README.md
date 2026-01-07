# cribbage-trainer

## Summary

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/markafitzgerald1/cribbage-trainer/npm-build-test-upload-artifact-and-deploy.yml?label=build%2Bdeploy&style=plastic)
![GitHub deployments](https://img.shields.io/github/deployments/markafitzgerald1/cribbage-trainer/github-pages?label=deploy&style=plastic)
![Website](https://img.shields.io/website?label=webapp%20site&style=plastic&url=https%3A%2F%2Fmarkafitzgerald1.github.io%2Fcribbage-trainer%2F)
![GitHub](https://img.shields.io/github/license/markafitzgerald1/cribbage-trainer?style=plastic)

Two-player cribbage discard and play improvement tool.

## Continuous deployment

Code in `main` is automatically built on `git push` and deployed to the [GitHub
Pages](https://pages.github.com/) hosted
[Cribbage Trainer app site](https://markafitzgerald1.github.io/cribbage-trainer/)
and [Storybook site](https://markafitzgerald1.github.io/cribbage-trainer/storybook/)
on build success via [GitHub Action Workflow](https://github.com/markafitzgerald1/cribbage-trainer/actions/workflows/npm-build-test-upload-artifact-and-deploy.yml).

## Local and Development Setup

### Install

- Install the latest version of the version of [Node.js](https://nodejs.org/en/)
  specified in `.nvmrc` by hand, or if using [nvm](https://github.com/nvm-sh/nvm):
  `nvm install`
- Install third-party dependencies: `npm install`

### Build and Run

- Build production version of app (optional): `npm run build`
- Serve up and navigate to the dev app server: `npm start` then `open http://localhost:5173`
- Serve up and navigate to the production preview app server:
  `npm run build` then `npm run start:production-preview` and `open http://localhost:4173`

### Lint and Test

- `npm run docker:build-and-test-all`

### Develop

- Serve [Storybook](https://storybook.js.org/) stories: `npm run storybook`
- Build a static version of the Storybook stories: `npm run storybook:build`
- Serve a static version of the Storybook stories: `npm run storybook:serve`

### Coding conventions

- Every React component should have a corresponding Storybook story file
  (`ComponentName.stories.ts` or `.tsx`).
- When suppressing duplication (`jscpd`), only ignore import/include statements
  and only for the minimum necessary lines; do not blanket-ignore larger code
  sections.
- Only comment on the "why" behind code; strongly prefer meaningful test names,
  function names, and variable names to comments in code.

### Dependency Maintenance

- Keep dependencies current in PRs: include minor and patch bumps, and take
  major upgrades when they do not overshadow the PR's primary purpose.
- `npm run deps:update:minor`: Updates all npm dependencies to their latest
  **minor** and **patch** versions (avoiding major updates), then installs them.
  Use a dedicated PR for large major upgrades when they would dominate the
  change set.

### Handling visual regression test screenshot differences

When the Playwright e2e (end to end) fail due to screenshot differences, compare
expected and actual screenshots via `npx --no-install playwright show-report` to
determine if the changes are visually acceptable. If acceptable, to update the
expected screenshots:

- remove out of date screenshots: `rm tests-e2e/index.screenshots.spec.ts-snapshots/*.png`
  , then
- generate the now expected browser screenshots: `npm run docker:build-and-test-all`.

### Husky/hooks

- Some git commands may invoke Docker-based test hooks. For doc-only changes,
  prefer skipping them (`HUSKY=0` or `--no-verify`) to avoid long runs; for code
  changes, only skip hooks if absolutely sure they are not needed (i.e., a build
  and all tests have been performed on the current uncommitted code). Keep GPG
  signing enabled for commits. Do not create unsigned commits.

### CI workflow notes

- Workflow: `.github/workflows/npm-build-test-upload-artifact-and-deploy.yml`.
- On non-`main` branches: builds Docker test image and runs Playwright e2e via
  `npm run docker:run-e2e-only`.
- On main: installs deps from `.nvmrc`, builds app and Storybook, uploads Pages
  artifact, deploys to GitHub Pages.

### Commit messages

- Follow the 50/72 Git commit message convention: subject line ≤ 50 chars, then
  blank line, body wrapped at 72 chars.
- Prefer semantic prefixes (e.g., feat, fix, chore, docs, refactor, test, ci, build).
