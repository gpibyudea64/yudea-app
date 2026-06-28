/**
 * Seed script to add sample birthday data for the current week.
 * Run with: DATABASE_URL='postgresql://admin:password123@localhost:5432/postgres' DIRECT_URL='postgresql://admin:password123@localhost:5432/postgres' npx tsx prisma/seed-birthday.ts
 */
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🎂 Seeding birthday test data...");

  const families = await prisma.family.findMany();
  if (families.length === 0) {
    console.error("❌ No families found. Run the main seed first.");
    return;
  }

  const birthdayDates = [
    new Date("2026-06-28"), // Sunday
    new Date("2026-06-29"), // Monday
    new Date("2026-06-30"), // Tuesday
    new Date("2026-07-01"), // Wednesday
    new Date("2026-07-02"), // Thursday
    new Date("2026-07-03"), // Friday
    new Date("2026-07-04"), // Saturday
  ];

  const nameData = [
    { firstName: "Budi", lastName: "Santoso", gender: "MALE", role: "FAMILY_HEAD" },
    { firstName: "Sari", lastName: "Wijaya", gender: "FEMALE", role: "WIFE" },
    { firstName: "Agus", lastName: "Prasetyo", gender: "MALE", role: "CHILD" },
    { firstName: "Dewi", lastName: "Lestari", gender: "FEMALE", role: "CHILD" },
    { firstName: "Hendra", lastName: "Gunawan", gender: "MALE", role: "FAMILY_HEAD" },
    { firstName: "Rina", lastName: "Kusuma", gender: "FEMALE", role: "WIFE" },
    { firstName: "Adi", lastName: "Nugroho", gender: "MALE", role: "CHILD" },
    { firstName: "Maya", lastName: "Anggraini", gender: "FEMALE", role: "CUCU" },
    { firstName: "Cahyo", lastName: "Purnomo", gender: "MALE", role: "FAMILY_HEAD" },
    { firstName: "Linda", lastName: "Hartati", gender: "FEMALE", role: "WIFE" },
    { firstName: "Doni", lastName: "Setiawan", gender: "MALE", role: "CHILD" },
    { firstName: "Putri", lastName: "Wulandari", gender: "FEMALE", role: "CHILD" },
    { firstName: "Eko", lastName: "Susanto", gender: "MALE", role: "FAMILY_HEAD" },
    { firstName: "Yulia", lastName: "Fitriani", gender: "FEMALE", role: "WIFE" },
  ];

  let count = 0;
  for (const date of birthdayDates) {
    // Create 2 members per day, spread across different families
    for (let j = 0; j < 2; j++) {
      const idx = count % nameData.length;
      const person = nameData[idx];
      const family = families[(count) % families.length];

      const fullName = `${person.firstName} ${person.lastName}`;
      const id = `birthday-seed-${count}`;

      // Use raw SQL since the `name` column still exists in the DB
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Member" (
          id, "firstName", "lastName", name, "birthCity", gender, "birthDate",
          phone, email, "familyId", role, "isActive", "isDeceased"
        ) VALUES (
          $1, $2, $3, $4, $5, $6::"Gender", $7,
          $8, $9, $10, $11::"MemberRole", true, false
        ) ON CONFLICT (id) DO NOTHING`,
        id,
        person.firstName,
        person.lastName,
        fullName,
        ["Jakarta", "Bandung", "Surabaya", "Medan", "Makassar"][idx % 5],
        person.gender,
        date,
        `0812${String(10000000 + count).padStart(8, "0")}`,
        `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}${count}@example.com`,
        family.id,
        person.role,
      );

      count++;
    }
  }

  console.log(`✅ Created ${count} sample members with birthdays this week.`);
  console.log("📅 Birthday dates range: June 28 - July 4, 2026");
}

main()
  .catch((e) => {
    console.error("❌ Seed birthday data failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
