import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";

describe("analytics consent dialog", () => {
  const renderDialog = (consent: boolean | null = null) => {
    const onChange = jest.fn();
    const { getByText, queryByText } = render(
      <AnalyticsConsentDialog
        consent={consent}
        onChange={onChange}
      />,
    );
    return { getByText, onChange, queryByText };
  };

  const ANALYTICS_CONSENT = "Analytics Consent";

  it("contains the expected title with null consent", () => {
    const { getByText } = renderDialog(null);

    expect(getByText(ANALYTICS_CONSENT)).toBeInTheDocument();
  });

  it("contains the expected title with unspecified consent", () => {
    const { getByText } = renderDialog();

    expect(getByText(ANALYTICS_CONSENT)).toBeInTheDocument();
  });

  it("contains the accept button with null consent", () =>
    expect(
      render(<AnalyticsConsentDialog onChange={jest.fn()} />).getByText(
        ANALYTICS_CONSENT,
      ),
    ).toBeInTheDocument());

  it.each<[boolean, string]>([
    [true, "Accept"],
    [false, "Decline"],
  ])(
    "calls the onChange callback with %s when the %s button is clicked",
    (expected, buttonText: string) => {
      const { onChange, getByText } = renderDialog();
      fireEvent.click(getByText(buttonText));

      expect(onChange).toHaveBeenCalledWith(expected);
    },
  );

  it.each<[boolean | null, string]>([
    [true, "Thank you! Your consent helps "],
    [false, "Analytics have been disabled."],
    [null, "We use cookies and tools like Google Analytics"],
  ])(
    "shows the correct message when consent is %s",
    (consent: boolean | null, expectedMessage: string) => {
      const { getByText } = renderDialog(consent);

      expect(getByText(expectedMessage, { exact: false })).toBeInTheDocument();
    },
  );

  const privacyPolicyLinkText = "Privacy Policy";
  const distinctPrivacyPolicyText = "Consent to Data Collection";

  it("shows the Privacy Policy when the link is clicked", () => {
    const { getByText } = renderDialog();

    fireEvent.click(getByText(privacyPolicyLinkText));

    expect(getByText(distinctPrivacyPolicyText)).toBeInTheDocument();
  });

  const ENTER_KEY_CODE = "Enter";

  it("shows the modal when Enter is pressed on the Privacy Policy link", () => {
    const { getByText } = renderDialog();

    fireEvent.keyDown(getByText(privacyPolicyLinkText), {
      code: ENTER_KEY_CODE,
      key: ENTER_KEY_CODE,
    });

    expect(getByText(distinctPrivacyPolicyText)).toBeInTheDocument();
  });

  it("does not show the modal when another key is pressed on the Privacy Policy link", () => {
    const { getByText, queryByText } = renderDialog();

    const keyCode = "Space";
    fireEvent.keyDown(getByText(privacyPolicyLinkText), {
      code: keyCode,
      key: keyCode,
    });

    expect(queryByText(distinctPrivacyPolicyText)).not.toBeInTheDocument();
  });

  const renderAndClick = () => {
    const { getByText, queryByText } = renderDialog();
    fireEvent.click(getByText(privacyPolicyLinkText));
    return { getByText, queryByText };
  };

  it("hides the modal when the close button is clicked", () => {
    const { getByText, queryByText } = renderAndClick();

    fireEvent.click(getByText("X"));

    expect(queryByText(distinctPrivacyPolicyText)).not.toBeInTheDocument();
  });

  it("hides the modal when the Escape key is pressed", () => {
    const { queryByText } = renderAndClick();

    const escapeKeyCode = "Escape";
    fireEvent.keyDown(document, { code: escapeKeyCode, key: escapeKeyCode });

    expect(queryByText(distinctPrivacyPolicyText)).not.toBeInTheDocument();
  });

  it("does not hide the modal when another key is pressed", () => {
    const { getByText } = renderAndClick();

    fireEvent.keyDown(document, { code: ENTER_KEY_CODE, key: ENTER_KEY_CODE });

    expect(getByText(distinctPrivacyPolicyText)).toBeInTheDocument();
  });

  it("hides modal on click outside", () => {
    const { queryByText } = renderAndClick();

    fireEvent.mouseDown(document);

    expect(queryByText(distinctPrivacyPolicyText)).not.toBeInTheDocument();
  });

  it("does not hide modal on click inside", () => {
    const { getByText } = renderAndClick();

    fireEvent.mouseDown(getByText(distinctPrivacyPolicyText));

    expect(getByText(distinctPrivacyPolicyText)).toBeInTheDocument();
  });

  it("renders null for unexpected consent values", () => {
    const { container } = render(
      <AnalyticsConsentDialog
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        consent={"unexpected" as any}
        onChange={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
