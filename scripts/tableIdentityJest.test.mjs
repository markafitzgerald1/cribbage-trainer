import {
  memoizedTableIdentity,
  withTableIdentity,
} from "./tableIdentityCacheKey.mjs";
import { notStrictEqual, strictEqual } from "node:assert/strict";
import { readTableIdentity } from "./expectedTableIdentity.mjs";
import { test } from "node:test";

const fakeBabel = {
  getCacheKey: () => "babel",
  getCacheKeyAsync: () => Promise.resolve("babel"),
};

for (const table of ["crib", "play"]) {
  test(`Jest cache keys change after a ${table}-only refresh`, async () => {
    let identity = readTableIdentity();
    const transform = withTableIdentity(fakeBabel, () => identity);
    const options = {
      config: { cwd: process.cwd(), rootDir: process.cwd() },
      configString: "{}",
      instrument: false,
    };
    const args = [
      "export default 1",
      `${process.cwd()}/src/game/tableIdentity.ts`,
      options,
    ];
    const before = transform.getCacheKey(...args);
    strictEqual(before, await transform.getCacheKeyAsync(...args));
    identity = { ...identity, [table]: { means_sha256: "a".repeat(64) } };
    notStrictEqual(transform.getCacheKey(...args), before);
    notStrictEqual(await transform.getCacheKeyAsync(...args), before);
  });
}

test("the identity is read again only when an artifact file changes", () => {
  let reads = 0;
  let signature = "one";
  const identity = memoizedTableIdentity(
    () => ({ reads: (reads += 1) }),
    () => signature,
  );

  identity();
  identity();
  strictEqual(reads, 1);

  signature = "two";
  strictEqual(identity().reads, 2);
});
