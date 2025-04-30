// src/modules/addressBook.ts

// Import the JDE connection service for authentication and API calls
import { JDEConnectionService } from '../services/JDEConnectionService';
import { info, error } from '../utils/logger';
import { loadF0115FieldDetails, F0115FieldDetail } from '../utils/f0115Excel';

// Define interfaces for our data structures
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
  rowset: AddressBookRecord[];
  [key: string]: any;
}

interface DataBrowseF0115 {
  data: {
    gridData: GridData;
    [key: string]: any;
  };
  [key: string]: any;
}

interface JDEResponse {
  fs_DATABROWSE_F0115?: DataBrowseF0115;
  [key: string]: any;
}

// Define the structure of an address book record from JDE
interface AddressBookRecord {
  [key: string]: unknown;
}

// Define the structure of an enhanced address book field with metadata
interface EnrichedAddressBookField {
  value: unknown;
  details: F0115FieldDetail | null;
}

// Define the structure of an enhanced address book record with metadata
interface EnrichedAddressBookRecord {
  [key: string]: EnrichedAddressBookField;
}

/**
 * Result interface for address book records containing both raw and enhanced data
 */
export interface AddressBookResult {
  raw: AddressBookRecord[];
  enhanced: EnrichedAddressBookRecord[];
}

/**
 * Fetches address book records for a specific address number from the JDE F0115 table.
 *
 * @param addressNumber The address number to fetch records for
 * @returns Object containing both raw and enhanced address book records
 */
