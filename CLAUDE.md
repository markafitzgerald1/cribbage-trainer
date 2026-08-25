# CLAUDE.md

@AGENTS.md

This file is intentionally a thin wrapper, and agent conventions are tiered.
`AGENTS.md` — imported above, so it is resident in every session — holds the
invariants an agent can violate without knowing it is in that domain, plus an
imperative pointer to each task-shaped procedure. Those procedures live in
`skills/*/SKILL.md` and are read on demand when their stated trigger applies,
so a session pays for the areas it actually touches. Review-time guidance for
Copilot lives in `.github/copilot-instructions.md`.

Add new durable learnings to whichever tier matches the learning's trigger:
`AGENTS.md` for what binds every session, a skill for what a stated trigger
loads on demand. What belongs here instead is the narrow set that is true of
Claude Code alone — its harness, its worktrees, this machine's shell — since
no other harness reads this file and the shared contract should not carry
guidance only one tool can use.

## Claude-specific notes

- State intent and constraints; trust the model to plan. Prefer outcome-based
  instructions ("keep the tree green", "zero duplication") over prescriptive
  step lists, which degrade Fable-class model performance.
- Before non-trivial work, do a quick blind-spot pass: read the touched
  modules and their tests, and list what the issue/prompt leaves unstated
  (hidden constraints usually live in `eslint.config.mjs`, `vite.config.js`
  thresholds, and `AGENTS.md`).
- The shell may start on an old Node. Activate the repo version per command:
  `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use; hash -r`
  (`hash -r` is required because zsh caches the old `node` path).
- `.husky/pre-commit` runs the full `npm run docker:build-and-test-all` gate
  synchronously on every commit — several minutes end to end. The Bash tool's
  default 2-minute timeout is long enough for a hook that fails early (a lint
  or coverage-threshold error partway through the Dockerfile) but not for one
  that runs to completion, so a `git commit` that hits the timeout (exit 143,
  "Command timed out") has not necessarily failed — it may still be running
  server-side. Check `git log`/`git status` before concluding a timed-out
  commit was rejected, and issue any `git commit` in this repo with
  `run_in_background: true` rather than trusting a fixed timeout to cover a
  passing run.
- Working inside a `.claude/worktrees/<name>` checkout changes what several
  tools see, and each difference has already been mistaken for a real failure:
  - `jest.config.json` ignores `/.claude/`, and the worktree's absolute path
    contains it, so a bare `npx jest` finds no tests at all. Override the
    list, and drop coverage, whose global thresholds fail a focused run that
    otherwise passed. Keep `--runTestsByPath`: without it the paths are
    swallowed by the preceding array flag and the whole suite runs.

    ```bash
    npx jest --coverage=false \
      --testPathIgnorePatterns '/tests-e2e/' \
      --runTestsByPath <file>
    ```

  - `npm run lint:cspell` reports "Files checked: 0" and exits 1, because the
    parent repository's `.gitignore` excludes `/.claude/` and `--gitignore`
    therefore excludes the whole worktree. Check changed files directly with
    `npx cspell --no-gitignore <files>`.
  - The worktree starts with a nearly empty `node_modules`. Most tools resolve
    upward to the parent repository's copy, but Vitest browser mode (Storybook
    tests and coverage) fails with "Failed to fetch dynamically imported
    module" until `npm install` is run inside the worktree.
  - Playwright's non-CI `reuseExistingServer` will reuse a stale `vite preview`
    left on port 4173 by the main checkout, running e2e against an old bundle.
  - Docker and CI are unaffected by all of the above: they check out normally.
