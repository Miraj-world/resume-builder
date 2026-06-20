import type { CareerFact } from "./types.js";

export interface ExportPolicyResult {
  exportable: boolean;
  reasons: string[];
}

const prohibitedVerificationStates = new Set([
  "pending_review",
  "rejected",
  "superseded",
  "in_conflict"
]);

export function evaluateFactForExport(fact: CareerFact): ExportPolicyResult {
  const reasons: string[] = [];

  if (fact.eligibility !== "eligible") {
    reasons.push(`Fact eligibility is ${fact.eligibility}.`);
  }

  if (prohibitedVerificationStates.has(fact.verificationStatus)) {
    reasons.push(`Fact verification state is ${fact.verificationStatus}.`);
  }

  if (fact.riskLevel === "high" && fact.verificationStatus !== "user_verified") {
    reasons.push("High-risk facts require explicit user verification.");
  }

  if (fact.evidence.length === 0) {
    reasons.push("Fact has no active evidence reference.");
  }

  return {
    exportable: reasons.length === 0,
    reasons
  };
}
