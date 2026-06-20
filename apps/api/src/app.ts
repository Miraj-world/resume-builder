import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { AppStore } from "./domain/store.js";
import { registerProductRoutes } from "./routes.js";

export interface BuildAppOptions {
  logger?: boolean;
  databaseUrl?: string;
  dataDirectory?: string;
  memoryDatabase?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });
  const store = new AppStore({
    ...(options.databaseUrl ? { connectionString: options.databaseUrl } : {}),
    ...(options.dataDirectory ? { dataDirectory: options.dataDirectory } : {}),
    memory: options.memoryDatabase ?? process.env.NODE_ENV === "test"
  });

  app.decorateRequest("workspaceId", "");
  app.decorateRequest("userId", "");
  app.decorateRequest("sessionId", "");
  app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 10 * 1024 * 1024
    }
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "resume-builder-api",
    storage: store.storageKind,
    timestamp: new Date().toISOString()
  }));

  app.get("/v1/system/contracts", async () => ({
    version: "1.0.0",
    contracts: [
      "evidence-reference",
      "career-fact",
      "project-summary",
      "resume-document",
      "resume-suggestion"
    ]
  }));

  registerProductRoutes(app, store);

  app.addHook("onReady", async () => {
    await store.initialize();
  });
  app.addHook("onClose", async () => {
    await store.close();
  });

  return app;
}
