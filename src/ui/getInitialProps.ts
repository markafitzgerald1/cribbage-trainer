import { SEED_PARAM, parseUrlAnalysisState } from "./urlAnalysisState";

export const getInitialProps = (search: string) => {
  const { cards, cribRole, discards, sortOrder } =
    parseUrlAnalysisState(search);
  return {
    initialCards: cards,
    initialCribRole: cribRole,
    initialDiscards: discards,
    initialSortOrder: sortOrder,
    seed: new URLSearchParams(search).get(SEED_PARAM),
  };
};
