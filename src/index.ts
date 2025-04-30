// src/index.ts

// Load environment variables from .env file at startup
import 'dotenv/config';

// Import the logger utility for consistent log output
import { info, error } from './utils/logger';
// Import the JDE connection service (handles authentication, tokens, etc.)
import { JDEConnectionService } from './services/JDEConnectionService';
// Import the vendors module (fetches vendor data from JDE)
import { getAllVendors } from './modules/vendors';

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
  info('Vendors:', vendors);
}

// Run the main function and catch any unhandled errors
main().catch((err) => {
  error('Fatal error:', err?.message || err);
  process.exit(1);
});
