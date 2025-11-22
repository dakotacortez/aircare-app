import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Fix Protocol Sections ID Types
 *
 * The previous migration created protocol sections tables with serial (integer) IDs,
 * but PayloadCMS uses MongoDB-style ObjectId strings for array items.
 * This migration drops and recreates all protocol sections tables with varchar IDs.
 *
 * Affected tables:
 * - protocols_sections and all nested arrays
 * - _protocols_v_version_sections and all nested arrays
 * - protocols_tags
 * - protocols_calculator_overrides
 *
 * Data loss: All existing protocol sections data will be lost (acceptable in dev)
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop all the existing tables (in reverse dependency order)
  await db.execute(sql`
    -- Drop version tables first
    DROP TABLE IF EXISTS "_protocols_v_version_calculator_overrides" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_tags" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_details" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_protocol_references" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_scope" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections" CASCADE;

    -- Drop main protocol tables
    DROP TABLE IF EXISTS "protocols_calculator_overrides" CASCADE;
    DROP TABLE IF EXISTS "protocols_tags" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps_details" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps_protocol_references" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps_scope" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections" CASCADE;
  `)

  // =====================================================================
  // RECREATE MAIN PROTOCOL TABLES WITH VARCHAR IDS
  // =====================================================================

  // Create protocols_sections table
  await db.execute(sql`
    CREATE TABLE "protocols_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "note" varchar,
      "content_type" varchar DEFAULT 'actionSteps',
      "bullet_list" jsonb,
      "rich_text" jsonb,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections" ADD CONSTRAINT "protocols_sections_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_order_idx" ON "protocols_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_parent_idx" ON "protocols_sections" USING btree ("_parent_id");
  `)

  // Create protocols_sections_scope table
  await db.execute(sql`
    CREATE TABLE "protocols_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections_scope" ADD CONSTRAINT "protocols_sections_scope_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."protocols_sections"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_scope_order_idx" ON "protocols_sections_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_scope_parent_idx" ON "protocols_sections_scope" USING btree ("parent_id");
  `)

  // Create protocols_sections_action_steps table
  await db.execute(sql`
    CREATE TABLE "protocols_sections_action_steps" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step_number" numeric,
      "action" varchar,
      "timing" varchar,
      "requires_med_control" boolean DEFAULT false,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections_action_steps" ADD CONSTRAINT "protocols_sections_action_steps_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols_sections"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_order_idx" ON "protocols_sections_action_steps" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_parent_idx" ON "protocols_sections_action_steps" USING btree ("_parent_id");
  `)

  // Create protocols_sections_action_steps_scope table
  await db.execute(sql`
    CREATE TABLE "protocols_sections_action_steps_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections_action_steps_scope" ADD CONSTRAINT "protocols_sections_action_steps_scope_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."protocols_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_scope_order_idx" ON "protocols_sections_action_steps_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_scope_parent_idx" ON "protocols_sections_action_steps_scope" USING btree ("parent_id");
  `)

  // Create protocols_sections_action_steps_protocol_references table
  await db.execute(sql`
    CREATE TABLE "protocols_sections_action_steps_protocol_references" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "protocol_id" integer,
      "label" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections_action_steps_protocol_references" ADD CONSTRAINT "protocols_v_s_a_s_protocol_references_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections_action_steps_protocol_references" ADD CONSTRAINT "protocols_v_s_a_s_protocol_references_protocol_fk"
      FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE set null ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_v_s_a_s_protocol_references_order_idx" ON "protocols_sections_action_steps_protocol_references" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_v_s_a_s_protocol_references_parent_idx" ON "protocols_sections_action_steps_protocol_references" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "protocols_v_s_a_s_protocol_references_protocol_idx" ON "protocols_sections_action_steps_protocol_references" USING btree ("protocol_id");
  `)

  // Create protocols_sections_action_steps_details table
  await db.execute(sql`
    CREATE TABLE "protocols_sections_action_steps_details" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "detail" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections_action_steps_details" ADD CONSTRAINT "protocols_sections_action_steps_details_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_details_order_idx" ON "protocols_sections_action_steps_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_details_parent_idx" ON "protocols_sections_action_steps_details" USING btree ("_parent_id");
  `)

  // Create protocols_tags table
  await db.execute(sql`
    CREATE TABLE "protocols_tags" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_tags" ADD CONSTRAINT "protocols_tags_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_tags_order_idx" ON "protocols_tags" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "protocols_tags_parent_idx" ON "protocols_tags" USING btree ("parent_id");
  `)

  // Create protocols_calculator_overrides table
  await db.execute(sql`
    CREATE TABLE "protocols_calculator_overrides" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "calculator_id" integer,
      "order" integer,
      "hidden" boolean DEFAULT false,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_calculator_overrides" ADD CONSTRAINT "protocols_calculator_overrides_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_calculator_overrides" ADD CONSTRAINT "protocols_calculator_overrides_calculator_fk"
      FOREIGN KEY ("calculator_id") REFERENCES "public"."calculators"("id") ON DELETE set null ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_calculator_overrides_order_idx" ON "protocols_calculator_overrides" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_calculator_overrides_parent_idx" ON "protocols_calculator_overrides" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "protocols_calculator_overrides_calculator_idx" ON "protocols_calculator_overrides" USING btree ("calculator_id");
  `)

  // =====================================================================
  // RECREATE VERSION TABLES WITH VARCHAR IDS
  // =====================================================================

  // Create _protocols_v_version_sections table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "note" varchar,
      "content_type" varchar DEFAULT 'actionSteps',
      "bullet_list" jsonb,
      "rich_text" jsonb,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections" ADD CONSTRAINT "_protocols_v_version_sections_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_order_idx" ON "_protocols_v_version_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_parent_idx" ON "_protocols_v_version_sections" USING btree ("_parent_id");
  `)

  // Create _protocols_v_version_sections_scope table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections_scope" ADD CONSTRAINT "_protocols_v_version_sections_scope_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_scope_order_idx" ON "_protocols_v_version_sections_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_scope_parent_idx" ON "_protocols_v_version_sections_scope" USING btree ("parent_id");
  `)

  // Create _protocols_v_version_sections_action_steps table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_sections_action_steps" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step_number" numeric,
      "action" varchar,
      "timing" varchar,
      "requires_med_control" boolean DEFAULT false,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections_action_steps" ADD CONSTRAINT "_protocols_v_version_sections_action_steps_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_action_steps_order_idx" ON "_protocols_v_version_sections_action_steps" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_action_steps_parent_idx" ON "_protocols_v_version_sections_action_steps" USING btree ("_parent_id");
  `)

  // Create _protocols_v_version_sections_action_steps_scope table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_sections_action_steps_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections_action_steps_scope" ADD CONSTRAINT "_protocols_v_v_s_action_steps_scope_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v_version_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_scope_order_idx" ON "_protocols_v_version_sections_action_steps_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_scope_parent_idx" ON "_protocols_v_version_sections_action_steps_scope" USING btree ("parent_id");
  `)

  // Create _protocols_v_version_sections_action_steps_protocol_references table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_sections_action_steps_protocol_references" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "protocol_id" integer,
      "label" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ADD CONSTRAINT "_protocols_v_v_s_a_s_protocol_references_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v_version_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ADD CONSTRAINT "_protocols_v_v_s_a_s_protocol_references_protocol_fk"
      FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE set null ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_a_s_protocol_references_order_idx" ON "_protocols_v_version_sections_action_steps_protocol_references" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_a_s_protocol_references_parent_idx" ON "_protocols_v_version_sections_action_steps_protocol_references" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_a_s_protocol_references_protocol_idx" ON "_protocols_v_version_sections_action_steps_protocol_references" USING btree ("protocol_id");
  `)

  // Create _protocols_v_version_sections_action_steps_details table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_sections_action_steps_details" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "detail" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections_action_steps_details" ADD CONSTRAINT "_protocols_v_v_s_action_steps_details_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v_version_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_details_order_idx" ON "_protocols_v_version_sections_action_steps_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_details_parent_idx" ON "_protocols_v_version_sections_action_steps_details" USING btree ("_parent_id");
  `)

  // Create _protocols_v_version_tags table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_tags" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_tags" ADD CONSTRAINT "_protocols_v_version_tags_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_tags_order_idx" ON "_protocols_v_version_tags" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_tags_parent_idx" ON "_protocols_v_version_tags" USING btree ("parent_id");
  `)

  // Create _protocols_v_version_calculator_overrides table
  await db.execute(sql`
    CREATE TABLE "_protocols_v_version_calculator_overrides" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "calculator_id" integer,
      "order" integer,
      "hidden" boolean DEFAULT false,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_calculator_overrides" ADD CONSTRAINT "_protocols_v_version_calculator_overrides_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_calculator_overrides" ADD CONSTRAINT "_protocols_v_v_calculator_overrides_calculator_fk"
      FOREIGN KEY ("calculator_id") REFERENCES "public"."calculators"("id") ON DELETE set null ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_calculator_overrides_order_idx" ON "_protocols_v_version_calculator_overrides" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_calculator_overrides_parent_idx" ON "_protocols_v_version_calculator_overrides" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_calculator_overrides_calculator_idx" ON "_protocols_v_version_calculator_overrides" USING btree ("calculator_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop all tables and recreate with serial IDs (reverting to the broken state)
  await db.execute(sql`
    DROP TABLE IF EXISTS "_protocols_v_version_calculator_overrides" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_tags" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_details" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_protocol_references" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_scope" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "_protocols_v_version_sections" CASCADE;

    DROP TABLE IF EXISTS "protocols_calculator_overrides" CASCADE;
    DROP TABLE IF EXISTS "protocols_tags" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps_details" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps_protocol_references" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps_scope" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_action_steps" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections_scope" CASCADE;
    DROP TABLE IF EXISTS "protocols_sections" CASCADE;
  `)

  // Note: The down migration doesn't recreate the tables with serial IDs
  // because that would restore the broken state. If you need to rollback,
  // you should use the previous migration's structure.
}
