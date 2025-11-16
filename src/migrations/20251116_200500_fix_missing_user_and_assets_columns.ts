import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Audit missing columns for users + payload locked documents rels.
 *
 * Adds/repairs:
 * - Ensures the assets collection table/enum exist (so Payload admin queries succeed)
 * - Adds missing assets_id column + FK on payload_locked_documents_rels
 * - Adds missing profile_image_id column + FK on users
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Ensure enum for assets.type exists
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_assets_type'
      ) THEN
        EXECUTE $sql$
          CREATE TYPE "public"."enum_assets_type" AS ENUM(
            'bls',
            'als',
            'micu',
            'cct',
            'helicopter',
            'chase',
            'support',
            'other'
          );
        $sql$;
      END IF;
    END $$;

    -- Ensure assets table exists
    CREATE TABLE IF NOT EXISTS "assets" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer,
      "name" varchar NOT NULL,
      "type" "public"."enum_assets_type" NOT NULL,
      "tail_number" varchar,
      "notes" text,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Guarantee unique constraint on asset name
    DO $$
    BEGIN
      ALTER TABLE "assets"
        ADD CONSTRAINT "assets_name_unique" UNIQUE ("name");
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Helpful indexes for ordering/filtering assets
    CREATE INDEX IF NOT EXISTS "assets__order_idx" ON "assets" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "assets_type_idx" ON "assets" USING btree ("type");

    -- Add missing assets_id column to payload_locked_documents_rels
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "assets_id" integer;

    -- Ensure FK for assets_id exists
    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_assets_fk"
        FOREIGN KEY ("assets_id") REFERENCES "assets"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_assets_id_idx"
      ON "payload_locked_documents_rels" USING btree ("assets_id");

    -- Add missing profile_image_id column to users
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "profile_image_id" integer;

    -- Ensure FK for profile image exists
    DO $$
    BEGIN
      ALTER TABLE "users"
        ADD CONSTRAINT "users_profile_image_id_media_id_fk"
        FOREIGN KEY ("profile_image_id") REFERENCES "media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "users_profile_image_id_idx"
      ON "users" USING btree ("profile_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove users profile image FK/index/column
    DROP INDEX IF EXISTS "users_profile_image_id_idx";

    DO $$
    BEGIN
      ALTER TABLE "users"
        DROP CONSTRAINT "users_profile_image_id_media_id_fk";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;

    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "profile_image_id";

    -- Remove payload_locked_documents_rels assets FK/index/column
    DROP INDEX IF EXISTS "payload_locked_documents_rels_assets_id_idx";

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        DROP CONSTRAINT "payload_locked_documents_rels_assets_fk";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "assets_id";

    -- Drop assets indexes/constraints/table/enum
    DROP INDEX IF EXISTS "assets__order_idx";
    DROP INDEX IF EXISTS "assets_type_idx";

    DO $$
    BEGIN
      ALTER TABLE "assets"
        DROP CONSTRAINT "assets_name_unique";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;

    DROP TABLE IF EXISTS "assets" CASCADE;

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_assets_type') THEN
        DROP TYPE "public"."enum_assets_type";
      END IF;
    END $$;
  `)
}
