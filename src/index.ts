// src/index.ts

// Load environment variables from .env file at startup
import 'dotenv/config';

// Import the logger utility for consistent log output
import { info, error } from './utils/logger';
// Import the JDE connection service (handles authentication, tokens, etc.)
import { JDEConnectionService } from './services/JDEConnectionService';
// Import modules for different JDE tables
import { getAddressBookRecords } from './modules/addressBook';
import { getContactInfoRecords } from './modules/contactInfo';
import { getMailingAddressRecords } from './modules/mailingAddress';
import { getVendorMasterRecords } from './modules/vendorMaster';
import { getWhosWhoRecords } from './modules/whosWho';
import * as fs from 'fs';

/**
 * Interface for a complete vendor record with all related data
 */
interface CompleteVendorRecord {
  addressNumber: string;
  vendorMaster: any[];
  addressBook: any[];
  contactInfo: any[];
  mailingAddress: any[];
  whosWho: any[];
}

/**
 * Fetches a single vendor record by address number and all related data from different JDE tables
 *
 * @param addressNumber The vendor's address number to fetch
 * @returns A complete vendor record with all related data
 */
async function getCompleteVendorRecord(
  addressNumber: string,
): Promise<CompleteVendorRecord> {
  info(`Fetching complete vendor record for address number: ${addressNumber}`);

  // Fetch data from all relevant tables in parallel for efficiency
  const [vendorMaster, addressBook, contactInfo, mailingAddress, whosWho] =
    await Promise.all([
      getVendorMasterRecords(addressNumber),
      getAddressBookRecords(addressNumber),
      getContactInfoRecords(addressNumber),
      getMailingAddressRecords(addressNumber),
      getWhosWhoRecords(addressNumber),
    ]);

  // Combine all data into a single comprehensive record
  const completeRecord: CompleteVendorRecord = {
    addressNumber,
    vendorMaster,
    addressBook,
    contactInfo,
    mailingAddress,
    whosWho,
  };

  // Save the complete record to a JSON file for inspection
  fs.writeFileSync(
    `complete_vendor_${addressNumber}.json`,
    JSON.stringify(completeRecord, null, 2),
    'utf-8',
  );

  info(
    `Complete vendor record for address number ${addressNumber} saved to complete_vendor_${addressNumber}.json`,
  );

  return completeRecord;
}

/**
 * Main entry point for the JDE Sync Utility.
 * - Validates connection to the JDE AIS server
 * - Fetches a single vendor record with all related data
 */
async function main() {
  info('Starting JDE Sync Utility...');

  // Instantiate the connection service (reads config from .env)
  const jde = new JDEConnectionService();

  // Validate connection by authenticating and calling /v2/defaultconfig
  const valid = await jde.validateConnection();
  if (!valid) {
    error('Connection validation failed. Exiting.');
    process.exit(1);
  }

  try {
    // Define the address number to fetch (this could come from command line args or config)
    const addressNumber = process.env.VENDOR_ADDRESS_NUMBER || '4242'; // Default or from env var

    // Fetch complete vendor record with all related data
    info(`Fetching vendor with address number: ${addressNumber}`);
    const completeVendor = await getCompleteVendorRecord(addressNumber);

    // Log a summary of the data retrieved
    info('Vendor data retrieval complete. Summary:');
    info(`- Vendor Master records: ${completeVendor.vendorMaster.length}`);
    info(`- Address Book records: ${completeVendor.addressBook.length}`);
    info(`- Contact Info records: ${completeVendor.contactInfo.length}`);
    info(`- Mailing Address records: ${completeVendor.mailingAddress.length}`);
    info(`- Who's Who records: ${completeVendor.whosWho.length}`);
  } catch (err) {
    error(
      'Error fetching vendor data:',
      err instanceof Error ? err.message : String(err),
    );
  }
}

// Run the main function and catch any unhandled errors
main().catch((err: unknown) => {
  error('Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
