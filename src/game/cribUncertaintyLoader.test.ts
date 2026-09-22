import { type CribUncertainty, cribStandardError } from "./cribUncertainty";
import { VALID_IDENTITY, validDocument } from "./cribUncertainty.test.common";
import {
  createCribUncertaintyLoader,
  loadCribUncertainty,
} from "./cribUncertaintyLoader";
import { describe, expect, it } from "@jest/globals";

const countingImport = (document: unknown) => {
  const calls = { count: 0 };
  return {
    calls,
    importDocument: () => {
      calls.count += 1;
      return Promise.resolve({ default: document });
    },
  };
};

const UNAVAILABLE_CASES = [
  {
    importDocument: () => Promise.reject(new Error("offline")),
    name: "an unreachable sidecar",
  },
  {
    importDocument: () => Promise.resolve({ default: { schema: "other" } }),
    name: "a document the reader refuses",
  },
];

const validLoader = () =>
  createCribUncertaintyLoader(countingImport(validDocument()).importDocument);

const standardErrorOf = (uncertainty: CribUncertainty | null): number | null =>
  uncertainty === null ? null : cribStandardError(uncertainty, VALID_IDENTITY);

describe("crib uncertainty loader", () => {
  it("validates the imported document once and shares the result", async () => {
    const { calls, importDocument } = countingImport(validDocument());
    const loader = createCribUncertaintyLoader(importDocument);
    const first = loader.loadCribUncertainty();
    const sharesPromise = first === loader.loadCribUncertainty();
    const parsed = await first;

    expect(sharesPromise).toBe(true);
    expect(calls.count).toBe(1);
    expect(standardErrorOf(parsed)).toBe(0.125);
  });

  it.each(UNAVAILABLE_CASES)(
    "treats $name as unavailable rather than as a failure",
    async ({ importDocument }) => {
      const loader = createCribUncertaintyLoader(importDocument);

      await expect(loader.loadCribUncertainty()).resolves.toBeNull();
    },
  );

  it("re-validates after a synchronous injection", async () => {
    const loader = validLoader();

    await loader.loadCribUncertainty();
    loader.setCribUncertaintySync({ schema: "not a sidecar" });

    await expect(loader.loadCribUncertainty()).resolves.toBeNull();
  });

  it("seeds synchronously from an injected document and clears on null", async () => {
    const loader = validLoader();

    loader.setCribUncertaintySync(validDocument());

    expect(standardErrorOf(loader.getCribUncertaintySync())).toBe(0.125);

    loader.setCribUncertaintySync(null);

    expect(loader.getCribUncertaintySync()).toBeNull();
    await expect(loader.loadCribUncertainty()).resolves.not.toBeNull();
  });

  it("remembers what the deferred load read", async () => {
    const loader = validLoader();

    expect(loader.getCribUncertaintySync()).toBeNull();

    await loader.loadCribUncertainty();

    expect(standardErrorOf(loader.getCribUncertaintySync())).toBe(0.125);
  });

  it("reads the shipped sidecar", async () => {
    await expect(loadCribUncertainty()).resolves.not.toBeNull();
  });
});
