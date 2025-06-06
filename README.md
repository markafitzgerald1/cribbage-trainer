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
  `npm start:production-preview` then `open http://localhost:4173`

### Lint and Test

- `npm run docker:build-test-suite`
- `npm run lint:actions` # validate GitHub Actions workflows

### Develop

- Serve [Storybook](https://storybook.js.org/) stories: `npm run storybook`
- Build a static version of the Storybook stories: `npm run storybook:build`
- Serve a static version of the Storybook stories: `npm run storybook:serve`

### Handling visual regression test screenshot differences

When the Playwright e2e (end to end) fail due to screenshot differences, compare
expected and actual screenshots via `npx --no-install playwright show-report` to
determine if the changes are visually acceptable. If acceptable, to update the
expected screenshots:

- remove out of date screenshots: `rm tests-e2e/index.screenshots.spec.ts-snapshots/*.png`
  , then
- generate the now expected browser screenshots: `npm run docker:build-test-suite`.
