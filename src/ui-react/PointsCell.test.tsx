import "@testing-library/jest-dom";
import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { PointsCell } from "./PointsCell";

describe("pointsCell", () => {
  it("renders points when greater than zero", () => {
    render(<PointsCell points={5} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders a dash when points is zero", () => {
    render(<PointsCell points={0} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
