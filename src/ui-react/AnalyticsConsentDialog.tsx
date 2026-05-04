import * as classes from "./AnalyticsConsentDialog.module.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import { PrivacyPolicy } from "./PrivacyPolicy";

const FADE_DELAY_MS = 5000;

type AnalyticsConsentDialogProps = {
  // eslint-disable-next-line react/require-default-props
  readonly consent?: boolean | null;
  readonly onChange: (value: boolean) => void;
  // eslint-disable-next-line react/require-default-props
  readonly wasInitiallyConsented?: boolean;
};

const useModalEventListeners = (
  showModal: boolean,
  handleKeyDown: (event: KeyboardEvent) => void,
  handleClickOutside: (event: MouseEvent) => void,
) => {
  useEffect(() => {
    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal, handleClickOutside, handleKeyDown]);
};

const FADE_TRANSITION_MS = 800;

interface FadeState {
  isFading: boolean;
  isFadedOut: boolean;
}

interface FadeSetters {
  setIsFading: (value: boolean) => void;
  setIsFadedOut: (value: boolean) => void;
}

const useFadeOutTimer = (
  consent: boolean | null,
  fadeState: FadeState,
  setters: FadeSetters,
) => {
  useEffect(() => {
    if (consent !== null && !fadeState.isFadedOut) {
      const fadeTimer = setTimeout(() => {
        setters.setIsFading(true);
      }, FADE_DELAY_MS);
      const removeTimer = setTimeout(() => {
        setters.setIsFadedOut(true);
        setters.setIsFading(false);
      }, FADE_DELAY_MS + FADE_TRANSITION_MS);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
    return () => {
      // No cleanup needed when consent is null or already faded
    };
  }, [consent, fadeState.isFadedOut, setters]);
};

const getDialogClassName = (
  isFadedOut: boolean,
  isFading: boolean,
  shouldAnimate: boolean,
): string => {
  if (isFadedOut) {
    return shouldAnimate
      ? classes.analyticsConsentDialogMinimalAnimated
      : classes.analyticsConsentDialogMinimal;
  }
  if (isFading) {
    return classes.analyticsConsentDialogFading;
  }
  return classes.analyticsConsentDialog;
};

export function AnalyticsConsentDialog({
  consent = null,
  onChange,
  wasInitiallyConsented = false,
}: AnalyticsConsentDialogProps) {
  const [showModal, setShowModal] = useState(false);
  const [isFadedOut, setIsFadedOut] = useState(consent !== null);
  const [isFading, setIsFading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const privacyPolicyRef = useRef<HTMLDivElement>(null);

  const displayModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const hideModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleAccept = useCallback(() => {
    onChange(true);
  }, [onChange]);

  const handleDecline = useCallback(() => {
    onChange(false);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideModal();
      }
    },
    [hideModal],
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const modalElement = modalRef.current;
      const privacyPolicyElement = privacyPolicyRef.current;
      if (
        modalElement &&
        !modalElement.contains(event.target as Node) &&
        privacyPolicyElement &&
        !privacyPolicyElement.contains(event.target as Node)
      ) {
        hideModal();
      }
    },
    [hideModal],
  );

  useModalEventListeners(showModal, handleKeyDown, handleClickOutside);

  const fadeSetters = useMemo(
    () => ({ setIsFadedOut, setIsFading }),
    [setIsFadedOut, setIsFading],
  );
  useFadeOutTimer(consent, { isFadedOut, isFading }, fadeSetters);

  const handleKeyDownEnter = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter") {
        displayModal();
      }
    },
    [displayModal],
  );

  const PrivacyPolicyLink = (
    <span
      onClick={displayModal}
      onKeyDown={handleKeyDownEnter}
      role="button"
      style={{
        color: "blue",
        cursor: "pointer",
        textDecoration: "underline",
      }}
      tabIndex={0}
    >
      Privacy Policy
    </span>
  );

  const renderConsentMessage = () => {
    if (isFadedOut) {
      return PrivacyPolicyLink;
    }

    switch (consent) {
      case true:
        return (
          <>
            Thank you! Your consent helps us improve our site using tools like
            Google Analytics. For more details, please see our{" "}
            {PrivacyPolicyLink}.
          </>
        );
      case false:
        return (
          <>
            Analytics have been disabled. You can find more information in our{" "}
            {PrivacyPolicyLink}.
          </>
        );
      case null:
      default:
        return (
          <>
            <h2>Analytics Consent</h2>
            <p>
              We use cookies and tools like Google Analytics to analyze how
              visitors use our site. This helps us make improvements and tailor
              the experience. See our {PrivacyPolicyLink} for more details.
            </p>
            <button
              onClick={handleAccept}
              type="button"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              type="button"
            >
              Decline
            </button>
          </>
        );
    }
  };

  const dialogClassName = getDialogClassName(
    isFadedOut,
    isFading,
    !wasInitiallyConsented,
  );

  return (
    <div className={dialogClassName}>
      {renderConsentMessage()}
      <Modal
        onClose={hideModal}
        ref={modalRef}
        show={showModal}
      >
        <PrivacyPolicy ref={privacyPolicyRef} />
      </Modal>
    </div>
  );
}
