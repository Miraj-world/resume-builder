import { describe, expect, it } from "vitest";
import { evaluateFactForExport } from "./policy.js";
import type { CareerFact, ProjectSummary } from "./types.js";
import { validatePayload } from "./validator.js";

const evidence = {
  schemaVersion: "1.0.0" as const,
  id: "evidence-1",
  sourceId: "source-1",
  sourceKind: "local_companion" as const,
  evidenceType: "repository_signal" as const,
  locator: {
    kind: "relative_path" as const,
    value: "package.json"
  },
  confidence: 0.97,
  observedAt: "2026-06-20T00:00:00.000Z"
};

describe("shared contracts", () => {
  it("accepts a privacy-safe local project summary", () => {
    const summary: ProjectSummary = {
      schemaVersion: "1.0.0",
      projectId: "project-1",
      workspaceId: "workspace-1",
      source: {
        kind: "local_companion",
        analysisMethod: "local_static",
        revision: "sha256:example",
        analyzedAt: "2026-06-20T00:00:00.000Z"
      },
      overview: {
        name: "Sample Project",
        description: "A locally analyzed project.",
        status: "active"
      },
      technologies: [
        {
          name: "TypeScript",
          confidence: 0.97,
          riskLevel: "low",
          evidence: [evidence]
        }
      ],
      components: [],
      features: [],
      qualitySignals: [],
      candidateInferences: [],
      warnings: [],
      privacy: {
        rawSourceUploaded: false,
        containsAbsolutePaths: false,
        containsSecretValues: false
      }
    };

    expect(validatePayload("project-summary.schema.json", summary)).toEqual({
      valid: true,
      errors: []
    });
  });

  it("rejects a local summary that claims raw source was uploaded", () => {
    const invalidSummary = {
      schemaVersion: "1.0.0",
      projectId: "project-1",
      workspaceId: "workspace-1",
      source: {
        kind: "local_companion",
        analysisMethod: "local_static",
        revision: "sha256:example",
        analyzedAt: "2026-06-20T00:00:00.000Z"
      },
      overview: {
        name: "Sample Project",
        description: "Unsafe fixture.",
        status: "active"
      },
      technologies: [],
      components: [],
      features: [],
      qualitySignals: [],
      candidateInferences: [],
      warnings: [],
      privacy: {
        rawSourceUploaded: true,
        containsAbsolutePaths: false,
        containsSecretValues: false
      }
    };

    expect(validatePayload("project-summary.schema.json", invalidSummary).valid).toBe(
      false
    );
  });

  it("blocks an unverified high-risk fact from export", () => {
    const fact: CareerFact = {
      schemaVersion: "1.0.0",
      id: "fact-1",
      workspaceId: "workspace-1",
      subject: { type: "achievement", id: "achievement-1" },
      predicate: "achieved_outcome",
      value: "Reduced processing time",
      evidenceType: "user_stated",
      riskLevel: "high",
      verificationStatus: "pending_review",
      eligibility: "eligible",
      confidence: 0.8,
      evidence: [evidence]
    };

    const result = evaluateFactForExport(fact);
    expect(result.exportable).toBe(false);
    expect(result.reasons).toContain("High-risk facts require explicit user verification.");
  });

  it("allows a verified and eligible fact with evidence", () => {
    const fact: CareerFact = {
      schemaVersion: "1.0.0",
      id: "fact-2",
      workspaceId: "workspace-1",
      subject: { type: "project", id: "project-1" },
      predicate: "used_skill",
      value: "TypeScript",
      evidenceType: "observed",
      riskLevel: "low",
      verificationStatus: "auto_accepted",
      eligibility: "eligible",
      confidence: 0.97,
      evidence: [evidence]
    };

    expect(evaluateFactForExport(fact)).toEqual({ exportable: true, reasons: [] });
  });
});
