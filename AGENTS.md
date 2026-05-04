# AGENTS.md

## Project overview

- Two-player cribbage discard and play trainer built with Vite + React + TypeScript.
- **Architectural Constraint:** The scoring engine must rely exclusively on objective simulation, enumeration, or probability. AI agents are explicitly forbidden from introducing or using hard-coded heuristics, expert "rules of thumb", or subjective weighting in scoring algorithms. All expected values must be mathematically derived.
- Primary branch: `main`; active work often happens on feature branches.

## Agent Skills & Tools

- Agents must index and activate any skills found in the `skills/` directory
  before performing complex tasks.
- Specifically, use the `make-it-green` skill for build validation and CI compliance.

## Setup

- Node: use version specified in `.nvmrc` (install via `nvm install` if available).
- Install deps: `npm install`.

## Core commands

- Dev server: `npm start` (opens <http://localhost:5173>).
- Build: `npm run build`.
- Prod preview server: `npm run build` then
  `npm run start:production-preview` (opens <http://localhost:4173>).
- Storybook: `npm run storybook`; static build `npm run storybook:build`; serve
  static `npm run storybook:serve`.

## Tests and quality

- Full suite (lint + unit + e2e via Docker): `npm run docker:build-and-test-all`
  (preferred before merge).
- Unit/logic tests: `npm test` (uses Jest/Vitest as configured).
- Playwright e2e report viewer: `npx --no-install playwright show-report`.
- Lint: `npm run lint` (if present) or rely on the Docker test-all command above.

## Dependency maintenance

- Keep dependencies current in PRs: include minor and patch bumps, and take major
  upgrades when they do not overshadow the PR's primary purpose.
- Use `npm run deps:update:minor` for routine refreshes; handle larger major
  upgrades separately if they would dominate the change set.

## Visual regression updates

- When Playwright snapshot diffs are acceptable:
  - Regenerate screenshots in Docker:
    `npm run docker:build-and-test-all -- -- --update-snapshots`.
  - In PRs, explicitly note the screenshot updates and ensure expected images
    are updated to match the current actuals (these will be human reviewed).

## Code style and conventions

- TypeScript/React with Vite; keep types sound.
- Every React component should have a corresponding Storybook story file
  (`ComponentName.stories.ts` or `.tsx`).
- Follow existing ESLint/Prettier configs; avoid introducing non-ASCII unless justified.
- Prefer `--fix` flags (e.g., `eslint --fix`, `prettier --write`) over manual
  code fixes for auto-fixable lint and formatting issues.
- **ESLint:** There is a strict prohibition against file-scoped `eslint-disable`
  comments. If a rule is violated, the agent must fix the code or update the
  global config. Do not automate disabling lint rules; only a human developer
  may request disables.
- **Duplicate Code (`jscpd`):** Duplication must be resolved via general
  architectural refactoring (e.g., extracting helper functions, extracting React
  components, or interface inheritance via `extends`/`Omit`). Explicitly forbid
  using `/* jscpd:ignore */` for business logic or UI rendering; reserve ignores
  strictly for unavoidable boilerplate like import blocks.
- **React Depth:** To satisfy strict `react/jsx-max-depth` limits without
  violating `react/no-multi-comp`, agents must extract layout markup into
  internal `renderX` helper functions (e.g., `renderTableBody()`) rather than
  declaring multiple React components in a single file.
- Never use inline `CSpell:ignore` comments; instead add words to `.cspell.json`.
- Prefer small, focused commits; summarize why changes are needed.
- Only comment on the "why" behind code; strongly prefer meaningful test names,
  function names, and variable names to comments in code.
- Use long-form flags for command-line tools (e.g., `git commit --message` not
  `git commit -m`, `ls --all` not `ls -a`) to improve readability and
  understanding.

## Husky/hooks

- Some git commands may invoke Docker-based test hooks. **For doc-only changes,
  skip hooks** (`HUSKY=0` or `--no-verify`) to avoid unnecessary Docker/test
  runs. For code changes, only skip hooks if absolutely sure they are not needed
  (i.e., a build and all tests have been performed on the current uncommitted
  code). Keep GPG signing enabled for commits. Autonomous AI agents MUST bypass
  GPG signing using the `--no-gpg-sign` flag for intermediate commits. The human
  engineer assumes cryptographic accountability via the final Squash and Merge
  signature.
- If an agent uses `--no-verify` or `HUSKY=0` to bypass local git hooks, it MUST
  execute `npm run docker:build-and-test-all` to explicitly ensure full CI
  compliance before pushing.

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
