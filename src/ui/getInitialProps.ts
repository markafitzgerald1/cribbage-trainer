import { parseHand } from "../game/Card";

const parseInitialCards = (handParam: string | null) => {
  if (!handParam) {
    return null;
  }
  try {
    return parseHand(handParam);
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
