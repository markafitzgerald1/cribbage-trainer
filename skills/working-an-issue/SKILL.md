---
name: working-an-issue
description: Use before starting work on a GitHub issue — the plan comment, branch and PR shape, what a review guide and testing plan owe a reader, how to request Copilot and verify it, and the Codex review loop that has to run before a human is asked to look.
---

# Working an issue end to end

**Description:** The delivery shape expected here, in order, and the two
review mechanics that have each produced a wrong conclusion when guessed at.

**Learnings:**

- The order is: post the plan as an attributed comment on the issue **before**
  writing code; move the issue to In Progress on the project board;
  implement on a `feature/<issue>-<slug>` branch; push once the branch has one
  commit and open the PR immediately, because the preview only publishes for
  pushes made after the PR exists; open it as a draft if the work is not ready
  to read; then push the rest.
- The PR body carries a human review guide and a manual testing plan. Request
  a Copilot review and run the Codex loop to a clean round before asking for
  human review — the human's attention is the scarce resource here and comes
  last, not first.
- The review guide is what makes a PR reviewable rather than merely correct: a
  suggested file reading order, the design decisions worth challenging rather
  than only the ones that worked, and honest flags for anything a reader would
  want to know and could otherwise miss — a lowered coverage threshold, a test
  whose environment could not reproduce the case it asserted, an approximation
  left standing. A guide that only restates the diff has not done its job.
- The manual testing plan says what a human should do in the deployed preview
  and what they should see. Be explicit about what no automated gate here
  covers: a real phone, a real network, a real Google Analytics stream. When
  the human runs those steps, record the result in the PR body, and say
  plainly if later commits have moved the code out from under that run.
- Request Copilot with
  `gh api --method POST --raw-field
'reviewers[]=copilot-pull-request-reviewer[bot]'
repos/<owner>/<repo>/pulls/<n>/requested_reviewers`.
  `gh pr edit --add-reviewer copilot` cannot resolve that login. Afterwards
  `gh pr view <n> --json reviewRequests` still returns `[]` and the REST
  response's own `requested_reviewers` array is empty — Copilot is simply not
  represented there, which is **not** evidence the request failed and must not
  be retried on that basis. Confirm it in
  `gh api repos/<owner>/<repo>/issues/<n>/timeline`, which shows
  `review_requested` with `requested_reviewer.login == "Copilot"` followed by
  `copilot_work_started`.
- Read the body of any review that arrives before claiming a review happened.
  Both bots can return a stub instead: Copilot when the requester is out of
  quota, Codex when its usage limits are reached.
- The Codex loop and the review-thread mechanics that bind every PR — request
  without asking, iterate to a clean round, reply to and resolve every thread
  — are in `AGENTS.md` under GitHub PR Reviews, because they apply to any PR
  and not only to issue work.
