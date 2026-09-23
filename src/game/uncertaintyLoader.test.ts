/* jscpd:ignore-start */
import {
  CRIB_IDENTITY,
  FIXTURE_STANDARD_ERROR,
  validCribDocument,
} from "./uncertaintySidecar.test.common";
import {
  type Uncertainty,
  uncertaintyStandardError,
} from "./uncertaintySidecar";
import { describe, expect, it } from "@jest/globals";
import { CRIB_UNCERTAINTY_CONTRACT } from "./cribUncertainty";
import { createUncertaintyLoader } from "./uncertaintyLoader";
import { loadCribUncertainty } from "./cribUncertaintyLoader";
import { loadPlayUncertainty } from "./playUncertaintyLoader";
/* jscpd:ignore-end */

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

/*
 * Driven with the crib contract because a real document is needed and crib's
 * is the smaller fixture; nothing under test here is table-specific. That the
 * shipped play sidecar loads through the same factory is its own case below.
 */
const cribLoader = (importDocument: () => Promise<{ default: unknown }>) =>
  createUncertaintyLoader(importDocument, CRIB_UNCERTAINTY_CONTRACT);

const validLoader = () =>
  cribLoader(countingImport(validCribDocument()).importDocument);

const standardErrorOf = (uncertainty: Uncertainty | null): number | null =>
  uncertainty === null
    ? null
    : uncertaintyStandardError(uncertainty, CRIB_IDENTITY);

describe("uncertainty loader", () => {
  it("validates the imported document once and shares the result", async () => {
    const { calls, importDocument } = countingImport(validCribDocument());
    const loader = cribLoader(importDocument);
    const first = loader.loadUncertainty();
    const sharesPromise = first === loader.loadUncertainty();
    const parsed = await first;

    expect(sharesPromise).toBe(true);
    expect(calls.count).toBe(1);
    expect(standardErrorOf(parsed)).toBe(FIXTURE_STANDARD_ERROR);
  });

  it.each(UNAVAILABLE_CASES)(
    "treats $name as unavailable rather than as a failure",
    async ({ importDocument }) => {
      const loader = cribLoader(importDocument);

      await expect(loader.loadUncertainty()).resolves.toBeNull();
    },
  );

  it("re-validates after a synchronous injection", async () => {
    const loader = validLoader();

    await loader.loadUncertainty();
    loader.setUncertaintySync({ schema: "not a sidecar" });

    await expect(loader.loadUncertainty()).resolves.toBeNull();
  });

  it("seeds synchronously from an injected document and clears on null", async () => {
    const loader = validLoader();

    loader.setUncertaintySync(validCribDocument());

    expect(standardErrorOf(loader.getUncertaintySync())).toBe(
      FIXTURE_STANDARD_ERROR,
    );

    loader.setUncertaintySync(null);

    expect(loader.getUncertaintySync()).toBeNull();
    await expect(loader.loadUncertainty()).resolves.not.toBeNull();
  });

  it("remembers what the deferred load read", async () => {
    const loader = validLoader();

    expect(loader.getUncertaintySync()).toBeNull();

    await loader.loadUncertainty();

    expect(standardErrorOf(loader.getUncertaintySync())).toBe(
      FIXTURE_STANDARD_ERROR,
    );
  });

  it.each([
    { load: loadCribUncertainty, name: "crib" },
    { load: loadPlayUncertainty, name: "play" },
  ])("reads the shipped $name sidecar", async ({ load }) => {
    await expect(load()).resolves.not.toBeNull();
  });
});
