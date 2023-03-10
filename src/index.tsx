import React from "react";
import ReactDOMClient from "react-dom/client";
import { Trainer } from "./components/Trainer";

ReactDOMClient.createRoot(
  document.querySelector("#trainer") ?? document.documentElement
).render(<Trainer />);
