import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Overhaul Protocols Collection + Add Medications
 *
 * Changes:
 * 1. Creates new Medications collection with comprehensive drug information
 * 2. Replaces protocol Lexical content fields with sections array structure
 * 3. Adds medications relationship to protocols
 * 4. Changes protocol_number field name to code
 * 5. Adds last_modified field, relatedProtocols, tags
 *
 * BREAKING: This migration removes old content fields (contentUniversal, contentBLS, etc.)
 * Existing protocol data will be lost if not backed up.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- =====================================================================
    -- CREATE MEDICATIONS COLLECTION
    -- =====================================================================

    CREATE TYPE "public"."enum_medications_class" AS ENUM(
      'vasopressor', 'antiarrhythmic', 'analgesic', 'sedative',
      'antiemetic', 'bronchodilator', 'anticonvulsant', 'antihypertensive',
      'antiplatelet', 'anticoagulant', 'paralytic', 'reversal', 'other'
    );

    CREATE TYPE "public"."enum_medications_scope" AS ENUM('BLS', 'ALS', 'CCT');
    CREATE TYPE "public"."enum_medications_doses_route" AS ENUM('IV', 'IO', 'IV/IO', 'IM', 'SQ', 'PO', 'SL', 'IN', 'INH', 'ET', 'PR');
    CREATE TYPE "public"."enum_medications_pregnancy_category" AS ENUM('A', 'B', 'C', 'D', 'X');

    CREATE TABLE "medications" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL UNIQUE,
      "generic_name" varchar,
      "class" "enum_medications_class" NOT NULL,
      "scope" jsonb NOT NULL DEFAULT '["ALS","CCT"]',
      "doses" jsonb,
      "indications" jsonb,
      "contraindications" jsonb,
      "precautions" jsonb,
      "mechanism_of_action" jsonb,
      "onset" varchar,
      "duration" varchar,
      "side_effects" jsonb,
      "mixing" jsonb,
      "compatibility" jsonb,
      "titration" jsonb,
      "special_instructions" jsonb,
      "pregnancy_category" "enum_medications_pregnancy_category",
      "notes" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX "medications_name_idx" ON "medications" USING btree ("name");
    CREATE INDEX "medications_class_idx" ON "medications" USING btree ("class");
    CREATE INDEX "medications_updated_at_idx" ON "medications" USING btree ("updated_at");
    CREATE INDEX "medications_created_at_idx" ON "medications" USING btree ("created_at");

    -- Medications locked documents relationship
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "medications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_medications_fk"
      FOREIGN KEY ("medications_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;

    -- =====================================================================
    -- UPDATE PROTOCOLS COLLECTION
    -- =====================================================================

    -- Rename protocol_number to code
    ALTER TABLE "protocols" RENAME COLUMN "protocol_number" TO "code";
    ALTER TABLE "_protocols_v" RENAME COLUMN "version_protocol_number" TO "version_code";

    -- Drop old Lexical content fields
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "content_universal";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "content_bls";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "content_als";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "content_cct";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "special_considerations";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "key_points";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "references";

    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_content_universal";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_content_bls";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_content_als";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_content_cct";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_special_considerations";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_key_points";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_references";

    -- Add new sections field (JSONB array)
    ALTER TABLE "protocols" ADD COLUMN "sections" jsonb NOT NULL DEFAULT '[]';
    ALTER TABLE "_protocols_v" ADD COLUMN "version_sections" jsonb;

    -- Add last_modified field (replacing next_review)
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "next_review";
    ALTER TABLE "protocols" ALTER COLUMN "last_reviewed" DROP NOT NULL;
    ALTER TABLE "protocols" ALTER COLUMN "effective_date" DROP NOT NULL;
    ALTER TABLE "protocols" ALTER COLUMN "version_number" DROP NOT NULL;
    ALTER TABLE "protocols" ALTER COLUMN "subcategory" DROP NOT NULL;
    ALTER TABLE "protocols" ADD COLUMN "last_modified" varchar;

    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_next_review";
    ALTER TABLE "_protocols_v" ADD COLUMN "version_last_modified" varchar;

    -- Add tags field (JSONB array)
    ALTER TABLE "protocols" ADD COLUMN "tags" jsonb DEFAULT '[]';
    ALTER TABLE "_protocols_v" ADD COLUMN "version_tags" jsonb;

    -- Update protocols_rels to handle medications and relatedProtocols relationships
    -- Drop old path constraint
    ALTER TABLE "protocols_rels" DROP CONSTRAINT IF EXISTS "protocols_rels_path_check";
    ALTER TABLE "_protocols_v_rels" DROP CONSTRAINT IF EXISTS "_protocols_v_rels_path_check";

    -- Add new relationship columns
    ALTER TABLE "protocols_rels" ADD COLUMN "medications_id" integer;
    ALTER TABLE "protocols_rels" ADD COLUMN "protocols_id" integer;
    ALTER TABLE "protocols_rels" ADD COLUMN "calculators_id" integer;

    ALTER TABLE "_protocols_v_rels" ADD COLUMN "medications_id" integer;
    ALTER TABLE "_protocols_v_rels" ADD COLUMN "protocols_id" integer;
    ALTER TABLE "_protocols_v_rels" ADD COLUMN "calculators_id" integer;

    -- Add foreign key constraints
    ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_medications_fk"
      FOREIGN KEY ("medications_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_protocols_fk"
      FOREIGN KEY ("protocols_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_calculators_fk"
      FOREIGN KEY ("calculators_id") REFERENCES "public"."calculators"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_medications_fk"
      FOREIGN KEY ("medications_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_protocols_fk"
      FOREIGN KEY ("protocols_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_calculators_fk"
      FOREIGN KEY ("calculators_id") REFERENCES "public"."calculators"("id") ON DELETE cascade ON UPDATE no action;

    -- Add indexes for new relationships
    CREATE INDEX "protocols_rels_medications_id_idx" ON "protocols_rels" USING btree ("medications_id");
    CREATE INDEX "protocols_rels_protocols_id_idx" ON "protocols_rels" USING btree ("protocols_id");
    CREATE INDEX "protocols_rels_calculators_id_idx" ON "protocols_rels" USING btree ("calculators_id");

    CREATE INDEX "_protocols_v_rels_medications_id_idx" ON "_protocols_v_rels" USING btree ("medications_id");
    CREATE INDEX "_protocols_v_rels_protocols_id_idx" ON "_protocols_v_rels" USING btree ("protocols_id");
    CREATE INDEX "_protocols_v_rels_calculators_id_idx" ON "_protocols_v_rels" USING btree ("calculators_id");

    -- Add calculator_overrides field (JSONB array)
    ALTER TABLE "protocols" ADD COLUMN "calculator_overrides" jsonb DEFAULT '[]';
    ALTER TABLE "_protocols_v" ADD COLUMN "version_calculator_overrides" jsonb;

    -- Update path constraint to include new relationship types
    ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_path_check"
      CHECK ("path" IN ('attachments', 'medications', 'relatedProtocols', 'calculatorOverrides.calculator'));
    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_path_check"
      CHECK ("path" IN ('attachments', 'medications', 'relatedProtocols', 'calculatorOverrides.calculator'));

    -- Add index on code field
    CREATE INDEX "protocols_code_idx" ON "protocols" USING btree ("code");
    CREATE INDEX "_protocols_v_version_code_idx" ON "_protocols_v" USING btree ("version_code");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- =====================================================================
    -- REVERSE PROTOCOLS CHANGES
    -- =====================================================================

    -- Drop new fields
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "sections";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "last_modified";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "tags";
    ALTER TABLE "protocols" DROP COLUMN IF EXISTS "calculator_overrides";

    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_sections";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_last_modified";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_tags";
    ALTER TABLE "_protocols_v" DROP COLUMN IF EXISTS "version_calculator_overrides";

    -- Restore old Lexical content fields
    ALTER TABLE "protocols" ADD COLUMN "content_universal" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "content_bls" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "content_als" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "content_cct" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "special_considerations" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "key_points" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "references" jsonb;
    ALTER TABLE "protocols" ADD COLUMN "next_review" timestamp(3) with time zone;

    ALTER TABLE "_protocols_v" ADD COLUMN "version_content_universal" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_content_bls" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_content_als" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_content_cct" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_special_considerations" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_key_points" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_references" jsonb;
    ALTER TABLE "_protocols_v" ADD COLUMN "version_next_review" timestamp(3) with time zone;

    -- Rename code back to protocol_number
    ALTER TABLE "protocols" RENAME COLUMN "code" TO "protocol_number";
    ALTER TABLE "_protocols_v" RENAME COLUMN "version_code" TO "version_protocol_number";

    -- Drop new relationship columns
    ALTER TABLE "protocols_rels" DROP COLUMN IF EXISTS "medications_id";
    ALTER TABLE "protocols_rels" DROP COLUMN IF EXISTS "protocols_id";
    ALTER TABLE "protocols_rels" DROP COLUMN IF EXISTS "calculators_id";

    ALTER TABLE "_protocols_v_rels" DROP COLUMN IF EXISTS "medications_id";
    ALTER TABLE "_protocols_v_rels" DROP COLUMN IF EXISTS "protocols_id";
    ALTER TABLE "_protocols_v_rels" DROP COLUMN IF EXISTS "calculators_id";

    -- Restore old path constraint
    ALTER TABLE "protocols_rels" DROP CONSTRAINT IF EXISTS "protocols_rels_path_check";
    ALTER TABLE "_protocols_v_rels" DROP CONSTRAINT IF EXISTS "_protocols_v_rels_path_check";

    ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_path_check" CHECK ("path" = 'attachments');
    ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_path_check" CHECK ("path" = 'attachments');

    -- =====================================================================
    -- DROP MEDICATIONS COLLECTION
    -- =====================================================================

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "medications_id";

    DROP TABLE IF EXISTS "medications";
    DROP TYPE IF EXISTS "public"."enum_medications_class";
    DROP TYPE IF EXISTS "public"."enum_medications_scope";
    DROP TYPE IF EXISTS "public"."enum_medications_doses_route";
    DROP TYPE IF EXISTS "public"."enum_medications_pregnancy_category";
  `)
}
