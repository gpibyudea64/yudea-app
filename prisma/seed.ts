import { Gender, MemberRole } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");
  await prisma.user.deleteMany();

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

  // Clear existing data (optional, useful for seeding fresh)
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

  await prisma.region.create({
    data: {
      name: "Region B",
      branchId: branch1.id,
    },
  });

  await prisma.region.create({
    data: {
      name: "Region C",
      branchId: branch2.id,
    },
  });

  // --- Seed Families ---
  const families: Awaited<ReturnType<typeof prisma.family.create>>[] = [];
  for (let i = 0; i < 5; i++) {
    const family = await prisma.family.create({
      data: {
        familyName: "testing family name",
        address: "testing address",
        regionId: region1.id,
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
          name: `testing fullname member ${i}`,
          gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          birthDate: new Date("2026-02-21T19:03:24.480Z"),
          phone: "12390231021",
          email: "danjdw@dsad.com",
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
