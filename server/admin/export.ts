import type { StoredLead, StoredService } from "../storage";

type CellValue = string | number | null | undefined | Date;

function normaliseCell(value: CellValue): { text: string; type: "String" | "Number" } {
  if (value instanceof Date) {
    return { text: value.toISOString(), type: "String" };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { text: value.toString(), type: "Number" };
  }

  if (value === null || value === undefined) {
    return { text: "", type: "String" };
  }

  return { text: String(value), type: "String" };
}

function escapeCsv(text: string): string {
  if (/[",\n]/u.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toCsv(rows: CellValue[][]): string {
  return rows
    .map((row) => row.map((cell) => escapeCsv(normaliseCell(cell).text)).join(","))
    .join("\n");
}

function toSpreadsheetXml(
  sheetName: string,
  headers: string[],
  rows: CellValue[][],
): string {
  const headerCells = headers
    .map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
    .join("");

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const { text, type } = normaliseCell(cell);
          return `<Cell><Data ss:Type="${type}">${escapeXml(text)}</Data></Cell>`;
        })
        .join("");

      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>\n` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    `<Worksheet ss:Name="${escapeXml(sheetName)}">` +
    `<Table>` +
    `<Row>${headerCells}</Row>` +
    dataRows +
    `</Table>` +
    `</Worksheet>` +
    `</Workbook>`;
}

export function buildLeadsCsv(leads: StoredLead[]): string {
  const header = [
    "Lead ID",
    "Client Name",
    "Status",
    "Partner ID",
    "Estimated Value",
    "Service ID",
    "Created At",
    "Updated At",
    "Country",
    "Region",
  ];

  const rows: CellValue[][] = leads.map((lead) => [
    lead.id,
    lead.clientName,
    lead.status,
    lead.partnerId,
    lead.estimatedValue ?? "",
    lead.serviceId ?? "",
    lead.createdAt,
    lead.updatedAt,
    lead.country ?? "",
    lead.region ?? "",
  ]);

  return toCsv([header, ...rows]);
}

export function buildLeadsSpreadsheet(leads: StoredLead[]): string {
  const headers = [
    "Lead ID",
    "Client Name",
    "Status",
    "Partner ID",
    "Estimated Value",
    "Service ID",
    "Created At",
    "Updated At",
    "Country",
    "Region",
  ];

  const rows: CellValue[][] = leads.map((lead) => [
    lead.id,
    lead.clientName,
    lead.status,
    lead.partnerId,
    lead.estimatedValue ?? "",
    lead.serviceId ?? "",
    lead.createdAt,
    lead.updatedAt,
    lead.country ?? "",
    lead.region ?? "",
  ]);

  return toSpreadsheetXml("Leads", headers, rows);
}

export function buildServicesCsv(services: StoredService[]): string {
  const header = [
    "Service ID",
    "Name",
    "Unit",
    "Base Price",
    "Active",
  ];

  const rows: CellValue[][] = services.map((service) => [
    service.id,
    service.name,
    service.unit,
    service.basePrice,
    service.active ? "Yes" : "No",
  ]);

  return toCsv([header, ...rows]);
}

export function buildServicesSpreadsheet(services: StoredService[]): string {
  const headers = ["Service ID", "Name", "Unit", "Base Price", "Active"];

  const rows: CellValue[][] = services.map((service) => [
    service.id,
    service.name,
    service.unit,
    service.basePrice,
    service.active ? "Yes" : "No",
  ]);

  return toSpreadsheetXml("Services", headers, rows);
}
