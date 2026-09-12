import * as cribLoader from "../game/expectedCribPointsTableLoader";
import * as playLoader from "../game/expectedPlayPointsTableLoader";
import {
  type MistakeClassification,
  classifyMistake,
} from "../analysis/classifyMistake";
import { useCallback, useEffect, useState } from "react";
import { type ExpectedCribPointsTable } from "../game/expectedCribPoints";
import { type ExpectedPlayPointsTable } from "../game/expectedPlayPoints";
import type { MistakeQueueItem } from "../ui/mistakeQueue";

interface ScoringTables {
  readonly crib: ExpectedCribPointsTable;
  readonly play: ExpectedPlayPointsTable;
}

const readSynchronousTables = (): ScoringTables | null => {
  const crib = cribLoader.getTableSync();
  const play = playLoader.getTableSync();
  return crib !== null && play !== null ? { crib, play } : null;
};

const classificationCache = new Map<string, MistakeClassification | null>();

export const clearClassificationCache = (): void => {
  classificationCache.clear();
};

interface UnclassifiedItem extends MistakeQueueItem {
  readonly previousDiscard: string;
}

const classifyAndCacheItem = (
  item: UnclassifiedItem,
  tables: ScoringTables,
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
  const [tables, setTables] = useState<ScoringTables | null>(
    readSynchronousTables,
  );
  const [classifications, setClassifications] = useState(classificationCache);

  useEffect(() => {
    if (show && tables === null) {
      Promise.all([cribLoader.loadTable(), playLoader.loadTable()])
        .then(([crib, play]) => {
          setTables({ crib, play });
        })
        .catch(() => {
          setTables(null);
        });
    }
  }, [show, tables]);

  useEffect(() => {
    if (!show || tables === null || sortedItems === null) {
      return () => {
        // No pending classification tasks while hidden or uninitialized.
      };
    }
    const visible = sortedItems.slice(0, visibleCount);
    const pendingItems = visible.filter(hasPreviousDiscard);
    if (pendingItems.length === 0) {
      return () => {
        // All visible items are already cached.
      };
    }

    let index = 0;
    const timeoutRef = {
      current: null as ReturnType<typeof setTimeout> | null,
    };
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

    return () => {
      clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
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
