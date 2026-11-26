import { createPegLinesLoader, shippedPegLines } from "./pegLinesLoader";
import { describe, expect, it, jest } from "@jest/globals";

const NO_LINES = { default: { schema: "not-lines" } };

describe("createPegLinesLoader", () => {
  it("reads the shipped file only when asked, and remembers it", async () => {
    expect.hasAssertions();

    expect(shippedPegLines.getPegLinesSync()).toBeNull();

    const lines = await shippedPegLines.loadPegLines();

    expect(lines?.poneRows("2_3_7_8")?.map(({ lead }) => lead)).toStrictEqual([
      1, 2,
    ]);
    expect(shippedPegLines.getPegLinesSync()).toBe(lines);
  }, 30_000);

  it.each([
    {
      expectedImports: 2,
      name: "retries an import that failed rather than staying unavailable",
      outcomes: [
        Promise.reject(new Error("offline")),
        Promise.resolve(NO_LINES),
      ],
    },
    {
      expectedImports: 1,
      name: "does not import again after the reader rejected the document",
      outcomes: [Promise.resolve(NO_LINES)],
    },
  ])("$name", async ({ expectedImports, outcomes }) => {
    expect.hasAssertions();

    const pending = [...outcomes];
    const importLines = jest.fn(
      async () => pending.shift() as Promise<typeof NO_LINES>,
    );
    const loader = createPegLinesLoader(importLines);

    await expect(loader.loadPegLines()).resolves.toBeNull();
    await expect(loader.loadPegLines()).resolves.toBeNull();
    expect(importLines).toHaveBeenCalledTimes(expectedImports);
    expect(loader.getPegLinesSync()).toBeNull();
  });
});
