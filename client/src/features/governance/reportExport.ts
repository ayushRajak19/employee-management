type Row = Record<string, unknown>;

const flatten = (value: unknown, prefix = ""): Row => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { [prefix]: Array.isArray(value) ? JSON.stringify(value) : value };
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => Object.entries(flatten(child, prefix ? `${prefix}.${key}` : key))));
};

export const reportCsv = (rows: unknown[]): string => {
  const flat = rows.map((row) => flatten(row));
  const columns = [...new Set(flat.flatMap((row) => Object.keys(row)))];
  const cell = (value: unknown) => {
    const raw = value == null ? "" : String(value);
    // Spreadsheet programs interpret leading =, +, -, @ (even after whitespace) as formulas.
    const safe = /^[=+\-@]/.test(raw.trimStart()) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [columns.map(cell).join(","), ...flat.map((row) => columns.map((column) => cell(row[column])).join(","))].join("\r\n");
};

export const downloadReport = (content: string, name: string, mime: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