export async function getAddressBookRecords(
  addressNumber: string,
): Promise<AddressBookResult> {
  // Create a new connection service instance and authenticate
  const jde = new JDEConnectionService();
  await jde.authenticate();

  // Set up query parameters:
  // - $filter: only records for the specified address number
  // - $limit: max records (adjust as needed)
  // - $token: required for AIS dataservice calls
  const params = new URLSearchParams({
    $filter: `AN8 EQ ${addressNumber}`, // Simple filter format
    $limit: '10',
    $token: jde.getToken()!,
  });

  try {
    // First attempt with simple filter format
    try {
      info(
        `Fetching F0115 address book records for address number ${addressNumber} with filter: ${params.get('$filter')}`,
      );

      // Get a reference to the axios instance and explicitly type it
      const axiosInstance = jde.getAxiosInstance() as unknown as AxiosInstance;

      // Make the API call with proper typing
      const response = await axiosInstance.get<JDEResponse>(
        `/v2/dataservice/table/F0115?${params.toString()}`,
        { headers: { Authorization: `Bearer ${jde.getToken()}` } },
      );

      // Extract the rowset from the response
      const rowset: AddressBookRecord[] =
        response.data?.fs_DATABROWSE_F0115?.data?.gridData?.rowset || [];

      info(
        `Fetched ${rowset.length} F0115 address book records for address number ${addressNumber}`,
      );

      // No longer saving to file, just log the count
      info(`Processed ${rowset.length} raw F0115 address book records`);

      // Load F0115 field details from Excel (async)
      const fieldDetails: Record<string, F0115FieldDetail> =
        await loadF0115FieldDetails();

      // Debug: log the field mapping keys and a sample record's keys
      if (rowset.length > 0) {
        //info('Excel fieldDetails keys:', Object.keys(fieldDetails));
        //info('Sample address book keys:', Object.keys(rowset[0]));
      }

      // Create enhanced version with field metadata
      const enhancedRowset: EnrichedAddressBookRecord[] = rowset.map(
        (record: AddressBookRecord) => {
          const enhancedRecord: EnrichedAddressBookRecord = {};

          Object.keys(record).forEach((field: string) => {
            const value = record[field];

            // Omit fields with value null or only whitespace
            if (value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;

            // Safe access to fieldDetails with proper type checking
            const fieldDetail = fieldDetails[field];

            enhancedRecord[field] = {
              value,
              details: fieldDetail
                ? {
                    fieldName: fieldDetail.fieldName,
                    itemDescription: fieldDetail.itemDescription,
                    itemLongName: fieldDetail.itemLongName,
                    itemDataTypeDescription:
                      fieldDetail.itemDataTypeDescription,
                    itemSize: fieldDetail.itemSize,
                  }
                : null,
            };
          });

          return enhancedRecord;
        },
      );

      // No longer saving to file, just log the count
      info(
        `Processed ${enhancedRowset.length} enhanced F0115 address book records`,
      );

      return {
        raw: rowset,
        enhanced: enhancedRowset,
      };
    } catch (err) {
      // If the first attempt fails, try with table name in filter
      info(
        `First attempt failed, retrying with table name in filter for address number ${addressNumber}. Error: ${err instanceof Error ? err.message : String(err)}`,
      );

      const paramsWithTable = new URLSearchParams({
        $filter: `F0115.AN8 EQ ${addressNumber}`, // Filter format with table name
        $limit: '10',
        $token: jde.getToken()!,
      });

      info(`Retrying with filter: ${paramsWithTable.get('$filter')}`);

      // Get a reference to the axios instance and explicitly type it
      const axiosInstance = jde.getAxiosInstance() as unknown as AxiosInstance;

      // Make the API call with proper typing
      const response = await axiosInstance.get<JDEResponse>(
        `/v2/dataservice/table/F0115?${paramsWithTable.toString()}`,
        { headers: { Authorization: `Bearer ${jde.getToken()}` } },
      );

      // Extract the rowset from the response
      const rowset: AddressBookRecord[] =
        response.data?.fs_DATABROWSE_F0115?.data?.gridData?.rowset || [];

      info(
        `Fetched ${rowset.length} F0115 address book records for address number ${addressNumber} with alternate filter`,
      );

      // No longer saving to file, just log the count
      info(
        `Processed ${rowset.length} raw F0115 address book records (alternate filter)`,
      );

      // Load F0115 field details from Excel (async)
      const fieldDetails: Record<string, F0115FieldDetail> =
        await loadF0115FieldDetails();

      // Debug: log the field mapping keys and a sample record's keys
      if (rowset.length > 0) {
        info('Excel fieldDetails keys:', Object.keys(fieldDetails));
        info('Sample address book keys:', Object.keys(rowset[0]));
      }

      // Create enhanced version with field metadata
      const enhancedRowset: EnrichedAddressBookRecord[] = rowset.map(
        (record: AddressBookRecord) => {
          const enhancedRecord: EnrichedAddressBookRecord = {};

          Object.keys(record).forEach((field: string) => {
            const value = record[field];

            // Omit fields with value null or only whitespace
            if (value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;

            // Safe access to fieldDetails with proper type checking
            const fieldDetail = fieldDetails[field];

            enhancedRecord[field] = {
              value,
              details: fieldDetail
                ? {
                    fieldName: fieldDetail.fieldName,
                    itemDescription: fieldDetail.itemDescription,
                    itemLongName: fieldDetail.itemLongName,
                    itemDataTypeDescription:
                      fieldDetail.itemDataTypeDescription,
                    itemSize: fieldDetail.itemSize,
                  }
                : null,
            };
          });

          return enhancedRecord;
        },
      );

      // No longer saving to file, just log the count
      info(
        `Processed ${enhancedRowset.length} enhanced F0115 address book records (alternate filter)`,
      );

      return {
        raw: rowset,
        enhanced: enhancedRowset,
      };
    }
  } catch (err: unknown) {
    // Log the error but return an empty array to avoid breaking the calling code
    if (err instanceof Error) {
      error(
        `Failed to fetch F0115 address book records for address number ${addressNumber}:`,
        err.message,
      );
    } else {
      error(
        `Failed to fetch F0115 address book records for address number ${addressNumber}:`,
        String(err),
      );
    }

    // Return empty objects instead of throwing to prevent the entire process from failing
    return {
      raw: [],
      enhanced: [],
    };
  }
}

/**
 * Test function to fetch address book records for a specific address number
 */
export async function testGetAddressBookRecords(
  addressNumber: string,
): Promise<void> {
  try {
    info(
      `Testing getAddressBookRecords for address number ${addressNumber}...`,
    );
    const result = await getAddressBookRecords(addressNumber);
    info(
      `Test completed. Fetched ${result.raw.length} raw records and ${result.enhanced.length} enhanced records.`,
    );

    if (result.raw.length > 0) {
      info('Sample raw record keys:', Object.keys(result.raw[0]));
      info('Sample raw record:', JSON.stringify(result.raw[0], null, 2));
    }

    if (result.enhanced.length > 0) {
      info('Sample enhanced record keys:', Object.keys(result.enhanced[0]));
      info(
        'Sample enhanced record:',
        JSON.stringify(result.enhanced[0], null, 2),
      );
    }

    if (result.raw.length === 0 && result.enhanced.length === 0) {
      info('No records found.');
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      error('Test failed:', err.message);
    } else {
      error('Test failed:', String(err));
    }
  }
}
