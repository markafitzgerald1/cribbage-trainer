import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";

const FADE_DELAY_MS = 3000;
const ANALYTICS_CONSENT = "Analytics Consent";
const privacyPolicyLinkText = "Privacy Policy";
const distinctPrivacyPolicyText = "Consent to Data Collection";
const ENTER_KEY_CODE = "Enter";

const renderDialog = (consent: boolean | null = null) => {
  const onChange = jest.fn();
  const { getByText, queryByText, container } = render(
    <AnalyticsConsentDialog
      consent={consent}
      onChange={onChange}
    />,
  );
  return { container, getByText, onChange, queryByText };
};

const renderAndClick = () => {
  const { getByText, queryByText } = renderDialog();
  fireEvent.click(getByText(privacyPolicyLinkText));
  return { getByText, queryByText };
};

describe("analytics consent dialog", () => {
  it("contains the expected title with null consent", () => {
    const { getByText } = renderDialog(null);

    expect(getByText(ANALYTICS_CONSENT)).toBeTruthy();
  });

  it("contains the expected title with unspecified consent", () => {
    const { getByText } = renderDialog();

    expect(getByText(ANALYTICS_CONSENT)).toBeTruthy();
  });

  it("contains the accept button with null consent", () =>
    expect(
      render(<AnalyticsConsentDialog onChange={jest.fn()} />).getByText(
        ANALYTICS_CONSENT,
      ),
    ).toBeTruthy());

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

      expect(getByText(expectedMessage, { exact: false })).toBeTruthy();
    },
  );

  it("shows the Privacy Policy when the link is clicked", () => {
    const { getByText } = renderDialog();

    fireEvent.click(getByText(privacyPolicyLinkText));

    expect(getByText(distinctPrivacyPolicyText)).toBeTruthy();
  });

  it("shows the modal when Enter is pressed on the Privacy Policy link", () => {
    const { getByText } = renderDialog();

    fireEvent.keyDown(getByText(privacyPolicyLinkText), {
      code: ENTER_KEY_CODE,
      key: ENTER_KEY_CODE,
    });

    expect(getByText(distinctPrivacyPolicyText)).toBeTruthy();
  });

  it("does not show the modal when another key is pressed on the Privacy Policy link", () => {
    const { getByText, queryByText } = renderDialog();

    const keyCode = "Space";
    fireEvent.keyDown(getByText(privacyPolicyLinkText), {
      code: keyCode,
      key: keyCode,
    });

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("hides the modal when the close button is clicked", () => {
    const { getByText, queryByText } = renderAndClick();

    fireEvent.click(getByText("X"));

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("hides the modal when the Escape key is pressed", () => {
    const { queryByText } = renderAndClick();

    const escapeKeyCode = "Escape";
    fireEvent.keyDown(document, { code: escapeKeyCode, key: escapeKeyCode });

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("does not hide the modal when another key is pressed", () => {
    const { getByText } = renderAndClick();

    fireEvent.keyDown(document, { code: ENTER_KEY_CODE, key: ENTER_KEY_CODE });

    expect(getByText(distinctPrivacyPolicyText)).toBeTruthy();
  });

  it("hides modal on click outside", () => {
    const { queryByText } = renderAndClick();

    fireEvent.mouseDown(document);

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("does not hide modal on click inside", () => {
    const { getByText } = renderAndClick();

    fireEvent.mouseDown(getByText(distinctPrivacyPolicyText));

    expect(getByText(distinctPrivacyPolicyText)).toBeTruthy();
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

describe("analytics consent dialog fade-out behavior", () => {
  const runWithFakeTimers = <T,>(
    fn: () => T,
  ): { advanceToFade: () => void; result: T } => {
    jest.useFakeTimers();
    const result = fn();
    const advanceToFade = () => {
      act(() => {
        jest.advanceTimersByTime(FADE_DELAY_MS);
      });
      jest.useRealTimers();
    };
    return { advanceToFade, result };
  };

  it.each<[boolean, string]>([
    [true, "Thank you!"],
    [false, "Analytics have been disabled"],
  ])(
    "fades to minimal privacy policy link after delay when consent is %s",
    (consent, textToDisappear) => {
      const { advanceToFade, result } = runWithFakeTimers(() =>
        renderDialog(consent),
      );

      expect(
        result.queryByText(textToDisappear, { exact: false }),
      ).toBeTruthy();

      advanceToFade();

      expect(result.queryByText(textToDisappear, { exact: false })).toBeFalsy();
      expect(result.getByText("Privacy Policy")).toBeTruthy();
    },
  );

  it("does not fade out when consent is null", () => {
    const { advanceToFade, result } = runWithFakeTimers(() =>
      renderDialog(null),
    );

    expect(result.queryByText("Analytics Consent")).toBeTruthy();

    advanceToFade();

    expect(result.queryByText("Analytics Consent")).toBeTruthy();
  });

  it("uses the minimal dialog class after fading", () => {
    const { advanceToFade, result } = runWithFakeTimers(() =>
      renderDialog(true),
    );

    advanceToFade();

    const dialogElement = result.container.firstChild as HTMLElement;

    expect(dialogElement.className).toContain("Minimal");
  });

  it("allows privacy policy link in faded state to still open modal", () => {
    const { advanceToFade } = runWithFakeTimers(() => renderDialog(true));

    advanceToFade();

    fireEvent.click(screen.getByText("Privacy Policy"));

    expect(screen.getByText("Consent to Data Collection")).toBeTruthy();
  });
});
