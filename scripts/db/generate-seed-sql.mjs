import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { data } from "../../src/db/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(2);
}

function sqlInteger(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(fallback);
  return String(Math.trunc(n));
}

const lines = [];
lines.push("START TRANSACTION;");
lines.push("SET FOREIGN_KEY_CHECKS = 0;");
lines.push("TRUNCATE TABLE laboratory_tests;");
lines.push("SET FOREIGN_KEY_CHECKS = 1;");
lines.push("");

for (const row of data) {
  lines.push(
    `INSERT INTO laboratory_tests (id, name, sample, method, price_public, price_convenio, tube, info, process_time, quantity, active)` +
      ` VALUES (` +
      `${sqlInteger(row.id, 0)}, ` +
      `${sqlString(row.name)}, ` +
      `${sqlString(row.sample)}, ` +
      `${sqlString(row.method)}, ` +
      `${sqlNumber(row.price1)}, ` +
      `${sqlNumber(row.price2)}, ` +
      `${sqlString(row.tube)}, ` +
      `${sqlString(row.info)}, ` +
      `${sqlString(row.time)}, ` +
      `${sqlInteger(row.quantity, 1)}, 1` +
      `) ON DUPLICATE KEY UPDATE` +
      ` name = VALUES(name),` +
      ` sample = VALUES(sample),` +
      ` method = VALUES(method),` +
      ` price_public = VALUES(price_public),` +
      ` price_convenio = VALUES(price_convenio),` +
      ` tube = VALUES(tube),` +
      ` info = VALUES(info),` +
      ` process_time = VALUES(process_time),` +
      ` quantity = VALUES(quantity),` +
      ` active = VALUES(active),` +
      ` updated_at = CURRENT_TIMESTAMP;`
  );
}

lines.push("");
lines.push("COMMIT;");
lines.push("");

const outputPath = path.resolve(__dirname, "../../database/seed.from_data.sql");
await fs.writeFile(outputPath, lines.join("\n"), "utf8");

console.log(`Generated ${data.length} rows into ${outputPath}`);
