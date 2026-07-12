import { SEED_PARAM, parseUrlAnalysisState } from "./urlAnalysisState";

export const getInitialProps = (search: string) => {
  const { cards, cribRole, discards, scoreSortKey, sortOrder } =
    parseUrlAnalysisState(search);
  return {
    initialCards: cards,
    initialCribRole: cribRole,
    initialDiscards: discards,
    initialScoreSortKey: scoreSortKey,
    initialSortOrder: sortOrder,
    seed: new URLSearchParams(search).get(SEED_PARAM),
  };
};
