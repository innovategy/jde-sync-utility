// src/modules/whosWho.ts

// Import the JDE connection service for authentication and API calls
import { JDEConnectionService } from '../services/JDEConnectionService';
import { info, error } from '../utils/logger';
import * as fs from 'fs';

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
  rowset: WhosWhoRecord[];
  [key: string]: any;
}

interface DataBrowseF01151 {
  data: {
    gridData: GridData;
    [key: string]: any;
  };
  [key: string]: any;
}

interface JDEResponse {
  fs_DATABROWSE_F01151?: DataBrowseF01151;
  [key: string]: any;
}

interface WhosWhoRecord {
  [key: string]: unknown;
}

/**
 * Fetches Who's Who records for a specific address number from the JDE F01151 table.
 *
 * @param addressNumber The address number to fetch records for
 * @returns Array of Who's Who records from JDE
 */
export async function getWhosWhoRecords(
  addressNumber: string,
): Promise<WhosWhoRecord[]> {
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
        `Fetching F01151 Who's Who records for address number ${addressNumber} with filter: ${params.get('$filter')}`,
      );

      // Get a reference to the axios instance and explicitly type it
      const axiosInstance = jde.getAxiosInstance() as unknown as AxiosInstance;

      // Make the API call with proper typing
      const response = await axiosInstance.get<JDEResponse>(
        `/v2/dataservice/table/F01151?${params.toString()}`,
        { headers: { Authorization: `Bearer ${jde.getToken()}` } },
      );

      // Extract the rowset from the response
      const rowset: WhosWhoRecord[] =
        response.data?.fs_DATABROWSE_F01151?.data?.gridData?.rowset || [];

      info(
        `Fetched ${rowset.length} F01151 Who's Who records for address number ${addressNumber}`,
      );

      // Save to a JSON file for inspection
      fs.writeFileSync(
        `whos_who_${addressNumber}.json`,
        JSON.stringify(rowset, null, 2),
        'utf-8',
      );

      return rowset;
    } catch (err) {
      // If the first attempt fails, try with table name in filter
      info(
        `First attempt failed, retrying with table name in filter for address number ${addressNumber}. Error: ${err instanceof Error ? err.message : String(err)}`,
      );

      const paramsWithTable = new URLSearchParams({
        $filter: `F01151.AN8 EQ ${addressNumber}`, // Filter format with table name
        $limit: '10',
        $token: jde.getToken()!,
      });

      info(`Retrying with filter: ${paramsWithTable.get('$filter')}`);

      // Get a reference to the axios instance and explicitly type it
      const axiosInstance = jde.getAxiosInstance() as unknown as AxiosInstance;

      // Make the API call with proper typing
      const response = await axiosInstance.get<JDEResponse>(
        `/v2/dataservice/table/F01151?${paramsWithTable.toString()}`,
        { headers: { Authorization: `Bearer ${jde.getToken()}` } },
      );

      // Extract the rowset from the response
      const rowset: WhosWhoRecord[] =
        response.data?.fs_DATABROWSE_F01151?.data?.gridData?.rowset || [];

      info(
        `Fetched ${rowset.length} F01151 Who's Who records for address number ${addressNumber} with alternate filter`,
      );

      // Save to a JSON file for inspection
      fs.writeFileSync(
        `whos_who_${addressNumber}.json`,
        JSON.stringify(rowset, null, 2),
        'utf-8',
      );

      return rowset;
    }
  } catch (err: unknown) {
    // Log the error but return an empty array to avoid breaking the calling code
    if (err instanceof Error) {
      error(
        `Failed to fetch F01151 Who's Who records for address number ${addressNumber}:`,
        err.message,
      );
    } else {
      error(
        `Failed to fetch F01151 Who's Who records for address number ${addressNumber}:`,
        String(err),
      );
    }

    // Return an empty array instead of throwing to prevent the entire process from failing
    return [];
  }
}

/**
 * Test function to fetch Who's Who records for a specific address number
 */
export async function testGetWhosWhoRecords(
  addressNumber: string,
): Promise<void> {
  try {
    info(`Testing getWhosWhoRecords for address number ${addressNumber}...`);
    const records = await getWhosWhoRecords(addressNumber);
    info(`Test completed. Fetched ${records.length} records.`);

    if (records.length > 0) {
      info('Sample record keys:', Object.keys(records[0]));
      info('Sample record:', JSON.stringify(records[0], null, 2));
    } else {
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
