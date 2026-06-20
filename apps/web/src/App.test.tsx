import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { originalBullet, proposedBullet } from "./data/resume";

describe("Resume Studio foundation", () => {
  it("accepts a suggestion and updates the selected resume bullet", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId("selected-bullet")).toHaveTextContent(originalBullet);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(screen.getByTestId("selected-bullet")).toHaveTextContent(proposedBullet);
    expect(screen.getByText("Suggestion accepted as a new resume version.")).toBeInTheDocument();
  });

  it("rejects a suggestion without changing the resume", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(screen.getByTestId("selected-bullet")).toHaveTextContent(originalBullet);
    expect(screen.getByText("Suggestion rejected. The resume is unchanged.")).toBeInTheDocument();
  });

  it("switches to the ATS text projection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "ATS preview" }));

    expect(screen.getByRole("region", { name: "ATS text preview" })).toBeInTheDocument();
  });
});
