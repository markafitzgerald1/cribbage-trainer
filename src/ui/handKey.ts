import { type Card, parseHand, serializeHand } from "../game/Card";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { CribRole } from "../game/expectedCribPoints";

const NOT_FOUND_INDEX = -1;

export interface ParsedHandKey {
  readonly cards: Card[];
  readonly cribRole: CribRole;
}

/*
 * Deal order rather than the displayed order, so re-sorting the six cards
 * cannot make one hand look like two, and the crib role alongside them,
 * because the same six cards played as dealer and as pone are two different
 * decisions with two different best answers. Cards alone let a hand entered
 * to study the opposite role suppress the dealt hand's own decision.
 *
 * Not a complete identity by itself: the same cards entered by hand can
 * later coincide with a genuinely dealt hand under the same role, and only
 * one of the two occurrences is practice. What tells them apart is
 * telemetry's own per-hand scope, tracked alongside this key as the open
 * hand's identity (see `OpenHand` in useDiscardTally) — the key alone is what
 * a stored record is keyed by and what provenance is looked up by, but which
 * occurrence a history restore names is decided by scope, not by key.
 */
export const toHandKey = (cards: readonly Card[], cribRole: CribRole): string =>
  `${serializeHand(cards)}|${cribRole}`;

export const parseHandKey = (handKey: string): ParsedHandKey | null => {
  const separatorIndex = handKey.indexOf("|");
  if (separatorIndex === NOT_FOUND_INDEX) {
    return null;
  }
  const cardsPart = handKey.substring(0, separatorIndex);
  const rolePart = handKey.substring(separatorIndex + 1);
  if (rolePart !== CribRole.Dealer && rolePart !== CribRole.Pone) {
    return null;
  }
  try {
    const cards = parseHand(cardsPart);
    if (cards.length !== CARDS_PER_DEALT_HAND) {
      return null;
    }
    return { cards, cribRole: rolePart };
  } catch {
    return null;
  }
};
