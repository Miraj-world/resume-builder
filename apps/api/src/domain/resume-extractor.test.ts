import { describe, expect, it } from "vitest";
import { extractResumeText } from "./resume-extractor.js";

describe("resume extraction", () => {
  it("extracts and normalizes plain text without retaining the upload", async () => {
    const result = await extractResumeText({
      filename: "resume.txt",
      mimetype: "text/plain",
      buffer: Buffer.from("Senior Engineer\r\nMay 2021 - Present\r\nTypeScript")
    });

    expect(result).toEqual({
      text: "Senior Engineer\nMay 2021 - Present\nTypeScript",
      sourceKind: "manual"
    });
  });
});
