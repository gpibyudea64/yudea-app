const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  try {
    const users = await p.user.findMany({
      select: { email: true, role: true, regionId: true },
    });
    console.log(JSON.stringify(users, null, 1));
  } catch (e) {
    console.error("FAIL:", e.message.split("\n")[0]);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
}

main();
