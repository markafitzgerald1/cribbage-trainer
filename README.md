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

Practice retains the latest 1,000 committed retries globally. Aggregate counters
and streaks, rather than the surviving attempt log, remain the mastery authority.
The Chromium storage stress fixture with 10,000 decisions, 10,000 aggregates and
1,000 attempts stores and reloads exactly at 5,147,904 bytes, leaving 94,955 ASCII
characters of headroom; 2,000 attempts exceed quota. Full decision/aggregate caps
already need about 5 MB before any attempts in that fixture. Larger legal tallies
or other origin data can still exhaust storage; failed writes retain session
progress but cannot guarantee durability across reload. Decision/aggregate codec
compaction is a separate follow-up, with both 10,000-row caps kept here.

## Evidence

What the pegging advice is built on, and what it is known to be worth. These
figures compare bots, not people. Each win rate is a percentage, where 50 is
parity, plus or minus one standard error in percentage points, from 500,000
pairs of duplicate games with the seats swapped. They are not adjusted for
multiple comparisons.

- **How close to optimal is the pegging?** An opponent who knew the policy
  exactly could gain at most 0.00047 points a hand against it. That is an exact
  average over the two seats and over the pairs of kept hands it was solved on,
  by card rank: half from uniform random four-card hands, half from six-card
  deals kept by the simulator's earlier discard rule. It does not bound a single
  hand, or another mix of hands.
- **Is this table better than the app's previous one?** 50.287 ± 0.027 when both
  bots peg with the solved policy; 49.724 ± 0.023 when both peg with the
  simulator's older heuristic.
- **What is pegging itself worth?** The solved policy beats that heuristic
  55.638 ± 0.029, with both bots discarding by the app's previous table.

A table does better in the pegging style it was measured in. This one's
advantage is established for players who peg like the solved policy, not for
the heuristic and not for people. The table uses card ranks only, aims for
points rather than for winning from the current score, and takes opponents'
discards from a fixed population that was not solved together with the pegging.
The
[release notes](https://github.com/markafitzgerald1/simulate-cribbage-games/releases/tag/expected-play-points)
have the remaining comparisons.

### Table history

Each play table keeps its entry when a newer one takes over. The digest is the
start of the means file's SHA-256, which the app records with each decision.

- **`4ef452e2`, CFR table, 2026-11-25 (#908):** current. Measured with the solved
  CFR pegging policy in both seats.
- **`7420b180`, June 2026 (#636):** replaced by the CFR table. Measured with the
  trained pegging policy of the time in both seats.
- **`6ed3a051`, weekly release, 2026-11-22 (#898):** never in the app. Measured
  with the simulator's heuristic in both seats.
- **`41ddcbd6`, October 2026 research:** never released. Measured with an earlier
  CFR pegging policy in both seats.

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

`npm run start:production-preview:https` does the same for the **built** site
rather than the dev server, and is the one to reach for when a bug may be a
build artifact: the production bundle is minified, carries no HMR client, and
resolves its modules differently, so it does not always behave like `npm
start`. Same certificate warning, same one-time acceptance.

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
  runs the same checks, split into parallel jobs, against your pull
  request's head — but only once the PR
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
