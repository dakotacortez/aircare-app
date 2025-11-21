import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: Force fix parent_id columns in push_notifications_target_roles
 *
 * This migration ensures that the push_notifications_target_roles table
 * uses the correct column names that Payload's query builder expects.
 *
 * Background: Payload's dev mode auto-sync creates columns with underscore
 * prefixes (_parent_id, _order), but the query builder references them
 * without prefixes (parent_id, order). This migration fixes that mismatch.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting forced parent_id column fix...')

  // First, check if the table exists
  const tableCheck = await payload.db.drizzle.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'push_notifications_target_roles'
    ) as exists
  `)

  if (!tableCheck.rows?.[0]?.exists) {
    console.log('Table push_notifications_target_roles does not exist, skipping...')
    return
  }

  // Handle _parent_id -> parent_id renaming
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      -- Check if _parent_id exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = '_parent_id'
      ) THEN
        -- Check if parent_id already exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'push_notifications_target_roles'
            AND column_name = 'parent_id'
        ) THEN
          -- Both exist, drop the underscore version
          RAISE NOTICE 'Both _parent_id and parent_id exist, dropping _parent_id';
          ALTER TABLE push_notifications_target_roles DROP COLUMN _parent_id;
        ELSE
          -- Only _parent_id exists, rename it
          RAISE NOTICE 'Renaming _parent_id to parent_id';
          ALTER TABLE push_notifications_target_roles RENAME COLUMN _parent_id TO parent_id;
        END IF;
      ELSE
        -- _parent_id doesn't exist, make sure parent_id does
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'push_notifications_target_roles'
            AND column_name = 'parent_id'
        ) THEN
          RAISE NOTICE 'Adding parent_id column';
          ALTER TABLE push_notifications_target_roles ADD COLUMN parent_id INTEGER;
        END IF;
      END IF;
    END $$;
  `)

  // Handle _order -> order renaming
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      -- Check if _order exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = '_order'
      ) THEN
        -- Check if order already exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'push_notifications_target_roles'
            AND column_name = 'order'
        ) THEN
          -- Both exist, drop the underscore version
          RAISE NOTICE 'Both _order and "order" exist, dropping _order';
          ALTER TABLE push_notifications_target_roles DROP COLUMN _order;
        ELSE
          -- Only _order exists, rename it
          RAISE NOTICE 'Renaming _order to "order"';
          ALTER TABLE push_notifications_target_roles RENAME COLUMN _order TO "order";
        END IF;
      ELSE
        -- _order doesn't exist, make sure order does
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'push_notifications_target_roles'
            AND column_name = 'order'
        ) THEN
          RAISE NOTICE 'Adding "order" column';
          ALTER TABLE push_notifications_target_roles ADD COLUMN "order" INTEGER;
        END IF;
      END IF;
    END $$;
  `)

  // Make sure the columns are NOT NULL
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      -- Set parent_id to NOT NULL if it has no null values
      IF NOT EXISTS (
        SELECT 1 FROM push_notifications_target_roles WHERE parent_id IS NULL
      ) THEN
        ALTER TABLE push_notifications_target_roles
        ALTER COLUMN parent_id SET NOT NULL;
      END IF;

      -- Set order to NOT NULL if it has no null values
      IF NOT EXISTS (
        SELECT 1 FROM push_notifications_target_roles WHERE "order" IS NULL
      ) THEN
        ALTER TABLE push_notifications_target_roles
        ALTER COLUMN "order" SET NOT NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If there are no rows, the check will fail, that's ok
      ALTER TABLE push_notifications_target_roles
        ALTER COLUMN parent_id SET NOT NULL,
        ALTER COLUMN "order" SET NOT NULL;
    END $$;
  `)

  // Ensure foreign key constraint exists
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      -- Drop existing constraint if it exists (with either name)
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notifications_target_roles_parent_fk'
          AND table_name = 'push_notifications_target_roles'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        DROP CONSTRAINT push_notifications_target_roles_parent_fk;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notifications_target_roles_parent_id_fk'
          AND table_name = 'push_notifications_target_roles'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        DROP CONSTRAINT push_notifications_target_roles_parent_id_fk;
      END IF;

      -- Add the constraint
      ALTER TABLE push_notifications_target_roles
      ADD CONSTRAINT push_notifications_target_roles_parent_id_fk
        FOREIGN KEY (parent_id)
        REFERENCES push_notifications(id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
    END $$;
  `)

  // Ensure indexes exist
  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS push_notifications_target_roles_order_idx
      ON push_notifications_target_roles USING btree ("order")
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS push_notifications_target_roles_parent_idx
      ON push_notifications_target_roles USING btree (parent_id)
  `)

  console.log('✓ Forced parent_id column fix completed')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Rename columns back to underscore versions
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = 'parent_id'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        RENAME COLUMN parent_id TO _parent_id;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = 'order'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        RENAME COLUMN "order" TO _order;
      END IF;
    END $$;
  `)

  console.log('✓ Rolled back parent_id column fix')
}
