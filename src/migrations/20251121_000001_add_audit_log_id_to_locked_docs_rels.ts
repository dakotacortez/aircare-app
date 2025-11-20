import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add audit_log_id to payload_locked_documents_rels
 *
 * The audit_log collection was added in migration 20251120_030000_add_notifications_and_audit_trail.ts
 * but the corresponding relationship column was not added to payload_locked_documents_rels.
 *
 * This migration adds the missing audit_log_id column to support locked document relationships
 * with audit log entries.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add missing audit_log relationship column to locked documents rels
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "audit_log_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audit_log_id_idx"
      ON "payload_locked_documents_rels" USING btree ("audit_log_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_audit_log_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk"
            FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_audit_log_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_audit_log_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "audit_log_id";
  `)
}
