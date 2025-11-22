import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create protocol_defaults global table
    CREATE TABLE IF NOT EXISTS "protocol_defaults" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    -- Create protocol_defaults_def_sections (main array table)
    CREATE TABLE IF NOT EXISTS "protocol_defaults_def_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "note" varchar,
      "content_type" "enum_protocol_defaults_def_sections_content_type" NOT NULL,
      "bullet_list" jsonb,
      "rich_text" jsonb,
      CONSTRAINT "protocol_defaults_def_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "protocol_defaults"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create enum for content_type
    DO $$ BEGIN
      CREATE TYPE "enum_protocol_defaults_def_sections_content_type" AS ENUM('actionSteps', 'bulletList', 'richText');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    -- Create protocol_defaults_def_sections_scope
    CREATE TABLE IF NOT EXISTS "protocol_defaults_def_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" "enum_protocol_defaults_def_sections_scope",
      "id" serial PRIMARY KEY NOT NULL,
      CONSTRAINT "protocol_defaults_def_sections_scope_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "protocol_defaults_def_sections"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create enum for scope
    DO $$ BEGIN
      CREATE TYPE "enum_protocol_defaults_def_sections_scope" AS ENUM('BLS', 'ALS', 'CCT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    -- Create protocol_defaults_def_sections_steps (action steps)
    CREATE TABLE IF NOT EXISTS "protocol_defaults_def_sections_steps" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step_number" numeric NOT NULL,
      "action" varchar NOT NULL,
      "timing" varchar,
      "requires_med_control" boolean DEFAULT false,
      CONSTRAINT "protocol_defaults_def_sections_steps_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "protocol_defaults_def_sections"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create protocol_defaults_def_sections_steps_scope
    CREATE TABLE IF NOT EXISTS "protocol_defaults_def_sections_steps_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" "enum_protocol_defaults_def_sections_steps_scope",
      "id" serial PRIMARY KEY NOT NULL,
      CONSTRAINT "protocol_defaults_def_sections_steps_scope_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "protocol_defaults_def_sections_steps"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create enum for action step scope
    DO $$ BEGIN
      CREATE TYPE "enum_protocol_defaults_def_sections_steps_scope" AS ENUM('BLS', 'ALS', 'CCT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    -- Create protocol_defaults_def_sections_steps_proto_refs
    CREATE TABLE IF NOT EXISTS "protocol_defaults_def_sections_steps_proto_refs" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "protocol_id" integer,
      "label" varchar,
      CONSTRAINT "protocol_defaults_def_sections_steps_proto_refs_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "protocol_defaults_def_sections_steps"("id") ON DELETE CASCADE,
      CONSTRAINT "protocol_defaults_def_sections_steps_proto_refs_protocol_fk"
        FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE SET NULL
    );
  `)

  await db.execute(sql`
    -- Create protocol_defaults_def_sections_steps_details
    CREATE TABLE IF NOT EXISTS "protocol_defaults_def_sections_steps_details" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "detail" varchar NOT NULL,
      CONSTRAINT "protocol_defaults_def_sections_steps_details_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "protocol_defaults_def_sections_steps"("id") ON DELETE CASCADE
    );
  `)

  await db.execute(sql`
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS "protocol_defaults_def_sections_order_idx" ON "protocol_defaults_def_sections" ("_order");
    CREATE INDEX IF NOT EXISTS "protocol_defaults_def_sections_parent_idx" ON "protocol_defaults_def_sections" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "protocol_defaults_def_sections_steps_order_idx" ON "protocol_defaults_def_sections_steps" ("_order");
    CREATE INDEX IF NOT EXISTS "protocol_defaults_def_sections_steps_parent_idx" ON "protocol_defaults_def_sections_steps" ("_parent_id");
  `)

  // Insert default data
  await db.execute(sql`
    -- Insert a default protocol_defaults record if none exists
    INSERT INTO "protocol_defaults" ("id", "updated_at", "created_at")
    SELECT 1, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM "protocol_defaults" WHERE id = 1);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps_details" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps_proto_refs" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps_scope" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_steps" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults_def_sections" CASCADE;
    DROP TABLE IF EXISTS "protocol_defaults" CASCADE;
    DROP TYPE IF EXISTS "enum_protocol_defaults_def_sections_content_type";
    DROP TYPE IF EXISTS "enum_protocol_defaults_def_sections_scope";
    DROP TYPE IF EXISTS "enum_protocol_defaults_def_sections_steps_scope";
  `)
}
