import { type PegLines, parsePegLines } from "./pegLines";

interface ImportedLines {
  readonly default: unknown;
}

export interface PegLinesSource {
  readonly getPegLinesSync: () => PegLines | null;
  readonly loadPegLines: () => Promise<PegLines | null>;
}

/*
 * Imported only when someone first opens "Opening plays", so the 721 KB file
 * costs nothing on a page load that never asks for it. A failed import clears
 * the pending promise, so a later opening retries rather than staying
 * unavailable for the rest of the session; a document the reader rejects is
 * remembered, since importing the same bytes again cannot change the verdict.
 */
export const createPegLinesLoader = (
  importLines: () => Promise<ImportedLines>,
): PegLinesSource => {
  let lines: PegLines | null = null;
  let pending: Promise<PegLines | null> | null = null;

  const remember = (module: ImportedLines): PegLines | null => {
    lines = parsePegLines(module.default);
    return lines;
  };

  const forget = (): null => {
    pending = null;
    return null;
  };

  const loadPegLines = (): Promise<PegLines | null> => {
    pending ??= importLines().then(remember, forget);
    return pending;
  };

  return { getPegLinesSync: () => lines, loadPegLines };
};

export const shippedPegLines: PegLinesSource = createPegLinesLoader(
  () => import("./expectedPlayPointsLines.json"),
);
