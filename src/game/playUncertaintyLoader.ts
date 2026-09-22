import {
  type UncertaintyLoader,
  createUncertaintyLoader,
} from "./uncertaintyLoader";
import { PLAY_UNCERTAINTY_CONTRACT } from "./playUncertainty";

export const shippedPlayUncertainty: UncertaintyLoader =
  createUncertaintyLoader(
    () => import("./expectedPlayPointsUncertainty.json"),
    PLAY_UNCERTAINTY_CONTRACT,
  );

export const {
  loadUncertainty: loadPlayUncertainty,
  setUncertaintySync: setPlayUncertaintySync,
} = shippedPlayUncertainty;
