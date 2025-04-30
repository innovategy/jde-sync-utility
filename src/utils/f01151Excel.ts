import path from 'path';
import { Workbook } from 'exceljs';
import { info } from '../utils/logger';

export interface F01151FieldDetail {
  fieldName: string;
  itemDescription: string;
  itemLongName: string;
  itemDataTypeDescription: string;
  itemSize: number;
  [key: string]: any;
}

export async function loadF01151FieldDetails(): Promise<
  Record<string, F01151FieldDetail>
> {
  const filePath = path.join(__dirname, '../../data/F01151.xlsx');
  const workbook = new Workbook();
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    info('F01151.xlsx not found in data folder. Returning empty field map.');
    return {};
  }
  const buffer = fs.readFileSync(filePath);
  await workbook.xlsx.load(buffer);
  info(
    'Excel sheet names:',
    workbook.worksheets.map((ws) => ws.name),
  );
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1);
  info('Excel header row values:', headerRow.values);
  let rowCount = 0;
  const fieldMap: Record<string, F01151FieldDetail> = {};
  const headers: string[] = headerRow.values.slice(1);
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    rowCount++;
    const rowObj: any = {};
    row.values.slice(1).forEach((cell: any, idx: number) => {
      rowObj[headers[idx]] = cell;
    });
    const tableName = rowObj['Table Name'];
    const alias = rowObj['Alias DD Item'];
    if (!tableName || !alias) return;
    const key = `${tableName}_${alias}`;
    fieldMap[key] = {
      fieldName: key,
      itemDescription:
        rowObj['DD Item Description'] || rowObj['Item Description'] || '',
      itemLongName:
        rowObj['DD Item Long Name'] || rowObj['Item Long Name'] || '',
      itemDataTypeDescription:
        rowObj['DD Item Data Type Description'] ||
        rowObj['Item Data Type Description'] ||
        '',
      itemSize: rowObj['DD Item Size'] || rowObj['Item Size'] || null,
      ...rowObj,
    };
  });
  info('Excel data row count:', rowCount);
  info('Sample fieldDetails keys:', Object.keys(fieldMap).slice(0, 5));
  return fieldMap;
}
