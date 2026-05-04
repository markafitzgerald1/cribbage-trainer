# cribbage-trainer

## Summary

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/markafitzgerald1/cribbage-trainer/npm-build-test-upload-artifact-and-deploy.yml?label=build%2Bdeploy&style=plastic)
![GitHub deployments](https://img.shields.io/github/deployments/markafitzgerald1/cribbage-trainer/github-pages?label=deploy&style=plastic)
![Website](https://img.shields.io/website?label=webapp%20site&style=plastic&url=https%3A%2F%2Fmarkafitzgerald1.github.io%2Fcribbage-trainer%2F)
![GitHub](https://img.shields.io/github/license/markafitzgerald1/cribbage-trainer?style=plastic)

Two-player cribbage discard and play improvement tool.

[![Play Cribbage Trainer](https://img.shields.io/badge/🃏_Play_Cribbage_Trainer_App-2ea44f?style=for-the-badge)](https://markafitzgerald1.github.io/cribbage-trainer/)

## Project Philosophy

To ensure the app's value proposition remains intact, the scoring engine relies
strictly on objective simulation and probability, not subjective expert rules of
thumb. Both humans and AI agents need to understand and respect this constraint.
Expected values must always be derived from simulation, enumeration, or
probability, rather than hard-coded heuristics or subjective weighting.

## Continuous deployment

Code in `main` is automatically built on `git push` and deployed to the [GitHub
Pages](https://pages.github.com/) hosted app and
[Storybook site](https://markafitzgerald1.github.io/cribbage-trainer/storybook/)
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

## Contributing

Before making changes, all developers and AI agents must read
[CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

## License & AI Provenance

This project utilizes AI coding assistants in its development. All AI-generated
code is rigorously reviewed, tested, and modified by human maintainers. The
compiled repository and all its contents are distributed under the Mozilla
Public License 2.0 (MPL 2.0). See the [LICENSE](LICENSE) file for more details.
