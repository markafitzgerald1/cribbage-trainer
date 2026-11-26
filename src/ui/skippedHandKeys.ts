export const skippedHandKeysKey = `cribbage_trainer_skipped_hands${import.meta.env.BASE_URL}`;

const MAX_REMEMBERED = 20;

const readKeys = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(skippedHandKeysKey) ?? "[]",
    );
    return Array.isArray(parsed)
      ? parsed.filter((key): key is string => typeof key === "string")
      : [];
  } catch {
    return [];
  }
};

// Whether this call is the first to charge the hand a skip, so two tabs left on one hand charge it once between them.
export const claimSkip = (handKey: string): boolean => {
  const keys = readKeys();
  if (keys.includes(handKey)) {
    return false;
  }
  try {
    localStorage.setItem(
      skippedHandKeysKey,
      JSON.stringify([...keys, handKey].slice(-MAX_REMEMBERED)),
    );
  } catch {
    // Storage errors are swallowed.
  }
  return true;
};

export const forgetSkippedHandKeys = () => {
  localStorage.removeItem(skippedHandKeysKey);
};
