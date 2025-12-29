# AGENTS.md

## Project overview

- Two-player cribbage discard and play trainer built with Vite + React + TypeScript.
- Primary branch: `main`; active work often happens on feature branches.

## Setup

- Node: use version specified in `.nvmrc` (install via `nvm install` if available).
- Install deps: `npm install`.

## Core commands

- Dev server: `npm start` (opens <http://localhost:5173>).
- Prod preview server: `npm start:production-preview` (opens <http://localhost:4173>).
- Build: `npm run build`.
- Storybook: `npm run storybook`; static build `npm run storybook:build`; serve
  static `npm run storybook:serve`.

## Tests and quality

- Full suite (lint + unit + e2e via Docker): `npm run docker:build-and-test-all`
  (preferred before merge).
- Unit/logic tests: `npm test` (uses Jest/Vitest as configured).
- Playwright e2e report viewer: `npx --no-install playwright show-report`.
- Lint: `npm run lint` (if present) or rely on the Docker test-all command above.

## Visual regression updates

- When Playwright snapshot diffs are acceptable:
  - Remove outdated screenshots: `rm tests-e2e/index.screenshots.spec.ts-snapshots/*.png`.
  - Regenerate: `npm run docker:build-and-test-all`.

## Code style and conventions

- TypeScript/React with Vite; keep types sound.
- Follow existing ESLint/Prettier configs; avoid introducing non-ASCII unless justified.
- Prefer small, focused commits; summarize why changes are needed.

## Husky/hooks

- Some git commands may invoke Docker-based test hooks. For doc-only changes you can optionally skip them (`HUSKY=0` or `--no-verify`), but for code changes let the hooks run.

## CI workflow notes

- Workflow: .github/workflows/npm-build-test-upload-artifact-and-deploy.yml.
- On non-main branches: builds Docker test image and runs Playwright e2e via
  `npm run docker:run-e2e-only`.
- On main: installs deps from `.nvmrc`, builds app and Storybook, uploads Pages
  artifact, deploys to GitHub Pages.

## Contribution notes

- Add/adjust tests alongside code changes.
- For visual changes, update Playwright snapshots when the new visuals are correct.
- Keep README and docs in sync when changing workflows or commands.

## Commit messages

- Follow the 50/72 Git commit message convention: subject line ≤ 50 chars, then
  blank line, body wrapped at 72 chars.
- Prefer semantic prefixes (e.g., feat, fix, chore, docs, refactor, test, ci, build).
