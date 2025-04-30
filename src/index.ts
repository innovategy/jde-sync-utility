// src/index.ts

// Load environment variables from .env file at startup
import 'dotenv/config';

// Import the logger utility for consistent log output
import { info, error } from './utils/logger';
// Import the JDE connection service (handles authentication, tokens, etc.)
import { JDEConnectionService } from './services/JDEConnectionService';
import { buildVendorsJson } from './modules/vendors';

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
    // Batch process all vendors and write unified JSON files
    info(
      'Batch processing all vendors and writing vendors.json and vendors-enhanced.json...',
    );
    await buildVendorsJson();
    info(
      'Batch vendor sync complete. See vendors.json and vendors-enhanced.json in the project root.',
    );
  } catch (err) {
    error(
      'Error during batch vendor sync:',
      err instanceof Error ? err.message : String(err),
    );
  }
}

// Run the main function and catch any unhandled errors
main().catch((err: unknown) => {
  error('Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
