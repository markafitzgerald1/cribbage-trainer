/*
 * Kept apart from the store so a Node context can import it. The key itself
 * is built from Vite's BASE_URL, and evaluating `import.meta` outside a
 * module fails, which is what an end-to-end spec importing the store would
 * be doing when it only wants to seed storage.
 */
export const DISCARD_TALLY_KEY_PREFIX = "discardTally";
