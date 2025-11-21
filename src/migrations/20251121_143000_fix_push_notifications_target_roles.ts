import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: Fix push_notifications targetRoles schema
 *
 * This migration fixes the push_notifications table schema:
 * 1. Removes the incorrect target_roles JSONB column
 * 2. Creates the proper push_notifications_target_roles join table that Payload expects
 * 3. Migrates any existing data from the JSONB column to the new table
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // First, create the target_roles join table
  await payload.db.drizzle.execute(sql`
    CREATE TABLE IF NOT EXISTS push_notifications_target_roles (
      "order" INTEGER NOT NULL,
      parent_id INTEGER NOT NULL,
      id VARCHAR PRIMARY KEY NOT NULL,
      value VARCHAR NOT NULL,
      CONSTRAINT push_notifications_target_roles_parent_fk
        FOREIGN KEY (parent_id)
        REFERENCES push_notifications(id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    )
  `)

  // If the table already exists with the old column names, rename them to match
  // what Payload expects (parent_id/order)
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = '_parent_id'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        RENAME COLUMN _parent_id TO parent_id;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = '_order'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        RENAME COLUMN _order TO "order";
      END IF;
    END $$;
  `)

  // Create indexes
  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS push_notifications_target_roles_order_idx
      ON push_notifications_target_roles USING btree ("order")
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS push_notifications_target_roles_parent_idx
      ON push_notifications_target_roles USING btree (parent_id)
  `)

  // Migrate existing data from JSONB column to new table
  await payload.db.drizzle.execute(sql`
    INSERT INTO push_notifications_target_roles (id, parent_id, "order", value)
    SELECT
      gen_random_uuid()::text as id,
      pn.id as parent_id,
      (row_number() OVER (PARTITION BY pn.id ORDER BY role_value)) - 1 as "order",
      role_value as value
    FROM push_notifications pn,
    jsonb_array_elements_text(pn.target_roles) AS role_value
    WHERE pn.target_roles IS NOT NULL
      AND jsonb_typeof(pn.target_roles) = 'array'
  `)

  // Drop the old JSONB column
  await payload.db.drizzle.execute(sql`
    ALTER TABLE push_notifications
    DROP COLUMN IF EXISTS target_roles
  `)

  console.log('✓ Fixed push_notifications targetRoles schema')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Add back the JSONB column
  await payload.db.drizzle.execute(sql`
    ALTER TABLE push_notifications
    ADD COLUMN IF NOT EXISTS target_roles JSONB NOT NULL DEFAULT '[]'::jsonb
  `)

  // Migrate data back from the join table to JSONB column
  await payload.db.drizzle.execute(sql`
    UPDATE push_notifications pn
    SET target_roles = (
      SELECT jsonb_agg(ptr.value ORDER BY ptr."order")
      FROM push_notifications_target_roles ptr
      WHERE ptr.parent_id = pn.id
    )
    WHERE EXISTS (
      SELECT 1 FROM push_notifications_target_roles ptr
      WHERE ptr.parent_id = pn.id
    )
  `)

  // Drop the join table
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS push_notifications_target_roles CASCADE
  `)

  console.log('✓ Rolled back push_notifications targetRoles schema fix')
}
