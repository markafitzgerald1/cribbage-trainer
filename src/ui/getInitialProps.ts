import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { parseHand } from "../game/Card";

const parseInitialCards = (handParam: string | null) => {
  if (!handParam) {
    return null;
  }
  try {
    const cards = parseHand(handParam);
    return cards.length === CARDS_PER_DEALT_HAND ? cards : null;
  } catch {
    return null;
  }
};

export const getInitialProps = (search: string) => {
  const searchParams = new URLSearchParams(search);
  const handParam = searchParams.get("hand");
  return {
    initialCards: parseInitialCards(handParam),
    seed: searchParams.get("seed"),
  };
};
