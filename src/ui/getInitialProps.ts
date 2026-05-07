import { parseHand } from "../game/Card";

export const getInitialProps = (search: string) => {
  const searchParams = new URLSearchParams(search);
  const handParam = searchParams.get("hand");
  return {
    initialCards: handParam ? parseHand(handParam) : null,
    seed: searchParams.get("seed"),
  };
};
