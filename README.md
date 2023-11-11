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

### Installation

- Install the latest version of the major version of [Node.js](https://nodejs.org/en/)
  specified in `.github/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml`
- Install third-party dependencies: `npm install`

### Testing

#### Local Development Tests

- Test, lint then run locally in development mode: `npm run clean && npm test &&
npm run lintThenTypeCopyPasteOutdatedAndAuditCheck && npx --no-install
playwright install --with-deps && npm run test-storybook && npm run test-e2e
&& npm start`
- Test, lint, build then run locally in production (GitHub Pages) mode: `npm run
clean && npm test && npm run lintThenTypeCopyPasteOutdatedAndAuditCheck && npx
--no-install playwright install --with-deps && npm run test-storybook && npm
run test-e2e && npm run clean && npm run build && npm start`

#### Linux-Based Tests from non-Linux Development Environments

- Run e2e (end to end) tests on Linux when development environment is not Linux:

  - Install [Docker](https://www.docker.com/) if not already installed for local
    development
  - Run a Playwright container:

  ```sh
  docker run -it --rm --ipc=host -v "$PWD":/usr/src/app -w /usr/src/app \
  mcr.microsoft.com/playwright:v1.40.1-jammy /bin/bash
  ```

  - In that container:
    - install `make` and `g++` to ensure that Parcel can run:
      `apt update && apt install --yes make gcc g++`,
    - remove any potentially non-Linux build or install artifacts then install:
      `rm -rf node_modules && npm run clean && npm install`,
    - run the e2e tests: `npm run test-e2e`, and
    - Remove Linux-specific build output: `rm -rf node_modules`.

- Run Storybook: `npm run storybook`
- Build static version of Storybook: `npm build storybook`

### Handling visual regression test screenshot differences

When the above `npm run test-e2e` fails due to screenshot differences, compare
expected and actual screenshots to determine if the changes are visually acceptable:

- Local development (any operating system): review via the `npm run test-e2e`
  displayed [Playwright report](http://localhost:9323/)
- Linux when not developing on Linux: `npx --no-install playwright show-report`
  and review via the browser tab opened by that command

If the changes are visually acceptable, update the visual regression test
screenshots via the following steps:

- Remove out of date screenshots:
  - Linux: `rm tests-e2e/index.screenshots.ts-snapshots/*-linux.png`
  - macOS: `rm tests-e2e/index.screenshots.ts-snapshots/*-darwin.png`
- Generate the now expected browser screenshots for your development platform:
  `npm run test-e2e`.
- If not developing on Linux, generate the now expected browser screenshots for
  Linux via [Docker](https://www.docker.com/) by running the ["Linux-Based Tests
  from non-Linux Development Environments"](#linux-based-tests-from-non-linux-development-environments)
  steps above, which will generate the now expected browser screenshots on Linux.
  These are required for GitHub Actions continuous integration to pass.
