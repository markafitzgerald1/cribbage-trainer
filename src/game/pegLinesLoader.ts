import { type PegLines, parsePegLines } from "./pegLines";
import linesUrl from "./expectedPlayPointsLines.json?url";

type LinesListener = (lines: PegLines) => void;

export interface PegLinesSource {
  readonly getPegLinesSync: () => PegLines | null;
  readonly loadPegLines: () => Promise<PegLines | null>;
  // Every open row learns of a load any row started, so a row that failed recovers too.
  readonly subscribe: (listener: LinesListener) => () => void;
}

/*
 * Fetched only when someone first opens "Opening plays", so the 721 KB file
 * costs nothing on a page load that never asks for it. A fetch rather than a
 * dynamic import because browsers cache a failed module load for the page's
 * life, so an import could never retry after a dropped connection. A failed
 * fetch clears the pending promise so a later opening retries, bypassing the
 * HTTP cache (Pages caches a 404 for ten minutes); a document the reader
 * rejects is remembered, since the same bytes cannot change verdict.
 */
export const createPegLinesLoader = (
  fetchDocument: (isRetry: boolean) => Promise<unknown>,
): PegLinesSource => {
  let lines: PegLines | null = null;
  let pending: Promise<PegLines | null> | null = null;
  let hasFailed = false;
  const listeners = new Set<LinesListener>();

  const remember = (document: unknown): PegLines | null => {
    lines = parsePegLines(document);
    const loaded = lines;
    if (loaded !== null) {
      listeners.forEach((listener) => {
        listener(loaded);
      });
    }
    return loaded;
  };

  const forget = (): null => {
    pending = null;
    hasFailed = true;
    return null;
  };

  const loadPegLines = (): Promise<PegLines | null> => {
    pending ??= fetchDocument(hasFailed).then(remember, forget);
    return pending;
  };

  const subscribe = (listener: LinesListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getPegLinesSync: () => lines, loadPegLines, subscribe };
};

export const shippedPegLines: PegLinesSource = createPegLinesLoader(
  async (isRetry) => {
    const response = await fetch(linesUrl, isRetry ? { cache: "reload" } : {});
    if (!response.ok) {
      throw new Error(`Pegging lines fetch failed: ${response.status}`);
    }
    return response.json() as Promise<unknown>;
  },
);
