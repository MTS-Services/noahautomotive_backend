/**
 * migrate-db.js
 * Copies all data from OLD database to NEW database.
 * Run:  node scripts/migrate-db.js
 */

const { PrismaClient } = require("@prisma/client");

const SOURCE_URL =
  "postgres://postgres:Ii58bgPu5qkFKFkcdPnh9myXbYFcqa1bk5hRwNrgPmAv4p77Bgo4MjDVGNIlGFAw@147.93.107.217:5426/postgres";

const DEST_URL =
  "postgres://postgres:epV9VvdNCl4OFs5hKvsVvJYoYrxkfJ2mFzrn29S8ptEoSPhgQY5wNBBnY9vTOEqs@187.77.96.96:5427/postgres";

const source = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } });
const dest = new PrismaClient({ datasources: { db: { url: DEST_URL } } });

const BATCH = 500; // rows per insert batch

async function copyTable(name, fetchFn, createFn) {
  let skip = 0;
  let total = 0;
  process.stdout.write(`  ${name} ... `);
  while (true) {
    const rows = await fetchFn(skip, BATCH);
    if (rows.length === 0) break;
    // Insert in chunks to avoid query size limits
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await createFn(chunk);
    }
    total += rows.length;
    skip += rows.length;
    if (rows.length < BATCH) break;
  }
  console.log(`${total} rows`);
}

async function main() {
  console.log("Connecting to both databases...");
  await source.$connect();
  await dest.$connect();

  console.log("\nCopying tables (order respects foreign keys):\n");

  // 1. users
  await copyTable(
    "users",
    (skip, take) =>
      source.user.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dest.user.createMany({ data: rows, skipDuplicates: true }),
  );

  // 2. otp_verifications
  await copyTable(
    "otp_verifications",
    (skip, take) =>
      source.otpVerification.findMany({
        skip,
        take,
        orderBy: { createdAt: "asc" },
      }),
    (rows) =>
      dest.otpVerification.createMany({ data: rows, skipDuplicates: true }),
  );

  // 3. listings
  await copyTable(
    "listings",
    (skip, take) =>
      source.listing.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dest.listing.createMany({ data: rows, skipDuplicates: true }),
  );

  // 4. listing_images
  await copyTable(
    "listing_images",
    (skip, take) =>
      source.listingImage.findMany({
        skip,
        take,
        orderBy: { createdAt: "asc" },
      }),
    (rows) =>
      dest.listingImage.createMany({ data: rows, skipDuplicates: true }),
  );

  // 5. reviews
  await copyTable(
    "reviews",
    (skip, take) =>
      source.review.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dest.review.createMany({ data: rows, skipDuplicates: true }),
  );

  // 6. conversations
  await copyTable(
    "conversations",
    (skip, take) =>
      source.conversation.findMany({
        skip,
        take,
        orderBy: { createdAt: "asc" },
      }),
    (rows) =>
      dest.conversation.createMany({ data: rows, skipDuplicates: true }),
  );

  // 7. conversation_participants
  await copyTable(
    "conversation_participants",
    (skip, take) =>
      source.conversationParticipant.findMany({
        skip,
        take,
        orderBy: { createdAt: "asc" },
      }),
    (rows) =>
      dest.conversationParticipant.createMany({
        data: rows,
        skipDuplicates: true,
      }),
  );

  // 8. messages
  await copyTable(
    "messages",
    (skip, take) =>
      source.message.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dest.message.createMany({ data: rows, skipDuplicates: true }),
  );

  console.log("\nAll tables copied successfully.");
}

main()
  .catch((e) => {
    console.error("\nERROR:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await dest.$disconnect();
  });
