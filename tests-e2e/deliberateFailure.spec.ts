import { expect, test } from "@playwright/test";

test("fails on purpose so the required check can be seen going red", () => {
  expect(true).toBe(false);
});
