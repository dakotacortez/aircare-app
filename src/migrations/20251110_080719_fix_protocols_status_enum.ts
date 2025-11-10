import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add missing values to the protocols status enum
  // Each ADD VALUE must be in its own statement
  await db.execute(sql`ALTER TYPE "public"."enum_protocols_status" ADD VALUE IF NOT EXISTS 'review'`)
  await db.execute(sql`ALTER TYPE "public"."enum_protocols_status" ADD VALUE IF NOT EXISTS 'active'`)
  await db.execute(sql`ALTER TYPE "public"."enum_protocols_status" ADD VALUE IF NOT EXISTS 'archived'`)

  // Also update the versions table enum
  await db.execute(sql`ALTER TYPE "public"."enum__protocols_v_version_status" ADD VALUE IF NOT EXISTS 'review'`)
  await db.execute(sql`ALTER TYPE "public"."enum__protocols_v_version_status" ADD VALUE IF NOT EXISTS 'active'`)
  await db.execute(sql`ALTER TYPE "public"."enum__protocols_v_version_status" ADD VALUE IF NOT EXISTS 'archived'`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly
  // You would need to recreate the enum type to remove values
  // For now, this is a no-op as removing enum values is complex
  await db.execute(sql`
    -- Cannot easily remove enum values in PostgreSQL
    -- Would require recreating the enum and updating all dependent columns
  `)
}
