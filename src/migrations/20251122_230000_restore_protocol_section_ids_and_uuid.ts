import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Restore _uuid columns and auto-generated IDs for protocol sections
 *
 * The previous attempt to remove `_uuid` columns broke Payload's Postgres adapter
 * because the admin list queries still select `_uuid`. At the same time, the new
 * varchar primary keys for the section tables did not have defaults, causing
 * `null value in column "id"` violations when Payload omitted the field.
 *
 * This migration reintroduces the `_uuid` columns (if they were dropped) and
 * ensures every varchar primary key auto-generates via `gen_random_uuid()`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "protocols_sections_action_steps" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "protocols_sections_action_steps_protocol_references" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "protocols_sections_action_steps_details" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "protocols_calculator_overrides" ADD COLUMN IF NOT EXISTS "_uuid" varchar;

    ALTER TABLE "_protocols_v_version_sections" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "_protocols_v_version_sections_action_steps" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "_protocols_v_version_sections_action_steps_details" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
    ALTER TABLE "_protocols_v_version_calculator_overrides" ADD COLUMN IF NOT EXISTS "_uuid" varchar;
  `)

  await db.execute(sql`
    ALTER TABLE "protocols_sections" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_sections_scope" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_sections_action_steps" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_sections_action_steps_scope" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_sections_action_steps_protocol_references" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_sections_action_steps_details" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_tags" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "protocols_calculator_overrides" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

    ALTER TABLE "_protocols_v_version_sections" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_sections_scope" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_sections_action_steps" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_sections_action_steps_scope" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_sections_action_steps_details" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_tags" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE "_protocols_v_version_calculator_overrides" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_calculator_overrides" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_tags" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_sections_action_steps_details" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_sections_action_steps_scope" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_sections_action_steps" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_sections_scope" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "_protocols_v_version_sections" ALTER COLUMN "id" DROP DEFAULT;

    ALTER TABLE "protocols_calculator_overrides" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_tags" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_sections_action_steps_details" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_sections_action_steps_protocol_references" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_sections_action_steps_scope" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_sections_action_steps" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_sections_scope" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "protocols_sections" ALTER COLUMN "id" DROP DEFAULT;
  `)

  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_calculator_overrides" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections_action_steps_details" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections_action_steps" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections" DROP COLUMN IF EXISTS "_uuid";

    ALTER TABLE "protocols_calculator_overrides" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections_action_steps_details" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections_action_steps_protocol_references" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections_action_steps" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections" DROP COLUMN IF EXISTS "_uuid";
  `)
}

