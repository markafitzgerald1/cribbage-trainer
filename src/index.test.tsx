import { describe, expect, it, jest } from "@jest/globals";
import ReactDOMClient from "react-dom/client";
import { StrictMode } from "react";
import { Trainer } from "./ui-react/Trainer";

describe("app entrypoint", () => {
  const moduleId = "./index";

  it("crashes on render if no #trainer element is found", () => {
    expect(() => {
      require(moduleId);
    }).toThrow("Target container is not a DOM element");
  });

  const containerSelector = "#trainer";

  it(`creates a React root in the '${containerSelector}' element with the Trainer component`, () => {
    try {
      const container = document.createElement("div");
      jest.spyOn(document, "querySelector").mockImplementation(() => container);
      const renderMock = jest.fn();
      jest
        .spyOn(ReactDOMClient, "createRoot")
        .mockImplementation(() => ({ render: renderMock, unmount: jest.fn() }));

      require(moduleId);

      expect(document.querySelector).toHaveBeenCalledWith(containerSelector);
      expect(ReactDOMClient.createRoot).toHaveBeenCalledWith(container);
      expect(renderMock).toHaveBeenCalledWith(
        <StrictMode>
          <Trainer generateRandomNumber={Math.random} />
        </StrictMode>,
      );
    } finally {
      jest.resetAllMocks();
    }
  });
});
