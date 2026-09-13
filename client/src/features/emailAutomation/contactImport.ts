import { readSheet, type Row } from "read-excel-file/browser";
import type { VendorInput } from "./emailAutomationApi";

export type ContactField = "name" | "companyName" | "email" | "source";
export type ContactColumnMap = Record<ContactField, number | null>;
export interface ContactWorkbook { fileName: string; headers: string[]; rows: Row[] }

const aliases: Record<ContactField, string[]> = {
  name: ["name", "vendor name", "contact name", "full name"],
  companyName: ["company", "company name", "vendor", "vendor company", "organization"],
  email: ["email", "email address", "work email", "vendor email"],
  source: ["source", "relationship", "consent source", "lead source"],
};
const text = (value: Row[number]) => value instanceof Date ? value.toISOString() : String(value ?? "").trim();
const normalized = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export const readContactWorkbook = async (file: File): Promise<ContactWorkbook> => {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Upload an Excel .xlsx file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Excel file must be 5 MB or smaller");
  const [headerRow = [], ...rows] = await readSheet(file);
  const headers = headerRow.map(text);
  if (!headers.some(Boolean) || !rows.length) throw new Error("The first sheet must contain a header row and at least one contact");
  if (rows.length > 1000) throw new Error("Import at most 1,000 contacts at a time");
  return { fileName: file.name, headers, rows };
};

export const suggestContactColumns = (headers: string[]): ContactColumnMap => Object.fromEntries(
  Object.entries(aliases).map(([field, names]) => { const index = headers.findIndex((header) => names.includes(normalized(header))); return [field, index < 0 ? null : index]; }),
) as ContactColumnMap;

export const mapContactRows = (workbook: ContactWorkbook, columns: ContactColumnMap, consentAt: string): { contacts: VendorInput[]; errors: string[] } => {
  const errors: string[] = [];
  const contacts: VendorInput[] = [];
  if ([columns.name, columns.companyName, columns.email].some((column) => column === null || column! < 0)) return { contacts, errors: ["Map Name, Company, and Email columns"] };
  if (new Set([columns.name, columns.companyName, columns.email]).size < 3) return { contacts, errors: ["Map Name, Company, and Email to different columns"] };
  workbook.rows.forEach((row, index) => {
    if (!row.some((cell) => text(cell))) return;
    const name = text(row[columns.name!]); const companyName = text(row[columns.companyName!]); const email = text(row[columns.email!]).toLowerCase();
    const source = columns.source === null || columns.source < 0 ? `Excel import: ${workbook.fileName}`.slice(0, 200) : text(row[columns.source]);
    const missing = [["name", name], ["company", companyName], ["email", email], ["source", source]].filter(([, value]) => !value).map(([field]) => field);
    if (missing.length) { errors.push(`Row ${index + 2}: missing ${missing.join(", ")}`); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.push(`Row ${index + 2}: invalid email`); return; }
    contacts.push({ name, companyName, email, source, consentAt });
  });
  return { contacts, errors };
};
