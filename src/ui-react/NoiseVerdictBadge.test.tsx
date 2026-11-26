import { describe, expect, it } from "@jest/globals";
import { NoiseVerdictBadge } from "./NoiseVerdictBadge";
import { render } from "@testing-library/react";

describe("noise verdict badge", () => {
  it("spells a sub-cent threshold out for screen readers while showing the glyph", () => {
    const { getByRole } = render(
      <NoiseVerdictBadge
        rolePair={{
          accessibleLabel: "0.01 points lost",
          leadingText: "",
          oppositeRoleCost: "0.01 pts lost",
          oppositeRoleCostsNothing: false,
        }}
        threshold={0.004}
        title="Within noise"
      />,
    );
    const note = getByRole("note", { hidden: true });

    expect(note.textContent).toMatch(/^Approximate threshold < 0\.01 pts: /u);
    expect(note.getAttribute("aria-label")).toMatch(
      /^Approximate threshold less than 0\.01 points: /u,
    );
  });
});
