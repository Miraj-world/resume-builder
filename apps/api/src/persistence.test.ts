import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe("durable Career Vault storage", () => {
  it("preserves sessions, sources, facts, and identities across API restarts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "resume-builder-pg-"));
    directories.push(directory);

    const firstApp = buildApp({ dataDirectory: directory, memoryDatabase: false });
    const sessionResponse = await firstApp.inject({
      method: "POST",
      url: "/v1/auth/dev-session"
    });
    const token = sessionResponse.json().token as string;
    const headers = { authorization: `Bearer ${token}` };

    await firstApp.inject({
      method: "POST",
      url: "/v1/sources/text",
      headers,
      payload: { text: "Senior Product Engineer\nMay 2021 - Present" }
    });
    await firstApp.inject({
      method: "POST",
      url: "/v1/identities",
      headers,
      payload: { name: "Product engineering", targetRoleFamilies: ["Product Engineer"] }
    });
    await firstApp.close();

    const secondApp = buildApp({ dataDirectory: directory, memoryDatabase: false });
    const [session, vault, identities] = await Promise.all([
      secondApp.inject({ method: "GET", url: "/v1/auth/session", headers }),
      secondApp.inject({ method: "GET", url: "/v1/vault/bootstrap", headers }),
      secondApp.inject({ method: "GET", url: "/v1/identities", headers })
    ]);

    expect(session.statusCode).toBe(200);
    expect(vault.json().summary.sources).toBe(1);
    expect(vault.json().facts.length).toBeGreaterThan(0);
    expect(identities.json().identities).toHaveLength(1);
    await secondApp.close();
  });
});
