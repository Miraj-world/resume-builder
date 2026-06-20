import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { CareerFact, EvidenceReference } from "@resume-builder/contracts";
import {
  createDatabase,
  type CreateDatabaseOptions,
  type DatabaseClient,
  type SqlExecutor,
  type SqlRow
} from "../database.js";
import { runMigrations } from "../migrations.js";
import { extractCandidateFacts } from "./fact-extractor.js";

export interface SourceRecord {
  id: string;
  workspaceId: string;
  name: string;
  kind: EvidenceReference["sourceKind"];
  characterCount: number;
  createdAt: string;
  referenceOnly: true;
}

export interface CredentialMetadata {
  id: string;
  provider: "openai" | "anthropic" | "google";
  storageMode: "session_only";
  maskedHint: string;
  status: "active";
  createdAt: string;
}

interface SessionCredential extends CredentialMetadata {
  secret: string;
}

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  workspaceId: string;
  displayName: string;
  expiresAt: string;
}

export interface DevelopmentSession extends AuthenticatedSession {
  token: string;
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

export interface SaveIdentityInput {
  name: string;
  headline?: string;
  targetRoleFamilies?: string[];
  narrativeSummary?: string;
  emphasizedSkills?: string[];
  isDefault?: boolean;
}

export interface UpdateIdentityInput {
  name?: string;
  headline?: string;
  targetRoleFamilies?: string[];
  narrativeSummary?: string;
  emphasizedSkills?: string[];
}

export interface IngestSourceInput {
  name: string;
  kind: EvidenceReference["sourceKind"];
  text: string;
}

export interface FactReviewInput {
  action: "accept" | "reject" | "correct";
  value?: string;
  eligibility?: CareerFact["eligibility"];
}

interface SourceRow extends SqlRow {
  id: string;
  workspace_id: string;
  name: string;
  kind: EvidenceReference["sourceKind"];
  character_count: number;
  created_at: string | Date;
  reference_only: boolean;
}

interface FactRow extends SqlRow {
  id: string;
  workspace_id: string;
  subject_type: CareerFact["subject"]["type"];
  subject_id: string;
  predicate: string;
  value_json: unknown;
  evidence_type: CareerFact["evidenceType"];
  risk_level: CareerFact["riskLevel"];
  verification_status: CareerFact["verificationStatus"];
  eligibility: CareerFact["eligibility"];
  confidence: number;
}

interface EvidenceRow extends SqlRow {
  id: string;
  fact_id: string;
  source_id: string;
  source_kind: EvidenceReference["sourceKind"];
  evidence_type: EvidenceReference["evidenceType"];
  locator_kind: EvidenceReference["locator"]["kind"];
  locator_value: string;
  confidence: number;
  observed_at: string | Date;
  safe_excerpt: string | null;
}

interface IdentityRow extends SqlRow {
  id: string;
  workspace_id: string;
  name: string;
  headline: string;
  target_role_families: unknown;
  narrative_summary: string;
  emphasized_skills: unknown;
  is_default: boolean;
  status: "active" | "archived";
  created_at: string | Date;
  updated_at: string | Date;
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function normalizeList(values: string[] | undefined): string[] {
  if (!values) return [];
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(
    0,
    30
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AppStore {
  readonly storageKind: DatabaseClient["kind"];
  private readonly database: DatabaseClient;
  private readonly sessionCredentials = new Map<string, SessionCredential[]>();
  private initialization?: Promise<void>;

  constructor(options: CreateDatabaseOptions = {}, database?: DatabaseClient) {
    this.database = database ?? createDatabase(options);
    this.storageKind = this.database.kind;
  }

  initialize(): Promise<void> {
    this.initialization ??= runMigrations(this.database);
    return this.initialization;
  }

  async close() {
    await this.database.close();
  }

  async createDevelopmentSession(): Promise<DevelopmentSession> {
    await this.initialize();
    const userId = "local-user";
    const workspaceId = "local-workspace";
    const displayName = "Alex Morgan";
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const sessionId = randomUUID();

    await this.database.transaction(async (transaction) => {
      await transaction.query(
        `insert into users (id, email, display_name)
         values ($1, $2, $3)
         on conflict (id) do update set display_name = excluded.display_name`,
        [userId, "local@resume-builder.invalid", displayName]
      );
      await transaction.query(
        `insert into workspaces (id, name)
         values ($1, $2)
         on conflict (id) do nothing`,
        [workspaceId, "Local Career Vault"]
      );
      await transaction.query(
        `insert into workspace_memberships (workspace_id, user_id, role)
         values ($1, $2, 'owner')
         on conflict (workspace_id, user_id) do nothing`,
        [workspaceId, userId]
      );
      await transaction.query(
        `delete from sessions
         where expires_at <= now() or revoked_at is not null`,
        []
      );
      await transaction.query(
        `insert into sessions
          (id, token_hash, user_id, workspace_id, expires_at)
         values ($1, $2, $3, $4, $5)`,
        [sessionId, hashToken(token), userId, workspaceId, expiresAt]
      );
    });

    return {
      sessionId,
      token,
      userId,
      workspaceId,
      displayName,
      expiresAt: expiresAt.toISOString()
    };
  }

  async authenticateSession(token: string): Promise<AuthenticatedSession | undefined> {
    await this.initialize();
    const result = await this.database.query<{
      session_id: string;
      user_id: string;
      workspace_id: string;
      display_name: string;
      expires_at: string | Date;
    }>(
      `select
         sessions.id as session_id,
         sessions.user_id,
         sessions.workspace_id,
         users.display_name,
         sessions.expires_at
       from sessions
       join users on users.id = sessions.user_id
       join workspace_memberships membership
         on membership.workspace_id = sessions.workspace_id
        and membership.user_id = sessions.user_id
       where sessions.token_hash = $1
         and sessions.revoked_at is null
         and sessions.expires_at > now()
         and users.status = 'active'
       limit 1`,
      [hashToken(token)]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      displayName: row.display_name,
      expiresAt: toIsoString(row.expires_at)
    };
  }

  async ingestSource(workspaceId: string, input: IngestSourceInput) {
    await this.initialize();
    const createdAt = new Date().toISOString();
    const source: SourceRecord = {
      id: randomUUID(),
      workspaceId,
      name: input.name,
      kind: input.kind,
      characterCount: input.text.length,
      createdAt,
      referenceOnly: true
    };
    const facts = extractCandidateFacts(input.text, {
      workspaceId,
      sourceId: source.id,
      sourceKind: source.kind,
      observedAt: createdAt
    });

    await this.database.transaction(async (transaction) => {
      await transaction.query(
        `insert into sources
          (id, workspace_id, name, kind, character_count, reference_only, created_at)
         values ($1, $2, $3, $4, $5, true, $6)`,
        [
          source.id,
          workspaceId,
          source.name,
          source.kind,
          source.characterCount,
          createdAt
        ]
      );

      for (const fact of facts) {
        await this.insertFact(transaction, fact, source.id, createdAt);
      }
    });

    return { source, facts, counts: await this.summary(workspaceId) };
  }

  private async insertFact(
    transaction: SqlExecutor,
    fact: CareerFact,
    sourceId: string,
    createdAt: string
  ) {
    await transaction.query(
      `insert into career_facts (
        id, workspace_id, source_id, subject_type, subject_id, predicate,
        value_json, evidence_type, risk_level, verification_status,
        eligibility, confidence, created_at, updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $13
      )`,
      [
        fact.id,
        fact.workspaceId,
        sourceId,
        fact.subject.type,
        fact.subject.id,
        fact.predicate,
        JSON.stringify(fact.value),
        fact.evidenceType,
        fact.riskLevel,
        fact.verificationStatus,
        fact.eligibility,
        fact.confidence,
        createdAt
      ]
    );

    for (const evidence of fact.evidence) {
      await transaction.query(
        `insert into evidence_references (
          id, workspace_id, fact_id, source_id, source_kind, evidence_type,
          locator_kind, locator_value, confidence, observed_at, safe_excerpt
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          evidence.id,
          fact.workspaceId,
          fact.id,
          evidence.sourceId,
          evidence.sourceKind,
          evidence.evidenceType,
          evidence.locator.kind,
          evidence.locator.value,
          evidence.confidence,
          evidence.observedAt,
          evidence.safeExcerpt ?? null
        ]
      );
    }
  }

  async listSources(workspaceId: string): Promise<SourceRecord[]> {
    await this.initialize();
    const result = await this.database.query<SourceRow>(
      `select id, workspace_id, name, kind, character_count, created_at, reference_only
       from sources where workspace_id = $1 order by created_at desc, id`,
      [workspaceId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      kind: row.kind,
      characterCount: Number(row.character_count),
      createdAt: toIsoString(row.created_at),
      referenceOnly: true
    }));
  }

  async listFacts(workspaceId: string): Promise<CareerFact[]> {
    await this.initialize();
    const [facts, evidence] = await Promise.all([
      this.database.query<FactRow>(
        `select id, workspace_id, subject_type, subject_id, predicate, value_json,
                evidence_type, risk_level, verification_status, eligibility, confidence
         from career_facts where workspace_id = $1 order by created_at desc, id`,
        [workspaceId]
      ),
      this.database.query<EvidenceRow>(
        `select id, fact_id, source_id, source_kind, evidence_type, locator_kind,
                locator_value, confidence, observed_at, safe_excerpt
         from evidence_references where workspace_id = $1 order by fact_id, id`,
        [workspaceId]
      )
    ]);
    const evidenceByFact = new Map<string, EvidenceReference[]>();
    for (const row of evidence.rows) {
      const references = evidenceByFact.get(row.fact_id) ?? [];
      references.push(this.mapEvidence(row));
      evidenceByFact.set(row.fact_id, references);
    }
    return facts.rows.map((row) => this.mapFact(row, evidenceByFact.get(row.id) ?? []));
  }

  private mapEvidence(row: EvidenceRow): EvidenceReference {
    return {
      schemaVersion: "1.0.0",
      id: row.id,
      sourceId: row.source_id,
      sourceKind: row.source_kind,
      evidenceType: row.evidence_type,
      locator: { kind: row.locator_kind, value: row.locator_value },
      confidence: Number(row.confidence),
      observedAt: toIsoString(row.observed_at),
      ...(row.safe_excerpt ? { safeExcerpt: row.safe_excerpt } : {})
    };
  }

  private mapFact(row: FactRow, evidence: EvidenceReference[]): CareerFact {
    return {
      schemaVersion: "1.0.0",
      id: row.id,
      workspaceId: row.workspace_id,
      subject: { type: row.subject_type, id: row.subject_id },
      predicate: row.predicate,
      value: parseJson(row.value_json, row.value_json),
      evidenceType: row.evidence_type,
      riskLevel: row.risk_level,
      verificationStatus: row.verification_status,
      eligibility: row.eligibility,
      confidence: Number(row.confidence),
      evidence
    };
  }

  async reviewFact(
    workspaceId: string,
    factId: string,
    input: FactReviewInput
  ): Promise<CareerFact | undefined> {
    await this.initialize();
    const status: CareerFact["verificationStatus"] =
      input.action === "reject" ? "rejected" : "user_verified";
    if (input.action === "correct" && !input.value?.trim()) return undefined;

    const parameters: unknown[] = [status, workspaceId, factId];
    let valueClause = "value_json";
    if (input.action === "correct") {
      parameters.push(JSON.stringify(input.value?.trim()));
      valueClause = "$4::jsonb";
    }
    parameters.push(input.eligibility ?? null);
    const eligibilityParameter = parameters.length;

    const result = await this.database.query(
      `update career_facts
       set verification_status = $1,
           value_json = ${valueClause},
           eligibility = coalesce($${eligibilityParameter}, eligibility),
           updated_at = now()
       where workspace_id = $2 and id = $3`,
      parameters
    );
    if (result.affectedRows === 0) return undefined;
    return this.getFact(workspaceId, factId);
  }

  private async getFact(workspaceId: string, factId: string) {
    const [factResult, evidenceResult] = await Promise.all([
      this.database.query<FactRow>(
        `select id, workspace_id, subject_type, subject_id, predicate, value_json,
                evidence_type, risk_level, verification_status, eligibility, confidence
         from career_facts where workspace_id = $1 and id = $2`,
        [workspaceId, factId]
      ),
      this.database.query<EvidenceRow>(
        `select id, fact_id, source_id, source_kind, evidence_type, locator_kind,
                locator_value, confidence, observed_at, safe_excerpt
         from evidence_references where workspace_id = $1 and fact_id = $2`,
        [workspaceId, factId]
      )
    ]);
    const row = factResult.rows[0];
    if (!row) return undefined;
    return this.mapFact(row, evidenceResult.rows.map((item) => this.mapEvidence(item)));
  }

  async summary(workspaceId: string) {
    await this.initialize();
    const [sourceResult, factResult] = await Promise.all([
      this.database.query<{ count: number | string }>(
        "select count(*) as count from sources where workspace_id = $1",
        [workspaceId]
      ),
      this.database.query<{
        facts: number | string;
        pending_review: number | string;
        auto_accepted: number | string;
        verified: number | string;
        conflicts: number | string;
      }>(
        `select
           count(*) as facts,
           count(*) filter (where verification_status = 'pending_review') as pending_review,
           count(*) filter (where verification_status = 'auto_accepted') as auto_accepted,
           count(*) filter (where verification_status = 'user_verified') as verified,
           count(*) filter (where verification_status = 'in_conflict') as conflicts
         from career_facts where workspace_id = $1`,
        [workspaceId]
      )
    ]);
    const counts = factResult.rows[0];
    return {
      sources: Number(sourceResult.rows[0]?.count ?? 0),
      facts: Number(counts?.facts ?? 0),
      pendingReview: Number(counts?.pending_review ?? 0),
      autoAccepted: Number(counts?.auto_accepted ?? 0),
      verified: Number(counts?.verified ?? 0),
      conflicts: Number(counts?.conflicts ?? 0)
    };
  }

  connectSessionCredential(
    workspaceId: string,
    provider: CredentialMetadata["provider"],
    secret: string
  ): CredentialMetadata {
    const credentials = this.sessionCredentials.get(workspaceId) ?? [];
    const credential: SessionCredential = {
      id: randomUUID(),
      provider,
      storageMode: "session_only",
      maskedHint: `••••${secret.slice(-4)}`,
      status: "active",
      createdAt: new Date().toISOString(),
      secret
    };
    this.sessionCredentials.set(
      workspaceId,
      [...credentials.filter((item) => item.provider !== provider), credential]
    );
    return this.toCredentialMetadata(credential);
  }

  listCredentialMetadata(workspaceId: string): CredentialMetadata[] {
    return (this.sessionCredentials.get(workspaceId) ?? []).map((credential) =>
      this.toCredentialMetadata(credential)
    );
  }

  revokeCredential(workspaceId: string, credentialId: string): boolean {
    const credentials = this.sessionCredentials.get(workspaceId) ?? [];
    const next = credentials.filter((credential) => credential.id !== credentialId);
    this.sessionCredentials.set(workspaceId, next);
    return next.length !== credentials.length;
  }

  private toCredentialMetadata(credential: SessionCredential): CredentialMetadata {
    const { secret: _secret, ...metadata } = credential;
    return metadata;
  }

  async listIdentities(workspaceId: string): Promise<ProfessionalIdentity[]> {
    await this.initialize();
    const result = await this.database.query<IdentityRow>(
      `select identity.*,
         coalesce(
           (select jsonb_agg(preference.value_json->>'name' order by preference.priority, preference.id)
            from identity_preferences preference
            where preference.professional_identity_id = identity.id
              and preference.preference_type = 'emphasized_skill'),
           '[]'::jsonb
         ) as emphasized_skills
       from professional_identities identity
       where identity.workspace_id = $1 and identity.status = 'active'
       order by identity.is_default desc, identity.created_at, identity.id`,
      [workspaceId]
    );
    return result.rows.map((row) => this.mapIdentity(row));
  }

  async createIdentity(
    workspaceId: string,
    input: SaveIdentityInput
  ): Promise<ProfessionalIdentity> {
    await this.initialize();
    const id = randomUUID();
    const roles = normalizeList(input.targetRoleFamilies);
    const skills = normalizeList(input.emphasizedSkills);

    await this.database.transaction(async (transaction) => {
      const existing = await transaction.query<{ count: number | string }>(
        `select count(*) as count from professional_identities
         where workspace_id = $1 and status = 'active'`,
        [workspaceId]
      );
      const makeDefault = input.isDefault === true || Number(existing.rows[0]?.count ?? 0) === 0;
      if (makeDefault) {
        await transaction.query(
          "update professional_identities set is_default = false where workspace_id = $1",
          [workspaceId]
        );
      }
      await transaction.query(
        `insert into professional_identities (
          id, workspace_id, name, headline, target_role_families,
          narrative_summary, is_default
        ) values ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          id,
          workspaceId,
          input.name.trim(),
          input.headline?.trim() ?? "",
          JSON.stringify(roles),
          input.narrativeSummary?.trim() ?? "",
          makeDefault
        ]
      );
      await this.replaceEmphasizedSkills(transaction, id, skills);
    });

    const created = await this.getIdentity(workspaceId, id);
    if (!created) throw new Error("Identity creation did not return a record.");
    return created;
  }

  async updateIdentity(
    workspaceId: string,
    identityId: string,
    input: UpdateIdentityInput
  ): Promise<ProfessionalIdentity | undefined> {
    await this.initialize();
    const existing = await this.getIdentity(workspaceId, identityId);
    if (!existing) return undefined;
    const roles = input.targetRoleFamilies
      ? normalizeList(input.targetRoleFamilies)
      : existing.targetRoleFamilies;

    await this.database.transaction(async (transaction) => {
      await transaction.query(
        `update professional_identities
         set name = $1, headline = $2, target_role_families = $3::jsonb,
             narrative_summary = $4, updated_at = now()
         where workspace_id = $5 and id = $6 and status = 'active'`,
        [
          input.name?.trim() ?? existing.name,
          input.headline?.trim() ?? existing.headline,
          JSON.stringify(roles),
          input.narrativeSummary?.trim() ?? existing.narrativeSummary,
          workspaceId,
          identityId
        ]
      );
      if (input.emphasizedSkills) {
        await this.replaceEmphasizedSkills(
          transaction,
          identityId,
          normalizeList(input.emphasizedSkills)
        );
      }
    });
    return this.getIdentity(workspaceId, identityId);
  }

  private async replaceEmphasizedSkills(
    transaction: SqlExecutor,
    identityId: string,
    skills: string[]
  ) {
    await transaction.query(
      `delete from identity_preferences
       where professional_identity_id = $1 and preference_type = 'emphasized_skill'`,
      [identityId]
    );
    for (const [priority, skill] of skills.entries()) {
      await transaction.query(
        `insert into identity_preferences (
          id, professional_identity_id, preference_type, value_json, priority
        ) values ($1, $2, 'emphasized_skill', $3::jsonb, $4)`,
        [randomUUID(), identityId, JSON.stringify({ name: skill }), priority]
      );
    }
  }

  async setDefaultIdentity(workspaceId: string, identityId: string) {
    await this.initialize();
    return this.database.transaction(async (transaction) => {
      const target = await transaction.query(
        `select id from professional_identities
         where workspace_id = $1 and id = $2 and status = 'active'`,
        [workspaceId, identityId]
      );
      if (target.rows.length === 0) return undefined;
      await transaction.query(
        "update professional_identities set is_default = false where workspace_id = $1",
        [workspaceId]
      );
      await transaction.query(
        `update professional_identities
         set is_default = true, updated_at = now()
         where workspace_id = $1 and id = $2`,
        [workspaceId, identityId]
      );
      return true;
    });
  }

  async archiveIdentity(workspaceId: string, identityId: string) {
    await this.initialize();
    return this.database.transaction(async (transaction) => {
      const target = await transaction.query<{ is_default: boolean }>(
        `select is_default from professional_identities
         where workspace_id = $1 and id = $2 and status = 'active'`,
        [workspaceId, identityId]
      );
      const row = target.rows[0];
      if (!row) return false;
      await transaction.query(
        `update professional_identities
         set status = 'archived', is_default = false, updated_at = now()
         where workspace_id = $1 and id = $2`,
        [workspaceId, identityId]
      );
      if (row.is_default) {
        await transaction.query(
          `update professional_identities set is_default = true, updated_at = now()
           where id = (
             select id from professional_identities
             where workspace_id = $1 and status = 'active'
             order by created_at, id limit 1
           )`,
          [workspaceId]
        );
      }
      return true;
    });
  }

  private async getIdentity(workspaceId: string, identityId: string) {
    const result = await this.database.query<IdentityRow>(
      `select identity.*,
         coalesce(
           (select jsonb_agg(preference.value_json->>'name' order by preference.priority, preference.id)
            from identity_preferences preference
            where preference.professional_identity_id = identity.id
              and preference.preference_type = 'emphasized_skill'),
           '[]'::jsonb
         ) as emphasized_skills
       from professional_identities identity
       where identity.workspace_id = $1 and identity.id = $2 and identity.status = 'active'`,
      [workspaceId, identityId]
    );
    const row = result.rows[0];
    return row ? this.mapIdentity(row) : undefined;
  }

  private mapIdentity(row: IdentityRow): ProfessionalIdentity {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      headline: row.headline,
      targetRoleFamilies: parseJson<string[]>(row.target_role_families, []),
      narrativeSummary: row.narrative_summary,
      emphasizedSkills: parseJson<string[]>(row.emphasized_skills, []),
      isDefault: row.is_default,
      status: row.status,
      createdAt: toIsoString(row.created_at),
      updatedAt: toIsoString(row.updated_at)
    };
  }
}
