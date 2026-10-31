/*
 * A cap against endless retries rather than a measured figure: each retry means
 * another tab finished a whole write inside this one's, so needing more than
 * one or two takes a storm of tabs no player produces.
 */
export const MAX_COMMIT_ATTEMPTS = 5;

export interface PlannedWrite {
  // Null when there is nothing to write.
  readonly serialized: string | null;
}

export interface CommitSteps<Plan extends PlannedWrite> {
  readonly plan: (raw: string | null) => Plan;
  readonly read: () => string | null;
  readonly write: (planned: Plan, serialized: string) => void;
}

function commitFrom<Plan extends PlannedWrite>(
  raw: string | null,
  attempt: number,
  steps: CommitSteps<Plan>,
): Plan {
  const planned = steps.plan(raw);
  if (planned.serialized === null) {
    return planned;
  }
  /*
   * Serialized before this re-read, so only two adjacent storage calls
   * separate the check from the write. That narrows the race with another tab
   * rather than closing it; closing it needs a cross-tab lock (#903).
   */
  if (attempt < MAX_COMMIT_ATTEMPTS) {
    const current = steps.read();
    if (current !== raw) {
      return commitFrom(current, attempt + 1, steps);
    }
  }
  steps.write(planned, planned.serialized);
  return planned;
}

/*
 * Compares the raw stored string rather than a revision counter, because the
 * string moves on every write, including one by a build that keeps no count.
 * On the last attempt it writes onto the latest read rather than giving up,
 * since a write kept only in memory is dropped once storage has moved.
 */
export function commitUnlessMoved<Plan extends PlannedWrite>(
  steps: CommitSteps<Plan>,
): Plan {
  return commitFrom(steps.read(), 1, steps);
}
