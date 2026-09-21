import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  type ExpectedTables,
  loadExpectedTables,
  readSynchronousExpectedTables,
} from "./expectedTables";
import {
  type MistakeClassification,
  classifyMistake,
} from "../analysis/classifyMistake";
import { useCallback, useEffect, useState } from "react";
import type { MistakeQueueItem } from "../ui/mistakeQueue";

const classificationCache = new Map<string, MistakeClassification | null>();

export const clearClassificationCache = (): void => {
  classificationCache.clear();
};

interface UnclassifiedItem extends MistakeQueueItem {
  readonly previousDiscard: string;
}

const classifyAndCacheItem = (
  item: UnclassifiedItem,
  tables: ExpectedTables,
): void => {
  const classification = classifyMistake({
    cards: item.cards,
    cribRole: item.cribRole,
    previousDiscard: item.previousDiscard,
    tables,
  });
  classificationCache.set(
    `${item.handKey}#${item.previousDiscard}`,
    classification,
  );
};

const hasPreviousDiscard = (item: MistakeQueueItem): item is UnclassifiedItem =>
  item.previousDiscard !== null &&
  !classificationCache.has(`${item.handKey}#${item.previousDiscard}`);

const CHUNK_SIZE = 1;

export const useMistakeQueueClassifications = (
  show: boolean,
  sortedItems: readonly MistakeQueueItem[] | null,
  visibleCount: number,
): ((item: MistakeQueueItem) => MistakeClassification | null) => {
  const [tables, setTables] = useState(readSynchronousExpectedTables);
  const [classifications, setClassifications] = useState(classificationCache);

  useEffect(() => {
    if (
      show &&
      tables === null &&
      sortedItems !== null &&
      sortedItems.some(hasPreviousDiscard)
    ) {
      loadExpectedTables(cribLoader.loadTable, playLoader.loadTable)
        .then(setTables)
        .catch(() => {
          setTables(null);
        });
    }
  }, [show, sortedItems, tables]);

  useEffect(() => {
    const timeoutRef = {
      current: null as ReturnType<typeof setTimeout> | null,
    };
    if (show && tables !== null && sortedItems !== null) {
      const visible = sortedItems.slice(0, visibleCount);
      const pendingItems = visible.filter(hasPreviousDiscard);
      if (pendingItems.length > 0) {
        let index = 0;
        const processNextChunk = () => {
          const chunk = pendingItems.slice(index, index + CHUNK_SIZE);
          for (const item of chunk) {
            classifyAndCacheItem(item, tables);
          }
          index += chunk.length;
          setClassifications(new Map(classificationCache));
          if (index < pendingItems.length) {
            timeoutRef.current = setTimeout(processNextChunk, 0);
          }
        };

        timeoutRef.current = setTimeout(processNextChunk, 0);
      }
    }

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, sortedItems, tables, visibleCount]);

  return useCallback(
    (item: MistakeQueueItem): MistakeClassification | null =>
      item.previousDiscard === null
        ? null
        : (classifications.get(`${item.handKey}#${item.previousDiscard}`) ??
          null),
    [classifications],
  );
};
