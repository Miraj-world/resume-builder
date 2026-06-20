import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import type { FormatsPlugin } from "ajv-formats";

const schemaFiles = [
  "evidence-reference.schema.json",
  "career-fact.schema.json",
  "project-summary.schema.json",
  "resume-document.schema.json",
  "resume-suggestion.schema.json"
] as const;

export type SchemaName = (typeof schemaFiles)[number];

const require = createRequire(import.meta.url);
const addFormats = require("ajv-formats") as FormatsPlugin;
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const schemaFile of schemaFiles) {
  const schemaUrl = new URL(`../schemas/${schemaFile}`, import.meta.url);
  const schema = JSON.parse(readFileSync(schemaUrl, "utf8")) as object;
  ajv.addSchema(schema);
}

export function getValidator(schemaName: SchemaName): ValidateFunction {
  const validator = ajv.getSchema(
    `https://resume-builder.local/schemas/${schemaName}`
  );

  if (!validator) {
    throw new Error(`Schema is not registered: ${schemaName}`);
  }

  return validator;
}

export function validatePayload(
  schemaName: SchemaName,
  payload: unknown
): { valid: boolean; errors: string[] } {
  const validator = getValidator(schemaName);
  const valid = validator(payload);

  return {
    valid: Boolean(valid),
    errors: (validator.errors ?? []).map(
      (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`
    )
  };
}
