import type { Meta, StoryObj } from "@storybook/react";
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

const createStoryWithConsent = (consent: boolean | null) => ({
  args: {
    consent,
    onChange: () => null,
  },
});

export const ConsentUnknownOrUnspecifiedDialog: Story =
  createStoryWithConsent(null);
export const ConsentGivenDialog: Story = createStoryWithConsent(true);
export const ConsentNotGivenDialog: Story = createStoryWithConsent(false);
