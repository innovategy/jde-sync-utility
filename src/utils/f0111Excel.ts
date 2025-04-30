import * as path from 'path';
import * as fs from 'fs';
import { Workbook } from 'exceljs';
import { info } from '../utils/logger';

export interface F0111FieldDetail {
  fieldName: string;
  itemDescription: string;
  itemLongName: string;
  itemDataTypeDescription: string;
  itemSize: number;
  [key: string]: unknown;
}

export async function loadF0111FieldDetails(): Promise<
  Record<string, F0111FieldDetail>
> {
  const filePath = path.join(__dirname, '../../data/F0111.xlsx');
  const workbook = new Workbook();
  if (!fs.existsSync(filePath)) {
    info('F0111.xlsx not found in data folder. Returning empty field map.');
    return {};
  }
  await workbook.xlsx.readFile(filePath);
  /*info(
    'Excel sheet names:',
    workbook.worksheets.map((ws) => ws.name),
  );*/
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  //info('Excel header row values:', headerRow.values);
  let rowCount = 0;
  const fieldMap: Record<string, F0111FieldDetail> = {};
  const headers: string[] = Array.isArray(headerRow.values)
    ? headerRow.values
        .slice(1)
        .filter((h): h is string => typeof h === 'string')
    : []; // skip first empty value
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
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
    if (!tableName || !alias) return;
    const key = `${tableName}_${alias}`;
    fieldMap[key] = {
      fieldName: key,
      itemDescription:
        (rowObj['DD Item Description'] as string) ||
        (rowObj['Item Description'] as string) ||
        '',
      itemLongName:
        (rowObj['DD Item Long Name'] as string) ||
        (rowObj['Item Long Name'] as string) ||
        '',
      itemDataTypeDescription:
        (rowObj['DD Item Data Type Description'] as string) ||
        (rowObj['Item Data Type Description'] as string) ||
        '',
      itemSize:
        (rowObj['DD Item Size'] as number) ||
        (rowObj['Item Size'] as number) ||
        0,
      ...rowObj,
    };
  });
  //info('Excel data row count:', rowCount);
  //info('Sample fieldDetails keys:', Object.keys(fieldMap).slice(0, 5));
  return fieldMap;
}
