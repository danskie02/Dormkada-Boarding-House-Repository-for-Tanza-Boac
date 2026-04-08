const fs = require("fs");
const path = require("path");

const ua = process.env.npm_config_user_agent ?? "";
if (!ua.includes("pnpm")) {
  console.error("Use pnpm instead");
  process.exit(1);
}

const root = path.join(__dirname, "..");
for (const name of ["package-lock.json", "yarn.lock"]) {
  try {
    fs.unlinkSync(path.join(root, name));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
