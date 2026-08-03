/* QA: quick environment + data check */
const fs = require("fs");
const { Pool } = require("pg");

const env = fs.readFileSync(".env", "utf8");
const line = env.split("\n").find((l) => !l.trim().startsWith("#") && l.includes("DATABASE_URL"));
const url = line.match(/DATABASE_URL="?([^"\n]+)/)[1];

const p = new Pool({ connectionString: url });

async function main() {
  const users = await p.query('SELECT email, role, "regionId" FROM "User" ORDER BY email');
  console.log("USERS:");
  for (const u of users.rows) console.log(`  ${u.email} | ${u.role} | region=${u.regionId ?? "-"}`);

  const counts = {};
  for (const tbl of ["Branch", "Region", "Family", "Member", "Attendance", "AppSetting", "Account", "Session"]) {
    try {
      const c = await p.query(`SELECT COUNT(*) c FROM "${tbl}"`);
      counts[tbl] = parseInt(c.rows[0].c, 10);
    } catch (e) {
      counts[tbl] = "ERR:" + e.message.slice(0, 40);
    }
  }
  console.log("\nROW COUNTS:", JSON.stringify(counts, null, 2));

  // sanity: check members have family/region linkage
  const orphans = await p.query(`
    SELECT COUNT(*) c FROM "Member" m
    LEFT JOIN "Family" f ON f.id = m."familyId"
    WHERE m."familyId" IS NULL OR f.id IS NULL
  `);
  console.log("\nMembers without valid family:", orphans.rows[0].c);

  const headlessFamilies = await p.query(`
    SELECT COUNT(*) c FROM "Family" f
    WHERE NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."familyId" = f.id AND m.role = 'FAMILY_HEAD')
  `);
  console.log("Families without FAMILY_HEAD:", headlessFamilies.rows[0].c);

  const appSettings = await p.query('SELECT key, length(value) as value_len FROM "AppSetting"');
  console.log("\nAppSetting keys:", JSON.stringify(appSettings.rows));

  process.exit(0);
}
main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
