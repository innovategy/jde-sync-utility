// src/modules/vendors.ts
// Import the JDE connection service for authentication and API calls
import { JDEConnectionService } from '../services/JDEConnectionService';
import { info } from '../utils/logger';
import { loadF0101FieldDetails, F0101FieldDetail } from '../utils/f0101Excel';
import * as fs from 'fs';
import { getContactInfoRecords } from './contactInfo';
import { getAddressBookRecords } from './addressBook';
import { getMailingAddressRecords } from './mailingAddress';
// Minimal interfaces needed for this module
interface AxiosInstance {
  get<T>(url: string, config?: any): Promise<AxiosResponse<T>>;
}
interface AxiosResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}
interface GridData {
  rowset: VendorRecord[];
  [key: string]: unknown;
}
interface DataBrowseF0101 {
  data: {
    gridData: GridData;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
interface JDEResponse {
  fs_DATABROWSE_F0101?: DataBrowseF0101;
  [key: string]: unknown;
}
interface VendorRecord {
  [key: string]: unknown;
}
export async function buildVendorsJson(): Promise<void> {
  // Step 1: Load vendors (raw) from the API
  const jde = new JDEConnectionService();
  await jde.authenticate();
  const params = new URLSearchParams({
    $filter: 'F0101.AT1 EQ V', // V for Vendors
    $limit: '5', // You can adjust this limit as needed
    $token: jde.getToken()!,
  });
  const axiosInstance = jde.getAxiosInstance() as unknown as AxiosInstance;
  const response = await axiosInstance.get<JDEResponse>(
    `/v2/dataservice/table/F0101?${params.toString()}`,
    { headers: { Authorization: `Bearer ${jde.getToken()}` } },
  );
  const vendorRowset: VendorRecord[] =
    response.data?.fs_DATABROWSE_F0101?.data?.gridData?.rowset || [];
  info(`Fetched ${vendorRowset.length} vendors.`);

  // Step 2: Iterate and fetch details for each vendor
  const vendorsRaw: Array<{
    addressNumber: string;
    vendor: VendorRecord;
    contactInfo: unknown;
    addressBook: unknown;
    mailingAddress: unknown;
  }> = [];
  const vendorsEnhanced: Array<{
    addressNumber: string;
    vendor: Record<string, unknown>;
    contactInfo: unknown;
    addressBook: unknown;
    mailingAddress: unknown;
  }> = [];

  // Load F0101 field details from Excel for enrichment
  const fieldDetails: Record<string, F0101FieldDetail> =
    await loadF0101FieldDetails();

  for (const vendor of vendorRowset) {
    // Address Number field
    const addressNumberRaw = vendor['F0101_AN8'];
    const addressNumber: string =
      typeof addressNumberRaw === 'string'
        ? addressNumberRaw
        : String(addressNumberRaw);
    if (
      !addressNumber ||
      addressNumber === 'undefined' ||
      addressNumber === 'null'
    ) {
      info('Skipping vendor with missing F0101_AN8:', vendor);
      continue;
    }
    info(`Processing vendor Address Number: ${addressNumber}`);

    // Fetch details from each module
    const [contactInfo, addressBook, mailingAddress] = await Promise.all([
      getContactInfoRecords(addressNumber),
      getAddressBookRecords(addressNumber),
      getMailingAddressRecords(addressNumber),
    ]);

    // Aggregate raw data as a nested object for this vendor
    vendorsRaw.push({
      addressNumber,
      vendor,
      contactInfo: contactInfo.raw,
      addressBook: addressBook.raw,
      mailingAddress: mailingAddress.raw,
    });

    // Enrich the vendor F0101 fields
    const enrichedVendor: Record<
      string,
      {
        value: unknown;
        details: F0101FieldDetail | null;
      }
    > = {};

    Object.keys(vendor).forEach((field) => {
      const value = vendor[field];

      if (value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;

      const fieldDetail = fieldDetails[field];

      enrichedVendor[field] = {
        value,
        details: fieldDetail
          ? {
              fieldName: fieldDetail.fieldName,
              itemDescription: fieldDetail.itemDescription,
              itemLongName: fieldDetail.itemLongName,
              itemDataTypeDescription: fieldDetail.itemDataTypeDescription,
              itemSize: fieldDetail.itemSize,
            }
          : null,
      };
    });

    // Aggregate enhanced data as a nested object for this vendor
    vendorsEnhanced.push({
      addressNumber,
      vendor: enrichedVendor,
      contactInfo: contactInfo.enhanced,
      addressBook: addressBook.enhanced,
      mailingAddress: mailingAddress.enhanced,
    });

    // Pause 3 seconds between each vendor round
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Step 3: Write output files
  fs.writeFileSync(
    'vendors.json',
    JSON.stringify(vendorsRaw, null, 2),
    'utf-8',
  );
  fs.writeFileSync(
    'vendors-enhanced.json',
    JSON.stringify(vendorsEnhanced, null, 2),
    'utf-8',
  );
  info('Wrote vendors.json and vendors-enhanced.json to project root.');
}
