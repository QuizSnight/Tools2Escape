const SPREADSHEET_ID = "HIER_GOOGLE_SHEET_ID_EINTRAGEN";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  (payload.sheets || []).forEach((tab) => writeTab(spreadsheet, tab.name, tab.rows || []));
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, updatedAt: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeTab(spreadsheet, name, rows) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.clear();
  if (!rows.length) return;

  const width = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => {
    const copy = row.slice();
    while (copy.length < width) copy.push("");
    return copy;
  });

  sheet.getRange(1, 1, normalizedRows.length, width).setValues(normalizedRows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, Math.min(width, 14));
}
