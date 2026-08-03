const { Client } = require("pg");
const fs = require("fs");

const env = fs.readFileSync(".env", "utf8");
const line = env
  .split("\n")
  .find((l) => !l.trim().startsWith("#") && l.includes("DATABASE_URL"));
const url = line.match(/DATABASE_URL="([^"]+)/)[1];

async function main() {
  const c = new Client({ connectionString: url });
  await c.connect();
  const cols = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'Member' ORDER BY ordinal_position",
  );
  console.log("Member columns:", cols.rows.map((x) => x.column_name).join(", "));
  const hasPresbyter = cols.rows.some((x) => x.column_name === "isPresbyter");
  console.log("HAS isPresbyter column:", hasPresbyter);

  const migs = await c.query(
    "SELECT migration_name, finished_at IS NOT NULL AS applied FROM _prisma_migrations ORDER BY started_at",
  );
  console.log("Applied migrations:", migs.rows.length);
  console.log(migs.rows.map((m) => `${m.applied ? "✓" : "✗"} ${m.migration_name}`).join("\n"));
  await c.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
