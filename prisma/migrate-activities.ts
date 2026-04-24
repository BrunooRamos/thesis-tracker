/**
 * One-off migration to create Activity-related tables and columns.
 *
 * Bypasses `prisma db push` because Prisma CLI can't reach Neon on TCP 5432
 * (only the serverless driver works). Runs raw SQL via the same @prisma/adapter-pg
 * that the runtime uses successfully.
 *
 * Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.
 *
 *   npx tsx prisma/migrate-activities.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function run(label: string, sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✔ ${label}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Swallow "already exists" errors so the script is idempotent
    if (/already exists|duplicate/i.test(msg)) {
      console.log(`  = ${label} (already exists)`);
    } else {
      console.log(`  ✖ ${label}`);
      throw err;
    }
  }
}

async function main() {
  console.log("🚀 Running Activity migrations...\n");

  console.log("📦 Enum:");
  await run(
    "ActivityStatus enum",
    `DO $$ BEGIN
       CREATE TYPE "ActivityStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE');
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );

  console.log("\n📦 Tables:");
  await run(
    "Activity table",
    `CREATE TABLE IF NOT EXISTS "Activity" (
       "id"          TEXT        NOT NULL PRIMARY KEY,
       "wbsCode"     TEXT        NOT NULL,
       "name"        TEXT        NOT NULL,
       "description" TEXT,
       "status"      "ActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
       "startDate"   TIMESTAMP(3),
       "endDate"     TIMESTAMP(3),
       "phaseId"     TEXT        NOT NULL,
       "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt"   TIMESTAMP(3) NOT NULL
     );`
  );
  await run(
    "Activity.wbsCode unique index",
    `CREATE UNIQUE INDEX IF NOT EXISTS "Activity_wbsCode_key" ON "Activity"("wbsCode");`
  );
  await run(
    "Activity.phaseId FK",
    `DO $$ BEGIN
       ALTER TABLE "Activity" ADD CONSTRAINT "Activity_phaseId_fkey"
         FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );

  await run(
    "Deliverable table",
    `CREATE TABLE IF NOT EXISTS "Deliverable" (
       "id"          TEXT        NOT NULL PRIMARY KEY,
       "title"       TEXT        NOT NULL,
       "description" TEXT,
       "fileUrl"     TEXT,
       "fileName"    TEXT,
       "fileType"    TEXT,
       "order"       INTEGER     NOT NULL DEFAULT 0,
       "activityId"  TEXT        NOT NULL,
       "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
     );`
  );
  await run(
    "Deliverable.activityId FK",
    `DO $$ BEGIN
       ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_activityId_fkey"
         FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );

  await run(
    "AcceptanceCriterion table",
    `CREATE TABLE IF NOT EXISTS "AcceptanceCriterion" (
       "id"         TEXT        NOT NULL PRIMARY KEY,
       "text"       TEXT        NOT NULL,
       "done"       BOOLEAN     NOT NULL DEFAULT false,
       "order"      INTEGER     NOT NULL DEFAULT 0,
       "activityId" TEXT        NOT NULL,
       "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
     );`
  );
  await run(
    "AcceptanceCriterion.activityId FK",
    `DO $$ BEGIN
       ALTER TABLE "AcceptanceCriterion" ADD CONSTRAINT "AcceptanceCriterion_activityId_fkey"
         FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );

  // Prisma implicit many-to-many: table named _<relationName>
  // Relation "activityOwners" between Activity and User → _activityOwners
  // Columns A = Activity.id (first alphabetically), B = User.id
  console.log("\n🔗 Join table (Activity ↔ User owners):");
  await run(
    "_activityOwners table",
    `CREATE TABLE IF NOT EXISTS "_activityOwners" (
       "A" TEXT NOT NULL,
       "B" TEXT NOT NULL,
       CONSTRAINT "_activityOwners_AB_pkey" PRIMARY KEY ("A", "B")
     );`
  );
  await run(
    "_activityOwners B index",
    `CREATE INDEX IF NOT EXISTS "_activityOwners_B_index" ON "_activityOwners"("B");`
  );
  await run(
    "_activityOwners.A FK",
    `DO $$ BEGIN
       ALTER TABLE "_activityOwners" ADD CONSTRAINT "_activityOwners_A_fkey"
         FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );
  await run(
    "_activityOwners.B FK",
    `DO $$ BEGIN
       ALTER TABLE "_activityOwners" ADD CONSTRAINT "_activityOwners_B_fkey"
         FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );

  console.log("\n🔧 New columns on existing tables:");
  await run(
    `Task.activityId column`,
    `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "activityId" TEXT;`
  );
  await run(
    `Task.activityId FK`,
    `DO $$ BEGIN
       ALTER TABLE "Task" ADD CONSTRAINT "Task_activityId_fkey"
         FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );
  await run(
    `Comment.activityId column`,
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "activityId" TEXT;`
  );
  await run(
    `Comment.activityId FK`,
    `DO $$ BEGIN
       ALTER TABLE "Comment" ADD CONSTRAINT "Comment_activityId_fkey"
         FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;`
  );

  console.log("\n✅ Migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
