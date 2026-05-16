import { type TestContainerGet, getByCardText } from "./test-utils";
import { describe, expect, it } from "@jest/globals";

type MatcherFn = (text: string, element: Element | null) => boolean;

function makeElement(
  tagName: string,
  classList: { contains: (c: string) => boolean },
  textContent: string | null = "",
): Element {
  return { classList, tagName, textContent } as unknown as Element;
}

function assertMatcherReturnsFalse(
  invokeWith: (matcherFn: MatcherFn) => boolean,
): void {
  let captured = true;
  const container: TestContainerGet = {
    getByText: (matcher) => {
      const matcherFn = matcher as MatcherFn;
      captured = invokeWith(matcherFn);
      return {} as HTMLElement;
    },
  };

  getByCardText(container, "5");

  expect(captured).toBe(false);
}

describe("test-utils", () => {
  it("createMatcher should return false for null element", () => {
    assertMatcherReturnsFalse((fn) => fn("", null));
  });

  it("getByCardText should handle elements with no text content", () => {
    const element = makeElement(
      "DIV",
      { contains: (className) => className === "mock-cardLabel" },
      null,
    );

    assertMatcherReturnsFalse((fn) => fn("", element));
  });

  it("getByCardText should handle non-DIV elements", () => {
    const element = makeElement("SPAN", { contains: () => true });

    assertMatcherReturnsFalse((fn) => fn("", element));
  });
});
