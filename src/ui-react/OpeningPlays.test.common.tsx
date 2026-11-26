import {
  FIXTURE_KEEP,
  FIXTURE_LINES,
  sourceOf,
} from "./openingPlays.test.common";
import { OPENING_PLAYS_FOOTER, OpeningPlays } from "./OpeningPlays";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Card } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { PegLines } from "../game/pegLines";
import type { PegLinesSource } from "../game/pegLinesLoader";
import { jest } from "@jest/globals";

export const loadSpy = (lines: PegLines | null) =>
  jest.fn(async () => Promise.resolve(lines));

interface RenderOptions {
  readonly cribRole?: CribRole;
  readonly isOpened?: boolean;
  readonly keep?: readonly Card[];
}

export const renderOpeningPlays = (
  source: PegLinesSource,
  {
    cribRole = CribRole.Pone,
    isOpened = true,
    keep = FIXTURE_KEEP,
  }: RenderOptions = {},
) => {
  render(
    <OpeningPlays
      cribRole={cribRole}
      keep={keep}
      source={source}
    />,
  );
  const toggle = screen.getByRole("button", { name: "Opening plays" });
  if (isOpened) {
    fireEvent.click(toggle);
  }
  return toggle;
};

export const findFooter = async () => screen.findByText(OPENING_PLAYS_FOOTER);

export const reopen = (toggle: HTMLElement) => {
  fireEvent.click(toggle);
  fireEvent.click(toggle);
};

export const renderWithLoadSpy = (options: RenderOptions = {}) => {
  const load = loadSpy(FIXTURE_LINES);
  return { load, toggle: renderOpeningPlays(sourceOf(load), options) };
};
