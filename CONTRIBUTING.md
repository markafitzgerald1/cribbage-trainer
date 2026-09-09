# Contributing

## Architecture and Core Philosophy

- **No Heuristic Scoring:** The app's value proposition depends on the scoring
  engine relying entirely on objective simulation and probability. It is strictly
  forbidden to use arbitrary heuristic scoring, expert "rules of thumb", or
  subjective weighting in the scoring algorithms. All expected values must be
  mathematically derived from simulation, enumeration, or probability.

## Coding conventions

- Every React component should have a corresponding Storybook story file
  (`ComponentName.stories.ts` or `.tsx`).
- When suppressing duplication (`jscpd`), only ignore import/include statements
  and only for the minimum necessary lines; do not blanket-ignore larger code
  sections.
- Only comment on the "why" behind code; strongly prefer meaningful test names,
  function names, and variable names to comments in code.

## Dependency Maintenance

- Keep dependencies current in PRs: include minor and patch bumps, and take
  major upgrades when they do not overshadow the PR's primary purpose.
- `npm run deps:update:minor`: Updates all npm dependencies to their latest
  **minor** and **patch** versions (avoiding major updates), then installs them.
  Use a dedicated PR for large major upgrades when they would dominate the
  change set.

## Handling visual regression test screenshot differences

When the Playwright e2e (end to end) tests fail due to screenshot differences,
compare expected and actual screenshots via
`npx --no-install playwright show-report` to determine if the changes are
visually acceptable. If acceptable, regenerate the expected screenshots in
Docker:

```sh
npm run docker:update-screenshots
```

After screenshots are regenerated, rerun the full Docker suite without update
flags:

```sh
npm run docker:build-and-test-all
```

## Husky/hooks

- `.husky/pre-commit` runs `npm run verify:fast` — the `npm install`-only
  checks (lint, type-check, jest, the build, the standalone guards),
  concurrently, in about 20 seconds. Let it run; skipping it saves nothing
  worth the risk.
- Every check in the hook comes from `devDependencies`, so a fresh clone plus
  `npm install` can run all of it. `actionlint` is deliberately excluded
  because it is installed only by the `Dockerfile`; including it made the
  hook exit 127 on any machine without a separate Homebrew install.
- The hook is a fast filter, not the merge gate. The authoritative gate is
  `npm run docker:build-and-test-all`; `npm run verify:gap` shows what it
  runs that the hook does not. Required CI serves as that gate once your
  pull request is open — it validates the PR's head. A branch pushed with
  no open PR runs no CI, so open the PR right after the first commit, or
  run the gate locally (also do that for unpushed work or a Docker-only
  reproduction).
- If you skipped the hook with `--no-verify` or `HUSKY=0`, run
  `npm run verify:fast` by hand before pushing; CI still runs the full gate
  on your PR's head once the PR exists.
- Documentation-only changes need only the documentation checks
  (`npm run lint:markdownlint`, `npm run lint:prettier`, and
  `npm run lint:cspell`).
- Human contributors keep GPG signing enabled and do not create unsigned
  commits. Autonomous AI agents are the exception: they MUST pass
  `--no-gpg-sign` on intermediate commits (see AGENTS.md), and the human
  assumes cryptographic accountability via the final Squash and Merge
  signature.

## CI workflow notes

- Workflow: `.github/workflows/npm-build-test-upload-artifact-and-deploy.yml`.
- On a pull request (`opened`, `reopened`, `synchronize`): builds the Docker
  test image, runs Playwright e2e via `npm run docker:run-e2e-only`, and
  publishes a per-PR preview. `push` triggers the workflow only for `main`,
  so a branch without an open PR gets no CI.
- On main: installs deps from `.nvmrc`, builds app and Storybook, uploads Pages
  artifact, deploys to GitHub Pages.

## Commit messages

- Follow the 50/72 Git commit message convention: subject line ≤ 50 chars, then
  blank line, body wrapped at 72 chars.
- Prefer semantic prefixes (e.g., feat, fix, chore, docs, refactor, test, ci, build).

## Gotchas & Lessons Learned

- **React Keys in Mapping Functions:** When rendering lists of cards or similar
  ephemeral state in React components, React keys must use stable card identity
  (e.g., combining rank and suit labels) rather than ephemeral array indices or
  `dealOrder`. This prevents UI state expansion bugs and unnecessary re-renders
  between deals.
- **Hidden Linter Failures and Globbing:** When using `npm-run-all` or `concurrently`
  to run multiple linting scripts, a failure in one script (like `markdownlint`)
  might be buried in the output. Always verify that linting scripts use exact,
  quoted globbing (e.g., `'**/*.md'`) to ensure they run correctly across platforms.
- **Bypassing Husky Hooks:** `--no-verify` / `HUSKY=0` skips `verify:fast`,
  so linting and test failures stay hidden until CI. If you bypass the hook,
  run `npm run verify:fast` manually before pushing; CI runs the full
  `docker:build-and-test-all` on your PR's head once the PR is open, so a
  local Docker run is only needed for unpushed work or a Docker-only repro.
- **Spell-check Ignore Rules Live in `.cspell.json`, Not `.gitignore`:**
  `lint:cspell` deliberately does not pass `--gitignore`. With that flag,
  cspell resolved ignores against the parent repository's `.gitignore`,
  whose `/.claude/*` entry covers every file in a `.claude/worktrees`
  checkout, so it checked zero files and exited 1 there. `ignorePaths` in
  `.cspell.json` resolves against cspell's own root instead. If you change
  either that list or `.gitignore`, keep them in step, and verify by
  comparing the checked-file set against a clean checkout rather than by a
  passing run — a glob-driven lint task that matches nothing still exits 0.
