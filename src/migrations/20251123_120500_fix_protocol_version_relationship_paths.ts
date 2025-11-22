import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Fixes `_protocols_v_rels` path validation for Payload 3.64+
 *
 * Payload now stores relationship paths on versions with a `version.` prefix
 * (e.g., `version.medications`). Existing constraints only whitelisted the
 * legacy values, so inserts started failing after the upgrade. This migration
 * allows both legacy and prefixed values for backwards compatibility.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_protocols_v_rels" DROP CONSTRAINT IF EXISTS "_protocols_v_rels_path_check";
    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_path_check"
      CHECK (
        "path" IN (
          'attachments',
          'medications',
          'relatedProtocols',
          'calculatorOverrides.calculator',
          'version.attachments',
          'version.medications',
          'version.relatedProtocols',
          'version.calculatorOverrides.calculator'
        )
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_protocols_v_rels" DROP CONSTRAINT IF EXISTS "_protocols_v_rels_path_check";
    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_path_check"
      CHECK (
        "path" IN (
          'attachments',
          'medications',
          'relatedProtocols',
          'calculatorOverrides.calculator'
        )
      );
  `)
}

