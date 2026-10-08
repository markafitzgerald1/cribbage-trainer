import {
  memoizedTableIdentity,
  withTableIdentity,
} from "./tableIdentityCacheKey.mjs";
import { createTransformer } from "babel-jest";

export default withTableIdentity(createTransformer(), memoizedTableIdentity());
