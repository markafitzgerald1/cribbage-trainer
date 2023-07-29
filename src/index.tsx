import React, { StrictMode } from "react";
import ReactDOMClient from "react-dom/client";
import { Trainer } from "./ui-react/Trainer";
import { create } from "./game/randomNumberGenerator";

ReactDOMClient.createRoot(document.querySelector("#trainer")!).render(
  <StrictMode>
    <Trainer
      generateRandomNumber={create(
        new URLSearchParams(window.location.search).get("seed"),
      )}
    />
  </StrictMode>,
);
