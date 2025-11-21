import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Fallback migration: Ensure push_notifications_target_roles table exists
 * with correct schema regardless of current state
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Ensuring push_notifications_target_roles table exists...')

  // Drop and recreate the table to ensure clean state
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS push_notifications_target_roles CASCADE
  `)

  await payload.db.drizzle.execute(sql`
    CREATE TABLE push_notifications_target_roles (
      id VARCHAR PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
      "order" INTEGER NOT NULL,
      parent_id INTEGER NOT NULL,
      value VARCHAR NOT NULL,
      CONSTRAINT push_notifications_target_roles_parent_id_fk
        FOREIGN KEY (parent_id)
        REFERENCES push_notifications(id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    )
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX push_notifications_target_roles_order_idx
      ON push_notifications_target_roles USING btree ("order")
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX push_notifications_target_roles_parent_idx
      ON push_notifications_target_roles USING btree (parent_id)
  `)

  console.log('✓ push_notifications_target_roles table created successfully')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS push_notifications_target_roles CASCADE
  `)

  console.log('✓ Dropped push_notifications_target_roles table')
}
