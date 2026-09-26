/* jscpd:ignore-start */
import { describe, expect, it, jest } from "@jest/globals";
import {
  findCaption,
  noUncertainty,
  renderHand,
  renderScoredPossibleKeepDiscards,
  waitForAnalysis,
} from "./ScoredPossibleKeepDiscards.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
import { uniformUncertainty } from "../game/uncertaintySidecar.test.common";
import { waitFor } from "@testing-library/react";
/* jscpd:ignore-end */

// The KH,KC dealer fixture gives up about 0.09 points against the best discard.
const NEAR_MISS_HAND = "4H,5D,KH,6H,8C,KC";
const NEAR_MISS_DISCARD = "KH,KC";

const settledWith = (standardError: number): UncertaintySource => ({
  getUncertaintySync: () => null,
  loadUncertainty: () => Promise.resolve(uniformUncertainty(standardError)),
});

// A load that settles only when the test calls one of the collected release functions.
const heldSource = (
  releases: ((value: null) => void)[],
): UncertaintySource => ({
  getUncertaintySync: () => null,
  loadUncertainty: () =>
    new Promise((resolve) => {
      releases.push(resolve);
    }),
});

const renderNearMiss = (
  crib: UncertaintySource,
  play: UncertaintySource,
  onStatusChange = jest.fn(),
) =>
  renderHand(NEAR_MISS_HAND, NEAR_MISS_DISCARD, {
    cribUncertaintySource: crib,
    onStatusChange,
    playUncertaintySource: play,
  });

