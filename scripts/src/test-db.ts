import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const result = await client.query("select current_user as user, current_database() as db, now() as now");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Connection error:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
