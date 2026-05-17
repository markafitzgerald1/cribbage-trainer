---
name: storybook-interaction-testing
description: Guidance on using Playwright in Storybook test components for interaction testing.
compatibility: Requires @storybook/react-vite and storybook/test.
---

# Storybook Interaction Testing

**Description:**
When creating interaction tests in Storybook, ensure that you utilize the proper
testing library tools provided by `storybook/test`.

**Learnings:**

- To trigger UI events (like clicks), use the `play` function in Storybook
  stories.
- Import interaction tools from `"storybook/test"` (e.g., `import { expect }`).
- The `play` function takes context as an argument, e.g.,
  `async ({ canvasElement, args }) => {}`.
- Use `within(canvasElement)` to query the DOM inside the `play` block.
- For mocking callbacks, assign `fn()` to `args` and assert with `expect()`.
- Assert UI output that is unique to the story state under test. Avoid broad
  text checks that can pass because of static controls or seeded defaults.
- Build story card fixtures with `createCard(...)` so `Card` objects include
  derived fields such as `count` and `rankLabel`.
- After easy-win interaction stories are added, rerun
  `npm run storybook:test:coverage` and lock the exact coverage totals into
  the Vite `test.coverage.thresholds` block.

**Example:**

```typescript
import { expect, fireEvent, fn, within } from "storybook/test";

export const ChangeSortOrder = {
  args: {
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const radio = within(canvasElement).getByRole("radio", {
      name: "Ascending",
    });
    await fireEvent.click(radio);
    await expect(args.onChange).toHaveBeenCalledWith(SortOrder.Ascending);
  },
};
```

## Review Comment Retrieval

When resolving GitHub PR review feedback, use thread-aware review data instead
of flat PR comments when possible.

1. Use the GitHub connector tool that lists PR review threads.
2. Check each thread's `is_resolved`, `is_outdated`, path, line, and comments.
3. Treat unresolved, non-outdated threads as the current actionable set.
4. Reply to addressed comments with an attributed agent prefix.
5. Resolve the thread only after the fix is committed or clearly present.

The connector can fetch review threads directly from a repository and PR
number, so agents should not need individual review URLs once the PR number is
known.
