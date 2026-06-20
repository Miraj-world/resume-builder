import type { CareerFact } from "@resume-builder/contracts";

const sessionStorageKey = "resume-builder.session-token";
let sessionToken: string | undefined;
let sessionRequest: Promise<string> | undefined;

export interface VaultSummary {
  sources: number;
  facts: number;
  pendingReview: number;
  autoAccepted: number;
  verified: number;
  conflicts: number;
}

export interface SourceRecord {
  id: string;
  name: string;
  kind: string;
  characterCount: number;
  createdAt: string;
  referenceOnly: true;
}

export interface VaultBootstrap {
  summary: VaultSummary;
  sources: SourceRecord[];
  facts: CareerFact[];
}

export interface CredentialMetadata {
  id: string;
  provider: "openai" | "anthropic" | "google";
  storageMode: "session_only";
  maskedHint: string;
  status: "active";
  createdAt: string;
}

export interface ProfessionalIdentity {
  id: string;
  workspaceId: string;
  name: string;
  headline: string;
  targetRoleFamilies: string[];
  narrativeSummary: string;
  emphasizedSkills: string[];
  isDefault: boolean;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

function readStoredSession(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.sessionStorage.getItem(sessionStorageKey) ?? undefined;
}

function storeSession(token: string | undefined) {
  sessionToken = token;
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(sessionStorageKey, token);
  else window.sessionStorage.removeItem(sessionStorageKey);
}

async function createSession(): Promise<string> {
  const response = await fetch("/api/v1/auth/dev-session", { method: "POST" });
  if (!response.ok) {
    throw new ApiError(
      "AUTH_UNAVAILABLE",
      "A local session could not be created.",
      response.status
    );
  }
  const body = (await response.json()) as { token: string };
  storeSession(body.token);
  return body.token;
}

async function getSessionToken(): Promise<string> {
  const existing = sessionToken ?? readStoredSession();
  if (existing) {
    sessionToken = existing;
    return existing;
  }
  sessionRequest ??= createSession().finally(() => {
    sessionRequest = undefined;
  });
  return sessionRequest;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retrySession = true
): Promise<T> {
  const token = await getSessionToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);

  if (init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    headers
  });

  if (response.status === 401 && retrySession) {
    storeSession(undefined);
    return apiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    throw new ApiError(
      error?.error ?? "REQUEST_FAILED",
      error?.message ?? "The request could not be completed.",
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
