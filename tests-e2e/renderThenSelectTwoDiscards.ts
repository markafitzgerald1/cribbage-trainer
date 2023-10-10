import { Page } from "@playwright/test";

export const renderThenSelectTwoDiscards = async (
  page: Page,
  constantSeedQuery: string,
) => {
  await page.goto(`/${constantSeedQuery}`);

  const discardCount = 2;
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < discardCount; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await checkboxes.nth(index).click();
  }
};
