import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add logo field to header
    ALTER TABLE "header" ADD COLUMN IF NOT EXISTS "logo_id" integer;

    -- Create site_settings table
    CREATE TABLE IF NOT EXISTS "site_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "site_name" varchar,
      "logo_id" integer,
      "favicon_id" integer,
      "hero_background_image_id" integer,
      "hero_badge_text" varchar,
      "hero_title" varchar,
      "hero_highlight" varchar,
      "hero_subtitle" varchar,
      "hero_primary_button_text" varchar,
      "hero_primary_button_link" varchar,
      "hero_secondary_button_text" varchar,
      "hero_secondary_button_link" varchar,
      "features_title" varchar,
      "features_subtitle" varchar,
      "cta_title" varchar,
      "cta_subtitle" varchar,
      "cta_primary_button_text" varchar,
      "cta_secondary_button_text" varchar,
      "contact_email" varchar,
      "contact_phone" varchar,
      "meta_title" varchar,
      "meta_description" varchar,
      "meta_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Create site_settings stats array table
    CREATE TABLE IF NOT EXISTS "site_settings_stats" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "number" varchar,
      "label" varchar
    );

    -- Create site_settings social links array table
    CREATE TABLE IF NOT EXISTS "site_settings_social_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "platform" varchar,
      "url" varchar
    );

    -- Create site_settings relationships table
    CREATE TABLE IF NOT EXISTS "site_settings_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    -- Add foreign keys
    DO $$ BEGIN
      ALTER TABLE "header" ADD CONSTRAINT "header_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_stats" ADD CONSTRAINT "site_settings_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "site_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "site_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "site_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "header_logo_idx" ON "header" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
    CREATE INDEX IF NOT EXISTS "site_settings_hero_background_image_idx" ON "site_settings" USING btree ("hero_background_image_id");
    CREATE INDEX IF NOT EXISTS "site_settings_meta_image_idx" ON "site_settings" USING btree ("meta_image_id");
    CREATE INDEX IF NOT EXISTS "site_settings_stats_order_idx" ON "site_settings_stats" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_stats_parent_id_idx" ON "site_settings_stats" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");

    -- Insert default site_settings row
    INSERT INTO "site_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove logo field from header
    ALTER TABLE "header" DROP COLUMN IF EXISTS "logo_id";

    -- Drop site_settings tables
    DROP TABLE IF EXISTS "site_settings_rels";
    DROP TABLE IF EXISTS "site_settings_social_links";
    DROP TABLE IF EXISTS "site_settings_stats";
    DROP TABLE IF EXISTS "site_settings";
  `);
}
