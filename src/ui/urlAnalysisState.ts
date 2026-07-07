import { CARDS_PER_DEALT_HAND, CARDS_PER_DISCARD } from "../game/facts";
import {
  type Card,
  isSamePhysicalCard,
  parseHand,
  serializeHand,
} from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { DealtCard } from "../game/DealtCard";
import { SortOrder } from "./SortOrder";

export const HAND_PARAM = "hand";
export const ROLE_PARAM = "role";
export const DISCARD_PARAM = "discard";
export const SORT_PARAM = "sort";
export const SEED_PARAM = "seed";

export interface UrlAnalysisState {
  readonly cards: Card[] | null;
  readonly cribRole: CribRole | null;
  readonly discards: Card[] | null;
  readonly sortOrder: SortOrder | null;
}

const tryParseHand = (value: string): Card[] | null => {
  try {
    return parseHand(value);
  } catch {
    return null;
  }
};

const parseHandParam = (value: string | null): Card[] | null => {
  const cards = value ? tryParseHand(value) : null;
  return cards && cards.length === CARDS_PER_DEALT_HAND ? cards : null;
};

const parseRoleParam = (value: string | null): CribRole | null => {
  switch (value?.toLowerCase()) {
    case "dealer":
      return CribRole.Dealer;
    case "pone":
      return CribRole.Pone;
    default:
      return null;
  }
};

const parseDiscardParam = (
  value: string | null,
  hand: readonly Card[] | null,
): Card[] | null => {
  if (!value || !hand) {
    return null;
  }
  const discards = tryParseHand(value);
  const isValid =
    discards !== null &&
    discards.length <= CARDS_PER_DISCARD &&
    discards.every((discard) =>
      hand.some((card) => isSamePhysicalCard(card, discard)),
    );
  return isValid ? discards : null;
};

const parseSortParam = (value: string | null): SortOrder | null => {
  switch (value?.toLowerCase()) {
    case "deal-order":
      return SortOrder.DealOrder;
    case "descending":
      return SortOrder.Descending;
    case "ascending":
      return SortOrder.Ascending;
    default:
      return null;
  }
};

const sortUrlValue = (sortOrder: SortOrder): string => {
  switch (sortOrder) {
    case SortOrder.DealOrder:
      return "deal-order";
    case SortOrder.Ascending:
      return "ascending";
    default:
      return "descending";
  }
};

export const parseUrlAnalysisState = (search: string): UrlAnalysisState => {
  const params = new URLSearchParams(search);
  const cards = parseHandParam(params.get(HAND_PARAM));
  return {
    cards,
    cribRole: parseRoleParam(params.get(ROLE_PARAM)),
    discards: parseDiscardParam(params.get(DISCARD_PARAM), cards),
    sortOrder: parseSortParam(params.get(SORT_PARAM)),
  };
};

export interface SerializableAnalysisState {
  readonly cribRole: CribRole;
  readonly dealtCards: readonly DealtCard[];
  readonly sortOrder: SortOrder;
}

export const serializeUrlAnalysisState = (
  search: string,
  { cribRole, dealtCards, sortOrder }: SerializableAnalysisState,
): string => {
  const params = new URLSearchParams(search);
  const cardsInDealOrder = [...dealtCards].sort(
    (first, second) => first.dealOrder - second.dealOrder,
  );
  params.set(HAND_PARAM, serializeHand(cardsInDealOrder));
  params.set(ROLE_PARAM, cribRole.toLowerCase());
  const discards = cardsInDealOrder.filter((dealtCard) => !dealtCard.kept);
  if (discards.length > 0) {
    params.set(DISCARD_PARAM, serializeHand(discards));
  } else {
    params.delete(DISCARD_PARAM);
  }
  params.set(SORT_PARAM, sortUrlValue(sortOrder));
  return `?${params.toString().replace(/%2C/gu, ",")}`;
};
