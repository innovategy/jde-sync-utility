// src/modules/vendors.ts

// Import the JDE connection service for authentication and API calls
import { JDEConnectionService } from '../services/JDEConnectionService';
import { info, error } from '../utils/logger';
import { loadF0101FieldDetails, F0101FieldDetail } from '../utils/f0101Excel';
import * as fs from 'fs';
// We need to define our own axios types to avoid TypeScript errors
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

/**
 * Interfaces for JDE API response structure
 */
interface GridData {
  rowset: VendorRecord[];
  [key: string]: any;
}

interface DataBrowseF0101 {
  data: {
    gridData: GridData;
    [key: string]: any;
  };
  [key: string]: any;
}

interface JDEResponse {
  fs_DATABROWSE_F0101?: DataBrowseF0101;
  [key: string]: any;
}

interface VendorRecord {
  [key: string]: unknown;
}

interface FieldDetails {
  fieldName: string;
  itemDescription?: string;
  itemLongName?: string;
  itemDataTypeDescription?: string;
  itemSize?: string | number;
}

interface EnrichedVendorField {
  value: unknown;
  details: FieldDetails | null;
}

interface EnrichedVendor {
  [key: string]: EnrichedVendorField;
}

/**
 * Fetches all vendor records from the JDE F0101 table.
 * Filters by AT1 = 'V' (vendor type) and returns all available fields.
 *
 * @returns Array of vendor objects from JDE
 */

export async function getAllVendors(): Promise<EnrichedVendor[]> {
  // Create a new connection service instance and authenticate
  const jde = new JDEConnectionService();
  await jde.authenticate();

  // Set up query parameters:
  // - $filter: only vendors (AT1 = 'V')
  // - $limit: max records (adjust as needed)
  // - $token: required for AIS dataservice calls

  // Example: fetch vendor address numbers and names
  const params = new URLSearchParams({
    $filter: 'F0101.AT1 EQ V', // V for Vendors
    $limit: '10',
    $token: jde.getToken()!,
  });

  try {
    // Call the dataservice API to fetch vendor records
    // First get a reference to the axios instance and explicitly type it
    const axiosInstance = jde.getAxiosInstance() as unknown as AxiosInstance;

    // Now make the API call with proper typing
    const response = await axiosInstance.get<JDEResponse>(
      `/v2/dataservice/table/F0101?${params.toString()}`,
      { headers: { Authorization: `Bearer ${jde.getToken()}` } },
    );

    // Extract the rowset (array of vendor objects) from the response
    const rowset: VendorRecord[] =
      response.data?.fs_DATABROWSE_F0101?.data?.gridData?.rowset || [];
    info(`Fetched ${rowset.length} vendors.`);

    // Load F0101 field details from Excel (async)
    const fieldDetails: Record<string, F0101FieldDetail> =
      await loadF0101FieldDetails();

    // Debug: log the field mapping keys and a sample vendor's keys
    if (rowset.length > 0) {
      info('Excel fieldDetails keys:', Object.keys(fieldDetails));
      info('Sample vendor keys:', Object.keys(rowset[0]));
    }

    // Enrich each vendor object with field metadata for each property
    const enrichedRowset: EnrichedVendor[] = rowset.map(
      (vendor: VendorRecord) => {
        const enrichedVendor: EnrichedVendor = {};

        Object.keys(vendor).forEach((field: string) => {
          const value = vendor[field];

          // Omit fields with value null or only whitespace
          if (value === null) return;
          if (typeof value === 'string' && value.trim() === '') return;

          // Safe access to fieldDetails with proper type checking
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

        return enrichedVendor;
      },
    );

    info('Vendors:\n' + JSON.stringify(enrichedRowset, null, 2));

    // Also print to console directly
    console.log('Vendors:\n' + JSON.stringify(enrichedRowset, null, 2));

    // Save to vendors.json for inspection
    fs.writeFileSync(
      'vendors.json',
      JSON.stringify(enrichedRowset, null, 2),
      'utf-8',
    );

    return enrichedRowset;
  } catch (err: unknown) {
    // Log and rethrow errors for upstream handling
    if (err instanceof Error) {
      error('Failed to fetch vendors:', err.message);
    } else {
      error('Failed to fetch vendors:', String(err));
    }

    throw err;
  }
}
