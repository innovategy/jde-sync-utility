import * as path from 'path';
import * as fs from 'fs';
import { Workbook, Row, CellValue } from 'exceljs';
import { info } from '../utils/logger';

// Helper function to safely stringify objects
/**
 * Safely converts any value to a string, handling objects properly
 * to avoid the default [object Object] stringification.
 */
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  // Handle objects specially to avoid [object Object] stringification
  if (typeof value === 'object' && value !== null) {
    try {
      // Using JSON.stringify to properly handle objects
      // This prevents the default [object Object] stringification
      return JSON.stringify(value);
    } catch {
      return '[complex object]';
    }
  }
  return String(value);
}

export interface F01151FieldDetail {
  fieldName: string;
  itemDescription: string;
  itemLongName: string;
  itemDataTypeDescription: string;
  itemSize: number | null;
  // Using indexed signature with more specific types instead of any
  [key: string]: string | number | boolean | null | undefined;
}

export async function loadF01151FieldDetails(): Promise<
  Record<string, F01151FieldDetail>
> {
  const filePath = path.join(__dirname, '../../data/F01151.xlsx');
  const workbook = new Workbook();
  if (!fs.existsSync(filePath)) {
    info('F01151.xlsx not found in data folder. Returning empty field map.');
    return {};
  }
  await workbook.xlsx.readFile(filePath);
  info(
    'Excel sheet names:',
    workbook.worksheets.map((ws) => ws.name),
  );
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  info('Excel header row values:', headerRow.values);
  let rowCount = 0;
  const fieldMap: Record<string, F01151FieldDetail> = {};
  // Extract header row values safely
  const headerValues = headerRow.values as CellValue[] | undefined;
  const headers: string[] = Array.isArray(headerValues)
    ? headerValues.slice(1).filter((h): h is string => typeof h === 'string')
    : [];

  worksheet.eachRow((row: Row, rowNumber: number) => {
    if (rowNumber === 1) return;
    rowCount++;
    const rowObj: Record<string, unknown> = {};

    const rowValues = row.values as CellValue[] | undefined;
    if (Array.isArray(rowValues)) {
      rowValues.slice(1).forEach((cell, idx) => {
        if (idx < headers.length && headers[idx]) {
          rowObj[headers[idx]] = cell;
        }
      });
    }

    // Extract and validate table name and alias
    const tableNameValue = rowObj['Table Name'];
    const aliasValue = rowObj['Alias DD Item'];

    // Safe conversion for tableName
    const tableName = safeStringify(tableNameValue);

    // Safe conversion for alias
    const alias = safeStringify(aliasValue);

    if (!tableName || !alias) return;

    const key = `${tableName}_${alias}`;

    // Helper function to safely convert cell values to strings
    const safeString = (
      primary: CellValue | undefined,
      fallback: CellValue | undefined,
    ): string => {
      // Try primary value first
      if (typeof primary === 'string') return primary;
      if (primary !== undefined && primary !== null) {
        if (typeof primary === 'object') return JSON.stringify(primary);
        return String(primary);
      }

      // Try fallback value
      if (typeof fallback === 'string') return fallback;
      if (fallback !== undefined && fallback !== null) {
        if (typeof fallback === 'object') return JSON.stringify(fallback);
        return String(fallback);
      }

      // Default empty string if neither exists
      return '';
    };

    // Helper function to safely convert cell values to numbers or null
    const safeNumber = (
      primary: CellValue | undefined,
      fallback: CellValue | undefined,
    ): number | null => {
      // Try to convert primary to number
      if (primary !== undefined && primary !== null) {
        const num = Number(primary);
        if (!isNaN(num)) return num;
      }

      // Try fallback value
      if (fallback !== undefined && fallback !== null) {
        const num = Number(fallback);
        if (!isNaN(num)) return num;
      }

      // Return null if conversion failed
      return null;
    };

    fieldMap[key] = {
      fieldName: key,
      itemDescription: safeString(
        rowObj['DD Item Description'] as CellValue | undefined,
        rowObj['Item Description'] as CellValue | undefined,
      ),
      itemLongName: safeString(
        rowObj['DD Item Long Name'] as CellValue | undefined,
        rowObj['Item Long Name'] as CellValue | undefined,
      ),
      itemDataTypeDescription: safeString(
        rowObj['DD Item Data Type Description'] as CellValue | undefined,
        rowObj['Item Data Type Description'] as CellValue | undefined,
      ),
      itemSize: safeNumber(
        rowObj['DD Item Size'] as CellValue | undefined,
        rowObj['Item Size'] as CellValue | undefined,
      ),
      // Convert rowObj to a properly typed object
      ...Object.fromEntries(
        Object.entries(rowObj).map(([k, v]) => {
          // Handle different value types appropriately
          let processedValue: string | number | boolean | null | undefined =
            undefined;

          if (v === undefined) {
            processedValue = null;
          } else if (v === null) {
            processedValue = null;
          } else if (
            typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean'
          ) {
            processedValue = v;
          } else {
            // Convert other types to string
            processedValue = safeStringify(v);
          }

          return [k, processedValue];
        }),
      ),
    };
  });
  info('Excel data row count:', rowCount);
  info('Sample fieldDetails keys:', Object.keys(fieldMap).slice(0, 5));
  return fieldMap;
}
