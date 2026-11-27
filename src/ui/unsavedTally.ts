import type { StoredTally } from "./discardTally";

/*
 * In-memory fallback held only when a write fails, so a browser refusing writes
 * accumulates on top of pending session hands rather than resetting to stale storage.
 * If storage moves on independently, the stale branch is dropped to protect other tabs.
 */
let unsavedTally: StoredTally | null = null;
let unsavedBase: StoredTally | null = null;
let nextUnsavedBatch = 0;
let activeUnsavedBatch: number | null = null;
const droppedUnsavedBatches = new Set<number>();

const sameHistory = (one: StoredTally, other: StoredTally) =>
  one.revision === other.revision;

export const forgetUnsaved = () => {
  unsavedTally = null;
  unsavedBase = null;
  activeUnsavedBatch = null;
};

export const dropUnsaved = () => {
  if (activeUnsavedBatch !== null) {
    droppedUnsavedBatches.add(activeUnsavedBatch);
  }
  forgetUnsaved();
};

export const clearUnsavedState = () => {
  forgetUnsaved();
  droppedUnsavedBatches.clear();
};

/*
 * The unsaved copy only when storage still holds what it grew from.
 * Otherwise this tab's pending hands are dropped: losing them costs a
 * session's own statistics, where keeping them would cost another tab its
 * entire history.
 */
export const basisFor = (persisted: StoredTally): StoredTally => {
  if (
    unsavedTally !== null &&
    unsavedBase !== null &&
    sameHistory(persisted, unsavedBase)
  ) {
    return unsavedTally;
  }
  dropUnsaved();
  return persisted;
};

export const recordUnsaved = (next: StoredTally, persisted: StoredTally) => {
  unsavedTally = next;
  // The first failure's basis is kept through a run of them, so a later success still compares against what storage held before any of this.
  unsavedBase ??= persisted;
  nextUnsavedBatch += 1;
  activeUnsavedBatch ??= nextUnsavedBatch;
};

export const currentUnsavedBatch = (): number | null => activeUnsavedBatch;

export const isUnsavedBatchDropped = (batch: number | null): boolean =>
  batch !== null && droppedUnsavedBatches.has(batch);
