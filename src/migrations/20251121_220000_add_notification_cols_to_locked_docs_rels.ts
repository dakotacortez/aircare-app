import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add notification_settings_id and push_notifications_id to payload_locked_documents_rels
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE payload_locked_documents_rels
    ADD COLUMN IF NOT EXISTS notification_settings_id INTEGER,
    ADD COLUMN IF NOT EXISTS push_notifications_id INTEGER
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_notification_settings_id_idx
      ON payload_locked_documents_rels (notification_settings_id)
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_push_notifications_id_idx
      ON payload_locked_documents_rels (push_notifications_id)
  `)

  console.log('✓ Added notification columns to payload_locked_documents_rels')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DROP INDEX IF EXISTS payload_locked_documents_rels_notification_settings_id_idx
  `)

  await payload.db.drizzle.execute(sql`
    DROP INDEX IF EXISTS payload_locked_documents_rels_push_notifications_id_idx
  `)

  await payload.db.drizzle.execute(sql`
    ALTER TABLE payload_locked_documents_rels
    DROP COLUMN IF EXISTS notification_settings_id,
    DROP COLUMN IF EXISTS push_notifications_id
  `)

  console.log('✓ Removed notification columns from payload_locked_documents_rels')
}
