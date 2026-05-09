import {
  type Matcher,
  type SelectorMatcherOptions,
} from "@testing-library/react";

const createMatcher = (text: string) => (_: string, element: Element | null) =>
  Boolean(element?.classList.contains("mock-cardLabel")) &&
  element?.textContent === text;

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
