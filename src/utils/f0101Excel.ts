import * as path from 'path';
import { Workbook } from 'exceljs';
import { info } from '../utils/logger';

export interface F0101FieldDetail {
  fieldName: string;
  itemDescription?: string;
  itemLongName?: string;
  itemDataTypeDescription?: string;
  itemSize?: string | number;
  [key: string]: unknown;
}

/**
 * Reads the F0101.xlsx file and returns a mapping of field name to details.
 * Adjust the column names below to match your Excel headers.
 */

export function loadF0101FieldDetails(): Promise<
  Record<string, F0101FieldDetail>
> {
  const filePath = path.join(__dirname, '../../data/F0101.xlsx');
  const workbook = new Workbook();
  return workbook.xlsx
    .readFile(filePath)
    .then(() => {
      info(
        'Excel sheet names:',
        workbook.worksheets.map((ws) => ws.name),
      );
      const worksheet = workbook.worksheets[0];
      const headerRow = worksheet.getRow(1);
      info('Excel header row values:', headerRow.values);
      let rowCount = 0;
      const fieldMap: Record<string, F0101FieldDetail> = {};
      const headers: string[] = Array.isArray(headerRow.values)
        ? headerRow.values
            .slice(1)
            .filter((h): h is string => typeof h === 'string')
        : [];
      // skip first empty value
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        rowCount++;
        const rowObj: Record<string, unknown> = {};
        if (Array.isArray(row.values)) {
          row.values.slice(1).forEach((cell, idx) => {
            if (idx < headers.length && headers[idx]) {
              rowObj[headers[idx]] = cell;
            }
          });
        }
        const tableName = rowObj['Table Name'] as string | undefined;
        const alias = rowObj['Alias DD Item'] as string | undefined;
        const fieldName = tableName && alias ? `${tableName}_${alias}` : null;
        if (!fieldName) return;
        fieldMap[fieldName] = {
          fieldName,
          itemDescription:
            (rowObj['DD Item Description'] as string | undefined) ||
            (rowObj['Item Description'] as string | undefined) ||
            (rowObj['Description'] as string | undefined),
          itemLongName:
            (rowObj['DD Item Long Name'] as string | undefined) ||
            (rowObj['Item Long Name'] as string | undefined) ||
            (rowObj['Long Name'] as string | undefined),
          itemDataTypeDescription:
            (rowObj['DD Item Data Type Description'] as string | undefined) ||
            (rowObj['Item Data Type Description'] as string | undefined) ||
            (rowObj['Data Type Description'] as string | undefined),
          itemSize:
            (rowObj['DD Item Size'] as string | number | undefined) ||
            (rowObj['Item Size'] as string | number | undefined) ||
            (rowObj['Size'] as string | number | undefined),
          ...rowObj,
        };
      });
      info('Excel data row count:', rowCount);
      info('Sample fieldDetails keys:', Object.keys(fieldMap).slice(0, 5));
      return fieldMap;
    })
    .catch((err: unknown) => {
      info('Excel loader error:', err);
      return {};
    });
}
