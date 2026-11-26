import { FIXTURE_KEEP, resolvingSource } from "./openingPlays.test.common";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import {
  OPENING_PLAYS_FOOTER,
  OPENING_PLAYS_UNAVAILABLE,
  OpeningPlays,
} from "./OpeningPlays";
import { expect, userEvent, within } from "storybook/test";
import { CribRole } from "../game/expectedCribPoints";

const LOAD_TIMEOUT_MS = 10_000;
const ROW_BACKGROUND = { backgroundColor: "#0f5132", padding: "8px" };

const openAndExpect = async (root: HTMLElement, text: string) => {
  const canvas = within(root);
  const toggle = canvas.getByRole("button", { name: "Opening plays" });

  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(toggle);

  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  // The real file is parsed on first opening, which can take seconds on a cold browser.
  await expect(
    await canvas.findByText(text, {}, { timeout: LOAD_TIMEOUT_MS }),
  ).toBeInTheDocument();
};

const meta = {
  args: { keep: FIXTURE_KEEP },
  component: OpeningPlays,
  decorators: [
    (Story) => (
      <div style={ROW_BACKGROUND}>
        <Story />
      </div>
    ),
  ],
  title: "OpeningPlays",
} satisfies Meta<typeof OpeningPlays>;

export default meta;

export const Pone: StoryObj<typeof meta> = {
  args: { cribRole: CribRole.Pone },
  play: async ({ canvasElement }) => {
    await openAndExpect(canvasElement, "You lead 3 in 58% of hands");

    await expect(
      within(canvasElement).getByText(OPENING_PLAYS_FOOTER),
    ).toBeVisible();
  },
};

export const Dealer: StoryObj<typeof meta> = {
  args: { cribRole: CribRole.Dealer },
  play: async ({ canvasElement }) => {
    await openAndExpect(
      canvasElement,
      "They lead J in 10% of hands, and you reply 3 in 95% of those",
    );
  },
};

export const Unavailable: StoryObj<typeof meta> = {
  args: { cribRole: CribRole.Pone, source: resolvingSource(null) },
  play: async ({ canvasElement }) => {
    await openAndExpect(canvasElement, OPENING_PLAYS_UNAVAILABLE);
  },
};
