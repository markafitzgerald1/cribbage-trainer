import {
  type UncertaintyLoader,
  createUncertaintyLoader,
} from "./uncertaintyLoader";
import { CRIB_UNCERTAINTY_CONTRACT } from "./cribUncertainty";

export const shippedCribUncertainty: UncertaintyLoader =
  createUncertaintyLoader(
    () => import("./expectedCribPointsUncertainty.json"),
    CRIB_UNCERTAINTY_CONTRACT,
  );

export const {
  loadUncertainty: loadCribUncertainty,
  setUncertaintySync: setCribUncertaintySync,
} = shippedCribUncertainty;
