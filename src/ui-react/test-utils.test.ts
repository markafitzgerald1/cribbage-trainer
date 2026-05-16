import { type TestContainerGet, getByCardText } from "./test-utils";
import { describe, expect, it } from "@jest/globals";

describe("test-utils", () => {
  it("createMatcher should return false for null element", () => {
    const container: TestContainerGet = {
      getByText: (matcher) => {
        const matcherFn = matcher as (
          text: string,
          element: Element | null,
        ) => boolean;

        const result = matcherFn("", null);

        expect(result).toBe(false);

        return {} as HTMLElement;
      },
    };

    getByCardText(container, "5");

    expect(true).toBe(true);
  });

  it("getByCardText should handle elements with no text content", () => {
    const container: TestContainerGet = {
      getByText: (matcher) => {
        const matcherFn = matcher as (
          text: string,
          element: Element | null,
        ) => boolean;

        const result = matcherFn("", {
          classList: {
            contains: (className: string) => className === "mock-cardLabel",
          },
          tagName: "DIV",
          textContent: null,
        } as unknown as Element);

        expect(result).toBe(false);

        return {} as HTMLElement;
      },
    };

    getByCardText(container, "5");

    expect(true).toBe(true);
  });

  it("getByCardText should handle non-DIV elements", () => {
    const container: TestContainerGet = {
      getByText: (matcher) => {
        const matcherFn = matcher as (
          text: string,
          element: Element | null,
        ) => boolean;

        const result = matcherFn("", {
          classList: { contains: () => true },
          tagName: "SPAN",
        } as unknown as Element);

        expect(result).toBe(false);

        return {} as HTMLElement;
      },
    };

    getByCardText(container, "5");

    expect(true).toBe(true);
  });
});
