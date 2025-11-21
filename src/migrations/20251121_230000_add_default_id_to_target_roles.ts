import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add default UUID generator to push_notifications_target_roles.id
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE push_notifications_target_roles
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text
  `)

  console.log('✓ Added default UUID generator to push_notifications_target_roles.id')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE push_notifications_target_roles
    ALTER COLUMN id DROP DEFAULT
  `)

  console.log('✓ Removed default from push_notifications_target_roles.id')
}
