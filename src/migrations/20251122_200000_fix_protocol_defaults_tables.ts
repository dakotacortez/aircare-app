import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix Protocol Defaults tables created by previous migration
 *
 * The original migration (20251122_190000) created tables with incorrect names
 * that don't match the dbName values in ProtocolDefaults.ts config.
 *
 * This migration:
 * - Drops the incorrectly-named tables
 * - Creates tables with correct names matching dbName config
 * - Uses proper ID types (serial instead of varchar)
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop all tables and enums created with incorrect names
  await db.execute(sql`
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps_details" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps_proto_refs" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps_scope" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections" CASCADE;
    DROP TYPE IF EXISTS "enum_protocol_defaults_def_sections_content_type";
    DROP TYPE IF EXISTS "enum_protocol_defaults_def_sections_scope";
    DROP TYPE IF EXISTS "enum_protocol_defaults_def_sections_steps_scope";
  `)

  // Create enums with correct names
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_def_sections_content_type" AS ENUM('actionSteps', 'bulletList', 'richText');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_def_sections_scope" AS ENUM('BLS', 'ALS', 'CCT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_steps_scope" AS ENUM('BLS', 'ALS', 'CCT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  // Create def_sections table (matches dbName from ProtocolDefaults.ts line 94)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "def_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "note" varchar,
      "content_type" "enum_def_sections_content_type" NOT NULL,
      "bullet_list" jsonb,
      "rich_text" jsonb,
      "_uuid" varchar,
      CONSTRAINT "def_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "protocol_defaults"("id") ON DELETE CASCADE
    );
  `)

  // Create def_sections_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "def_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_def_sections_scope",
      "id" serial PRIMARY KEY NOT NULL,
      CONSTRAINT "def_sections_scope_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "def_sections"("id") ON DELETE CASCADE
    );
  `)

  // Create steps table (matches dbName from ProtocolDefaults.ts line 216)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "steps" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "step_number" numeric NOT NULL,
      "action" varchar NOT NULL,
      "timing" varchar,
      "requires_med_control" boolean DEFAULT false,
      "_uuid" varchar,
      CONSTRAINT "steps_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "def_sections"("id") ON DELETE CASCADE
    );
  `)

  // Create steps_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "steps_scope" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_steps_scope",
      "id" serial PRIMARY KEY NOT NULL,
      CONSTRAINT "steps_scope_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "steps"("id") ON DELETE CASCADE
    );
  `)

  // Create proto_refs table (matches dbName from ProtocolDefaults.ts line 278)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "proto_refs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "protocol_id" integer,
      "label" varchar,
      "_uuid" varchar,
      CONSTRAINT "proto_refs_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "steps"("id") ON DELETE CASCADE,
      CONSTRAINT "proto_refs_protocol_fk"
        FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE SET NULL
    );
  `)

  // Create steps_details table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "steps_details" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "detail" varchar NOT NULL,
      "_uuid" varchar,
      CONSTRAINT "steps_details_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "steps"("id") ON DELETE CASCADE
    );
  `)

  // Create indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "def_sections_order_idx" ON "def_sections" ("_order");
    CREATE INDEX IF NOT EXISTS "def_sections_parent_idx" ON "def_sections" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "def_sections_scope_order_idx" ON "def_sections_scope" ("order");
    CREATE INDEX IF NOT EXISTS "def_sections_scope_parent_idx" ON "def_sections_scope" ("parent_id");
    CREATE INDEX IF NOT EXISTS "steps_order_idx" ON "steps" ("_order");
    CREATE INDEX IF NOT EXISTS "steps_parent_idx" ON "steps" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "steps_scope_order_idx" ON "steps_scope" ("order");
    CREATE INDEX IF NOT EXISTS "steps_scope_parent_idx" ON "steps_scope" ("parent_id");
    CREATE INDEX IF NOT EXISTS "proto_refs_order_idx" ON "proto_refs" ("_order");
    CREATE INDEX IF NOT EXISTS "proto_refs_parent_idx" ON "proto_refs" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "proto_refs_protocol_idx" ON "proto_refs" ("protocol_id");
    CREATE INDEX IF NOT EXISTS "steps_details_order_idx" ON "steps_details" ("_order");
    CREATE INDEX IF NOT EXISTS "steps_details_parent_idx" ON "steps_details" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop all the correctly-named tables
  await db.execute(sql`
    DROP TABLE IF EXISTS "steps_details" CASCADE;
    DROP TABLE IF EXISTS "proto_refs" CASCADE;
    DROP TABLE IF EXISTS "steps_scope" CASCADE;
    DROP TABLE IF EXISTS "steps" CASCADE;
    DROP TABLE IF EXISTS "def_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "def_sections" CASCADE;
    DROP TYPE IF EXISTS "enum_def_sections_content_type";
    DROP TYPE IF EXISTS "enum_def_sections_scope";
    DROP TYPE IF EXISTS "enum_steps_scope";
  `)
}
