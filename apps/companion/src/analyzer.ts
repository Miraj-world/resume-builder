import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import type {
  EvidenceReference,
  ProjectSignal,
  ProjectSummary
} from "@resume-builder/contracts";

const ignoredDirectoryNames = new Set([
  ".git",
  ".next",
  ".turbo",
  ".cache",
  ".idea",
  ".vscode",
  "bin",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "obj",
  "out",
  "release",
  "target",
  "vendor"
]);

const binaryExtensions = new Set([
  ".7z",
  ".avi",
  ".bmp",
  ".class",
  ".dll",
  ".doc",
  ".docx",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".jar",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".pdf",
  ".png",
  ".pyc",
  ".so",
  ".tar",
  ".webp",
  ".zip"
]);

const technologyByExtension: Readonly<Record<string, string>> = {
  ".cs": "C#",
  ".css": "CSS",
  ".dart": "Dart",
  ".go": "Go",
  ".html": "HTML",
  ".java": "Java",
  ".js": "JavaScript",
  ".jsx": "React JSX",
  ".kt": "Kotlin",
  ".php": "PHP",
  ".py": "Python",
  ".rb": "Ruby",
  ".rs": "Rust",
  ".sql": "SQL",
  ".swift": "Swift",
  ".ts": "TypeScript",
  ".tsx": "React TypeScript",
  ".vue": "Vue"
};

const secretFilePatterns = [
  /^\.env(?:\..+)?$/i,
  /^(?:id_rsa|id_ed25519)$/i,
  /^(?:credentials|secrets?)\.json$/i,
  /\.(?:key|pem|p12|pfx|jks|keystore)$/i
];

interface InventoryFile {
  relativePath: string;
  extension: string;
  size: number;
  modifiedMs: number;
}

interface Inventory {
  files: InventoryFile[];
  ignoredFileCount: number;
  secretCandidateCount: number;
  binaryFileCount: number;
}

export interface AnalyzeFolderOptions {
  rootPath: string;
  workspaceId: string;
  projectId: string;
  projectName?: string;
  analyzedAt?: Date;
}

function isSecretCandidate(fileName: string): boolean {
  return secretFilePatterns.some((pattern) => pattern.test(fileName));
}

async function inventoryFolder(rootPath: string): Promise<Inventory> {
  const inventory: Inventory = {
    files: [],
    ignoredFileCount: 0,
    secretCandidateCount: 0,
    binaryFileCount: 0
  };

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (ignoredDirectoryNames.has(entry.name)) {
            inventory.ignoredFileCount += 1;
            return;
          }

          await walk(absolutePath);
          return;
        }

        if (!entry.isFile()) {
          inventory.ignoredFileCount += 1;
          return;
        }

        if (isSecretCandidate(entry.name)) {
          inventory.secretCandidateCount += 1;
          return;
        }

        const extension = extname(entry.name).toLowerCase();
        if (binaryExtensions.has(extension)) {
          inventory.binaryFileCount += 1;
          return;
        }

        const fileStat = await stat(absolutePath);
        inventory.files.push({
          relativePath: relative(rootPath, absolutePath).replaceAll("\\", "/"),
          extension,
          size: fileStat.size,
          modifiedMs: fileStat.mtimeMs
        });
      })
    );
  }

  await walk(rootPath);
  return inventory;
}

function createRevision(files: InventoryFile[]): string {
  const hash = createHash("sha256");
  const orderedFiles = [...files].sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath)
  );

  for (const file of orderedFiles) {
    hash.update(`${file.relativePath}:${file.size}:${file.modifiedMs}\n`);
  }

  return `sha256:${hash.digest("hex")}`;
}

function createEvidence(
  sourceId: string,
  relativePath: string,
  confidence: number,
  observedAt: string
): EvidenceReference {
  return {
    schemaVersion: "1.0.0",
    id: `${sourceId}:${relativePath}`,
    sourceId,
    sourceKind: "local_companion",
    evidenceType: "repository_signal",
    locator: {
      kind: "relative_path",
      value: relativePath
    },
    confidence,
    observedAt
  };
}

function buildTechnologySignals(
  files: InventoryFile[],
  sourceId: string,
  observedAt: string
): ProjectSignal[] {
  const grouped = new Map<string, InventoryFile[]>();

  for (const file of files) {
    const technology = technologyByExtension[file.extension];
    if (!technology) continue;

    const current = grouped.get(technology) ?? [];
    current.push(file);
    grouped.set(technology, current);
  }

  return [...grouped.entries()]
    .map(([name, matchingFiles]) => {
      const confidence = Number(
        Math.min(0.99, 0.72 + matchingFiles.length * 0.03).toFixed(2)
      );
      const evidenceFiles = matchingFiles.slice(0, 3);

      return {
        name,
        confidence,
        riskLevel: "low" as const,
        evidence: evidenceFiles.map((file) =>
          createEvidence(sourceId, file.relativePath, confidence, observedAt)
        )
      };
    })
    .sort((left, right) => right.confidence - left.confidence);
}

function buildQualitySignals(
  files: InventoryFile[],
  sourceId: string,
  observedAt: string
): ProjectSignal[] {
  const testFile = files.find((file) =>
    /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)|\.(?:test|spec)\./i.test(
      file.relativePath
    )
  );
  const readmeFile = files.find((file) => /(?:^|\/)readme(?:\.[^/]*)?$/i.test(file.relativePath));
  const signals: ProjectSignal[] = [];

  if (testFile) {
    signals.push({
      name: "Automated tests detected",
      confidence: 0.9,
      riskLevel: "low",
      evidence: [createEvidence(sourceId, testFile.relativePath, 0.9, observedAt)]
    });
  }

  if (readmeFile) {
    signals.push({
      name: "Project documentation detected",
      confidence: 0.9,
      riskLevel: "low",
      evidence: [createEvidence(sourceId, readmeFile.relativePath, 0.9, observedAt)]
    });
  }

  return signals;
}

export async function analyzeFolder(
  options: AnalyzeFolderOptions
): Promise<ProjectSummary> {
  const analyzedAt = (options.analyzedAt ?? new Date()).toISOString();
  const inventory = await inventoryFolder(options.rootPath);
  const sourceId = `local-project:${options.projectId}`;
  const projectName = options.projectName ?? basename(options.rootPath);

  return {
    schemaVersion: "1.0.0",
    projectId: options.projectId,
    workspaceId: options.workspaceId,
    source: {
      kind: "local_companion",
      analysisMethod: "local_static",
      revision: createRevision(inventory.files),
      analyzedAt
    },
    overview: {
      name: projectName,
      description: `Local static analysis of ${inventory.files.length} eligible files.`,
      status: "active"
    },
    technologies: buildTechnologySignals(inventory.files, sourceId, analyzedAt),
    components: [],
    features: [],
    qualitySignals: buildQualitySignals(inventory.files, sourceId, analyzedAt),
    candidateInferences: [],
    warnings: [
      "Repository signals do not prove the user's personal ownership, proficiency, or business impact."
    ],
    exclusions: {
      ignoredFileCount: inventory.ignoredFileCount,
      secretCandidateCount: inventory.secretCandidateCount,
      binaryFileCount: inventory.binaryFileCount
    },
    privacy: {
      rawSourceUploaded: false,
      containsAbsolutePaths: false,
      containsSecretValues: false
    }
  };
}
