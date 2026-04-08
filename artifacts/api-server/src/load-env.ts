import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Built bundle: dist/index.mjs → repo root .env
config({ path: path.resolve(__dirname, "../../../.env") });
