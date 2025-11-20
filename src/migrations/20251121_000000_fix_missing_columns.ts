import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Fix missing schema columns after dynamic updates
 *
 * - Ensure hospital_change_requests has proposed_data_source_attribution
 * - Ensure payload_locked_documents_rels supports notifications relationships
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add missing attribution column for hospital change requests
    ALTER TABLE "hospital_change_requests"
      ADD COLUMN IF NOT EXISTS "proposed_data_source_attribution" varchar;

    -- Add missing notifications relationship column to locked documents rels
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "notifications_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notifications_id_idx"
      ON "payload_locked_documents_rels" USING btree ("notifications_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_notifications_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk"
            FOREIGN KEY ("notifications_id") REFERENCES "notifications"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_notifications_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_notifications_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "notifications_id";

    ALTER TABLE "hospital_change_requests"
      DROP COLUMN IF EXISTS "proposed_data_source_attribution";
  `)
}
