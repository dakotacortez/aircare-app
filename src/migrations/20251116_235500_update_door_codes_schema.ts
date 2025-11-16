import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure the bases/hospitals door codes tables match the updated field schema.
 *
 * - Adds the missing `label` column (if needed)
 * - Renames legacy `door_code` columns to `code` when the new column does not exist yet
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hospitals_door_codes'
          AND column_name = 'label'
      ) THEN
        ALTER TABLE "hospitals_door_codes"
          ADD COLUMN "label" varchar;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bases_door_codes'
          AND column_name = 'label'
      ) THEN
        ALTER TABLE "bases_door_codes"
          ADD COLUMN "label" varchar;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hospitals_door_codes'
          AND column_name = 'door_code'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hospitals_door_codes'
          AND column_name = 'code'
      ) THEN
        ALTER TABLE "hospitals_door_codes"
          RENAME COLUMN "door_code" TO "code";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bases_door_codes'
          AND column_name = 'door_code'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bases_door_codes'
          AND column_name = 'code'
      ) THEN
        ALTER TABLE "bases_door_codes"
          RENAME COLUMN "door_code" TO "code";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospitals_door_codes"
      DROP COLUMN IF EXISTS "label";

    ALTER TABLE "bases_door_codes"
      DROP COLUMN IF EXISTS "label";

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hospitals_door_codes'
          AND column_name = 'door_code'
      ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hospitals_door_codes'
          AND column_name = 'code'
      ) THEN
        ALTER TABLE "hospitals_door_codes"
          RENAME COLUMN "code" TO "door_code";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bases_door_codes'
          AND column_name = 'door_code'
      ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bases_door_codes'
          AND column_name = 'code'
      ) THEN
        ALTER TABLE "bases_door_codes"
          RENAME COLUMN "code" TO "door_code";
      END IF;
    END $$;
  `)
}