describe("scored possible keep discards caption", () => {
  describe("caption diagnostics and optimal margin", () => {
    it.each([
      {
        cards: "5H,5D,6H,7H,8H,9H",
        discards: "5H,5D",
        expectedAriaLabel:
          "Optimal discard, 4.05 better than the next best discard",
        expectedMarkedTexts: [],
        expectedText: "Optimal, 4.05 better than next",
        name: "optimal discard caption when chosen discard is optimal",
      },
      {
        cards: "9D,9C,9H,4C,4H,3S",
        cribRole: CribRole.Pone,
        discards: "3S,9C",
        expectedAriaLabel:
          "Optimal discard, 0.37 better than the next best distinct discard",
        expectedMarkedTexts: [],
        expectedText: "Optimal, 0.37 better than next distinct",
        name: "optimal discard caption when top choices tie",
      },
      {
        cards: "4H,5D,KH,6H,8C,KC",
        cribRole: CribRole.Dealer,
        discards: "KH,KC",
        expectedAriaLabel:
          "Sub-optimal: 0.09 points lost. 1.31 Crib and 0.08 Play gain do not cover 1.48 Hand loss",
        expectedMarkedTexts: [],
        expectedText:
          "Sub-optimal: 0.09 pts lost1.31 Crib + 0.08 Play gain < 1.48 Hand loss",
        name: "sub-optimal caption withholding a reversed role that cost more",
      },
      {
        cards: "9D,9C,9H,4C,4H,3S",
        cribRole: CribRole.Dealer,
        discards: "9D,3S",
        expectedAriaLabel:
          "Sub-optimal: 3.11 points lost as dealer, 0.00 as pone. 0.64 Play gain does not cover 2.05 Crib and 1.70 Hand loss",
        expectedMarkedTexts: ["0.00 as pone"],
        expectedText:
          "Sub-optimal: 3.11 as dealer, 0.00 as pone0.64 Play gain < 2.05 Crib + 1.70 Hand loss",
        name: "a zero cost under the reversed role stated as a figure, not as a diagnosis",
      },
    ])(
      "renders $name",
      async ({
        cards,
        cribRole = CribRole.Dealer,
        discards,
        expectedAriaLabel,
        expectedMarkedTexts,
        expectedText,
      }) => {
        const dealtCards = toDealtCards(parseHand(cards), parseHand(discards));
        const { container } = renderScoredPossibleKeepDiscards(dealtCards, {
          cribRole,
        });
        const caption = await findCaption(container);

        expect(caption.getAttribute("role")).toBe("group");
        expect(caption.getAttribute("aria-label")).toBe(expectedAriaLabel);
        expect(caption.textContent).toBe(expectedText);
        // Mocked CSS modules render the class as mock-<name>; only a reversed-role figure that cost nothing carries it.
        expect(
          Array.from(
            container.querySelectorAll(".mock-costsNothing"),
            (element) => element.textContent,
          ),
        ).toStrictEqual(expectedMarkedTexts);
      },
    );
  });

  it.each([
    {
      cards: "4H,5D,KH,6H,8C,KC",
      cribRole: CribRole.Dealer,
      discards: "KH,KC",
      expectedSides: ["1.31 Crib + 0.08 Play gain", "< 1.48 Hand loss"],
      name: "gain and loss sides in separate",
    },
    {
      cards: "5H,5D,JC,QH,KS,9D",
      cribRole: CribRole.Pone,
      discards: "5H,5D",
      expectedSides: ["7.57 Hand + 5.18 Crib + 0.53 Play loss"],
      name: "a single side with no offsetting gains in one",
    },
  ])(
    "renders $name diagnosticSide inline elements",
    async ({ cards, cribRole, discards, expectedSides }) => {
      const { container } = renderHand(cards, discards, { cribRole });
      const sides = (await findCaption(container)).querySelectorAll(
        "span[class*='diagnosticSide']",
      );

      expect(Array.from(sides, (side) => side.textContent)).toStrictEqual(
        expectedSides,
      );
    },
  );

  describe("simulation-noise verdict (#774)", () => {
    it("calls a loss inside the noise threshold within noise, never sub-optimal or optimal", async () => {
      const { container } = renderNearMiss(settledWith(1), settledWith(1));
      const caption = await findCaption(container);

      expect(caption.textContent).toMatch(/^Within noise: 0\.09 pts lost/u);
      expect(caption.getAttribute("aria-label")).toMatch(
        /^Within simulation noise, 95% one-sided, approximate: 0\.09 points lost, under the .+ point threshold\. /u,
      );
      expect(container.querySelector("[class*='noiseBadge']")).not.toBeNull();
    });

    it.each([
      {
        crib: settledWith(0.0001),
        name: "a threshold below the loss",
        play: settledWith(0.0001),
      },
      {
        crib: noUncertainty,
        name: "an unavailable crib sidecar",
        play: settledWith(1),
      },
      {
        crib: settledWith(1),
        name: "an unavailable play sidecar",
        play: noUncertainty,
      },
    ])("keeps the mistake flag with $name", async ({ crib, play }) => {
      const { container } = renderNearMiss(crib, play);
      const caption = await findCaption(container);

      expect(caption.textContent).toMatch(/^Sub-optimal: 0\.09 pts lost/u);
    });

    it("withholds a sub-optimal verdict from the live region until both sidecars settle", async () => {
      const cribReleases: ((value: null) => void)[] = [];
      const pendingCrib = heldSource(cribReleases);
      const onStatusChange = jest.fn();
      const { container } = renderNearMiss(
        pendingCrib,
        noUncertainty,
        onStatusChange,
      );

      await waitFor(() => {
        expect(container.querySelector("table")).not.toBeNull();
      }, waitForAnalysis);

      expect(container.querySelector("figcaption")).toBeNull();
      expect(onStatusChange).not.toHaveBeenCalledWith(
        expect.stringMatching(/Sub-optimal|Within/u),
      );

      cribReleases.forEach((resolve) => {
        resolve(null);
      });

      expect((await findCaption(container)).textContent).toMatch(
        /^Sub-optimal/u,
      );
    });

    it("announces an optimal verdict without waiting for the sidecars", () => {
      const neverSettles = heldSource([]);
      const { container } = renderHand("5H,5D,6H,7H,8H,9H", "5H,5D", {
        cribUncertaintySource: neverSettles,
        playUncertaintySource: neverSettles,
      });

      expect(container.querySelector("figcaption")?.textContent).toMatch(
        /^Optimal/u,
      );
    });
  });
});
