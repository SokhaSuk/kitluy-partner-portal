/** Escape one value for RFC 4180-style CSV output. */
export function csvCell(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Convert an array of plain records to CSV. */
export function toCsv(rows, columns) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const defs =
    columns?.length > 0
      ? columns.map((column) =>
          typeof column === 'string' ? { key: column, label: column } : column
        )
      : Object.keys(safeRows[0] || {}).map((key) => ({ key, label: key }));

  const lines = [defs.map((column) => csvCell(column.label)).join(',')];
  safeRows.forEach((row) => {
    lines.push(
      defs
        .map((column) =>
          csvCell(typeof column.value === 'function' ? column.value(row) : row[column.key])
        )
        .join(',')
    );
  });
  return `\uFEFF${lines.join('\r\n')}`;
}

/** Trigger a browser download. Returns false outside a browser. */
export function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function downloadCsv(filename, rows, columns) {
  return downloadText(filename, toCsv(rows, columns), 'text/csv;charset=utf-8');
}

export function downloadJson(filename, value) {
  return downloadText(filename, JSON.stringify(value, null, 2), 'application/json;charset=utf-8');
}
