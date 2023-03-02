# cribbage-trainer

Two-player cribbage discard and play improvement tool.

## Continuous deployment

Code in `main` is automatically built on `git push` and deployed to [GitHub Pages](https://markafitzgerald1.github.io/cribbage-trainer/) on build success via [GitHub Action Workflow](https://github.com/markafitzgerald1/cribbage-trainer/actions/workflows/npm-parcel-build-upload-and-deploy-to-pages.yml).

## Local and development setup

- Install third-party dependencies: `npm install`
- Run locally in development mode: `npm run clean && npm run lintTypeCheckAndAudit && npm start`
- Build and run locally in production (GitHub Pages) mode: `npm run clean && npm run lintTypeCheckAndAudit && npm run build && npm start`
