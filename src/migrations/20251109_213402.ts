import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_protocols_category" AS ENUM('medical', 'trauma', 'pediatric', 'neonatal', 'obgyn', 'procedures', 'behavioral', 'environmental', 'special-ops');
  CREATE TYPE "public"."enum_protocols_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__protocols_v_version_category" AS ENUM('medical', 'trauma', 'pediatric', 'neonatal', 'obgyn', 'procedures', 'behavioral', 'environmental', 'special-ops');
  CREATE TYPE "public"."enum__protocols_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "protocols" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"protocol_number" varchar,
  	"category" "enum_protocols_category",
  	"subcategory" varchar,
  	"content" jsonb,
  	"indications" jsonb,
  	"contraindications" jsonb,
  	"considerations" jsonb,
  	"effective_date" timestamp(3) with time zone,
  	"last_reviewed" timestamp(3) with time zone,
  	"next_review" timestamp(3) with time zone,
  	"version_number" varchar,
  	"status" "enum_protocols_status" DEFAULT 'draft',
  	"keywords" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_protocols_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "protocols_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_protocols_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_protocol_number" varchar,
  	"version_category" "enum__protocols_v_version_category",
  	"version_subcategory" varchar,
  	"version_content" jsonb,
  	"version_indications" jsonb,
  	"version_contraindications" jsonb,
  	"version_considerations" jsonb,
  	"version_effective_date" timestamp(3) with time zone,
  	"version_last_reviewed" timestamp(3) with time zone,
  	"version_next_review" timestamp(3) with time zone,
  	"version_version_number" varchar,
  	"version_status" "enum__protocols_v_version_status" DEFAULT 'draft',
  	"version_keywords" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__protocols_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_protocols_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "protocols_id" integer;
  ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "protocols_rels" ADD CONSTRAINT "protocols_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_protocols_v" ADD CONSTRAINT "_protocols_v_parent_id_protocols_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."protocols"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_protocols_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_protocols_v_rels" ADD CONSTRAINT "_protocols_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "protocols_updated_at_idx" ON "protocols" USING btree ("updated_at");
  CREATE INDEX "protocols_created_at_idx" ON "protocols" USING btree ("created_at");
  CREATE INDEX "protocols__status_idx" ON "protocols" USING btree ("_status");
  CREATE INDEX "protocols_rels_order_idx" ON "protocols_rels" USING btree ("order");
  CREATE INDEX "protocols_rels_parent_idx" ON "protocols_rels" USING btree ("parent_id");
  CREATE INDEX "protocols_rels_path_idx" ON "protocols_rels" USING btree ("path");
  CREATE INDEX "protocols_rels_media_id_idx" ON "protocols_rels" USING btree ("media_id");
  CREATE INDEX "_protocols_v_parent_idx" ON "_protocols_v" USING btree ("parent_id");
  CREATE INDEX "_protocols_v_version_version_updated_at_idx" ON "_protocols_v" USING btree ("version_updated_at");
  CREATE INDEX "_protocols_v_version_version_created_at_idx" ON "_protocols_v" USING btree ("version_created_at");
  CREATE INDEX "_protocols_v_version_version__status_idx" ON "_protocols_v" USING btree ("version__status");
  CREATE INDEX "_protocols_v_created_at_idx" ON "_protocols_v" USING btree ("created_at");
  CREATE INDEX "_protocols_v_updated_at_idx" ON "_protocols_v" USING btree ("updated_at");
  CREATE INDEX "_protocols_v_latest_idx" ON "_protocols_v" USING btree ("latest");
  CREATE INDEX "_protocols_v_autosave_idx" ON "_protocols_v" USING btree ("autosave");
  CREATE INDEX "_protocols_v_rels_order_idx" ON "_protocols_v_rels" USING btree ("order");
  CREATE INDEX "_protocols_v_rels_parent_idx" ON "_protocols_v_rels" USING btree ("parent_id");
  CREATE INDEX "_protocols_v_rels_path_idx" ON "_protocols_v_rels" USING btree ("path");
  CREATE INDEX "_protocols_v_rels_media_id_idx" ON "_protocols_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_protocols_fk" FOREIGN KEY ("protocols_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_protocols_id_idx" ON "payload_locked_documents_rels" USING btree ("protocols_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "protocols" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "protocols_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_protocols_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_protocols_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "protocols" CASCADE;
  DROP TABLE "protocols_rels" CASCADE;
  DROP TABLE "_protocols_v" CASCADE;
  DROP TABLE "_protocols_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_protocols_fk";
  
  DROP INDEX "payload_locked_documents_rels_protocols_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "protocols_id";
  DROP TYPE "public"."enum_protocols_category";
  DROP TYPE "public"."enum_protocols_status";
  DROP TYPE "public"."enum__protocols_v_version_category";
  DROP TYPE "public"."enum__protocols_v_version_status";`)
}
