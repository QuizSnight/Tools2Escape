import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "workbook-inspection.json";

if (!inputPath) {
  console.error("Usage: node scripts/inspect-workbook.mjs <input.xlsx> [output.json]");
  process.exit(1);
}

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 20000,
  tableMaxRows: 12,
  tableMaxCols: 16,
  tableMaxCellChars: 120,
});

const sheets = [];
const sheetList = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 20000,
});

for (const line of sheetList.ndjson.trim().split(/\r?\n/).filter(Boolean)) {
  const record = JSON.parse(line);
  if (!record.name) continue;
  const sheet = workbook.worksheets.getItem(record.name);
  const used = sheet.getUsedRange(true);
  let values = [];
  if (used) {
    values = used.values.slice(0, 20).map((row) => row.slice(0, 20));
  }
  sheets.push({ name: record.name, preview: values });
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(
  outputPath,
  JSON.stringify({ summary: summary.ndjson, sheets }, null, 2),
  "utf8",
);

console.log(outputPath);
