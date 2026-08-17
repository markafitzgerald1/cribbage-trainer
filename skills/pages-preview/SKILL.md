---
name: pages-preview
description: Use before changing the Pages workflows, the PR preview deploy, the `pages-content` branch, or `scripts/pagesContentMerge.mjs` — covers preview eligibility, the shared deployed tree, the two Pages environments, and the guard that keeps production from being wiped.
compatibility: Requires the gh CLI for PR and workflow inspection.
---

# PR preview deploys (issue #153)

**Description:** How per-PR previews are published to GitHub Pages, why the
production site and the previews share one deployed tree, and the ordering and
concurrency rules that decide whether a run publishes anything at all.

**Learnings:**

- Every eligible open PR auto-publishes to
  `https://markafitzgerald1.github.io/cribbage-trainer/pr/<number>/`, kept
  current on every push and removed when the PR closes
  (`.github/workflows/pages-preview-cleanup.yml`, triggered by
  `pull_request: closed`, kept in its own file so editing cleanup logic can
  never perturb the production-critical jobs' `on:`/`if:` conditions).
  "Eligible" means same-repository and not authored by `dependabot[bot]`;
  fork PRs never reach this at all since `push` never fires in this repo for
  fork commits. Because previews are `push`-triggered, the branch-creating
  push always precedes `gh pr create` and skips with "No open pull request
  found"; the first preview publishes on the first push made _after_ the PR
  exists (push an empty or follow-up commit if one is needed sooner).
- The branch-ordering and push-timing rules these triggers imply bind every
  PR, not just Pages work, so they live in "CI workflow notes" in
  `AGENTS.md`: open the PR before the push you want previewed, and never
  push while waiting on a run.
- The `pages-content` branch is a git-based **cache**, not the Pages
  publishing source (Pages settings stay `build_type: workflow`). It is
  fetched-or-created, mutated, and force-pushed as a single amended commit
  by every publish (`.github/actions/publish-pages-content`), so its history
  never grows — don't "clean up" this branch or its lack of history; that is
  intentional, and a repository ruleset ("Protect pages-content from
  deletion") blocks deleting it. It holds the production site root plus one `pr/<number>/`
  directory per currently-open preview; the merge/replace/remove logic lives
  in `scripts/pagesContentMerge.mjs` (tested via `node --test`, not Jest, so
  it stays outside `src/**` and the 100% Jest coverage threshold).
- Every publish deploys the **whole** merged tree, so a `pages-content`
  checkout lacking a root `index.html` must never reach `deploy-pages`: the
  very first preview publish did exactly that (the branch bootstraps empty
  and production had never been seeded through this pipeline) and took the
  production site down. The composite action now runs
  `pagesContentMerge.mjs assert-deployable` before deploying, `applyProd`
  preserves the checkout's `.git` worktree pointer (deleting it breaks the
  commit-and-push step), and the cleanup workflow no-ops when the branch
  does not exist. If the guard ever fires, seed production first (deploy
  `main` through the new workflow, or apply the `prod` mutation to the
  branch manually).
- Never retry a failed Pages deploy with a single-job rerun: rerunning a
  job that already uploaded a `github-pages` artifact adds a second one to
  the same run, and `actions/deploy-pages` then always fails with
  "Multiple artifacts named github-pages" — for every attempt on that run.
  Push a new commit (fresh run) instead.
- A GitHub Actions concurrency group holds one running job plus **one**
  waiting job; a newer arrival cancels the older waiting one ("higher
  priority waiting request"), even with `cancel-in-progress: false`.
  Merging a PR fires `push` and `pull_request: closed` simultaneously, so
  the close-cleanup job could cancel the merge's own production deploy
  (this hit the #656 merge and left production one commit stale). Hence
  cleanup skips merged PRs entirely and the production publish prunes
  previews for non-open PRs instead (`pagesContentMerge.mjs prune`). Because
  that prune is destructive, its open-PR allowlist must use a paginated API
  query; a finite `gh pr list --limit` can omit a still-open PR and delete its
  preview.
- Bot logins are spelled differently per GitHub API surface: Dependabot is
  `app/dependabot` in `gh` CLI/GraphQL author fields but `dependabot[bot]`
  in REST/webhook event payloads. Never compare a single literal — the
  preview-eligibility check matched only the latter and silently published
  a preview for a Dependabot PR.
- There are deliberately **two** GitHub Pages environments: `github-pages`
  (production) has a branch policy restricting it to `main` — reusing it for
  previews would silently hang every preview job before any step runs.
  Preview jobs target the separate, unprotected `github-pages-preview`
  environment instead, which Actions auto-creates on first use.
- `vite.config.js`'s `base` reads `PAGES_BASE_PATH` (falling back to
  `/cribbage-trainer`); preview builds set it to `/cribbage-trainer/pr/<n>`
  and deliberately skip the `dist/`-caching step used on main, since that
  cache key hashes only source files, not the base path.
