import { identityPaths, readTableIdentity } from "./expectedTableIdentity.mjs";
import { createTransformer } from "babel-jest";
import { statSync } from "node:fs";

const statSignature = () =>
  identityPaths
    .map((url) => {
      const { mtimeMs, size } = statSync(url);
      return `${mtimeMs}:${size}`;
    })
    .join("|");

// Jest asks for a cache key once per transformed module, and reading and
// parsing the two large sidecars each time cost about 15 s per 300 modules.
export const memoizedTableIdentity = (
  read = readTableIdentity,
  signature = statSignature,
) => {
  let lastSignature = null;
  let identity = null;
  return () => {
    const current = signature();
    if (current !== lastSignature) {
      identity = read();
      lastSignature = current;
    }
    return identity;
  };
};

export const tableIdentityTransformer = (readIdentity = readTableIdentity) => {
  const babel = createTransformer();
  return {
    ...babel,
    getCacheKey(...args) {
      return babel.getCacheKey(...args) + JSON.stringify(readIdentity());
    },
    async getCacheKeyAsync(...args) {
      return (
        (await babel.getCacheKeyAsync(...args)) + JSON.stringify(readIdentity())
      );
    },
  };
};

export default tableIdentityTransformer(memoizedTableIdentity());
