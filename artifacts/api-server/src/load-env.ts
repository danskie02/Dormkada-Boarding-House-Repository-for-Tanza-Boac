import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Built bundle: dist/index.mjs → repo root .env
const envPath = path.resolve(__dirname, "../../../.env");

// Only load from file if it exists
if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log("Loaded .env from:", envPath);
} else {
  console.log(".env file not found at:", envPath, "Using process.env variables");
}

// Verify critical env vars are set
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set in environment");
}
if (!process.env.PORT) {
  console.warn("⚠️  PORT not set in environment");
}
