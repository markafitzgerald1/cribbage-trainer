import * as classes from "./Modal.module.css";
import React, { forwardRef } from "react";

export interface ModalProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ show, onClose, children }, ref) => {
    if (!show) {
      return null;
    }

    return (
      <div className={classes.overlay}>
        <div
          className={classes.content}
          ref={ref}
        >
          <button
            aria-label="Close modal"
            className={classes.close}
            onClick={onClose}
            type="button"
          >
            X
          </button>
          {children}
        </div>
      </div>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
