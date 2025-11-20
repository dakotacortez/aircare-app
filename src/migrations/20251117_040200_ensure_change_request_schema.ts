import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure Change Request Schema Integrity
 *
 * This comprehensive fallback migration ensures all change request tables
 * and columns exist in the database. Change requests mirror the structure
 * of their parent collections (bases/hospitals) but nested under proposedData.
 *
 * Tables ensured:
 * - base_change_requests (main table)
 * - base_change_requests_proposed_data_contact_info
 * - base_change_requests_proposed_data_door_codes
 * - base_change_requests_proposed_data_hazards
 * - hospital_change_requests (main table)
 * - hospital_change_requests_proposed_data_other_phones
 * - hospital_change_requests_proposed_data_door_codes
 * - hospital_change_requests_proposed_data_hazards
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ========================================
    -- BASE CHANGE REQUESTS
    -- ========================================

    -- Ensure base_change_requests table exists
    CREATE TABLE IF NOT EXISTS "base_change_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" varchar,
      "target_base_id" integer,
      "status" varchar DEFAULT 'pending',
      "applied_at" timestamp(3) with time zone,
      "submitted_by_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Add missing columns to base_change_requests if needed
    ALTER TABLE "base_change_requests"
      ADD COLUMN IF NOT EXISTS "type" varchar,
      ADD COLUMN IF NOT EXISTS "target_base_id" integer,
      ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "applied_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "submitted_by_id" integer;

    -- Ensure proposedData group columns exist
    ALTER TABLE "base_change_requests"
      ADD COLUMN IF NOT EXISTS "proposed_data_name" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_squad_phone" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_coordinates" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_latitude" numeric,
      ADD COLUMN IF NOT EXISTS "proposed_data_longitude" numeric,
      ADD COLUMN IF NOT EXISTS "proposed_data_notes" text,
      ADD COLUMN IF NOT EXISTS "proposed_data_source_attribution" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_line1" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_line2" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_city" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_state" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_zip" varchar;

    -- Ensure base_change_requests_proposed_data_contact_info table exists
    CREATE TABLE IF NOT EXISTS "base_change_requests_proposed_data_contact_info" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "phone_number" varchar,
      "description" text
    );

    -- Add description if missing
    ALTER TABLE "base_change_requests_proposed_data_contact_info"
      ADD COLUMN IF NOT EXISTS "description" text;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "base_change_requests_proposed_data_contact_info_order_idx"
      ON "base_change_requests_proposed_data_contact_info" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "base_change_requests_proposed_data_contact_info_parent_idx"
      ON "base_change_requests_proposed_data_contact_info" USING btree ("_parent_id");

    -- Add foreign key if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'base_change_requests_proposed_data_contact_info_parent_fk'
      ) THEN
        ALTER TABLE "base_change_requests_proposed_data_contact_info"
          ADD CONSTRAINT "base_change_requests_proposed_data_contact_info_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "base_change_requests"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure base_change_requests_proposed_data_door_codes table exists
    CREATE TABLE IF NOT EXISTS "base_change_requests_proposed_data_door_codes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "code" varchar,
      "notes" text
    );

    -- Add notes if missing
    ALTER TABLE "base_change_requests_proposed_data_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "base_change_requests_proposed_data_door_codes_order_idx"
      ON "base_change_requests_proposed_data_door_codes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "base_change_requests_proposed_data_door_codes_parent_idx"
      ON "base_change_requests_proposed_data_door_codes" USING btree ("_parent_id");

    -- Add foreign key if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'base_change_requests_proposed_data_door_codes_parent_fk'
      ) THEN
        ALTER TABLE "base_change_requests_proposed_data_door_codes"
          ADD CONSTRAINT "base_change_requests_proposed_data_door_codes_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "base_change_requests"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure base_change_requests_proposed_data_hazards table exists
    CREATE TABLE IF NOT EXISTS "base_change_requests_proposed_data_hazards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "note" text
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "base_change_requests_proposed_data_hazards_order_idx"
      ON "base_change_requests_proposed_data_hazards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "base_change_requests_proposed_data_hazards_parent_idx"
      ON "base_change_requests_proposed_data_hazards" USING btree ("_parent_id");

    -- Add foreign key if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'base_change_requests_proposed_data_hazards_parent_fk'
      ) THEN
        ALTER TABLE "base_change_requests_proposed_data_hazards"
          ADD CONSTRAINT "base_change_requests_proposed_data_hazards_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "base_change_requests"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Add indexes for base_change_requests
    CREATE INDEX IF NOT EXISTS "base_change_requests_target_base_idx"
      ON "base_change_requests" USING btree ("target_base_id");
    CREATE INDEX IF NOT EXISTS "base_change_requests_submitted_by_idx"
      ON "base_change_requests" USING btree ("submitted_by_id");
    CREATE INDEX IF NOT EXISTS "base_change_requests_status_idx"
      ON "base_change_requests" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "base_change_requests_updated_at_idx"
      ON "base_change_requests" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "base_change_requests_created_at_idx"
      ON "base_change_requests" USING btree ("created_at");

    -- Add foreign keys for base_change_requests if they don't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'base_change_requests_target_base_fk'
      ) THEN
        ALTER TABLE "base_change_requests"
          ADD CONSTRAINT "base_change_requests_target_base_fk"
            FOREIGN KEY ("target_base_id") REFERENCES "bases"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'base_change_requests_submitted_by_fk'
      ) THEN
        ALTER TABLE "base_change_requests"
          ADD CONSTRAINT "base_change_requests_submitted_by_fk"
            FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    -- ========================================
    -- HOSPITAL CHANGE REQUESTS
    -- ========================================

    -- Ensure hospital_change_requests table exists
    CREATE TABLE IF NOT EXISTS "hospital_change_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" varchar,
      "target_hospital_id" integer,
      "status" varchar DEFAULT 'pending',
      "applied_at" timestamp(3) with time zone,
      "submitted_by_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Add missing columns to hospital_change_requests if needed
    ALTER TABLE "hospital_change_requests"
      ADD COLUMN IF NOT EXISTS "type" varchar,
      ADD COLUMN IF NOT EXISTS "target_hospital_id" integer,
      ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "applied_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "submitted_by_id" integer;

    -- Ensure proposedData group columns exist
    ALTER TABLE "hospital_change_requests"
      ADD COLUMN IF NOT EXISTS "proposed_data_name" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_squad_phone" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_coordinates" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_latitude" numeric,
      ADD COLUMN IF NOT EXISTS "proposed_data_longitude" numeric,
      ADD COLUMN IF NOT EXISTS "proposed_data_notes" text,
      ADD COLUMN IF NOT EXISTS "proposed_data_source_attribution" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_line1" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_line2" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_city" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_state" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_address_zip" varchar;

    -- Ensure hospital_change_requests_proposed_data_other_phones table exists
    CREATE TABLE IF NOT EXISTS "hospital_change_requests_proposed_data_other_phones" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "phone_number" varchar,
      "description" text
    );

    -- Add description if missing
    ALTER TABLE "hospital_change_requests_proposed_data_other_phones"
      ADD COLUMN IF NOT EXISTS "description" text;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_other_phones_order_idx"
      ON "hospital_change_requests_proposed_data_other_phones" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_other_phones_parent_idx"
      ON "hospital_change_requests_proposed_data_other_phones" USING btree ("_parent_id");

    -- Add foreign key if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_other_phones_parent_fk'
      ) THEN
        ALTER TABLE "hospital_change_requests_proposed_data_other_phones"
          ADD CONSTRAINT "hospital_change_requests_proposed_data_other_phones_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospital_change_requests"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure hospital_change_requests_proposed_data_door_codes table exists
    CREATE TABLE IF NOT EXISTS "hospital_change_requests_proposed_data_door_codes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "code" varchar,
      "notes" text
    );

    -- Add notes if missing
    ALTER TABLE "hospital_change_requests_proposed_data_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_door_codes_order_idx"
      ON "hospital_change_requests_proposed_data_door_codes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_door_codes_parent_idx"
      ON "hospital_change_requests_proposed_data_door_codes" USING btree ("_parent_id");

    -- Add foreign key if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_door_codes_parent_fk'
      ) THEN
        ALTER TABLE "hospital_change_requests_proposed_data_door_codes"
          ADD CONSTRAINT "hospital_change_requests_proposed_data_door_codes_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospital_change_requests"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure hospital_change_requests_proposed_data_hazards table exists
    CREATE TABLE IF NOT EXISTS "hospital_change_requests_proposed_data_hazards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "note" text
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_hazards_order_idx"
      ON "hospital_change_requests_proposed_data_hazards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_hazards_parent_idx"
      ON "hospital_change_requests_proposed_data_hazards" USING btree ("_parent_id");

    -- Add foreign key if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_hazards_parent_fk'
      ) THEN
        ALTER TABLE "hospital_change_requests_proposed_data_hazards"
          ADD CONSTRAINT "hospital_change_requests_proposed_data_hazards_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospital_change_requests"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Add indexes for hospital_change_requests
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_target_hospital_idx"
      ON "hospital_change_requests" USING btree ("target_hospital_id");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_submitted_by_idx"
      ON "hospital_change_requests" USING btree ("submitted_by_id");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_status_idx"
      ON "hospital_change_requests" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_updated_at_idx"
      ON "hospital_change_requests" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "hospital_change_requests_created_at_idx"
      ON "hospital_change_requests" USING btree ("created_at");

    -- Add foreign keys for hospital_change_requests if they don't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_target_hospital_fk'
      ) THEN
        ALTER TABLE "hospital_change_requests"
          ADD CONSTRAINT "hospital_change_requests_target_hospital_fk"
            FOREIGN KEY ("target_hospital_id") REFERENCES "hospitals"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_submitted_by_fk'
      ) THEN
        ALTER TABLE "hospital_change_requests"
          ADD CONSTRAINT "hospital_change_requests_submitted_by_fk"
            FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This is a safety migration, so down migration is minimal
  // We don't want to drop tables that might have been created by other migrations
  await db.execute(sql`
    -- This migration is designed to be a safety net
    -- Down migration intentionally does nothing to avoid data loss
    SELECT 1;
  `)
}
