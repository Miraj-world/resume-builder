import { resolve } from "node:path";
import { analyzeFolder } from "./analyzer.js";

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const pathArgument = readArgument("path");

if (!pathArgument) {
  console.error(
    "Usage: npm run analyze -w @resume-builder/companion -- --path <folder> [--project-id <id>] [--workspace-id <id>]"
  );
  process.exitCode = 1;
} else {
  const summary = await analyzeFolder({
    rootPath: resolve(pathArgument),
    projectId: readArgument("project-id") ?? "local-preview-project",
    workspaceId: readArgument("workspace-id") ?? "local-preview-workspace"
  });

  console.log(JSON.stringify(summary, null, 2));
}
