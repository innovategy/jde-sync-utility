import * as path from 'path';
import { Workbook, Row, CellValue } from 'exceljs';
import { info } from '../utils/logger';

export interface F0116FieldDetail {
  fieldName: string;
  itemDescription: string;
  itemLongName: string;
  itemDataTypeDescription: string;
  itemSize: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

export async function loadF0116FieldDetails(): Promise<
  Record<string, F0116FieldDetail>
> {
  const filePath = path.join(__dirname, '../../data/F0116.xlsx');
  const workbook = new Workbook();
  await workbook.xlsx.readFile(filePath);

  info(
    'Excel sheet names:',
    workbook.worksheets.map((ws) => ws.name),
  );

  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  info('Excel header row values:', headerRow.values);

  let rowCount = 0;
  const fieldMap: Record<string, F0116FieldDetail> = {};

  // Extract header row values safely
  const headerValues = headerRow.values as CellValue[] | undefined;
  const headers: string[] = Array.isArray(headerValues)
    ? headerValues.slice(1).filter((h): h is string => typeof h === 'string')
    : [];

  worksheet.eachRow((row: Row, rowNumber: number) => {
    if (rowNumber === 1) return;
    rowCount++;

    const rowObj: Record<string, CellValue> = {};

    const rowValues = row.values as CellValue[] | undefined;
    if (Array.isArray(rowValues)) {
      rowValues.slice(1).forEach((cell: CellValue, idx: number) => {
        if (idx < headers.length) {
          rowObj[headers[idx]] = cell;
        }
      });
    }

    // Extract and validate table name and alias
    const tableNameValue = rowObj['Table Name'];
    const aliasValue = rowObj['Alias DD Item'];

    const tableName =
      typeof tableNameValue === 'string'
        ? tableNameValue
        : tableNameValue !== undefined && tableNameValue !== null
          ? typeof tableNameValue === 'object'
            ? JSON.stringify(tableNameValue)
            : String(tableNameValue)
          : '';

    const alias =
      typeof aliasValue === 'string'
        ? aliasValue
        : aliasValue !== undefined && aliasValue !== null
          ? typeof aliasValue === 'object'
            ? JSON.stringify(aliasValue)
            : String(aliasValue)
          : '';

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
        rowObj['DD Item Description'],
        rowObj['Item Description'],
      ),
      itemLongName: safeString(
        rowObj['DD Item Long Name'],
        rowObj['Item Long Name'],
      ),
      itemDataTypeDescription: safeString(
        rowObj['DD Item Data Type Description'],
        rowObj['Item Data Type Description'],
      ),
      itemSize: safeNumber(rowObj['DD Item Size'], rowObj['Item Size']),
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
            processedValue =
              typeof v === 'object' ? JSON.stringify(v) : String(v);
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
