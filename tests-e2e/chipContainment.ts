import { type Locator, expect } from "@playwright/test";

// Same-row tolerance for filter chips: sub-pixel drift, not a wrapped row.
export const CHIP_ROW_TOLERANCE_PX = 2;

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return {
    bottom: (box?.y ?? Number.NaN) + (box?.height ?? Number.NaN),
    left: box?.x ?? Number.NaN,
    right: (box?.x ?? Number.NaN) + (box?.width ?? Number.NaN),
    top: box?.y ?? Number.NaN,
  };
};

/*
 * Every chip must be legible in full, which is a different claim from fitting
 * on one row -- and the stronger one. An earlier version of this guard
 * asserted a single row, and the non-wrapping scroll strip that satisfied it
 * cropped "Low < 0.31" to "Low < 0.3" behind a scroll strip nobody notices.
 * So: assert each chip is whole inside its group and the group inside the
 * viewport, and say nothing about how many rows that takes.
 *
 * Measured against the group rather than the viewport on purpose -- these
 * panels scroll, so a group below the fold is reachable rather than broken.
 * Both axes, because `boundingBox` still reports geometry for a chip an
 * ancestor has clipped, so horizontal edges alone would miss a group whose
 * height cannot hold the rows it wrapped onto.
 */
export const expectChipsFullyVisible = async (
  group: Locator,
  expectedCount: number,
) => {
  const chips = group.locator("label");
  await expect(chips).toHaveCount(expectedCount);

  const viewportWidth = group.page().viewportSize()?.width ?? Number.NaN;
  const groupBox = await boxOf(group);

  expect(groupBox.left).toBeGreaterThanOrEqual(-CHIP_ROW_TOLERANCE_PX);
  expect(groupBox.right).toBeLessThanOrEqual(
    viewportWidth + CHIP_ROW_TOLERANCE_PX,
  );

  const chipBoxes = await Promise.all(
    (await chips.all()).map(async (chip) => boxOf(chip)),
  );

  chipBoxes.forEach((chipBox) => {
    expect(chipBox.left).toBeGreaterThanOrEqual(
      groupBox.left - CHIP_ROW_TOLERANCE_PX,
    );
    expect(chipBox.right).toBeLessThanOrEqual(
      groupBox.right + CHIP_ROW_TOLERANCE_PX,
    );
    expect(chipBox.top).toBeGreaterThanOrEqual(
      groupBox.top - CHIP_ROW_TOLERANCE_PX,
    );
    expect(chipBox.bottom).toBeLessThanOrEqual(
      groupBox.bottom + CHIP_ROW_TOLERANCE_PX,
    );
  });
};

/*
 * Only for groups whose wrapping would be a regression. Loss severity and the
 * trend dialog's groups wrap on purpose, so they use the containment helper
 * alone; Sort by is held on one row by the portrait sizing caps, and a wrap
 * there means those caps have slipped. Containment cannot see that, since
 * wrapped chips are still fully inside their group.
 */
export const expectChipsShareARow = async (group: Locator) => {
  const tops = await Promise.all(
    (await group.locator("label").all()).map(
      async (chip) => (await boxOf(chip)).top,
    ),
  );

  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(
    CHIP_ROW_TOLERANCE_PX,
  );
};
