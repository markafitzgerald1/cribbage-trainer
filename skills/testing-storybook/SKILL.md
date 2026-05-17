---
name: storybook-interaction-testing
description: Guidance on using Playwright in Storybook test components for interaction testing.
compatibility: Requires @storybook/react-vite and storybook/test.
---

# Storybook Interaction Testing

**Description:**
When creating interaction tests in Storybook (e.g., in `*.stories.tsx` or `*.stories.ts` files), ensure that you utilize the proper testing library tools provided by `@storybook/test` or `storybook/test`.

**Learnings:**
- To trigger UI events (like clicks) and verify results, use the `play` function in Storybook stories.
- Import interaction tools from `"storybook/test"` (e.g., `import { expect, fireEvent, within, fn } from "storybook/test";`).
- The `play` function takes context as an argument (`async ({ canvasElement, args }) => { ... }`).
- Use `within(canvasElement)` to query the DOM inside the `play` block.
- For mocking and asserting callbacks (like `onChange`), assign `fn()` to the `args` of the story, and verify it with `expect(args.onChange).toHaveBeenCalledWith(...)`.

**Example:**
```typescript
import { expect, fireEvent, fn, within } from "storybook/test";

export const ChangeSortOrder = {
  args: {
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const radio = within(canvasElement).getByRole("radio", { name: "Ascending" });
    await fireEvent.click(radio);
    await expect(args.onChange).toHaveBeenCalledWith(SortOrder.Ascending);
  },
};
```
