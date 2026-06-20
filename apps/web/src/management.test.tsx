import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CareerFact } from "@resume-builder/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const reviewFact: CareerFact = {
  schemaVersion: "1.0.0",
  id: "fact-1",
  workspaceId: "local-workspace",
  subject: { type: "achievement", id: "achievement-1" },
  predicate: "achievement.quantified_claim",
  value: "Improved authorization latency by 45%.",
  evidenceType: "observed",
  riskLevel: "high",
  verificationStatus: "pending_review",
  eligibility: "eligible",
  confidence: 0.98,
  evidence: [
    {
      schemaVersion: "1.0.0",
      id: "evidence-1",
      sourceId: "source-1",
      sourceKind: "manual",
      evidenceType: "text_span",
      locator: { kind: "section", value: "Line 1" },
      confidence: 0.98,
      observedAt: "2026-06-20T00:00:00.000Z",
      safeExcerpt: "Improved authorization latency by 45%."
    }
  ]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Career Vault management flow", () => {
  it("imports pasted text and accepts a consequential fact", async () => {
    const user = userEvent.setup();
    let facts: CareerFact[] = [];

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);

      if (path.endsWith("/v1/auth/dev-session")) {
        return jsonResponse({ token: "test-session" });
      }

      if (path.endsWith("/v1/sources/text") && init?.method === "POST") {
        facts = [reviewFact];
        return jsonResponse({ source: { id: "source-1" }, facts });
      }

      if (path.endsWith("/v1/facts/fact-1") && init?.method === "PATCH") {
        facts = [{ ...reviewFact, verificationStatus: "user_verified" }];
        return jsonResponse({ fact: facts[0] });
      }

      if (path.endsWith("/v1/vault/bootstrap")) {
        return jsonResponse({
          summary: {
            sources: facts.length > 0 ? 1 : 0,
            facts: facts.length,
            pendingReview: facts.filter((fact) => fact.verificationStatus === "pending_review").length,
            autoAccepted: 0,
            verified: facts.filter((fact) => fact.verificationStatus === "user_verified").length,
            conflicts: 0
          },
          sources: facts.length > 0 ? [{ id: "source-1" }] : [],
          facts
        });
      }

      return jsonResponse({ error: "NOT_FOUND" }, 404);
    }));

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Career Vault" }));
    await screen.findByRole("heading", { name: "Review important facts" });

    await user.type(
      screen.getByLabelText("Resume text"),
      "Improved authorization latency by 45%."
    );
    await user.click(screen.getByRole("button", { name: "Extract career information" }));

    expect(await screen.findAllByText("Improved authorization latency by 45%.")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Needs review (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByRole("tab", { name: "Needs review (0)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Auto-accepted (1)" })).toBeInTheDocument();
  });

  it("never renders the raw provider key after connecting", async () => {
    const user = userEvent.setup();
    let connected = false;

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (path.endsWith("/v1/auth/dev-session")) {
        return jsonResponse({ token: "test-session" });
      }
      if (path.endsWith("/v1/credentials/session") && init?.method === "POST") {
        connected = true;
        return jsonResponse({ credential: { id: "credential-1" } });
      }
      if (path.endsWith("/v1/credentials")) {
        return jsonResponse({
          credentials: connected
            ? [{
                id: "credential-1",
                provider: "openai",
                storageMode: "session_only",
                maskedHint: "••••alue",
                status: "active",
                createdAt: "2026-06-20T00:00:00.000Z"
              }]
            : []
        });
      }
      return jsonResponse(undefined, 204);
    }));

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Connections" }));
    await screen.findByText("No provider connected yet.");

    const keyInput = screen.getByLabelText("API key");
    await user.type(keyInput, "local-test-credential-value");
    await user.click(screen.getByRole("button", { name: "Connect provider" }));

    expect(await screen.findByText("••••alue · Session only")).toBeInTheDocument();
    expect(keyInput).toHaveValue("");
    expect(screen.queryByText("local-test-credential-value")).not.toBeInTheDocument();
  });

  it("creates a professional identity without copying Career Vault facts", async () => {
    const user = userEvent.setup();
    let identities: Array<Record<string, unknown>> = [];

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (path.endsWith("/v1/auth/dev-session")) {
        return jsonResponse({ token: "test-session" });
      }
      if (path.endsWith("/v1/vault/bootstrap")) {
        return jsonResponse({
          summary: {
            sources: 0,
            facts: 0,
            pendingReview: 0,
            autoAccepted: 0,
            verified: 0,
            conflicts: 0
          },
          sources: [],
          facts: []
        });
      }
      if (path.endsWith("/v1/identities") && init?.method === "POST") {
        identities = [{
          id: "identity-1",
          workspaceId: "local-workspace",
          name: "Engineering leader",
          headline: "Evidence-led technical leadership",
          targetRoleFamilies: ["Engineering Manager", "Staff Engineer"],
          narrativeSummary: "Connects system design with product delivery.",
          emphasizedSkills: ["System design", "Mentorship"],
          isDefault: true,
          status: "active",
          createdAt: "2026-06-20T00:00:00.000Z",
          updatedAt: "2026-06-20T00:00:00.000Z"
        }];
        return jsonResponse({ identity: identities[0] }, 201);
      }
      if (path.endsWith("/v1/identities")) {
        return jsonResponse({ identities });
      }
      return jsonResponse({ error: "NOT_FOUND" }, 404);
    }));

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Career Vault" }));
    await screen.findByRole("heading", { name: "Review important facts" });
    await user.click(screen.getByRole("button", { name: "Identities" }));

    expect(await screen.findByRole("heading", { name: "One career, multiple identities" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Identity name"), "Engineering leader");
    await user.type(screen.getByLabelText("Headline and positioning"), "Evidence-led technical leadership");
    await user.type(screen.getByLabelText("Target role families"), "Engineering Manager, Staff Engineer");
    await user.type(screen.getByLabelText("Skills to emphasize"), "System design, Mentorship");
    await user.type(screen.getByLabelText("Preferred narrative"), "Connects system design with product delivery.");
    const editor = screen.getByRole("complementary", { name: "Identity editor" });
    await user.click(within(editor).getByRole("button", { name: "Create identity" }));

    expect(await screen.findByText("Engineering leader")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Shared history stays canonical.")).toBeInTheDocument();
  });
});
