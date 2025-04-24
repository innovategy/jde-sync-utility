// src/index.ts

// Load environment variables from .env file at startup
import 'dotenv/config';

// Import the logger utility for consistent log output
import { info, error } from './utils/logger';
// Import the JDE connection service (handles authentication, tokens, etc.)
import { JDEConnectionService } from './services/JDEConnectionService';
// Import the vendors module (fetches vendor data from JDE)
import { getAllVendors } from './modules/vendors';
import { getVendorFullProfile } from './modules/vendorProfile';
// Import the field metadata utility (checks UDC/enum info for fields)
import { checkFieldMetadata } from './utils/fieldMetadata';

/**
 * Main entry point for the JDE Sync Utility.
 * - Validates connection to the JDE AIS server
 * - Fetches all vendor records (F0101 table)
 * - Demonstrates field metadata utility (jargonservice)
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

  // Fetch all vendors (AT1 = 'V') from F0101 using the vendors module
  const vendors = await getAllVendors();
  info(`Fetched ${vendors.length} vendors. Fetching full profiles...`);

  // Log the first vendor object to determine field names
  if (vendors.length > 0) {
    info('Sample vendor object:', vendors[0]);
  }

  // For each vendor, fetch full profile (mailing, phones, master, performance)
  const fullProfiles = await Promise.all(
    vendors.map(async (vendor) => {
      // Try to find the address number field dynamically
      let addressNumber: any = null;
      for (const key of Object.keys(vendor)) {
        if (key.toUpperCase().includes('AN8')) {
          addressNumber = vendor[key];
          break;
        }
      }
      if (!addressNumber) return null;
      try {
        const profile = await getVendorFullProfile(addressNumber);
        return { ...vendor, ...profile };
      } catch (err) {
        error(`Failed to fetch full profile for vendor ${addressNumber}:`, err?.message || err);
        return { ...vendor, error: err?.message || err };
      }
    })
  );
  info('Vendor full profiles:', fullProfiles);

}

// Run the main function and catch any unhandled errors
main().catch((err) => {
  error('Fatal error:', err?.message || err);
  process.exit(1);
});
