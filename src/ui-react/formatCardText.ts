import type { Card } from "../game/Card";

/*
 * Cards as the app already spells them for assistive technology — rank label
 * plus the suit glyph, space separated, as in "K♥ Q♠". This is the form the
 * analysis row's expand button has always used in its `aria-label`, so a
 * screen reader hears one representation of a card throughout rather than a
 * second one invented for the cut panel.
 */
export const formatCardText = (cards: readonly Card[]): string =>
  cards.map((card) => `${card.rankLabel}${card.suit}`).join(" ");
