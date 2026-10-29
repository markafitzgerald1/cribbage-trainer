/* jscpd:ignore-start */
import { InteractiveHand, type InteractiveHandDrill } from "./InteractiveHand";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { CribRole } from "../game/expectedCribPoints";
import { SortOrder } from "../ui/SortOrder";
import type { UncountedReason } from "./uncountedReason";
import { basePanelArgs } from "./PracticeDrillPanel.test.common";
import { createGenerator } from "../game/randomNumberGenerator";
import { dealHand } from "../game/dealHand";
/* jscpd:ignore-end */

const renderNote = (
  uncountedReason: UncountedReason | null,
  practiceDrill: InteractiveHandDrill | null = null,
) =>
  render(
    <InteractiveHand
      cribRole={CribRole.Dealer}
      dealtCards={dealHand(createGenerator())}
      onCardChange={jest.fn()}
      onDeal={jest.fn()}
      onEnterCards={jest.fn()}
      onSortOrderChange={jest.fn()}
      practiceDrill={practiceDrill}
      sortOrder={SortOrder.Ascending}
      uncountedReason={uncountedReason}
    />,
  );

describe("uncounted hand note", () => {
  it.each([
    ["decided", "Not counted: you already decided this hand."],
    ["drill", "Not counted: this hand is from your practice queue."],
    ["entered", "Not counted: you entered these cards."],
    ["linked", "Not counted: this hand was opened from its web address."],
    ["restored", "Not counted: this hand was restored from history."],
    ["seeded", "Not counted: hands from a seeded link are practice."],
  ] as const)("says %s hands are not counted", (reason, text) => {
    renderNote(reason);

    expect(screen.getByRole("note").textContent).toBe(text);
  });

  it("sits in a polite live region so a change is announced", () => {
    const { container } = renderNote("entered");

    expect(container.querySelector("[aria-live='polite']")?.textContent).toBe(
      "Not counted: you entered these cards.",
    );
  });

  it("shows nothing for a hand that counts", () => {
    renderNote(null);

    expect(screen.queryByRole("note")).toBeNull();
  });

  it("leaves the drill to speak for itself", () => {
    renderNote("linked", basePanelArgs({ phase: "choosing" }));

    expect(screen.queryByText(/Not counted/u)).toBeNull();
  });
});
