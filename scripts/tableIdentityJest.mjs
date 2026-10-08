import { createTransformer } from "babel-jest";
import { readTableIdentity } from "./expectedTableIdentity.mjs";

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

export default tableIdentityTransformer();
