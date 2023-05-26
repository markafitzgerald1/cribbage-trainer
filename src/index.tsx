import React, { StrictMode } from "react";
import ReactDOMClient from "react-dom/client";
import { Trainer } from "./ui-react/Trainer";

ReactDOMClient.createRoot(document.querySelector("#trainer")!).render(
  <StrictMode>
    <Trainer />
  </StrictMode>
);
