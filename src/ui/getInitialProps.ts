import {
  OWN_HAND_PARAM,
  SEED_PARAM,
  parseUrlAnalysisState,
} from "./urlAnalysisState";

export const getInitialProps = (search: string) => {
  const { cards, cribRole, discards, scoreSortKey, sortOrder } =
    parseUrlAnalysisState(search);
  const params = new URLSearchParams(search);
  return {
    initialCards: cards,
    initialCribRole: cribRole,
    initialDiscards: discards,
    initialOwnHandId: params.get(OWN_HAND_PARAM),
    initialScoreSortKey: scoreSortKey,
    initialSortOrder: sortOrder,
    seed: params.get(SEED_PARAM),
  };
};
