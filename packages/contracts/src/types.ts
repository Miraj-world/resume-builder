export type EvidenceType = "observed" | "user_stated" | "inferred";

export type RiskLevel = "low" | "medium" | "high";

export type VerificationStatus =
  | "auto_accepted"
  | "pending_review"
  | "user_verified"
  | "rejected"
  | "superseded"
  | "in_conflict";

export type ResumeEligibility =
  | "eligible"
  | "guidance_only"
  | "sensitive"
  | "excluded";

export interface EvidenceReference {
  schemaVersion: "1.0.0";
  id: string;
  sourceId: string;
  sourceKind:
    | "resume_pdf"
    | "resume_doc"
    | "linkedin_export"
    | "note"
    | "repository_upload"
    | "github_repository"
    | "local_companion"
    | "manual";
  evidenceType:
    | "text_span"
    | "document_field"
    | "repository_signal"
    | "user_confirmation"
    | "manual_entry";
  locator: {
    kind: "page" | "section" | "field" | "relative_path" | "detector" | "manual";
    value: string;
  };
  confidence: number;
  observedAt: string;
  safeExcerpt?: string;
}

export interface CareerFact {
  schemaVersion: "1.0.0";
  id: string;
  workspaceId: string;
  subject: {
    type:
      | "person"
      | "experience"
      | "project"
      | "education"
      | "credential"
      | "achievement"
      | "skill"
      | "organization";
    id: string;
  };
  predicate: string;
  value: unknown;
  evidenceType: EvidenceType;
  riskLevel: RiskLevel;
  verificationStatus: VerificationStatus;
  eligibility: ResumeEligibility;
  confidence: number;
  evidence: EvidenceReference[];
}

export interface ProjectSignal {
  name: string;
  confidence: number;
  riskLevel: "low" | "medium";
  evidence: EvidenceReference[];
}

export interface ProjectSummary {
  schemaVersion: "1.0.0";
  projectId: string;
  workspaceId: string;
  source: {
    kind: "local_companion" | "github_repository" | "repository_upload";
    analysisMethod: "local_static" | "cloud_static";
    revision: string;
    analyzedAt: string;
  };
  overview: {
    name: string;
    description: string;
    status: "active" | "archived" | "unknown";
  };
  technologies: ProjectSignal[];
  components: Array<{ name: string; description: string; confidence: number }>;
  features: Array<{ name: string; description: string; confidence: number }>;
  qualitySignals: ProjectSignal[];
  candidateInferences: Array<{
    claim: string;
    riskLevel: "medium" | "high";
    verificationStatus: "pending_review";
    confidence: number;
  }>;
  warnings: string[];
  exclusions?: {
    ignoredFileCount?: number;
    secretCandidateCount?: number;
    binaryFileCount?: number;
  };
  privacy: {
    rawSourceUploaded: false;
    containsAbsolutePaths: false;
    containsSecretValues: false;
  };
}

export type SuggestionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "modified"
  | "stale";
