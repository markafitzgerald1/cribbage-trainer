import {
  type Matcher,
  type SelectorMatcherOptions,
} from "@testing-library/react";

const createMatcher =
  (text: string) => (_: string, element: Element | null) => {
    if (
      element?.tagName.toUpperCase() !== "DIV" ||
      !element?.classList.contains("mock-cardLabel")
    ) {
      return false;
    }
    const content = element.textContent?.replace(/\s+/gu, "") || "";
    const target = text.replace(/\s+/gu, "");
    return content.includes(target);
  };

export interface TestContainerGet {
  getByText(id: Matcher, options?: SelectorMatcherOptions): HTMLElement;
}
export interface TestContainerGetAll {
  getAllByText(id: Matcher, options?: SelectorMatcherOptions): HTMLElement[];
}
export interface TestContainerQueryAll {
  queryAllByText(id: Matcher, options?: SelectorMatcherOptions): HTMLElement[];
}

export const getByCardText = (container: TestContainerGet, text: string) =>
  container.getByText(createMatcher(text));

export const getAllByCardText = (
  container: TestContainerGetAll,
  text: string,
) => container.getAllByText(createMatcher(text));

export const queryAllByCardText = (
  container: TestContainerQueryAll,
  text: string,
) => container.queryAllByText(createMatcher(text));

/*
 * The role costs a badge marked as costing nothing under the reversed crib
 * role. CSS modules are mocked as mock-<name> under Jest, so the class is
 * the only observable here; that the class renders as a green underline is
 * asserted in Storybook and Playwright, where the stylesheet actually loads.
 */
export const markedRoleCostTexts = (root: ParentNode) =>
  Array.from(
    root.querySelectorAll(".mock-costsNothing"),
    (element) => element.textContent,
  );
