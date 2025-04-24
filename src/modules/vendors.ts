// src/modules/vendors.ts

// Import the JDE connection service for authentication and API calls
import { JDEConnectionService } from '../services/JDEConnectionService';
import { info, error } from '../utils/logger';

/**
 * Fetches all vendor records from the JDE F0101 table.
 * Filters by AT1 = 'V' (vendor type) and returns all available fields.
 *
 * @returns Array of vendor objects from JDE
 */

export async function getAllVendors(): Promise<any[]> {
  // Create a new connection service instance and authenticate
  const jde = new JDEConnectionService();
  await jde.authenticate();

  // Set up query parameters:
  // - $filter: only vendors (AT1 = 'V')
  // - $limit: max records (adjust as needed)
  // - $token: required for AIS dataservice calls

  // Example: fetch vendor address numbers and names
  const params = new URLSearchParams({
    '$filter': 'F0101.AT1 EQ V', // V for Vendors
    '$limit': '10',
    '$token': jde.getToken()!
  });
  try {
    // Call the dataservice API to fetch vendor records
    const response = await jde.getAxiosInstance().get(`/v2/dataservice/table/F0101?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jde.getToken()}` }
    });
    // Extract the rowset (array of vendor objects) from the response
    const rowset = response.data?.fs_DATABROWSE_F0101?.data?.gridData?.rowset || [];
    info(`Fetched ${rowset.length} vendors.`);
    return rowset;
  } catch (err: any) {
    // Log and rethrow errors for upstream handling
    error('Failed to fetch vendors:', err?.message || err);
    throw err;
  }
}
