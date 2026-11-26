import "@testing-library/jest-dom";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import {
  createSequenceGenerator,
  startTelemetryCapture,
  startTrainerWithEmptyTally,
} from "./Trainer.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { getInitialProps } from "../ui/getInitialProps";
import { readTallyForDisplay } from "../ui/discardTally";

const completeLink =
  "?hand=AD,10C,5D,9H,KC,AS&role=dealer&discard=AD,AS&analysis-sort=hand";
const startAnalysis = (search = completeLink) => {
  const generator = createSequenceGenerator([]);
  const trackEvent = startTelemetryCapture(true);
  const trainer = startTrainerWithEmptyTally({
    ...getInitialProps(search),
    generateRandomNumber: generator,
    trackEvent,
  });
  return { ...trainer, generator, trackEvent };
};
const header = (name = /^Hand:/u) =>
  screen.getByRole("button", { name }).closest("[aria-sort]");
const rowLabels = () =>
  Array.from(document.querySelectorAll("tbody tr button")).map((button) =>
    button.getAttribute("aria-label"),
  );
const clickHeader = (
  user: ReturnType<typeof startAnalysis>["user"],
  name = /^Hand:/u,
) => user.click(screen.getByRole("button", { name }));
const awaitDirection = (direction: string) =>
  waitFor(
    () => {
      expect(header()).toHaveAttribute("aria-sort", direction);
    },
    { timeout: 8000 },
  );

const backToDirection = (direction: string) => {
  act(() => {
    window.history.back();
  });
  return awaitDirection(direction);
};

// Restore spies before the test's final assertions, so no disable is needed for ending with expect.
const capturePushes = async (run: () => Promise<void>) => {
  const spy = jest.spyOn(window.history, "pushState");
  try {
    await run();
    return spy.mock.calls.map((call) => call[2]);
  } finally {
    spy.mockRestore();
  }
};

describe("analysis direction", () => {
  it("hydrates a reversed link through the initial-props boundary", async () => {
    startAnalysis(`${completeLink}&analysis-order=ascending`);
    await awaitDirection("ascending");

    expect(window.location.search).toContain("analysis-order=ascending");
  });

  it("flips the entire list on repeated clicks and starts another column best first", async () => {
    const { user, generator, trackEvent } = startAnalysis();
    await awaitDirection("descending");
    const bestFirst = rowLabels();
    const tally = readTallyForDisplay();
    const events = [...trackEvent.mock.calls];

    expect(events.length).toBeGreaterThan(0);

    await clickHeader(user);

    expect([header()?.getAttribute("aria-sort"), rowLabels()]).toStrictEqual([
      "ascending",
      [...bestFirst].reverse(),
    ]);

    await clickHeader(user);

    expect({
      direction: header()?.getAttribute("aria-sort"),
      reversed: window.location.search.includes("analysis-order"),
      rows: rowLabels(),
    }).toStrictEqual({
      direction: "descending",
      reversed: false,
      rows: bestFirst,
    });

    await clickHeader(user);
    await clickHeader(user, /^Crib:/u);

    expect([
      header(/^Crib:/u)?.getAttribute("aria-sort"),
      header()?.getAttribute("aria-sort"),
    ]).toStrictEqual(["descending", "none"]);
    expect({
      draws: generator.mock.calls,
      events: trackEvent.mock.calls,
      tally: readTallyForDisplay(),
    }).toStrictEqual({ draws: [], events, tally });
  });

  it("pushes each direction change and Back restores both directions without pushing", async () => {
    const { user } = startAnalysis();
    await awaitDirection("descending");
    const original = window.location.search;
    const pushes = await capturePushes(async () => {
      await clickHeader(user);
      await clickHeader(user);
      await backToDirection("ascending");
      await backToDirection("descending");
    });

    expect(pushes).toHaveLength(2);
    expect(pushes[0]).toContain("analysis-order=ascending");
    expect(pushes[1]).toBe(original);
    expect(window.location.search).toBe(original);
  });

  it.each(["", "&analysis-order=sideways"])(
    "restores worst first on popstate and resets to best first for %p",
    async (suffix) => {
      startAnalysis();
      await awaitDirection("descending");
      const bestFirst = rowLabels();
      const navigate = (order: string) => {
        window.history.replaceState(null, "", `${completeLink}${order}`);
        fireEvent.popState(window);
      };
      navigate("&analysis-order=ascending");
      await awaitDirection("ascending");

      expect(rowLabels()).toStrictEqual([...bestFirst].reverse());

      navigate(suffix);
      await awaitDirection("descending");

      expect({
        rows: rowLabels(),
        search: window.location.search,
      }).toStrictEqual({
        rows: bestFirst,
        search: expect.not.stringContaining("analysis-order"),
      });
    },
  );
});
