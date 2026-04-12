/**
 * Runs drizzle-kit push with DATABASE_URL from the environment.
 * When ../../.env exists (local dev), loads it via dotenv first.
 * On hosts like Render there is no .env file; env vars are injected — we skip loading.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(__dirname, "../../.env");

if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}

const dkBin = resolve(__dirname, "node_modules/drizzle-kit/bin.cjs");
const configPath = resolve(__dirname, "drizzle.config.ts");
const extra = process.argv.slice(2);
const dkArgs = ["push", ...extra, "--config", configPath];

const result = spawnSync(process.execPath, [dkBin, ...dkArgs], {
  stdio: "inherit",
  cwd: __dirname,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
