import { type ReactElement, StrictMode } from "react";
import { Trainer, type TrainerProps } from "./ui-react/Trainer";
import { describe, expect, it, jest } from "@jest/globals";
import ReactDOMClient from "react-dom/client";

describe("app entrypoint", () => {
  const moduleId = "./index";

  it("crashes on render if no #trainer element is found", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require(moduleId);
    }).toThrow("Target container is not a DOM element");
  });

  const containerSelector = "#trainer";

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it(`creates a React root in the '${containerSelector}' element with the Trainer component in Strict Mode`, () => {
    try {
      const container = document.createElement("div");
      jest.spyOn(document, "querySelector").mockImplementation(() => container);
      const renderMock = jest.fn();
      const createRootSpy = jest
        .spyOn(ReactDOMClient, "createRoot")
        .mockImplementation(() => ({ render: renderMock, unmount: jest.fn() }));
      interface StrictModeProps {
        children: React.ReactNode;
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require(moduleId);
      const renderArg = renderMock.mock.calls[0]?.[0] as ReactElement<
        StrictModeProps,
        typeof StrictMode
      >;
      const trainerElement = renderArg.props
        .children as ReactElement<TrainerProps>;

      expect(document.querySelector).toHaveBeenCalledWith(containerSelector);
      expect(createRootSpy).toHaveBeenCalledTimes(1);
      expect(createRootSpy.mock.calls[0]?.[0]).toBe(container);
      expect(renderArg.type).toBe(StrictMode);
      expect(trainerElement.type).toBe(Trainer);
    } finally {
      jest.resetAllMocks();
    }
  });
});
