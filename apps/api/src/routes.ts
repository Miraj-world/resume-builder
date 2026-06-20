import type { FastifyInstance } from "fastify";
import { createRequireSession, getAuthMode } from "./auth.js";
import {
  ResumeExtractionError,
  extractResumeText
} from "./domain/resume-extractor.js";
import type {
  AppStore,
  FactReviewInput,
  SaveIdentityInput,
  UpdateIdentityInput
} from "./domain/store.js";

const supportedProviders = new Set(["openai", "anthropic", "google"]);

function normalizeStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function registerProductRoutes(app: FastifyInstance, store: AppStore) {
  const requireSession = createRequireSession(store);

  app.post("/v1/auth/dev-session", async (_request, reply) => {
    if (getAuthMode() !== "local_development") {
      return reply.code(503).send({
        error: "AUTH_PROVIDER_REQUIRED",
        message: "Configure the production identity provider before signing in."
      });
    }
    const session = await store.createDevelopmentSession();
    return {
      mode: "local_development",
      token: session.token,
      expiresAt: session.expiresAt,
      workspaceId: session.workspaceId,
      user: {
        id: session.userId,
        displayName: session.displayName
      }
    };
  });

  app.get(
    "/v1/auth/session",
    { preHandler: requireSession },
    async (request) => ({
      workspaceId: request.workspaceId,
      userId: request.userId,
      sessionId: request.sessionId
    })
  );

  app.get(
    "/v1/vault/bootstrap",
    { preHandler: requireSession },
    async (request) => {
      const [summary, sources, facts] = await Promise.all([
        store.summary(request.workspaceId),
        store.listSources(request.workspaceId),
        store.listFacts(request.workspaceId)
      ]);
      return { summary, sources, facts };
    }
  );

  app.post<{ Body: { name?: string; text?: string } }>(
    "/v1/sources/text",
    { preHandler: requireSession },
    async (request, reply) => {
      const text = request.body?.text?.trim();
      if (!text || text.length < 10) {
        return reply.code(400).send({
          error: "RESUME_TEXT_REQUIRED",
          message: "Paste at least 10 characters of resume text."
        });
      }
      const result = await store.ingestSource(request.workspaceId, {
        name: request.body.name?.trim() || "Pasted resume text",
        kind: "manual",
        text: text.slice(0, 500_000)
      });
      return reply.code(201).send(result);
    }
  );

  app.post(
    "/v1/sources/upload",
    { preHandler: requireSession },
    async (request, reply) => {
      const upload = await request.file();
      if (!upload) {
        return reply.code(400).send({
          error: "RESUME_FILE_REQUIRED",
          message: "Choose a resume file to upload."
        });
      }
      try {
        const buffer = await upload.toBuffer();
        const extracted = await extractResumeText({
          filename: upload.filename,
          mimetype: upload.mimetype,
          buffer
        });
        const result = await store.ingestSource(request.workspaceId, {
          name: upload.filename,
          kind: extracted.sourceKind,
          text: extracted.text
        });
        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof ResumeExtractionError) {
          return reply.code(400).send({
            error: error.safeCode,
            message: error.message
          });
        }
        throw error;
      }
    }
  );

  app.patch<{ Params: { factId: string }; Body: FactReviewInput }>(
    "/v1/facts/:factId",
    { preHandler: requireSession },
    async (request, reply) => {
      const action = request.body?.action;
      if (!action || !["accept", "reject", "correct"].includes(action)) {
        return reply.code(400).send({
          error: "INVALID_REVIEW_ACTION",
          message: "Choose accept, reject, or correct."
        });
      }
      const fact = await store.reviewFact(
        request.workspaceId,
        request.params.factId,
        request.body
      );
      if (!fact) {
        return reply.code(404).send({
          error: "FACT_NOT_FOUND",
          message: "The fact could not be updated."
        });
      }
      return { fact, summary: await store.summary(request.workspaceId) };
    }
  );

  app.get(
    "/v1/credentials",
    { preHandler: requireSession },
    async (request) => ({
      credentials: store.listCredentialMetadata(request.workspaceId),
      persistentStorageAvailable: false
    })
  );

  app.post<{
    Body: { provider?: string; apiKey?: string; storageMode?: string };
  }>(
    "/v1/credentials/session",
    { preHandler: requireSession },
    async (request, reply) => {
      const provider = request.body?.provider?.toLowerCase();
      const apiKey = request.body?.apiKey?.trim();
      if (!provider || !supportedProviders.has(provider)) {
        return reply.code(400).send({
          error: "UNSUPPORTED_PROVIDER",
          message: "Choose a supported AI provider."
        });
      }
      if (!apiKey || apiKey.length < 12) {
        return reply.code(400).send({
          error: "INVALID_API_KEY",
          message: "Enter a valid provider key."
        });
      }
      if (request.body.storageMode && request.body.storageMode !== "session_only") {
        return reply.code(409).send({
          error: "PERSISTENT_STORAGE_DISABLED",
          message: "Persistent encrypted storage is disabled in local development."
        });
      }
      const credential = store.connectSessionCredential(
        request.workspaceId,
        provider as "openai" | "anthropic" | "google",
        apiKey
      );
      return reply.code(201).send({ credential });
    }
  );

  app.delete<{ Params: { credentialId: string } }>(
    "/v1/credentials/:credentialId",
    { preHandler: requireSession },
    async (request, reply) => {
      const revoked = store.revokeCredential(
        request.workspaceId,
        request.params.credentialId
      );
      if (!revoked) {
        return reply.code(404).send({
          error: "CREDENTIAL_NOT_FOUND",
          message: "The session credential was not found."
        });
      }
      return reply.code(204).send();
    }
  );

  app.get(
    "/v1/identities",
    { preHandler: requireSession },
    async (request) => ({ identities: await store.listIdentities(request.workspaceId) })
  );

  app.post<{ Body: SaveIdentityInput }>(
    "/v1/identities",
    { preHandler: requireSession },
    async (request, reply) => {
      const name = request.body?.name?.trim();
      if (!name || name.length > 80) {
        return reply.code(400).send({
          error: "IDENTITY_NAME_REQUIRED",
          message: "Give this professional identity a concise name."
        });
      }
      const identity = await store.createIdentity(request.workspaceId, {
        name,
        ...(request.body.headline !== undefined
          ? { headline: request.body.headline.slice(0, 160) }
          : {}),
        targetRoleFamilies: normalizeStringList(request.body.targetRoleFamilies) ?? [],
        ...(request.body.narrativeSummary !== undefined
          ? { narrativeSummary: request.body.narrativeSummary.slice(0, 2_000) }
          : {}),
        emphasizedSkills: normalizeStringList(request.body.emphasizedSkills) ?? [],
        isDefault: request.body.isDefault === true
      });
      return reply.code(201).send({ identity });
    }
  );

  app.patch<{ Params: { identityId: string }; Body: UpdateIdentityInput }>(
    "/v1/identities/:identityId",
    { preHandler: requireSession },
    async (request, reply) => {
      const identity = await store.updateIdentity(
        request.workspaceId,
        request.params.identityId,
        {
          ...(request.body.name ? { name: request.body.name.slice(0, 80) } : {}),
          ...(request.body.headline !== undefined
            ? { headline: request.body.headline.slice(0, 160) }
            : {}),
          ...(request.body.targetRoleFamilies
            ? { targetRoleFamilies: normalizeStringList(request.body.targetRoleFamilies) ?? [] }
            : {}),
          ...(request.body.narrativeSummary !== undefined
            ? { narrativeSummary: request.body.narrativeSummary.slice(0, 2_000) }
            : {}),
          ...(request.body.emphasizedSkills
            ? { emphasizedSkills: normalizeStringList(request.body.emphasizedSkills) ?? [] }
            : {})
        }
      );
      if (!identity) {
        return reply.code(404).send({
          error: "IDENTITY_NOT_FOUND",
          message: "The professional identity was not found."
        });
      }
      return { identity };
    }
  );

  app.post<{ Params: { identityId: string } }>(
    "/v1/identities/:identityId/default",
    { preHandler: requireSession },
    async (request, reply) => {
      const updated = await store.setDefaultIdentity(
        request.workspaceId,
        request.params.identityId
      );
      if (!updated) {
        return reply.code(404).send({
          error: "IDENTITY_NOT_FOUND",
          message: "The professional identity was not found."
        });
      }
      return { identities: await store.listIdentities(request.workspaceId) };
    }
  );

  app.delete<{ Params: { identityId: string } }>(
    "/v1/identities/:identityId",
    { preHandler: requireSession },
    async (request, reply) => {
      const archived = await store.archiveIdentity(
        request.workspaceId,
        request.params.identityId
      );
      if (!archived) {
        return reply.code(404).send({
          error: "IDENTITY_NOT_FOUND",
          message: "The professional identity was not found."
        });
      }
      return reply.code(204).send();
    }
  );
}
