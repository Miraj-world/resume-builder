import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validatePayload } from "@resume-builder/contracts";
import { analyzeFolder } from "./analyzer.js";

const temporaryFolders: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryFolders.splice(0).map((folder) =>
      rm(folder, { recursive: true, force: true })
    )
  );
});

describe("local project analyzer", () => {
  it("emits a contract-valid summary without source code or secret paths", async () => {
    const folder = await mkdtemp(join(tmpdir(), "resume-builder-companion-"));
    temporaryFolders.push(folder);

    await mkdir(join(folder, "src"));
    await writeFile(join(folder, "src", "index.ts"), "export const answer = 42;\n");
    await writeFile(join(folder, "README.md"), "# Sample\n");
    await writeFile(join(folder, ".env.local"), "SECRET=do-not-emit\n");

    const summary = await analyzeFolder({
      rootPath: folder,
      workspaceId: "workspace-1",
      projectId: "project-1",
      projectName: "Sample Project",
      analyzedAt: new Date("2026-06-20T00:00:00.000Z")
    });

    expect(validatePayload("project-summary.schema.json", summary).valid).toBe(true);
    expect(summary.technologies.map((item) => item.name)).toContain("TypeScript");
    expect(summary.exclusions?.secretCandidateCount).toBe(1);
    expect(JSON.stringify(summary)).not.toContain("do-not-emit");
    expect(JSON.stringify(summary)).not.toContain(folder);
  });
});
