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
- Serve the dev app server over HTTPS, reachable from other devices on your
  network: `npm run start:https` (see below)

### Reach the dev server from a phone

`npm start` listens on `localhost` only, and serving it over plain `http` to a
LAN address does not work: `crypto.randomUUID` is secure-context only, so the
telemetry layer throws on first render and the page stays white. `npm start`
is unaffected, because `localhost` is a secure context whatever the scheme.

`npm run start:https` covers that case. It listens on every interface and
serves over TLS with a self-signed certificate, which makes the LAN origin a
secure context. Nothing to install on either machine:

1. Run `npm run start:https` and read the `Network:` URL it prints, for
   example `https://192.168.2.20:5173/cribbage-trainer`.
2. Open that URL on the phone, on the same network.
3. **Expect a certificate warning, and accept it.** On Android Chrome that is
   "Advanced" then "Proceed to ... (unsafe)"; on iOS Safari it is "Show
   Details" then "visit this website".

The warning is the cost of the approach, not a sign anything is wrong. The
certificate is generated locally and names only `localhost` and `127.0.0.1`,
so a LAN address mismatches it by construction. Expect to accept it again
after the certificate is regenerated (it is cached under `node_modules` and
lasts 30 days), if the browser forgets the exception, or if the router hands
out a different address.

Use a pull request preview instead when you need a real deployed origin — a
trusted certificate, the production base path, or analytics behavior that
depends on the origin. This path is for iterating on a visual change without
paying a deploy per look.

If the warning ever becomes more annoying than it is worth, the upgrade is
[mkcert](https://github.com/FiloSottile/mkcert): a locally trusted certificate
authority, installed on the laptop and on the phone, with no warning
afterwards. It is deliberately not the default here, because installing a
private certificate authority on a phone is a ten-minute per-device setup with
a real trust decision attached, to remove a single tap.

### Lint and Test

- Fast checks, and what `.husky/pre-commit` runs by default on each commit
  (about 20 seconds): `npm run verify:fast`
- The full gate: `npm run docker:build-and-test-all`. Continuous integration
  runs this for you against your pull request's head — but only once the PR
  exists: a branch pushed with no open PR triggers no CI. Open the PR right
  after the first commit (the flow below), or run the gate yourself when CI
  cannot serve that purpose — work that will stay unpushed, or a failure
  that only reproduces inside Docker.
- If you committed with `--no-verify`, you skipped `verify:fast`, not the
  gate — run `npm run verify:fast` by hand before pushing.

### Develop

- Serve [Storybook](https://storybook.js.org/) stories: `npm run storybook`
- Build a static version of the Storybook stories: `npm run storybook:build`
- Serve a static version of the Storybook stories: `npm run storybook:serve`

## Contributing

Before making changes, all developers and AI agents must read
[CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

[AGENTS.md](AGENTS.md) is picked up automatically by Codex, Google Antigravity,
and the GitHub Copilot cloud coding agent, and by Claude Code through
[CLAUDE.md](CLAUDE.md). Cursor, Windsurf, and Devin read it natively too.

Visual Studio Code is the exception: enable the `chat.useAgentsMdFile` setting
so Copilot applies [AGENTS.md](AGENTS.md) there. It is off by default, and
`.vscode/` is git-ignored in this repository, so set it per machine (workspace
or user settings). Without it, Copilot in VS Code sees only
`.github/copilot-instructions.md` and none of the conventions in
[AGENTS.md](AGENTS.md).

## License & AI Provenance

This project utilizes AI coding assistants in its development. All AI-generated
code is rigorously reviewed, tested, and modified by human maintainers. The
compiled repository and all its contents are distributed under the Mozilla
Public License 2.0 (MPL 2.0). See the [LICENSE](LICENSE) file for more details.
