# cribbage-trainer

## Summary

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/markafitzgerald1/cribbage-trainer/npm-parcel-build-upload-and-deploy-to-pages.yml?label=build%2Bdeploy&style=plastic)
![GitHub deployments](https://img.shields.io/github/deployments/markafitzgerald1/cribbage-trainer/github-pages?label=deploy&style=plastic)
![Website](https://img.shields.io/website?label=webapp%20site&style=plastic&url=https%3A%2F%2Fmarkafitzgerald1.github.io%2Fcribbage-trainer%2F)
![GitHub](https://img.shields.io/github/license/markafitzgerald1/cribbage-trainer?style=plastic)

Two-player cribbage discard and play improvement tool.

## Continuous deployment

Code in `main` is automatically built on `git push` and deployed to [GitHub
Pages](https://markafitzgerald1.github.io/cribbage-trainer/) on build success
via [GitHub Action Workflow](https://github.com/markafitzgerald1/cribbage-trainer/actions/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml).

## Local and development setup

- Install the latest version of the major version of [Node.js](https://nodejs.org/en/)
  specified in `.github/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml`
- Install third-party dependencies: `npm install`
- Run locally in development mode: `npm run clean && npm test && npm run
lintThenTypeCopyPasteOutdatedAndAuditCheck && npx --no-install playwright install
--with-deps && npm run test-e2e && npm start`
- Build and run locally in production (GitHub Pages) mode: `npm run clean && npm
test && npm run lintThenTypeCopyPasteOutdatedAndAuditCheck && npx --no-install
playwright install --with-deps && npm run test-e2e && npm run clean && npm run
build && npm start`

### Update visual regression test screenshots

- Remove out of date screenshots for all platforms: `rm tests-e2e/index.screenshots.spec.ts-snapshots/*.png`
- Generate the now expected browser screenshots for your development platform: `npm
run test-e2e`.
- If not developing on Linux, also generate now expected Linux browser
  screenshots by starting a [Playwright Docker container](https://playwright.dev/docs/docker#pull-the-image)
  with the [same version](https://mcr.microsoft.com/en-us/product/playwright/tags)
  as that in `package.json`:

  ```sh
  docker run -it --rm --ipc=host -v "$PWD":/usr/src/app -w /usr/src/app \
  mcr.microsoft.com/playwright:v1.39.0-jammy /bin/bash
  ```

- Then, in that container:
  - install `make` and `g++` to ensure that Parcel can run:
    `apt update && apt install --yes make gcc g++`,
  - remove any potentially non-Linux build or install artifacts then install:
    `rm -rf node_modules && npm run clean && npm install`,
  - generate now expected browser screenshots on Linux (required for GitHub
    Actions continuous integration to pass): `npm run test-e2e`, and
  - Remove Linux-specific build output: `rm -rf node_modules`.
