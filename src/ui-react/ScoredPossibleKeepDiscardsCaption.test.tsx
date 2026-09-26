/* jscpd:ignore-start */
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import {
  findCaption,
  noUncertainty,
  renderHand,
  renderScoredPossibleKeepDiscards,
  scoredElement,
  waitForAnalysis,
} from "./ScoredPossibleKeepDiscards.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { SIDECAR_SETTLE_TIMEOUT_MS } from "./useUncertainty";
import { type Uncertainty } from "../game/uncertaintySidecar";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
import { uniformUncertainty } from "../game/uncertaintySidecar.test.common";
/* jscpd:ignore-end */

// The KH,KC dealer fixture gives up about 0.09 points against the best discard.
const NEAR_MISS_HAND = "4H,5D,KH,6H,8C,KC";
const NEAR_MISS_DISCARD = "KH,KC";

// Wide enough that any loss this hand can give up lands inside the threshold.
const WIDE_ERROR = 5;

const settledWith = (standardError: number): UncertaintySource => ({
  getUncertaintySync: () => null,
  loadUncertainty: () => Promise.resolve(uniformUncertainty(standardError)),
});

// A load that settles only when the test calls one of the collected release functions.
type Release = (value: Uncertainty | null) => void;

const heldSource = (releases: Release[]): UncertaintySource => ({
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

// Runs out the settle wait on fake timers, then delivers a document to the held crib load.
const waitOutThenRelease = async (
  cribReleases: Release[],
  lateDocument: Uncertainty | null,
): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(SIDECAR_SETTLE_TIMEOUT_MS);
  });
  await act(async () => {
    cribReleases.forEach((release) => {
      release(lateDocument);
    });
    await Promise.resolve();
  });
};

// Renders with a crib load that stays pending past the settle wait, then optionally delivers a document late.
const renderPastTheWait = async (
  lateDocument: Uncertainty | null,
): Promise<HTMLElement> => {
  jest.useFakeTimers();
  const cribReleases: Release[] = [];
  const { container } = renderNearMiss(heldSource(cribReleases), noUncertainty);
  await waitOutThenRelease(cribReleases, lateDocument);
  jest.useRealTimers();
  return container;
};

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

      expect(caption.textContent).toMatch(
        /^Within noise, approximate: 0\.09 pts lost/u,
      );
      expect(caption.getAttribute("aria-label")).toMatch(
        /^Within simulation noise, 95% one-sided, approximate: 0\.09 points lost, at or below the .+ point threshold\. /u,
      );
      expect(container.querySelector("[class*='noiseBadge']")).not.toBeNull();
      expect(
        container
          .querySelector("tr[data-highlight-tier='chosen']")
          ?.getAttribute("title"),
      ).toMatch(/within simulation noise, approximate/u);
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
      const cribReleases: Release[] = [];
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

    it.each([
      { lateDocument: null, name: "a load that never settles" },
      {
        lateDocument: uniformUncertainty(1),
        name: "a document arriving after the wait",
      },
    ])(
      "gives the sub-optimal verdict once the wait times out, for $name",
      async ({ lateDocument }) => {
        const container = await renderPastTheWait(lateDocument);

        expect(container.querySelector("figcaption")?.textContent).toMatch(
          /^Sub-optimal: 0\.09 pts lost/u,
        );
      },
    );

    it("gives a fresh verdict to the next hand after one timed out, using the late document", async () => {
      jest.useFakeTimers();
      const cribReleases: Release[] = [];
      const sources = {
        cribUncertaintySource: heldSource(cribReleases),
        playUncertaintySource: settledWith(WIDE_ERROR),
      };
      const { container, rerender } = renderHand(
        NEAR_MISS_HAND,
        NEAR_MISS_DISCARD,
        sources,
      );
      await waitOutThenRelease(cribReleases, uniformUncertainty(WIDE_ERROR));
      const timedOutVerdict =
        container.querySelector("figcaption")?.textContent;
      rerender(
        scoredElement(
          toDealtCards(parseHand(NEAR_MISS_HAND), parseHand("4H,KC")),
          sources,
        ),
      );
      jest.useRealTimers();

      expect(timedOutVerdict).toMatch(/^Sub-optimal/u);
      expect((await findCaption(container)).textContent).toMatch(
        /^Within noise/u,
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
