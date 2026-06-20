import { extname } from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";
import type { EvidenceReference } from "@resume-builder/contracts";

export class ResumeExtractionError extends Error {
  constructor(
    public readonly safeCode: string,
    message: string
  ) {
    super(message);
  }
}

export interface ResumeUpload {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

export interface ResumeExtractionResult {
  text: string;
  sourceKind: EvidenceReference["sourceKind"];
}

function normalizeExtractedText(text: string): string {
  const normalized = text
    .replaceAll("\u0000", "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  if (normalized.length < 10) {
    throw new ResumeExtractionError(
      "NO_READABLE_TEXT",
      "The document did not contain enough readable text."
    );
  }

  return normalized.slice(0, 500_000);
}

export async function extractResumeText(
  upload: ResumeUpload
): Promise<ResumeExtractionResult> {
  const extension = extname(upload.filename).toLowerCase();

  try {
    if (extension === ".txt" || upload.mimetype === "text/plain") {
      return {
        text: normalizeExtractedText(upload.buffer.toString("utf8")),
        sourceKind: "manual"
      };
    }

    if (extension === ".pdf" || upload.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: new Uint8Array(upload.buffer) });
      try {
        const result = await parser.getText();
        return {
          text: normalizeExtractedText(result.text),
          sourceKind: "resume_pdf"
        };
      } finally {
        await parser.destroy();
      }
    }

    if (
      extension === ".docx" ||
      upload.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: upload.buffer });
      return {
        text: normalizeExtractedText(result.value),
        sourceKind: "resume_doc"
      };
    }

    if (extension === ".doc" || upload.mimetype === "application/msword") {
      const extractor = new WordExtractor();
      const document = await extractor.extract(upload.buffer);
      return {
        text: normalizeExtractedText(document.getBody()),
        sourceKind: "resume_doc"
      };
    }
  } catch (error) {
    if (error instanceof ResumeExtractionError) throw error;
    throw new ResumeExtractionError(
      "DOCUMENT_EXTRACTION_FAILED",
      "The document could not be read. It may be damaged or password protected."
    );
  }

  throw new ResumeExtractionError(
    "UNSUPPORTED_FILE_TYPE",
    "Supported resume formats are PDF, DOC, DOCX, and TXT."
  );
}
