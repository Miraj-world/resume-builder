import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.map((app) => app.close()));
  apps.length = 0;
});

async function authenticatedApp() {
  const app = buildApp({ memoryDatabase: true });
  apps.push(app);
  const response = await app.inject({ method: "POST", url: "/v1/auth/dev-session" });
  const token = response.json().token as string;
  return { app, headers: { authorization: `Bearer ${token}` } };
}

describe("API foundation", () => {
  it("reports service health and storage mode", async () => {
    const app = buildApp({ memoryDatabase: true });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "resume-builder-api",
      storage: "pglite"
    });
  });

  it("publishes the active contract set", async () => {
    const app = buildApp({ memoryDatabase: true });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/v1/system/contracts" });
    expect(response.statusCode).toBe(200);
    expect(response.json().contracts).toContain("project-summary");
  });

  it("rejects client-selected workspace headers", async () => {
    const app = buildApp({ memoryDatabase: true });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/vault/bootstrap",
      headers: { "x-workspace-id": "workspace-from-client" }
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "AUTH_REQUIRED" });
  });

  it("creates and authenticates a database-backed local session", async () => {
    const { app, headers } = await authenticatedApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/auth/session",
      headers
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      workspaceId: "local-workspace",
      userId: "local-user"
    });
  });

  it("extracts reviewable and auto-accepted facts from resume text", async () => {
    const { app, headers } = await authenticatedApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/sources/text",
      headers,
      payload: {
        name: "Resume text",
        text: [
          "Senior Product Engineer",
          "May 2021 - Present",
          "Improved authorization latency by 45%.",
          "Designed event-driven architecture with TypeScript and PostgreSQL."
        ].join("\n")
      }
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.counts.pendingReview).toBeGreaterThanOrEqual(3);
    expect(body.counts.autoAccepted).toBeGreaterThanOrEqual(2);
    expect(body.source.referenceOnly).toBe(true);
  });

  it("accepts a high-risk fact through an explicit review action", async () => {
    const { app, headers } = await authenticatedApp();
    const ingestion = await app.inject({
      method: "POST",
      url: "/v1/sources/text",
      headers,
      payload: { text: "Senior Software Engineer\nMay 2022 - Present" }
    });
    const pendingFact = ingestion
      .json()
      .facts.find(
        (fact: { verificationStatus: string }) =>
          fact.verificationStatus === "pending_review"
      );
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/facts/${pendingFact.id}`,
      headers,
      payload: { action: "accept" }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().fact.verificationStatus).toBe("user_verified");
  });

  it("keeps session credentials secret and returns metadata only", async () => {
    const { app, headers } = await authenticatedApp();
    const secret = "not-a-real-test-provider-key";
    const response = await app.inject({
      method: "POST",
      url: "/v1/credentials/session",
      headers,
      payload: { provider: "openai", apiKey: secret, storageMode: "session_only" }
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).not.toContain(secret);
    expect(response.json().credential).toMatchObject({
      provider: "openai",
      storageMode: "session_only",
      status: "active"
    });
  });

  it("maintains multiple identities over one shared Career Vault", async () => {
    const { app, headers } = await authenticatedApp();
    await app.inject({
      method: "POST",
      url: "/v1/sources/text",
      headers,
      payload: { text: "Senior Product Engineer\nMay 2021 - Present" }
    });

    const engineering = await app.inject({
      method: "POST",
      url: "/v1/identities",
      headers,
      payload: {
        name: "Engineering leader",
        targetRoleFamilies: ["Engineering Manager", "Staff Engineer"],
        emphasizedSkills: ["System design", "Mentorship"]
      }
    });
    const product = await app.inject({
      method: "POST",
      url: "/v1/identities",
      headers,
      payload: {
        name: "Product builder",
        targetRoleFamilies: ["Product Manager"],
        emphasizedSkills: ["Product strategy"]
      }
    });

    expect(engineering.statusCode).toBe(201);
    expect(engineering.json().identity.isDefault).toBe(true);
    expect(product.statusCode).toBe(201);

    const productId = product.json().identity.id as string;
    const setDefault = await app.inject({
      method: "POST",
      url: `/v1/identities/${productId}/default`,
      headers
    });
    expect(setDefault.statusCode).toBe(200);
    expect(
      setDefault.json().identities.find((item: { id: string }) => item.id === productId)
        .isDefault
    ).toBe(true);

    const [identities, vault] = await Promise.all([
      app.inject({ method: "GET", url: "/v1/identities", headers }),
      app.inject({ method: "GET", url: "/v1/vault/bootstrap", headers })
    ]);
    expect(identities.json().identities).toHaveLength(2);
    expect(vault.json().summary.sources).toBe(1);
    expect(vault.json().facts.length).toBeGreaterThan(0);
  });
});
