import * as classes from "./AnalyticsConsentDialog.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { PrivacyPolicy } from "./PrivacyPolicy";

const FADE_DELAY_MS = 3000;

type AnalyticsConsentDialogProps = {
  // eslint-disable-next-line react/require-default-props
  readonly consent?: boolean | null;
  readonly onChange: (value: boolean) => void;
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

const useFadeOutTimer = (
  consent: boolean | null,
  setIsFadedOut: (value: boolean) => void,
) => {
  useEffect(() => {
    if (consent !== null) {
      const timer = setTimeout(() => {
        setIsFadedOut(true);
      }, FADE_DELAY_MS);
      return () => {
        clearTimeout(timer);
      };
    }
    return () => {
      // No cleanup needed when consent is null
    };
  }, [consent, setIsFadedOut]);
};

export function AnalyticsConsentDialog({
  consent = null,
  onChange,
}: AnalyticsConsentDialogProps) {
  const [showModal, setShowModal] = useState(false);
  const [isFadedOut, setIsFadedOut] = useState(false);
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
  useFadeOutTimer(consent, setIsFadedOut);

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
      default:
        return null;
    }
  };

  const content = renderConsentMessage();

  if (content === null) {
    return null;
  }

  const dialogClassName = isFadedOut
    ? classes.analyticsConsentDialogMinimal
    : classes.analyticsConsentDialog;

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
