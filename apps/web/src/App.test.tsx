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

  it("wires the resume workspace controls to visible state changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Software Engineer" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Engineering Leader" }));
    expect(screen.getByRole("button", { name: "Engineering Leader" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Recent" }));
    expect(screen.getByRole("tabpanel", { name: "Recent conversations" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show diff" }));
    expect(screen.getByLabelText("Suggestion diff")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("110%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View checks" }));
    expect(screen.getByRole("region", { name: "Resume validation checks" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close suggestions" }));
    await user.click(screen.getByRole("button", { name: "Show suggestions" }));
    expect(screen.getByRole("button", { name: "Close suggestions" })).toBeInTheDocument();
  });

  it("attaches evidence and resets the whole resume workspace", async () => {
    const user = userEvent.setup();
    render(<App />);

    const evidence = new File(["Architecture decision"], "adr-007.txt", {
      type: "text/plain"
    });
    await user.upload(screen.getByLabelText("Choose evidence file"), evidence);
    expect(screen.getByText("adr-007.txt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("Review the attached evidence.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByTestId("selected-bullet")).toHaveTextContent(originalBullet);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Workspace reset to the saved demo version")).toBeInTheDocument();
    expect(screen.queryByText("adr-007.txt")).not.toBeInTheDocument();
  });

  it("opens help, settings, and connection sections", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByRole("region", { name: "Help" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(await screen.findByRole("heading", { name: "Connections" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "GitHub" }));
    expect(screen.getByRole("region", { name: "GitHub connection details" })).toBeInTheDocument();
  });

  it("exposes a native downloadable resume export", () => {
    render(<App />);

    const exportLink = screen.getByRole("link", { name: "Export" });
    expect(exportLink).toHaveAttribute("download", "alex-morgan-resume.txt");
    expect(exportLink.getAttribute("href")).toContain("data:text/plain;charset=utf-8,");
  });
});
