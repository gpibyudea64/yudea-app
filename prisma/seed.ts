import { prisma } from "@/lib/prisma";
import { BloodType, Gender, MemberRole } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Demo users are upserted on every run so the documented login accounts always
 * exist, even when an existing database is left untouched.
 */
async function upsertDemoUsers() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: { role: "ADMIN" },
    create: {
      name: "Admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    },
  });

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      password: hashedPassword,
      role: "STAFF",
    },
  });
}

/**
 * Spreads member ages across every pelkat bracket (children, youth, adults,
 * elderly) instead of seeding everyone with the same birth date, which made
 * the pelkat dashboard show a single group.
 */
const SEED_AGES_BY_INDEX = [42, 38, 10, 16, 22, 65, 8, 14, 28, 55];

function seedBirthDate(index: number): Date {
  const now = new Date();
  const birth = new Date(now);
  birth.setFullYear(now.getFullYear() - SEED_AGES_BY_INDEX[index % SEED_AGES_BY_INDEX.length]);
  // Fixed month/day keeps the data deterministic across runs.
  birth.setMonth(1, 21);
  return birth;
}

const SEED_BLOOD_TYPES: Array<BloodType | null> = [
  BloodType.A,
  BloodType.B,
  BloodType.AB,
  BloodType.O,
  null,
];

async function main() {
  console.log("🌱 Seeding database...");

  const reset = process.argv.includes("--reset");
  const existingBranches = await prisma.branch.count();

  // Safety guard: never wipe a populated database unless --reset is passed.
  if (existingBranches > 0 && !reset) {
    await upsertDemoUsers();
    console.log(
      `⚠️  Database already has ${existingBranches} branch(es) — refusing to wipe existing data.`,
    );
    console.log("    Re-run with `npm run prisma:seed -- --reset` to wipe and reseed from scratch.");
    return;
  }

  if (reset) {
    console.log("🧹 --reset passed: wiping existing data first...");
  }

  await prisma.user.deleteMany();
  await upsertDemoUsers();

  // Clear existing data (only reached when seeding fresh or with --reset)
  await prisma.attendance.deleteMany();
  await prisma.member.deleteMany();
  await prisma.family.deleteMany();
  await prisma.region.deleteMany();
  await prisma.branch.deleteMany();

  // --- Seed Branches ---
  const branch1 = await prisma.branch.create({
    data: {
      name: "Central Branch",
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: "West Branch",
    },
  });

  // --- Seed Regions ---
  const region1 = await prisma.region.create({
    data: {
      name: "Region A",
      branchId: branch1.id,
    },
  });

  const region2 = await prisma.region.create({
    data: {
      name: "Region B",
      branchId: branch1.id,
    },
  });

  const region3 = await prisma.region.create({
    data: {
      name: "Region C",
      branchId: branch2.id,
    },
  });

  // --- Seed Coordinator Users for Each Region ---
  const coordinatorPassword = await bcrypt.hash("coordinator123", 10);
  await prisma.user.create({
    data: {
      name: "Coordinator Region A",
      email: "coordinator-a@example.com",
      password: coordinatorPassword,
      role: "COORDINATOR",
      regionId: region1.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Coordinator Region B",
      email: "coordinator-b@example.com",
      password: coordinatorPassword,
      role: "COORDINATOR",
      regionId: region2.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Coordinator Region C",
      email: "coordinator-c@example.com",
      password: coordinatorPassword,
      role: "COORDINATOR",
      regionId: region3.id,
    },
  });

  // --- Seed Families ---
  const families: Awaited<ReturnType<typeof prisma.family.create>>[] = [];

  // Families for Region A
  for (let i = 0; i < 3; i++) {
    const family = await prisma.family.create({
      data: {
        familyName: `Region A Family ${i + 1}`,
        address: `Address in Region A ${i + 1}`,
        regionId: region1.id,
      },
    });
    families.push(family);
  }

  // Families for Region B
  for (let i = 0; i < 3; i++) {
    const family = await prisma.family.create({
      data: {
        familyName: `Region B Family ${i + 1}`,
        address: `Address in Region B ${i + 1}`,
        regionId: region2.id,
      },
    });
    families.push(family);
  }

  // Families for Region C
  for (let i = 0; i < 3; i++) {
    const family = await prisma.family.create({
      data: {
        familyName: `Region C Family ${i + 1}`,
        address: `Address in Region C ${i + 1}`,
        regionId: region3.id,
      },
    });
    families.push(family);
  }

  // --- Seed Members ---
  const members: Awaited<ReturnType<typeof prisma.member.create>>[] = [];
  for (const family of families) {
    for (let i = 0; i < 10; i++) {
      const member = await prisma.member.create({
        data: {
          firstName: `NamaDepan${i}`,
          lastName: `NamaBelakang${i}`,
          birthCity: "Jakarta",
          gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          birthDate: seedBirthDate(i),
          phone: "12390231021",
          email: "danjdw@dsad.com",
          bloodType: SEED_BLOOD_TYPES[i % SEED_BLOOD_TYPES.length] ?? null,
          familyId: family.id,
          role:
            i === 1
              ? MemberRole.FAMILY_HEAD
              : i === 2
                ? MemberRole.WIFE
                : MemberRole.CHILD,
        },
      });
      members.push(member);
    }
  }

  const regionCoordinatorMember = members[0];

  if (regionCoordinatorMember) {
    await prisma.region.update({
      where: {
        id: region1.id,
      },
      data: {
        coordinator: {
          connect: { id: regionCoordinatorMember.id },
        },
      },
    });
  }

  // --- Seed Attendance ---
  await prisma.attendance.createMany({
    data: [
      {
        serviceDate: new Date("2026-02-22T09:00:00"),
        serviceType: "Sunday Service",
        maleCount: 20,
        femaleCount: 25,
        totalCount: 45,
      },
      {
        serviceDate: new Date("2026-02-22T17:00:00"),
        serviceType: "Evening Service",
        maleCount: 15,
        femaleCount: 18,
        totalCount: 33,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
