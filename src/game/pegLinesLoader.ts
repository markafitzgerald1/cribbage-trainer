import { type PegLines, parsePegLines } from "./pegLines";
import linesUrl from "./expectedPlayPointsLines.json?url";

export interface PegLinesSource {
  readonly getPegLinesSync: () => PegLines | null;
  readonly loadPegLines: () => Promise<PegLines | null>;
}

/*
 * Fetched only when someone first opens "Opening plays", so the 721 KB file
 * costs nothing on a page load that never asks for it. A fetch rather than a
 * dynamic import because browsers cache a failed module load for the page's
 * life, so an import could never retry after a dropped connection. A failed
 * fetch clears the pending promise so a later opening retries; a document the
 * reader rejects is remembered, since the same bytes cannot change verdict.
 */
export const createPegLinesLoader = (
  fetchDocument: () => Promise<unknown>,
): PegLinesSource => {
  let lines: PegLines | null = null;
  let pending: Promise<PegLines | null> | null = null;

  const remember = (document: unknown): PegLines | null => {
    lines = parsePegLines(document);
    return lines;
  };

  const forget = (): null => {
    pending = null;
    return null;
  };

  const loadPegLines = (): Promise<PegLines | null> => {
    pending ??= fetchDocument().then(remember, forget);
    return pending;
  };

  return { getPegLinesSync: () => lines, loadPegLines };
};

export const shippedPegLines: PegLinesSource = createPegLinesLoader(
  async () => {
    const response = await fetch(linesUrl);
    if (!response.ok) {
      throw new Error(`Pegging lines fetch failed: ${response.status}`);
    }
    return response.json() as Promise<unknown>;
  },
);
