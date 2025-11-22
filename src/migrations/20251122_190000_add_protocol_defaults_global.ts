import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // First, drop any tables and enums created with incorrect names from previous migration attempts
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

  // Create all enums first
  await db.execute(sql`
    -- Create enum for content_type
    DO $$ BEGIN
      CREATE TYPE "enum_def_sections_content_type" AS ENUM('actionSteps', 'bulletList', 'richText');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    -- Create enum for scope
    DO $$ BEGIN
      CREATE TYPE "enum_def_sections_scope" AS ENUM('BLS', 'ALS', 'CCT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    -- Create enum for action step scope
    DO $$ BEGIN
      CREATE TYPE "enum_steps_scope" AS ENUM('BLS', 'ALS', 'CCT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  // Now create tables
  await db.execute(sql`
    -- Create protocol_defaults global table
    CREATE TABLE IF NOT EXISTS "protocol_defaults" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    -- Create def_sections (main array table)
    -- Note: Using exact dbName from ProtocolDefaults.ts (line 94)
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

  await db.execute(sql`
    -- Create def_sections_scope
    CREATE TABLE IF NOT EXISTS "def_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_def_sections_scope",
      "id" serial PRIMARY KEY NOT NULL,
      CONSTRAINT "def_sections_scope_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "def_sections"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create steps (action steps)
    -- Note: Using exact dbName from ProtocolDefaults.ts (line 216)
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

  await db.execute(sql`
    -- Create steps_scope
    CREATE TABLE IF NOT EXISTS "steps_scope" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_steps_scope",
      "id" serial PRIMARY KEY NOT NULL,
      CONSTRAINT "steps_scope_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "steps"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create proto_refs (protocol references)
    -- Note: Using exact dbName from ProtocolDefaults.ts (line 278)
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

  await db.execute(sql`
    -- Create steps_details
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

  await db.execute(sql`
    -- Create indexes for better performance
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

  // Insert default data
  await db.execute(sql`
    -- Insert a default protocol_defaults record if none exists
    INSERT INTO "protocol_defaults" ("id", "updated_at", "created_at")
    SELECT 1, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM "protocol_defaults" WHERE id = 1);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "steps_details" CASCADE;
    DROP TABLE IF EXISTS "proto_refs" CASCADE;
    DROP TABLE IF EXISTS "steps_scope" CASCADE;
    DROP TABLE IF EXISTS "steps" CASCADE;
    DROP TABLE IF EXISTS "def_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "def_sections" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults" CASCADE;
    DROP TYPE IF EXISTS "enum_def_sections_content_type";
    DROP TYPE IF EXISTS "enum_def_sections_scope";
    DROP TYPE IF EXISTS "enum_steps_scope";
  `)
}
