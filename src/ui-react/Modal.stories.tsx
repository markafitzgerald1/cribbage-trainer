import type { Meta, StoryObj } from "@storybook/react-vite";
import Modal, { type ModalProps } from "./Modal";
import { expect, fireEvent } from "storybook/test";
import { PrivacyPolicy as PrivacyPolicyNode } from "./PrivacyPolicy";
import { useState } from "react";

const meta = {
  component: Modal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  title: "Modal",
} satisfies Meta<ModalProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <p>Sample modal content.</p>,
    onClose: () => null,
    show: true,
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "300px", position: "relative" }}>
        <Story />
      </div>
    ),
  ],
};

const privacyPolicyArgs = {
  children: <PrivacyPolicyNode />,
  onClose: () => null,
  show: true,
};

export const ShownPrivacyPolicy: Story = {
  args: privacyPolicyArgs,
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent(
      "Privacy Policy for Cribbage Trainer",
    );
  },
};

export const ClosedPrivacyPolicy: Story = {
  args: privacyPolicyArgs,
  play: async ({ canvasElement }) => {
    const closeButton = canvasElement.querySelector("button");

    await fireEvent.click(closeButton!);

    await expect(canvasElement).not.toHaveTextContent(
      "Privacy Policy for Cribbage Trainer",
    );
  },
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <Modal
        onClose={() => setShow(false)}
        show={show}
      >
        <PrivacyPolicyNode />
      </Modal>
    );
  },
};
