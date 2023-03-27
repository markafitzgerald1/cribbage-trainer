# cribbage-trainer

Two-player cribbage discard and play improvement tool.

## main Branch Build and Deploy Status

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/markafitzgerald1/cribbage-trainer/npm-parcel-build-upload-and-deploy-to-pages.yml?label=build%2Bdeploy&style=plastic)

## Continuous deployment

Code in `main` is automatically built on `git push` and deployed to [GitHub Pages](https://markafitzgerald1.github.io/cribbage-trainer/) on build success via [GitHub Action Workflow](https://github.com/markafitzgerald1/cribbage-trainer/actions/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml).

## Local and development setup

- Install the latest version of the major version of [Node.js](https://nodejs.org/en/) specified in `.github/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml`
- Install third-party dependencies: `npm install`
- Run locally in development mode: `npm run clean && npm test && npm run lintTypeCopyPasteAuditAndOutdatedCheck && npm start`
- Build and run locally in production (GitHub Pages) mode: `npm run clean && npm test && npm run build && npm run lintTypeCopyPasteAuditAndOutdatedCheck && npm start`
