# cribbage-trainer

## Summary

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/markafitzgerald1/cribbage-trainer/npm-parcel-build-upload-and-deploy-to-pages.yml?label=build%2Bdeploy&style=plastic)
![GitHub deployments](https://img.shields.io/github/deployments/markafitzgerald1/cribbage-trainer/github-pages?label=deploy&style=plastic)
![Website](https://img.shields.io/website?label=webapp%20site&style=plastic&url=https%3A%2F%2Fmarkafitzgerald1.github.io%2Fcribbage-trainer%2F)
![GitHub](https://img.shields.io/github/license/markafitzgerald1/cribbage-trainer?style=plastic)

Two-player cribbage discard and play improvement tool.

## Continuous deployment

Code in `main` is automatically built on `git push` and deployed to the [GitHub
Pages](https://pages.github.com/) hosted
[Cribbage Trainer app site](https://markafitzgerald1.github.io/cribbage-trainer/)
on build success via
[GitHub Action Workflow](https://github.com/markafitzgerald1/cribbage-trainer/actions/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml).

## Local and Development Setup

### Install

- Install the latest version of the major version of [Node.js](https://nodejs.org/en/)
  specified in `.github/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml`
- Install third-party dependencies: `npm install`

### Build and Run

- Build production version of app (optional): `npm run build`
- Serve up and navigate to the app: `npm start`

### Lint and Test

- `npm run clean && npm run lint && npm test && npm run playwright-install &&
npm run test-storybook && npm run docker-test-e2e`

### Develop

- Serve [Storybook](https://storybook.js.org/) stories: `npm run storybook`
- Build a static version of the Storybook stories: `npm build storybook`

### Handling visual regression test screenshot differences

When the Playwright e2e (end to end) fail due to screenshot differences, compare
expected and actual screenshots via `npx --no-install playwright report` to
determine if the changes are visually acceptable. If acceptable, to update the
expected screenshots:

- remove out of date screenshots: `rm tests-e2e/index.screenshots.spec.ts-snapshots/*.png`
  , then
- generate the now expected browser screenshots: `npm run docker-test-e2e`.
