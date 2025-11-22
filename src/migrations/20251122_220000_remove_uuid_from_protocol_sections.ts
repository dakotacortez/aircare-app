import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Remove _uuid columns from protocol sections tables
 *
 * The previous migration included both `id` varchar and `_uuid` varchar columns.
 * PayloadCMS was inserting the ObjectId into `_uuid` and leaving `id` as null,
 * causing "null value in column id violates not-null constraint" errors.
 *
 * The fix: Remove `_uuid` columns entirely. PayloadCMS will use the `id` column
 * directly for ObjectIds (like it does in Protocol Defaults tables).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop _uuid columns from all protocol sections tables
  await db.execute(sql`
    ALTER TABLE "protocols_sections" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections_action_steps" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections_action_steps_protocol_references" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_sections_action_steps_details" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "protocols_calculator_overrides" DROP COLUMN IF EXISTS "_uuid";
  `)

  // Drop _uuid columns from version tables
  await db.execute(sql`
    ALTER TABLE "_protocols_v_version_sections" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections_action_steps" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections_action_steps_protocol_references" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_sections_action_steps_details" DROP COLUMN IF EXISTS "_uuid";
    ALTER TABLE "_protocols_v_version_calculator_overrides" DROP COLUMN IF EXISTS "_uuid";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Re-add _uuid columns (reverting to broken state)
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
}
