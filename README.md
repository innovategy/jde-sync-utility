# JDE Sync Utility

A modular, extensible Node.js/TypeScript utility for interacting with JD Edwards (JDE) EnterpriseOne via the AIS REST API. Designed for easy configuration, robust connection handling, and rapid extension to new JDE modules.

---

## Features
- **Modular architecture**: Each JDE table or business object (e.g., vendors, invoices) is implemented as a separate module.
- **Environment-based configuration**: All AIS connection settings are managed via a `.env` file.
- **Connection service**: Handles authentication, token management, and connection validation.
- **Logger utility**: Consistent, timestamped logging for info, errors, and debug output.
- **Field metadata enrichment**: Load field details from Excel files to enrich JDE data with comprehensive metadata including field names, descriptions, data types, and sizes.
- **Ready for extension**: Easily add new modules for other tables or business logic.

---

## Project Structure

```
├── src/
│   ├── index.ts                # Entry point: connection validation, demo usage
│   ├── services/
│   │   └── JDEConnectionService.ts  # Handles AIS authentication and token
│   ├── modules/
│   │   ├── vendors.ts          # Fetches all vendor details from F0101
│   │   └── vendorsMaster.ts    # Builds comprehensive vendor master records
│   └── utils/
│       ├── logger.ts           # Logger utility
│       ├── fieldMetadata.ts    # Utility to fetch field metadata/UDC info
│       ├── f0101Excel.ts       # Loads F0101 field details from Excel
│       ├── f0111Excel.ts       # Loads F0111 field details from Excel
│       ├── f0115Excel.ts       # Loads F0115 field details from Excel
│       ├── f01151Excel.ts      # Loads F01151 field details from Excel
│       ├── f0116Excel.ts       # Loads F0116 field details from Excel
│       └── f0401Excel.ts       # Loads F0401 field details from Excel
├── data/                       # Contains Excel files with field details
│   ├── F0101.xlsx              # Address Book field details
│   ├── F0111.xlsx              # Who's Who field details
│   ├── F0115.xlsx              # Phone Numbers field details
│   ├── F01151.xlsx             # Electronic Addresses field details
│   ├── F0116.xlsx              # Addresses field details
│   └── F0401.xlsx              # Supplier Master field details
├── .env                        # AIS connection configuration
├── vendors.json                # Output file with basic vendor details
├── vendors_master.json         # Output file with comprehensive vendor details
└── README.md                   # This file
```

---

## Setup & Installation

1. **Clone the repo**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   AIS_BASE_URL=https://your-jde-ais-server/jderest
   AIS_USERNAME=your_jde_username
   AIS_PASSWORD=your_jde_password
   AIS_ENVIRONMENT=your_jde_env
   AIS_ROLE=your_jde_role
   ```

---

## Usage

Build the project:
```bash
npm run build
```

Run the main script:
```bash
npm run sync
```

Or for development (using ts-node):
```bash
npm run sync:dev
```

The script will:
- Validate connection to the AIS server
- Fetch basic vendor details from F0101 and save to `vendors.json`
- Build comprehensive vendor master records with data from multiple tables and save to `vendors_master.json`

### Output Files

After running the script, you'll get two JSON files in the project root:

1. **vendors.json**: Contains basic vendor information from the F0101 table, enriched with field metadata.

2. **vendors_master.json**: Contains comprehensive vendor master records that combine data from multiple tables:
   - F0101 (Address Book)
   - F0111 (Who's Who)
   - F0115 (Phone Numbers)
   - F01151 (Electronic Addresses)
   - F0116 (Addresses)
   - F0401 (Supplier Master)

   Each record is enriched with field metadata from the corresponding Excel files in the `data/` folder.

---

## Extending the Utility

- **Add new modules**: Create a new file in `src/modules/` (e.g., `invoices.ts`) and export a function for your business logic.
- **Use the connection service**: Import and instantiate `JDEConnectionService` for token/auth.
- **Leverage the logger**: Use `info`, `error`, and `debug` from `logger.ts` for consistent logs.
- **Add new Excel loaders**: Follow the pattern in the existing Excel utility files to load field details for additional tables.
- **Extend the data folder**: Add new Excel files with field details for additional tables you want to work with.

---

## Advanced: Field Metadata Enrichment

The utility includes Excel-based field metadata loaders in the `src/utils/` directory that load field details from Excel files in the `data/` folder. These loaders are used to enrich JDE data with comprehensive metadata.

**Example usage:**
```typescript
import { loadF0101FieldDetails } from './utils/f0101Excel';

// Load field details from Excel
const fieldDetails = await loadF0101FieldDetails();

// Use field details to enrich data
const enrichedData = {
  value: vendorData.AN8,
  details: fieldDetails['F0101_AN8'] || null
};
```

- Each Excel file should contain columns for field name, description, data type, and size
- The utility automatically maps JDE field codes to their corresponding metadata
- This approach allows for offline enrichment without requiring additional API calls

---

## Troubleshooting
- **500 error from /jargonservice**: Confirm endpoint path, token, and permissions. Some setups require extra headers or different endpoint versions (e.g., `/jderest/v2/jargonservice`).
- **Vendor fetch returns partial data**: Adjust `$limit` in `vendors.ts` or add pagination logic in your module.
- **Missing Excel files**: Ensure all required Excel files are present in the `data/` folder. The utility expects specific Excel files with field details for each table.
- **Type errors**: If you encounter TypeScript errors, ensure you're using the correct import syntax (e.g., `import * as fs from 'fs'` instead of `import fs from 'fs'`).

---

## Contribution & Support
This project is designed for rapid extension and adaptation to your JDE environment. Contributions and suggestions are welcome!

## Stay in touch

- Author - [Sina Ghazi](https://www.upwork.com/freelancers/sinaghazi)

## License
2025 by Innovategy Oy is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Support

For support, please open an issue in the GitHub repository or contact the development team.