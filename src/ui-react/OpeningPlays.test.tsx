import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  FIXTURE_LINES,
  lead,
  resolvingSource,
  sourceOf,
} from "./openingPlays.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import {
  findFooter,
  loadSpy,
  renderOpeningPlays,
  renderWithLoadSpy,
  reopen,
} from "./OpeningPlays.test.common";
import { fireEvent, isInaccessible, screen } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { OPENING_PLAYS_UNAVAILABLE } from "./OpeningPlays";
import type { PegLines } from "../game/pegLines";
import { parseCard } from "../game/Card";

const ACES = ["AC", "AD", "AH", "AS"].map(parseCard);
const PONE_THREE = "You lead 3 in 58% of hands";

describe("openingPlays", () => {
  it("starts collapsed and loads nothing until opened", async () => {
    expect.hasAssertions();

    const { load, toggle } = renderWithLoadSpy({ isOpened: false });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(load).not.toHaveBeenCalled();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(findFooter()).resolves.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("shows a loading line until the file arrives", async () => {
    expect.hasAssertions();

    renderOpeningPlays(resolvingSource(FIXTURE_LINES));

    expect(screen.getByText("Loading")).toBeInTheDocument();
    await expect(screen.findByText(PONE_THREE)).resolves.toBeInTheDocument();
  });

  it("reads each pone lead as a sentence above the footer", async () => {
    expect.hasAssertions();

    renderOpeningPlays(resolvingSource(FIXTURE_LINES));

    await expect(findFooter()).resolves.toBeInTheDocument();
    expect(screen.getByText("You lead 2 in 42% of hands")).toBeInTheDocument();
    expect(screen.getByText("3 58%")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText(/another rank/u)).not.toBeInTheDocument();
  });

  it("folds a rare pone lead into other", async () => {
    expect.hasAssertions();

    const rareLead = [lead(0, 300), lead(4, 9700)];
    renderOpeningPlays(
      resolvingSource({ ...FIXTURE_LINES, poneRows: () => rareLead }),
    );

    await expect(
      screen.findByText("You lead another rank in 3% of hands"),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText("other 3%")).toBeInTheDocument();
  });

  it("shows the dealer's replies to the opponent's leads, folding rare leads", async () => {
    expect.hasAssertions();

    renderOpeningPlays(resolvingSource(FIXTURE_LINES), {
      cribRole: CribRole.Dealer,
    });

    await expect(
      screen.findByText(
        "They lead 4 in 19% of hands, and you reply 7 in more than 99% of those",
      ),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(
        "They lead J in 10% of hands, and you reply 3 in 95% of those",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("They lead another rank in 8% of hands"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/They lead 9 /u)).not.toBeInTheDocument();
    expect(screen.queryByText(/You lead/u)).not.toBeInTheDocument();
  });

  it.each([
    { name: "a rejected file", source: resolvingSource(null) },
    {
      name: "a failed load",
      source: sourceOf(async () => Promise.reject(new Error("offline"))),
    },
  ])(
    "says the plays are unavailable after $name, never zero",
    async ({ source }) => {
      expect.hasAssertions();

      renderOpeningPlays(source);

      await expect(
        screen.findByText(OPENING_PLAYS_UNAVAILABLE),
      ).resolves.toBeInTheDocument();
      expect(screen.queryByText(/0%/u)).not.toBeInTheDocument();
      expect(screen.queryByText(/deliberate/u)).not.toBeInTheDocument();
    },
  );

  it.each([CribRole.Pone, CribRole.Dealer])(
    "says the plays are unavailable for a %s hand the file lacks",
    (cribRole) => {
      expect.hasAssertions();

      renderOpeningPlays(sourceOf(loadSpy(null), FIXTURE_LINES), {
        cribRole,
        keep: ACES,
      });

      expect(screen.getByText(OPENING_PLAYS_UNAVAILABLE)).toBeInTheDocument();
    },
  );

  it("uses lines another row already loaded without loading again", () => {
    expect.hasAssertions();

    const load = loadSpy(FIXTURE_LINES);
    const known: { lines: PegLines | null } = { lines: null };
    const toggle = renderOpeningPlays(
      { getPegLinesSync: () => known.lines, loadPegLines: load },
      { isOpened: false },
    );
    known.lines = FIXTURE_LINES;

    fireEvent.click(toggle);

    expect(screen.getByText(PONE_THREE)).toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
  });

  it("loads once across closing and reopening", async () => {
    expect.hasAssertions();

    const { load, toggle } = renderWithLoadSpy();
    reopen(toggle);

    await expect(findFooter()).resolves.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.queryByText(PONE_THREE)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByText(PONE_THREE)).toBeVisible();
  });

  it.each([
    { cribRole: CribRole.Pone, sentence: PONE_THREE },
    {
      cribRole: CribRole.Dealer,
      sentence: "They lead 3 in 13% of hands, and you reply 3 every time",
    },
    {
      cribRole: CribRole.Dealer,
      sentence: "They lead J in 10% of hands, and you reply 3 in 95% of those",
    },
    {
      cribRole: CribRole.Dealer,
      sentence: "They lead another rank in 8% of hands",
    },
  ])(
    "leaves $sentence in the accessibility tree",
    async ({ cribRole, sentence }) => {
      expect.hasAssertions();

      renderOpeningPlays(resolvingSource(FIXTURE_LINES), { cribRole });

      await expect(screen.findByText(sentence)).resolves.toBeInTheDocument();
      expect(isInaccessible(screen.getByText(sentence))).toBe(false);
    },
  );

  it("retries on reopening after a failed load, showing loading meanwhile", async () => {
    expect.hasAssertions();

    const retry: { deliver: (lines: PegLines) => void } = {
      deliver: jest.fn(),
    };
    const load = jest
      .fn<() => Promise<PegLines | null>>()
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(
        new Promise<PegLines | null>((resolve) => {
          retry.deliver = resolve;
        }),
      );
    const toggle = renderOpeningPlays(sourceOf(load));

    await expect(
      screen.findByText(OPENING_PLAYS_UNAVAILABLE),
    ).resolves.toBeInTheDocument();

    reopen(toggle);

    expect(
      screen.queryByText(OPENING_PLAYS_UNAVAILABLE),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();

    retry.deliver(FIXTURE_LINES);

    await expect(screen.findByText(PONE_THREE)).resolves.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
