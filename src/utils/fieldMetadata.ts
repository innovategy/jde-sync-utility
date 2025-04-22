// src/utils/fieldMetadata.ts
import { JDEConnectionService } from '../services/JDEConnectionService';
import { info, error } from './logger';

export interface FieldMetadata {
  field: string;
  description?: string;
  udcProductCode?: string;
  udcTypeCode?: string;
  validValues?: Array<{ value: string; description: string }>;
}

export async function checkFieldMetadata(table: string, field: string): Promise<FieldMetadata | null> {
  const jde = new JDEConnectionService();
  await jde.authenticate();

  const jargonReq = {
    items: [`${table}.${field}`]
  };

  try {
    const headers = {
      Authorization: `Bearer ${jde.getToken()}`,
      'jde-AIS-Auth': jde.getToken(),
      'Content-Type': 'application/json'
    };
    const response = await jde.getAxiosInstance().post('/jargonservice', jargonReq, { headers });
    const meta = response.data?.items?.[0];
    info('Field Metadata:', meta);

    if (meta?.udcProductCode && meta?.udcTypeCode) {
      info(`Field ${field} has UDC mapping: Product Code=${meta.udcProductCode}, Type Code=${meta.udcTypeCode}`);
    }
    if (meta?.validValues && meta.validValues.length > 0) {
      info(`Field ${field} has enum values:`, meta.validValues);
    }
    if (!meta?.udcProductCode && (!meta?.validValues || meta.validValues.length === 0)) {
      info(`Field ${field} does not have UDC or enum mapping.`);
    }
    return meta;
  } catch (err: any) {
    error('Failed to get field metadata:', err?.message || err);
    return null;
  }
}
