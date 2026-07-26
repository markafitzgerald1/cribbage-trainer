import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";

const meta = {
  component: AnalyticsConsentDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "AnalyticsConsentDialog",
} satisfies Meta<typeof AnalyticsConsentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedArgs = {
  consent: true,
  onChange: () => null,
};

const createStoryWithConsent = (consent: boolean | null) => ({
  args: {
    ...sharedArgs,
    consent,
  },
});

const openPrivacyPolicy = async (canvasElement: HTMLElement) => {
  const privacyLink = within(canvasElement).getByRole("button", {
    name: "Privacy Policy",
  });

  await fireEvent.click(privacyLink);

  await expect(canvasElement).toHaveTextContent(
    "Privacy Policy for Cribbage Trainer",
  );
};

const createPrivacyStory = (
  afterOpen?: (canvasElement: HTMLElement) => Promise<void> | void,
): Story => ({
  args: sharedArgs,
  play: async ({ canvasElement }) => {
    await openPrivacyPolicy(canvasElement);
    if (afterOpen) {
      await afterOpen(canvasElement);
    }
  },
});

export const ConsentUnknownOrUnspecifiedDialog: Story =
  createStoryWithConsent(null);
export const ConsentGivenDialog: Story = createStoryWithConsent(true);
export const ConsentNotGivenDialog: Story = createStoryWithConsent(false);

const openAnalyticsSettings = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await fireEvent.click(
    canvas.getByRole("button", { name: "Analytics Settings" }),
  );
  return canvas;
};

const createSettingsArgs = (consent: boolean) => ({
  consent,
  onChange: fn(),
});

const createSettingsStory = (consent: boolean, actionName: string): Story => ({
  args: createSettingsArgs(consent),
  play: async ({ args, canvasElement }) => {
    const canvas = await openAnalyticsSettings(canvasElement);
    await fireEvent.click(canvas.getByText(actionName));

    await expect(args.onChange).toHaveBeenCalledWith(!consent);
  },
});

export const ConsentCanBeGranted: Story = createSettingsStory(
  false,
  "Allow analytics",
);
export const ConsentCanBeWithdrawn: Story = createSettingsStory(
  true,
  "Disable analytics",
);

export const AnalyticsSettingsCanBeDismissed: Story = {
  args: createSettingsArgs(true),
  play: async ({ args, canvasElement }) => {
    await openAnalyticsSettings(canvasElement);
    const canvas = within(canvasElement);

    await expect(canvasElement).toHaveTextContent(
      "Analytics is currently enabled",
    );

    await fireEvent.click(canvas.getByRole("button", { name: "Close" }));

    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "Analytics Settings" }),
      ).toBeVisible();
    });

    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const PrivacyPolicyOpens: Story = createPrivacyStory();

export const PrivacyPolicyClosesOnOutsideClick: Story = createPrivacyStory(
  async (canvasElement) => {
    const overlay = canvasElement.querySelector('[class*="overlay"]');

    await expect(overlay).not.toBeNull();

    await fireEvent.mouseDown(overlay as Element);

    await expect(canvasElement).not.toHaveTextContent(
      "Privacy Policy for Cribbage Trainer",
    );
  },
);

export const PrivacyPolicyClosesWithEscape: Story = createPrivacyStory(
  async (canvasElement) => {
    await fireEvent.keyDown(canvasElement, { key: "Escape" });

    await expect(canvasElement).not.toHaveTextContent(
      "Privacy Policy for Cribbage Trainer",
    );
  },
);
