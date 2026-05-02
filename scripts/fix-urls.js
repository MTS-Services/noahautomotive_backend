/**
 * One-time script: replaces old base URL with new base URL in every
 * column that stores uploaded file paths.
 *
 * Run: node scripts/fix-urls.js
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const OLD = "https://backendnoahautomotive.mtscorporate.com";
const NEW = "https://backend.c4r.co.uk";

async function replaceInColumn(table, column) {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "${table}" SET "${column}" = REPLACE("${column}", $1, $2) WHERE "${column}" LIKE $3`,
    OLD,
    NEW,
    `${OLD}%`,
  );
  console.log(`  ${table}.${column}: ${result} row(s) updated`);
}

async function main() {
  console.log(`Replacing\n  OLD: ${OLD}\n  NEW: ${NEW}\n`);

  await replaceInColumn("listing_images", "url");
  await replaceInColumn("users", "profileImage");
  await replaceInColumn("users", "bannerImage");
  await replaceInColumn("messages", "mediaUrl");

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
