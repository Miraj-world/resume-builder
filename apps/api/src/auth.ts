import type { FastifyReply, FastifyRequest } from "fastify";
import type { AppStore } from "./domain/store.js";

declare module "fastify" {
  interface FastifyRequest {
    workspaceId: string;
    userId: string;
    sessionId: string;
  }
}

export type AuthMode = "local_development" | "external_oidc" | "disabled";

export function getAuthMode(): AuthMode {
  const configured = process.env.AUTH_MODE;
  if (configured === "local_development" || configured === "external_oidc") {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? "disabled" : "local_development";
}

function readBearerToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
}

export function createRequireSession(store: AppStore) {
  return async function requireSession(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const token = readBearerToken(request);
    if (!token) {
      await reply.code(401).send({
        error: "AUTH_REQUIRED",
        message: "A signed-in session is required."
      });
      return;
    }

    const session = await store.authenticateSession(token);
    if (!session) {
      await reply.code(401).send({
        error: "SESSION_INVALID",
        message: "The session expired or is no longer valid."
      });
      return;
    }

    request.workspaceId = session.workspaceId;
    request.userId = session.userId;
    request.sessionId = session.sessionId;
  };
}
