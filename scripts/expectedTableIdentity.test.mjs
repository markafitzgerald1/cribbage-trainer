import {
  TABLE_IDENTITY_MODULE,
  identityPaths,
  readTableIdentity,
  tableIdentityPlugin,
} from "./expectedTableIdentity.mjs";
import {
  deepStrictEqual,
  notStrictEqual,
  strictEqual,
  throws,
} from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const bytes = identityPaths.map((file) => readFileSync(file, "utf8"));
const readBytes = (values) => (file) => values.at(identityPaths.indexOf(file));
const sha = (value) => createHash("sha256").update(value).digest("hex");

test("both shipped identities name the exact means bytes", () => {
  const identity = readTableIdentity();
  deepStrictEqual(identity, {
    crib: { means_sha256: sha(bytes[0]) },
    play: { means_sha256: sha(bytes[2]) },
  });
});

for (const [name, offset] of [
  ["crib", 0],
  ["play", 2],
]) {
  test(`${name} byte-only changes are not normalized away and require the matched sidecar`, () => {
    const changed = [...bytes];
    changed[offset] += " ";
    throws(
      () => readTableIdentity(readBytes(changed)),
      /exported against means/u,
    );
    const sidecar = JSON.parse(changed[offset + 1]);
    sidecar.means_sha256 = sha(changed[offset]);
    changed[offset + 1] = JSON.stringify(sidecar);
    const original = JSON.stringify(readTableIdentity());
    const updated = JSON.stringify(readTableIdentity(readBytes(changed)));
    notStrictEqual(updated, original);
  });
}

test("the virtual module watches both means and both sidecars and exports only digests", () => {
  const plugin = tableIdentityPlugin();
  strictEqual(plugin.resolveId("other"), null);
  strictEqual(plugin.load("other"), null);
  const files = [];
  const source = plugin.load.call(
    { addWatchFile: (file) => files.push(file) },
    plugin.resolveId(TABLE_IDENTITY_MODULE),
  );
  deepStrictEqual(
    files,
    identityPaths.map((file) => file.pathname),
  );
  strictEqual(source, `export default ${JSON.stringify(readTableIdentity())};`);
});

test("development table changes invalidate the loaded identity and reload without swapping a mounted analysis", () => {
  const plugin = tableIdentityPlugin();
  const id = plugin.resolveId(TABLE_IDENTITY_MODULE);
  const module = { id };
  const invalidated = [];
  const sent = [];
  const server = {
    moduleGraph: {
      getModuleById: () => module,
      invalidateModule: (value) => invalidated.push(value),
    },
    ws: { send: (message) => sent.push(message) },
  };
  strictEqual(plugin.handleHotUpdate({ file: "unrelated", server }), null);
  for (const file of identityPaths) {
    deepStrictEqual(
      plugin.handleHotUpdate({ file: file.pathname, server }),
      [],
    );
  }
  strictEqual(invalidated.length, 4);
  strictEqual(invalidated[0], module);
  deepStrictEqual(
    sent,
    Array.from({ length: 4 }, () => ({ type: "full-reload" })),
  );
});
