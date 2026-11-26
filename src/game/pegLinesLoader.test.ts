import { describe, expect, it, jest } from "@jest/globals";
import { createPegLinesLoader } from "./pegLinesLoader";
import linesDocument from "./expectedPlayPointsLines.json";

const NOT_LINES = { schema: "not-lines" };
const OFFLINE = 503;

const response = (status: number) =>
  ({
    json: async () => Promise.resolve(linesDocument),
    ok: status < 400,
    status,
  }) as unknown as Response;

/*
 * A fresh module, imported only after fetch is replaced, so a fetch moved to
 * module evaluation would be counted here rather than missed. jsdom has no
 * fetch of its own and each spec file gets its own environment, so nothing
 * needs restoring.
 */
const importShippedLoader = async (statuses: readonly number[]) => {
  const remaining = [...statuses];
  const fetchSpy = jest.fn(async () =>
    Promise.resolve(response(remaining.shift() ?? OFFLINE)),
  );
  globalThis.fetch = fetchSpy;
  jest.resetModules();
  const { shippedPegLines } = await import("./pegLinesLoader");
  return { fetchSpy, shippedPegLines };
};

describe("shippedPegLines", () => {
  it("fetches the shipped file only when asked, and remembers it", async () => {
    expect.hasAssertions();

    const { fetchSpy, shippedPegLines } = await importShippedLoader([200]);

    expect(fetchSpy).not.toHaveBeenCalled();

    const lines = await shippedPegLines.loadPegLines();

    expect(lines?.poneRows("2_3_7_8")?.map(({ lead }) => lead)).toStrictEqual([
      1, 2,
    ]);
    expect(shippedPegLines.getPegLinesSync()).toBe(lines);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  }, 30_000);

  it("fetches again after a failed response", async () => {
    expect.hasAssertions();

    const retried = await importShippedLoader([OFFLINE, 200]);
    const load = async () => retried.shippedPegLines.loadPegLines();

    await expect(load()).resolves.toBeNull();
    await expect(load()).resolves.not.toBeNull();
    expect(retried.fetchSpy).toHaveBeenCalledTimes(2);
  }, 30_000);
});

describe("createPegLinesLoader", () => {
  it("does not fetch again after the reader rejected the document", async () => {
    expect.hasAssertions();

    const fetchDocument = jest.fn(async () => Promise.resolve(NOT_LINES));
    const loader = createPegLinesLoader(fetchDocument);

    await expect(loader.loadPegLines()).resolves.toBeNull();
    await expect(loader.loadPegLines()).resolves.toBeNull();
    expect(fetchDocument).toHaveBeenCalledTimes(1);
    expect(loader.getPegLinesSync()).toBeNull();
  });
});
