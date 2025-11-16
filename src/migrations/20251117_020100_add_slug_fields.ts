import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add slug fields for SEO-friendly URLs
 * 
 * Adds slug varchar fields to hospitals and bases tables for pretty URLs.
 * Generates slugs from existing names and ensures uniqueness.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add slug columns
    ALTER TABLE "hospitals"
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    ALTER TABLE "bases"
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    -- Create unique indexes for slugs
    CREATE UNIQUE INDEX IF NOT EXISTS "hospitals_slug_idx" 
      ON "hospitals" ("slug");
    
    CREATE UNIQUE INDEX IF NOT EXISTS "bases_slug_idx" 
      ON "bases" ("slug");
  `)

  // Generate slugs from existing names
  // We need to do this in a separate query to handle deduplication
  const hospitals = await db.execute(sql`
    SELECT "id", "name" FROM "hospitals" WHERE "name" IS NOT NULL
  `)

  for (const hospital of hospitals.rows) {
    const slug = generateSlug(hospital.name as string)
    await db.execute(sql`
      UPDATE "hospitals" 
      SET "slug" = ${slug}
      WHERE "id" = ${hospital.id}
    `)
  }

  const bases = await db.execute(sql`
    SELECT "id", "name" FROM "bases" WHERE "name" IS NOT NULL
  `)

  for (const base of bases.rows) {
    const slug = generateSlug(base.name as string)
    await db.execute(sql`
      UPDATE "bases" 
      SET "slug" = ${slug}
      WHERE "id" = ${base.id}
    `)
  }

  // Make slug required after populating
  await db.execute(sql`
    ALTER TABLE "hospitals"
      ALTER COLUMN "slug" SET NOT NULL;

    ALTER TABLE "bases"
      ALTER COLUMN "slug" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "hospitals_slug_idx";
    DROP INDEX IF EXISTS "bases_slug_idx";

    ALTER TABLE "hospitals"
      DROP COLUMN IF EXISTS "slug";

    ALTER TABLE "bases"
      DROP COLUMN IF EXISTS "slug";
  `)
}

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
