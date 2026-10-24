import { EMPTY, withFailingWrite } from "./discardTally.test.common";
import { claimSkip, skippedHandKeysKey } from "./skippedHandKeys";
import { describe, expect, it } from "@jest/globals";

describe("claimSkip", () => {
  it("lets only the first claim on a hand charge it", () => {
    localStorage.clear();
    const claims = [claimSkip("one"), claimSkip("one"), claimSkip("two")];

    expect(claims).toStrictEqual([true, false, true]);
  });

  it("forgets the oldest hands past the cap", () => {
    localStorage.clear();
    Array.from({ length: 21 }, (_, index) => claimSkip(`hand-${index}`));

    expect(claimSkip("hand-0")).toBe(true);
  });

  it.each([
    { claimed: true, name: "text that is not JSON", stored: "not-json" },
    { claimed: true, name: "JSON that is not a list", stored: '{"a":1}' },
    {
      claimed: false,
      name: "a list with a non-text entry",
      stored: '[1,"two"]',
    },
  ])("reads $name from storage", ({ claimed, stored }) => {
    localStorage.setItem(skippedHandKeysKey, stored);

    expect(claimSkip("two")).toBe(claimed);
  });

  it("still lets the claim through when storage rejects the write", () => {
    localStorage.clear();
    let claimed = false;
    withFailingWrite(() => {
      claimed = claimSkip("one");
      return EMPTY;
    });

    expect(claimed).toBe(true);
  });
});
