import { loadF0101FieldDetails } from '../utils/f0101Excel';
import { loadF0115FieldDetails } from '../utils/f0115Excel';
import { loadF0116FieldDetails } from '../utils/f0116Excel';
import { loadF0401FieldDetails } from '../utils/f0401Excel';
import { loadF0111FieldDetails } from '../utils/f0111Excel';
import { loadF01151FieldDetails } from '../utils/f01151Excel';
import { info } from '../utils/logger';
import * as fs from 'fs';
import path from 'path';
import { Workbook } from 'exceljs';

// Define interfaces for our data structures
interface TableRow {
  [key: string]: unknown;
}

interface EnrichedField {
  value: unknown;
  details: FieldDetails | null;
}

interface FieldDetails {
  fieldName: string;
  itemDescription?: string;
  itemLongName?: string;
  itemDataTypeDescription?: string;
  itemSize?: string | number;
}

interface EnrichedRow {
  [key: string]: EnrichedField;
}

interface VendorMaster {
  AN8: string;
  F0101: EnrichedRow;
  F0401?: EnrichedRow;
  F0115: EnrichedRow[];
  F01151: EnrichedRow[];
  F0116: EnrichedRow[];
  F0111: EnrichedRow[];
}

// Utility to load data from an Excel file as an array of objects
async function loadTableData(xlsxFile: string): Promise<TableRow[]> {
  const filePath = path.join(__dirname, '../../data', xlsxFile);
  if (!fs.existsSync(filePath)) return [];
  const workbook = new Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  const headers: string[] = Array.isArray(headerRow.values)
    ? headerRow.values
        .slice(1)
        .filter((h): h is string => typeof h === 'string')
    : [];

  const data: TableRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowObj: TableRow = {};
    if (Array.isArray(row.values)) {
      row.values.slice(1).forEach((cellValue, idx) => {
        if (idx < headers.length && headers[idx]) {
          rowObj[headers[idx]] = cellValue;
        }
      });
    }
    data.push(rowObj);
  });
  return data;
}

// Helper to enrich a row with field metadata (only selected keys)
function enrichRow(
  row: TableRow,
  fieldDetails: Record<string, FieldDetails>,
  tableName: string,
): EnrichedRow {
  const enriched: EnrichedRow = {};
  Object.keys(row).forEach((field) => {
    const value = row[field];
    if (value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;

    const key = `${tableName}_${field}`;
    const details = fieldDetails[key] || null;

    enriched[key] = {
      value,
      details: details
        ? {
            fieldName: details.fieldName,
            itemDescription: details.itemDescription,
            itemLongName: details.itemLongName,
            itemDataTypeDescription: details.itemDataTypeDescription,
            itemSize: details.itemSize,
          }
        : null,
    };
  });

  return enriched;
}

export async function buildVendorsMaster(): Promise<void> {
  // Load all field metadata
  const [
    f0101Fields,
    f0115Fields,
    f0116Fields,
    f0401Fields,
    f0111Fields,
    f01151Fields,
  ] = await Promise.all([
    loadF0101FieldDetails(),
    loadF0115FieldDetails(),
    loadF0116FieldDetails(),
    loadF0401FieldDetails(),
    loadF0111FieldDetails(),
    loadF01151FieldDetails(),
  ]);

  // Load all data tables
  const [f0101Data, f0401Data, f0115Data, f01151Data, f0116Data, f0111Data] =
    await Promise.all([
      loadTableData('F0101.xlsx'),
      loadTableData('F0401.xlsx'),
      loadTableData('F0115.xlsx'),
      loadTableData('F01151.xlsx'),
      loadTableData('F0116.xlsx'),
      loadTableData('F0111.xlsx'),
    ]);

  // Index all related tables by AN8
  function indexByAN8(arr: TableRow[]): Record<string, TableRow[]> {
    const map: Record<string, TableRow[]> = {};
    arr.forEach((row) => {
      const an8 = (row['Address Number'] as string) || (row['AN8'] as string);
      if (!an8) return;
      if (!map[an8]) map[an8] = [];
      map[an8].push(row);
    });
    return map;
  }
  const f0401ByAN8 = indexByAN8(f0401Data);
  const f0115ByAN8 = indexByAN8(f0115Data);
  const f01151ByAN8 = indexByAN8(f01151Data);
  const f0116ByAN8 = indexByAN8(f0116Data);
  const f0111ByAN8 = indexByAN8(f0111Data);

  // Compose master vendor objects
  const vendorsMaster: VendorMaster[] = f0101Data.map((vendor) => {
    const an8 =
      (vendor['Address Number'] as string) || (vendor['AN8'] as string);
    return {
      AN8: an8,
      F0101: enrichRow(
        vendor,
        f0101Fields as Record<string, FieldDetails>,
        'F0101',
      ),
      F0401: f0401ByAN8[an8]?.length
        ? enrichRow(
            f0401ByAN8[an8][0],
            f0401Fields as Record<string, FieldDetails>,
            'F0401',
          )
        : undefined,
      F0115:
        f0115ByAN8[an8]?.map((row) =>
          enrichRow(row, f0115Fields as Record<string, FieldDetails>, 'F0115'),
        ) || [],
      F01151:
        f01151ByAN8[an8]?.map((row) =>
          enrichRow(
            row,
            f01151Fields as Record<string, FieldDetails>,
            'F01151',
          ),
        ) || [],
      F0116:
        f0116ByAN8[an8]?.map((row) =>
          enrichRow(row, f0116Fields as Record<string, FieldDetails>, 'F0116'),
        ) || [],
      F0111:
        f0111ByAN8[an8]?.map((row) =>
          enrichRow(row, f0111Fields as Record<string, FieldDetails>, 'F0111'),
        ) || [],
    };
  });

  fs.writeFileSync(
    path.join(__dirname, '../../vendors_master.json'),
    JSON.stringify(vendorsMaster, null, 2),
    'utf-8',
  );
  info(
    `Saved master vendor data for ${vendorsMaster.length} vendors to vendors_master.json`,
  );
}

// To run directly
if (require.main === module) {
  buildVendorsMaster().catch((err) => {
    console.error('Error building vendors master:', err);
    process.exit(1);
  });
}
