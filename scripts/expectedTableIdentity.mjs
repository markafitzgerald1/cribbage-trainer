import {
  CRIB_UNCERTAINTY_CONTRACT,
  PLAY_UNCERTAINTY_CONTRACT,
  assertMeansDigest,
} from "./uncertaintySidecar.mjs";
import { URL, fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const pairs = [CRIB_UNCERTAINTY_CONTRACT, PLAY_UNCERTAINTY_CONTRACT];
export const TABLE_IDENTITY_MODULE = "virtual:expected-table-identity";
const moduleId = `\0${TABLE_IDENTITY_MODULE}`;
export const identityPaths = pairs.flatMap(({ table }) => {
  const name = table === "crib" ? "Crib" : "Play";
  return ["Table", "Uncertainty"].map(
    (kind) =>
      new URL(`../src/game/expected${name}Points${kind}.json`, import.meta.url),
  );
});

export const readTableIdentity = (read = readFileSync) =>
  Object.fromEntries(
    pairs.map((contract, index) => {
      const means = read(identityPaths.at(index * 2), "utf8");
      const sidecar = JSON.parse(read(identityPaths.at(index * 2 + 1), "utf8"));
      assertMeansDigest(sidecar, means, contract);
      return [contract.table, { means_sha256: sidecar.means_sha256 }];
    }),
  );

export const tableIdentityPlugin = () => ({
  handleHotUpdate({ file, server }) {
    if (identityPaths.some((url) => fileURLToPath(url) === file)) {
      const loaded = server.moduleGraph.getModuleById(moduleId);
      if (loaded) server.moduleGraph.invalidateModule(loaded);
      server.ws.send({ type: "full-reload" });
      return [];
    }
    return null;
  },
  load(id) {
    if (id !== moduleId) {
      return null;
    }
    for (const file of identityPaths) {
      this.addWatchFile(fileURLToPath(file));
    }
    return `export default ${JSON.stringify(readTableIdentity())};`;
  },
  name: "expected-table-identity",
  resolveId: (id) => (id === TABLE_IDENTITY_MODULE ? moduleId : null),
});
