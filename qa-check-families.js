const fs = require("fs");
const { Pool } = require("pg");

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/DATABASE_URL="?([^"\n]+)/)[1];
const p = new Pool({ connectionString: url });

async function main() {
  const r = await p.query(
    `SELECT f."familyName", f.provinsi, f.kelurahan, COUNT(m.id)::int AS members
     FROM "Family" f
     LEFT JOIN "Member" m ON m."familyId" = f.id
     WHERE f."familyName" LIKE '%QA%'
     GROUP BY f.id
     ORDER BY f."createdAt" DESC
     LIMIT 6`,
  );
  console.log(JSON.stringify(r.rows, null, 1));
  process.exit(0);
}
main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
