export const ownHandKey = `cribbage_trainer_own_hand${import.meta.env.BASE_URL}`;

export const formatOwnHand = (handId: string, handKey: string): string =>
  `${handId}|${handKey}`;

// The id that marks which dealt occurrence wrote the marker, or null when the marker is absent or names another hand.
export const readOwnHandId = (handKey: string): string | null => {
  try {
    const stored = localStorage.getItem(ownHandKey);
    if (stored === null) {
      return null;
    }
    const separator = stored.indexOf("|");
    return stored.slice(separator + 1) === handKey
      ? stored.slice(0, separator)
      : null;
  } catch {
    return null;
  }
};

// Marks the hand now on screen as the player's own, or clears the marker when it is not: entered, linked, drilled or seeded.
export const writeOwnHand = (ownHandKeyOrNull: string | null): void => {
  try {
    if (ownHandKeyOrNull === null) {
      localStorage.removeItem(ownHandKey);
    } else {
      localStorage.setItem(
        ownHandKey,
        formatOwnHand(crypto.randomUUID(), ownHandKeyOrNull),
      );
    }
  } catch {
    // Storage errors are swallowed.
  }
};
