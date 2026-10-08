import { notStrictEqual, strictEqual } from "node:assert/strict";
import { readTableIdentity } from "./expectedTableIdentity.mjs";
import { tableIdentityTransformer } from "./tableIdentityJest.mjs";
import { test } from "node:test";

for (const table of ["crib", "play"]) {
  test(`Jest cache keys change after a ${table}-only refresh`, async () => {
    let identity = readTableIdentity();
    const transform = tableIdentityTransformer(() => identity);
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
