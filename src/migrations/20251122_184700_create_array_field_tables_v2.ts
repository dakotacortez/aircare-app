import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Create Array Field Tables
 *
 * This migration creates the proper table structure for array fields
 * that were incorrectly stored as JSONB in the previous migration.
 *
 * Creates tables for:
 * - medications_scope
 * - medications_doses
 * - protocols_sections and nested action steps
 * - protocols_tags
 * - protocols_calculator_overrides
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create medications_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "medications_scope" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_scope_parent_fk'
      ) THEN
        ALTER TABLE "medications_scope" ADD CONSTRAINT "medications_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "medications_scope_order_idx" ON "medications_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "medications_scope_parent_idx" ON "medications_scope" USING btree ("parent_id");
  `)

  // Create medications_doses table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "medications_doses" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "route" varchar,
      "adult_dose" varchar,
      "pediatric_dose" varchar,
      "concentration" varchar,
      "interval" varchar,
      "max_dose" varchar,
      "rate" varchar
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_doses_parent_fk'
      ) THEN
        ALTER TABLE "medications_doses" ADD CONSTRAINT "medications_doses_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "medications_doses_order_idx" ON "medications_doses" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "medications_doses_parent_idx" ON "medications_doses" USING btree ("_parent_id");
  `)

  // Drop JSONB columns from medications table
  await db.execute(sql`
    ALTER TABLE "medications" DROP COLUMN IF EXISTS "scope";
    ALTER TABLE "medications" DROP COLUMN IF EXISTS "doses";
  `)

  // Create protocols_sections table (for main protocols table)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "note" varchar,
      "content_type" varchar DEFAULT 'actionSteps',
      "bullet_list" jsonb,
      "rich_text" jsonb
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_sections_parent_fk'
      ) THEN
        ALTER TABLE "protocols_sections" ADD CONSTRAINT "protocols_sections_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_order_idx" ON "protocols_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_parent_idx" ON "protocols_sections" USING btree ("_parent_id");
  `)

  // Create protocols_sections_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_sections_scope_parent_fk'
      ) THEN
        ALTER TABLE "protocols_sections_scope" ADD CONSTRAINT "protocols_sections_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."protocols_sections"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_scope_order_idx" ON "protocols_sections_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_scope_parent_idx" ON "protocols_sections_scope" USING btree ("parent_id");
  `)

  // Create protocols_sections_action_steps table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_sections_action_steps" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step_number" numeric,
      "action" varchar,
      "timing" varchar,
      "requires_med_control" boolean DEFAULT false
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_sections_action_steps_parent_fk'
      ) THEN
        ALTER TABLE "protocols_sections_action_steps" ADD CONSTRAINT "protocols_sections_action_steps_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols_sections"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_order_idx" ON "protocols_sections_action_steps" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_parent_idx" ON "protocols_sections_action_steps" USING btree ("_parent_id");
  `)

  // Create protocols_sections_action_steps_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_sections_action_steps_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_sections_action_steps_scope_parent_fk'
      ) THEN
        ALTER TABLE "protocols_sections_action_steps_scope" ADD CONSTRAINT "protocols_sections_action_steps_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."protocols_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_scope_order_idx" ON "protocols_sections_action_steps_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_scope_parent_idx" ON "protocols_sections_action_steps_scope" USING btree ("parent_id");
  `)

  // Create protocols_sections_action_steps_protocol_references table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_sections_action_steps_protocol_references" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "protocol_id" integer,
      "label" varchar
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_v_s_a_s_protocol_references_parent_fk'
      ) THEN
        ALTER TABLE "protocols_sections_action_steps_protocol_references" ADD CONSTRAINT "protocols_v_s_a_s_protocol_references_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_v_s_a_s_protocol_references_protocol_fk'
      ) THEN
        ALTER TABLE "protocols_sections_action_steps_protocol_references" ADD CONSTRAINT "protocols_v_s_a_s_protocol_references_protocol_fk"
          FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_v_s_a_s_protocol_references_order_idx" ON "protocols_sections_action_steps_protocol_references" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_v_s_a_s_protocol_references_parent_idx" ON "protocols_sections_action_steps_protocol_references" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "protocols_v_s_a_s_protocol_references_protocol_idx" ON "protocols_sections_action_steps_protocol_references" USING btree ("protocol_id");
  `)

  // Create protocols_sections_action_steps_details table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_sections_action_steps_details" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "detail" varchar
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_sections_action_steps_details_parent_fk'
      ) THEN
        ALTER TABLE "protocols_sections_action_steps_details" ADD CONSTRAINT "protocols_sections_action_steps_details_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_details_order_idx" ON "protocols_sections_action_steps_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_sections_action_steps_details_parent_idx" ON "protocols_sections_action_steps_details" USING btree ("_parent_id");
  `)

  // Create protocols_tags table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_tags" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_tags_parent_fk'
      ) THEN
        ALTER TABLE "protocols_tags" ADD CONSTRAINT "protocols_tags_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_tags_order_idx" ON "protocols_tags" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "protocols_tags_parent_idx" ON "protocols_tags" USING btree ("parent_id");
  `)

  // Create protocols_calculator_overrides table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "protocols_calculator_overrides" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "calculator_id" integer,
      "order" integer,
      "hidden" boolean DEFAULT false
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_calculator_overrides_parent_fk'
      ) THEN
        ALTER TABLE "protocols_calculator_overrides" ADD CONSTRAINT "protocols_calculator_overrides_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'protocols_calculator_overrides_calculator_fk'
      ) THEN
        ALTER TABLE "protocols_calculator_overrides" ADD CONSTRAINT "protocols_calculator_overrides_calculator_fk"
          FOREIGN KEY ("calculator_id") REFERENCES "public"."calculators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "protocols_calculator_overrides_order_idx" ON "protocols_calculator_overrides" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "protocols_calculator_overrides_parent_idx" ON "protocols_calculator_overrides" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "protocols_calculator_overrides_calculator_idx" ON "protocols_calculator_overrides" USING btree ("calculator_id");
  `)

  // Drop JSONB columns from protocols table
  await db.execute(sql`
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "sections";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "tags";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "calculator_overrides";
  `)

  // NOW CREATE VERSION TABLES FOR _protocols_v

  // Create _protocols_v_version_sections table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "note" varchar,
      "content_type" varchar DEFAULT 'actionSteps',
      "bullet_list" jsonb,
      "rich_text" jsonb
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_version_sections_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections" ADD CONSTRAINT "_protocols_v_version_sections_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_order_idx" ON "_protocols_v_version_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_parent_idx" ON "_protocols_v_version_sections" USING btree ("_parent_id");
  `)

  // Create _protocols_v_version_sections_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_sections_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_version_sections_scope_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections_scope" ADD CONSTRAINT "_protocols_v_version_sections_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_scope_order_idx" ON "_protocols_v_version_sections_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_scope_parent_idx" ON "_protocols_v_version_sections_scope" USING btree ("parent_id");
  `)

  // Create _protocols_v_version_sections_action_steps table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_sections_action_steps" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step_number" numeric,
      "action" varchar,
      "timing" varchar,
      "requires_med_control" boolean DEFAULT false
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_version_sections_action_steps_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections_action_steps" ADD CONSTRAINT "_protocols_v_version_sections_action_steps_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_action_steps_order_idx" ON "_protocols_v_version_sections_action_steps" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_sections_action_steps_parent_idx" ON "_protocols_v_version_sections_action_steps" USING btree ("_parent_id");
  `)

  // Create _protocols_v_version_sections_action_steps_scope table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_sections_action_steps_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_v_s_action_steps_scope_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections_action_steps_scope" ADD CONSTRAINT "_protocols_v_v_s_action_steps_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v_version_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_scope_order_idx" ON "_protocols_v_version_sections_action_steps_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_scope_parent_idx" ON "_protocols_v_version_sections_action_steps_scope" USING btree ("parent_id");
  `)

  // Create _protocols_v_version_sections_action_steps_protocol_references table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_sections_action_steps_protocol_references" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "protocol_id" integer,
      "label" varchar
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_v_s_a_s_protocol_references_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ADD CONSTRAINT "_protocols_v_v_s_a_s_protocol_references_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v_version_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_v_s_a_s_protocol_references_protocol_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ADD CONSTRAINT "_protocols_v_v_s_a_s_protocol_references_protocol_fk"
          FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_a_s_protocol_references_order_idx" ON "_protocols_v_version_sections_action_steps_protocol_references" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_a_s_protocol_references_parent_idx" ON "_protocols_v_version_sections_action_steps_protocol_references" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_a_s_protocol_references_protocol_idx" ON "_protocols_v_version_sections_action_steps_protocol_references" USING btree ("protocol_id");
  `)

  // Create _protocols_v_version_sections_action_steps_details table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_sections_action_steps_details" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "detail" varchar
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_v_s_action_steps_details_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_sections_action_steps_details" ADD CONSTRAINT "_protocols_v_v_s_action_steps_details_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v_version_sections_action_steps"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_details_order_idx" ON "_protocols_v_version_sections_action_steps_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_v_s_action_steps_details_parent_idx" ON "_protocols_v_version_sections_action_steps_details" USING btree ("_parent_id");
  `)

  // Create _protocols_v_version_tags table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_tags" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_version_tags_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_tags" ADD CONSTRAINT "_protocols_v_version_tags_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_tags_order_idx" ON "_protocols_v_version_tags" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_tags_parent_idx" ON "_protocols_v_version_tags" USING btree ("parent_id");
  `)

  // Create _protocols_v_version_calculator_overrides table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_protocols_v_version_calculator_overrides" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "calculator_id" integer,
      "order" integer,
      "hidden" boolean DEFAULT false
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_version_calculator_overrides_parent_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_calculator_overrides" ADD CONSTRAINT "_protocols_v_version_calculator_overrides_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_protocols_v_v_calculator_overrides_calculator_fk'
      ) THEN
        ALTER TABLE "_protocols_v_version_calculator_overrides" ADD CONSTRAINT "_protocols_v_v_calculator_overrides_calculator_fk"
          FOREIGN KEY ("calculator_id") REFERENCES "public"."calculators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_calculator_overrides_order_idx" ON "_protocols_v_version_calculator_overrides" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_calculator_overrides_parent_idx" ON "_protocols_v_version_calculator_overrides" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_protocols_v_version_calculator_overrides_calculator_idx" ON "_protocols_v_version_calculator_overrides" USING btree ("calculator_id");
  `)

  // Drop JSONB columns from _protocols_v table
  await db.execute(sql`
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_sections";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_tags";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_calculator_overrides";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop all created tables
  await db.execute(sql`
    DROP TABLE IF EXISTS "_protocols_v_version_calculator_overrides";
    DROP TABLE IF EXISTS "_protocols_v_version_tags";
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_details";
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_protocol_references";
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps_scope";
    DROP TABLE IF EXISTS "_protocols_v_version_sections_action_steps";
    DROP TABLE IF EXISTS "_protocols_v_version_sections_scope";
    DROP TABLE IF EXISTS "_protocols_v_version_sections";

    DROP TABLE IF EXISTS "protocols_calculator_overrides";
    DROP TABLE IF EXISTS "protocols_tags";
    DROP TABLE IF EXISTS "protocols_sections_action_steps_details";
    DROP TABLE IF EXISTS "protocols_sections_action_steps_protocol_references";
    DROP TABLE IF EXISTS "protocols_sections_action_steps_scope";
    DROP TABLE IF EXISTS "protocols_sections_action_steps";
    DROP TABLE IF EXISTS "protocols_sections_scope";
    DROP TABLE IF EXISTS "protocols_sections";

    DROP TABLE IF EXISTS "medications_doses";
    DROP TABLE IF EXISTS "medications_scope";
  `)

  // Restore JSONB columns
  await db.execute(sql`
    ALTER TABLE "medications" ADD COLUMN IF NOT EXISTS "scope" jsonb NOT NULL DEFAULT '["ALS","CCT"]';
    ALTER TABLE "medications" ADD COLUMN IF NOT EXISTS "doses" jsonb;

    ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "sections" jsonb NOT NULL DEFAULT '[]';
    ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]';
    ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "calculator_overrides" jsonb DEFAULT '[]';

    ALTER TABLE "_protocols_v" ADD COLUMN IF NOT EXISTS "version_sections" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN IF NOT EXISTS "version_tags" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN IF NOT EXISTS "version_calculator_overrides" jsonb;
  `)
}
