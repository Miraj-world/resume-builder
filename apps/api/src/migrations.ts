import type { DatabaseClient } from "./database.js";

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "career_vault_foundation",
    sql: `
      create table if not exists users (
        id text primary key,
        email text unique,
        display_name text not null,
        status text not null default 'active',
        created_at timestamptz not null default now()
      );

      create table if not exists workspaces (
        id text primary key,
        name text not null,
        created_at timestamptz not null default now()
      );

      create table if not exists workspace_memberships (
        workspace_id text not null references workspaces(id) on delete cascade,
        user_id text not null references users(id) on delete cascade,
        role text not null default 'owner',
        created_at timestamptz not null default now(),
        primary key (workspace_id, user_id)
      );

      create table if not exists sessions (
        id text primary key,
        token_hash text not null unique,
        user_id text not null references users(id) on delete cascade,
        workspace_id text not null references workspaces(id) on delete cascade,
        expires_at timestamptz not null,
        revoked_at timestamptz,
        created_at timestamptz not null default now()
      );
      create index if not exists sessions_token_hash_idx on sessions(token_hash);

      create table if not exists sources (
        id text primary key,
        workspace_id text not null references workspaces(id) on delete cascade,
        name text not null,
        kind text not null,
        character_count integer not null,
        reference_only boolean not null default true,
        created_at timestamptz not null default now()
      );
      create index if not exists sources_workspace_idx on sources(workspace_id, created_at desc);

      create table if not exists career_facts (
        id text primary key,
        workspace_id text not null references workspaces(id) on delete cascade,
        source_id text not null references sources(id) on delete cascade,
        subject_type text not null,
        subject_id text not null,
        predicate text not null,
        value_json jsonb not null,
        evidence_type text not null,
        risk_level text not null,
        verification_status text not null,
        eligibility text not null,
        confidence double precision not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists career_facts_workspace_idx on career_facts(workspace_id, created_at desc);
      create index if not exists career_facts_review_idx on career_facts(workspace_id, verification_status);

      create table if not exists evidence_references (
        id text primary key,
        workspace_id text not null references workspaces(id) on delete cascade,
        fact_id text not null references career_facts(id) on delete cascade,
        source_id text not null references sources(id) on delete cascade,
        source_kind text not null,
        evidence_type text not null,
        locator_kind text not null,
        locator_value text not null,
        confidence double precision not null,
        observed_at timestamptz not null,
        safe_excerpt text
      );
      create index if not exists evidence_fact_idx on evidence_references(fact_id);

      create table if not exists professional_identities (
        id text primary key,
        workspace_id text not null references workspaces(id) on delete cascade,
        name text not null,
        headline text not null default '',
        target_role_families jsonb not null default '[]'::jsonb,
        narrative_summary text not null default '',
        is_default boolean not null default false,
        status text not null default 'active',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists identities_workspace_idx on professional_identities(workspace_id, status, created_at);
      create unique index if not exists identities_one_default_idx
        on professional_identities(workspace_id) where is_default = true and status = 'active';

      create table if not exists identity_preferences (
        id text primary key,
        professional_identity_id text not null references professional_identities(id) on delete cascade,
        preference_type text not null,
        target_entity_type text,
        target_entity_id text,
        value_json jsonb not null,
        priority integer not null default 0
      );
      create index if not exists identity_preferences_identity_idx
        on identity_preferences(professional_identity_id, preference_type, priority);
    `
  }
];

export async function runMigrations(database: DatabaseClient) {
  await database.ready();
  await database.exec(`
    create table if not exists schema_migrations (
      version integer primary key,
      name text not null,
      applied_at timestamptz not null default now()
    );
  `);

  const result = await database.query<{ version: number }>(
    "select version from schema_migrations"
  );
  const applied = new Set(result.rows.map((row) => Number(row.version)));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    await database.transaction(async (transaction) => {
      await transaction.exec(migration.sql);
      await transaction.query(
        "insert into schema_migrations (version, name) values ($1, $2)",
        [migration.version, migration.name]
      );
    });
  }
}
