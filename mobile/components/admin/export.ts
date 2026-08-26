import { Alert, Platform } from "react-native";

export type ExportTable = {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
};

function csvCell(value: string | number) {
  const s = String(value ?? "");
  // Quote anything containing a comma, quote or newline, doubling inner quotes.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(table: ExportTable): string {
  return [table.columns, ...table.rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

function fileStamp() {
  return new Date().toISOString().slice(0, 10);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Hands the browser a file to save. Uses an object URL and a synthetic click,
 * which is what puts the file in the user's Downloads rather than only showing
 * it on screen.
 */
function downloadBlob(contents: string, filename: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has taken the reference.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(table: ExportTable) {
  if (Platform.OS !== "web") {
    Alert.alert(
      "Export needs a browser",
      "CSV download runs in the web console. On a device this needs expo-file-system and expo-sharing.",
    );
    return;
  }
  downloadBlob(
    "﻿" + toCsv(table), // BOM so Excel opens the accents correctly
    `${slug(table.title)}-${fileStamp()}.csv`,
    "text/csv;charset=utf-8",
  );
}

function escapeHtml(s: string | number) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Opens the report in a print window so the browser can save it as PDF.
 *
 * There is no PDF library in this project, and adding one to write bytes by
 * hand would be a lot of weight for a report; the browser already has a good
 * PDF writer behind the print dialog, so we build clean HTML and hand it over.
 */
export function exportPdf(table: ExportTable) {
  if (Platform.OS !== "web") {
    Alert.alert(
      "Export needs a browser",
      "PDF export runs in the web console. On a device this needs expo-print.",
    );
    return;
  }

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(table.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 3px solid #D62828; padding-bottom: 14px; margin-bottom: 22px; }
  .brand { font-size: 20px; font-weight: 800; color: #D62828; }
  .brand small { display: block; font-size: 11px; color: #6B7280; font-weight: 600; letter-spacing: .5px; }
  h1 { font-size: 17px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6B7280; }
  .meta { text-align: right; font-size: 11px; color: #6B7280; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 10px; letter-spacing: .6px; color: #6B7280;
       border-bottom: 1px solid #E7E9EE; padding: 9px 8px; text-transform: uppercase; }
  td { font-size: 12px; padding: 10px 8px; border-bottom: 1px solid #F1F3F6; }
  tr:nth-child(even) td { background: #FBFCFD; }
  footer { margin-top: 26px; font-size: 10px; color: #9CA3AF; text-align: center; }
  @media print { body { margin: 14mm; } }
</style>
</head>
<body>
  <header>
    <div>
      <div class="brand">The Burger Yard<small>ADMIN CONSOLE</small></div>
    </div>
    <div class="meta">
      Generated ${escapeHtml(new Date().toLocaleString())}<br />
      ${escapeHtml(table.rows.length)} rows
    </div>
  </header>

  <h1>${escapeHtml(table.title)}</h1>
  ${table.subtitle ? `<div class="sub">${escapeHtml(table.subtitle)}</div>` : ""}

  <table>
    <thead><tr>${table.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
    <tbody>
      ${table.rows
        .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
        .join("")}
    </tbody>
  </table>

  <footer>Ayeduase New Site · The Burger Yard</footer>
  <script>
    window.onload = function () { window.focus(); window.print(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    Alert.alert(
      "Popup blocked",
      "Allow popups for this site, then try the PDF export again.",
    );
    return;
  }
  win.document.write(html);
  win.document.close();
}
