import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";

const FADE_DELAY_MS = 5000;
const FADE_TRANSITION_MS = 800;
const ANALYTICS_CONSENT = "Analytics Consent";
const privacyPolicyLinkText = "Privacy Policy";
const distinctPrivacyPolicyText = "Consent to Data Collection";
const ENTER_KEY_CODE = "Enter";

const createMockOnChange = () => jest.fn();

const renderDialogElement = (
  consent: boolean | null,
  onChange: ReturnType<typeof createMockOnChange>,
) =>
  render(
    <AnalyticsConsentDialog
      consent={consent}
      onChange={onChange}
    />,
  );

const renderDialog = (consent: boolean | null = null) => {
  const onChange = createMockOnChange();
  const { getByText, queryByText, container } = renderDialogElement(
    consent,
    onChange,
  );
  return { container, getByText, onChange, queryByText };
};

const renderAndClickPrivacyLink = () => {
  const { getByText, queryByText } = renderDialog();
  fireEvent.click(getByText(privacyPolicyLinkText));
  return { getByText, queryByText };
};

const setupFadeTest = (initialConsent: boolean | null = null) => {
  const onChange = createMockOnChange();
  jest.useFakeTimers();
  const rendered = renderDialogElement(initialConsent, onChange);
  const advancePastFade = () => {
    act(() => {
      jest.advanceTimersByTime(FADE_DELAY_MS + FADE_TRANSITION_MS);
    });
    jest.useRealTimers();
  };
  const advanceToFadeStart = () => {
    act(() => {
      jest.advanceTimersByTime(FADE_DELAY_MS);
    });
  };
  const rerenderWithConsent = (newConsent: boolean) => {
    rendered.rerender(
      <AnalyticsConsentDialog
        consent={newConsent}
        onChange={onChange}
      />,
    );
  };
  return {
    advancePastFade,
    advanceToFadeStart,
    onChange,
    rendered,
    rerenderWithConsent,
  };
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
    [null, "We use cookies and tools like Google Analytics"],
  ])(
    "shows the correct message when consent is %s",
    (consent: boolean | null, expectedMessage: string) => {
      const { getByText } = renderDialog(consent);

      expect(getByText(expectedMessage, { exact: false })).toBeTruthy();
    },
  );

  it.each<[boolean]>([[true], [false]])(
    "shows only Privacy Policy link when consent is already %s on load",
    (consent: boolean) => {
      const { getByText, queryByText } = renderDialog(consent);

      expect(getByText(privacyPolicyLinkText)).toBeTruthy();
      expect(queryByText("Thank you")).toBeFalsy();
      expect(queryByText("Analytics have been disabled")).toBeFalsy();
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
    const { getByText, queryByText } = renderAndClickPrivacyLink();

    fireEvent.click(getByText("X"));

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("hides the modal when the Escape key is pressed", () => {
    const { queryByText } = renderAndClickPrivacyLink();

    const escapeKeyCode = "Escape";
    fireEvent.keyDown(document, { code: escapeKeyCode, key: escapeKeyCode });

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("does not hide the modal when another key is pressed", () => {
    const { getByText } = renderAndClickPrivacyLink();

    fireEvent.keyDown(document, { code: ENTER_KEY_CODE, key: ENTER_KEY_CODE });

    expect(getByText(distinctPrivacyPolicyText)).toBeTruthy();
  });

  it("hides modal on click outside", () => {
    const { queryByText } = renderAndClickPrivacyLink();

    fireEvent.mouseDown(document);

    expect(queryByText(distinctPrivacyPolicyText)).toBeFalsy();
  });

  it("does not hide modal on click inside", () => {
    const { getByText } = renderAndClickPrivacyLink();

    fireEvent.mouseDown(getByText(distinctPrivacyPolicyText));

    expect(getByText(distinctPrivacyPolicyText)).toBeTruthy();
  });

  it("shows only Privacy Policy link for unexpected consent values", () => {
    const { getByText } = render(
      <AnalyticsConsentDialog
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        consent={"unexpected" as any}
        onChange={jest.fn()}
      />,
    );

    expect(getByText(privacyPolicyLinkText)).toBeTruthy();
  });
});

describe("analytics consent dialog fade-out behavior", () => {
  const queryTextWithPartialMatch = (
    rendered: ReturnType<typeof render>,
    text: string,
  ) => rendered.queryByText(text, { exact: false });

  it.each<[boolean, string]>([
    [true, "Thank you!"],
    [false, "Analytics have been disabled"],
  ])(
    "shows message then fades to Privacy Policy link when consent changes to %s during session",
    (consent, textToDisappear) => {
      const fadeTest = setupFadeTest(null);

      expect(
        queryTextWithPartialMatch(fadeTest.rendered, textToDisappear),
      ).toBeFalsy();

      fadeTest.rerenderWithConsent(consent);

      expect(
        queryTextWithPartialMatch(fadeTest.rendered, textToDisappear),
      ).toBeTruthy();

      fadeTest.advancePastFade();

      expect(
        queryTextWithPartialMatch(fadeTest.rendered, textToDisappear),
      ).toBeFalsy();

      expect(fadeTest.rendered.getByText("Privacy Policy")).toBeTruthy();
    },
  );

  it("does not fade out when consent is null", () => {
    const nullConsentTest = setupFadeTest(null);

    expect(
      nullConsentTest.rendered.queryByText("Analytics Consent"),
    ).toBeTruthy();

    nullConsentTest.advancePastFade();

    expect(
      nullConsentTest.rendered.queryByText("Analytics Consent"),
    ).toBeTruthy();
  });

  it("uses the fading dialog class during fade transition", () => {
    const fadingTest = setupFadeTest(null);
    fadingTest.rerenderWithConsent(true);
    fadingTest.advanceToFadeStart();
    const dialogElement = fadingTest.rendered.container
      .firstChild as HTMLElement;
    jest.useRealTimers();

    expect(dialogElement.className).toContain("Fading");
  });

  it("uses the minimal dialog class after fading", () => {
    const minimalTest = setupFadeTest(null);
    minimalTest.rerenderWithConsent(true);
    minimalTest.advancePastFade();
    const dialogElement = minimalTest.rendered.container
      .firstChild as HTMLElement;

    expect(dialogElement.className).toContain("Minimal");
  });

  it("allows privacy policy link in faded state to still open modal", () => {
    const modalTest = setupFadeTest(null);
    modalTest.rerenderWithConsent(true);
    modalTest.advancePastFade();
    fireEvent.click(screen.getByText("Privacy Policy"));

    expect(screen.getByText("Consent to Data Collection")).toBeTruthy();
  });
});
