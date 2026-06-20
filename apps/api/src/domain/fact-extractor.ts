import { randomUUID } from "node:crypto";
import type {
  CareerFact,
  EvidenceReference
} from "@resume-builder/contracts";

export interface FactExtractionContext {
  workspaceId: string;
  sourceId: string;
  sourceKind: EvidenceReference["sourceKind"];
  observedAt: string;
}

const dateRangePattern =
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*\d{4}\s*(?:-|–|—|to)\s*(?:Present|Current|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*\d{4})\b/i;

const titlePattern =
  /\b(?:senior|staff|principal|lead|junior|associate|chief|head)?\s*(?:software|product|data|machine learning|security|cloud|systems?|civil|mechanical|electrical|marketing|sales|operations|finance|clinical|research|ux|ui)?\s*(?:engineer|developer|manager|director|designer|analyst|consultant|specialist|architect|scientist|researcher|coordinator|administrator|nurse|physician|teacher|professor|accountant|attorney)\b/i;

const quantifiedPattern =
  /(?:\b\d+(?:\.\d+)?\s*%|\$\s*\d|\b\d+(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s*(?:users?|customers?|clients?|patients?|projects?|teams?|hours?|days?|weeks?|months?|requests?|transactions?)\b)/i;

const architecturePattern =
  /\b(?:architecture|microservices?|distributed systems?|event[- ]driven|multi[- ]tenant|data isolation|system design)\b/i;

const skillPatterns: ReadonlyArray<[string, RegExp]> = [
  ["TypeScript", /\bTypeScript\b/i],
  ["JavaScript", /\bJavaScript\b/i],
  ["Python", /\bPython\b/i],
  ["Java", /\bJava\b/i],
  ["C#", /\bC#\b/i],
  ["Go", /\bGolang\b|\bGo\b/i],
  ["Rust", /\bRust\b/i],
  ["React", /\bReact\b/i],
  ["Node.js", /\bNode(?:\.js|JS)\b/i],
  ["PostgreSQL", /\bPostgreSQL\b|\bPostgres\b/i],
  ["SQL", /\bSQL\b/i],
  ["AWS", /\bAWS\b|Amazon Web Services/i],
  ["Azure", /\bAzure\b/i],
  ["Google Cloud", /\bGCP\b|Google Cloud/i],
  ["Docker", /\bDocker\b/i],
  ["Kubernetes", /\bKubernetes\b|\bK8s\b/i]
];

function createEvidence(
  context: FactExtractionContext,
  lineNumber: number,
  excerpt: string,
  confidence: number
): EvidenceReference {
  return {
    schemaVersion: "1.0.0",
    id: randomUUID(),
    sourceId: context.sourceId,
    sourceKind: context.sourceKind,
    evidenceType: "text_span",
    locator: {
      kind: "section",
      value: `Line ${lineNumber}`
    },
    confidence,
    observedAt: context.observedAt,
    safeExcerpt: excerpt.slice(0, 500)
  };
}

function createFact(
  context: FactExtractionContext,
  options: {
    subjectType: CareerFact["subject"]["type"];
    predicate: string;
    value: string;
    lineNumber: number;
    evidenceType: CareerFact["evidenceType"];
    riskLevel: CareerFact["riskLevel"];
    verificationStatus: CareerFact["verificationStatus"];
    confidence: number;
  }
): CareerFact {
  return {
    schemaVersion: "1.0.0",
    id: randomUUID(),
    workspaceId: context.workspaceId,
    subject: {
      type: options.subjectType,
      id: `${options.subjectType}:${context.sourceId}`
    },
    predicate: options.predicate,
    value: options.value,
    evidenceType: options.evidenceType,
    riskLevel: options.riskLevel,
    verificationStatus: options.verificationStatus,
    eligibility: "eligible",
    confidence: options.confidence,
    evidence: [
      createEvidence(
        context,
        options.lineNumber,
        options.value,
        options.confidence
      )
    ]
  };
}

export function extractCandidateFacts(
  text: string,
  context: FactExtractionContext
): CareerFact[] {
  const facts: CareerFact[] = [];
  const seen = new Set<string>();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const addFact = (fact: CareerFact) => {
    const key = `${fact.predicate}:${String(fact.value).toLowerCase()}`;
    if (seen.has(key) || facts.length >= 80) return;
    seen.add(key);
    facts.push(fact);
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.length <= 120 && titlePattern.test(line)) {
      addFact(
        createFact(context, {
          subjectType: "experience",
          predicate: "experience.title",
          value: line,
          lineNumber,
          evidenceType: "observed",
          riskLevel: "high",
          verificationStatus: "pending_review",
          confidence: 0.9
        })
      );
    }

    if (dateRangePattern.test(line)) {
      addFact(
        createFact(context, {
          subjectType: "experience",
          predicate: "experience.date_range",
          value: line,
          lineNumber,
          evidenceType: "observed",
          riskLevel: "high",
          verificationStatus: "pending_review",
          confidence: 0.91
        })
      );
    }

    if (quantifiedPattern.test(line)) {
      addFact(
        createFact(context, {
          subjectType: "achievement",
          predicate: "achievement.quantified_claim",
          value: line,
          lineNumber,
          evidenceType: "observed",
          riskLevel: "high",
          verificationStatus: "pending_review",
          confidence: 0.84
        })
      );
    }

    if (architecturePattern.test(line)) {
      addFact(
        createFact(context, {
          subjectType: "project",
          predicate: "project.architecture_claim",
          value: line,
          lineNumber,
          evidenceType: "inferred",
          riskLevel: "medium",
          verificationStatus: "pending_review",
          confidence: 0.72
        })
      );
    }
  });

  for (const [skill, pattern] of skillPatterns) {
    const matchingIndex = lines.findIndex((line) => pattern.test(line));
    if (matchingIndex < 0) continue;

    addFact(
      createFact(context, {
        subjectType: "skill",
        predicate: "skill.observed",
        value: skill,
        lineNumber: matchingIndex + 1,
        evidenceType: "observed",
        riskLevel: "low",
        verificationStatus: "auto_accepted",
        confidence: 0.88
      })
    );
  }

  return facts;
}
