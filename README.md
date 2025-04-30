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
│   ├── index.ts                # Entry point: validates connection, runs batch sync
│   ├── services/
│   │   └── JDEConnectionService.ts  # Handles AIS authentication and token
│   ├── modules/
│   │   ├── addressBook.ts      # Fetches Address Book data (F0101)
│   │   ├── contactInfo.ts      # Fetches Who's Who data (F0111)
│   │   ├── mailingAddress.ts   # Fetches Address data (F0116)
│   │   └── vendors.ts          # Coordinates fetching vendor/supplier data (F0401) & related info
│   └── utils/
│       ├── logger.ts           # Logger utility
│       ├── f0101Excel.ts       # Loads F0101 field details from Excel
│       ├── f0111Excel.ts       # Loads F0111 field details from Excel
│       ├── f0115Excel.ts       # Loads F0115 field details from Excel
│       ├── f0116Excel.ts       # Loads F0116 field details from Excel
├── data/                       # Contains Excel files with field details
│   ├── F0101.xlsx              # Address Book field details
│   ├── F0111.xlsx              # Who's Who field details
│   ├── F0115.xlsx              # Phone Numbers field details
│   └── F0116.xlsx              # Addresses field details
├── .env                        # AIS connection configuration
├── vendors.json                # Output file with basic vendor details
├── vendors-enhanced.json       # Output file with comprehensive vendor details
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

Run the main sync script:
```bash
npm run sync
```

Or for development (using ts-node):
```bash
npm run sync:dev
```

The script (`src/index.ts`) will:
- Validate the connection to the AIS server using `JDEConnectionService`.
- Execute the `buildVendorsJson` function from `src/modules/vendors.ts`.
- This function fetches data from multiple JDE tables (coordinated via the modules) and generates two output files:
    - `vendors.json`
    - `vendors-enhanced.json`

### Output Files

After running the script, you'll get two JSON files in the project root:

1.  **vendors.json**: Contains a basic list or summary of vendors processed (details depend on implementation in `vendors.ts`).

2.  **vendors-enhanced.json**: Contains comprehensive vendor records that combine data from multiple related tables:
    - Address Book (F0101 - via `addressBook.ts`)
    - Who's Who / Contacts (F0111 - via `contactInfo.ts`)
    - Phone Numbers (F0115 - via `vendors.ts` likely uses `f0115Excel.ts`)
    - Addresses (F0116 - via `mailingAddress.ts`)
    - Supplier Master (F0401 - via `vendors.ts`)

    Each record is enriched with field metadata from the corresponding Excel files (`F0101.xlsx`, `F0111.xlsx`, `F0115.xlsx`, `F0116.xlsx`) located in the `data/` folder.

---

## Extending the Utility

- **Add new modules**: Create a new file in `src/modules/` (e.g., `invoices.ts`) and export functions for your business logic.
- **Use the connection service**: Import and instantiate `JDEConnectionService` for token/auth.
- **Leverage the logger**: Use `info`, `error`, and `debug` from `logger.ts` for consistent logs.
- **Add new Excel loaders**: If working with new tables, create corresponding utility files in `src/utils/` (e.g., `fXXXXExcel.ts`) following the existing pattern to load field details.
- **Extend the data folder**: Add new Excel files (e.g., `FXXXX.xlsx`) with field details for the new tables.

---

## Advanced: Field Metadata Enrichment

The utility includes Excel-based field metadata loaders in the `src/utils/` directory that load field details from Excel files in the `data/` folder. These loaders are used to enrich JDE data with comprehensive metadata.

**Example usage:**
```typescript
import { loadF0101FieldDetails } from './utils/f0101Excel';

// Load field details from Excel
const fieldDetails = await loadF0101FieldDetails();
```

- Each Excel file should contain columns for field name, description, data type, and size
- The utility automatically maps JDE field codes to their corresponding metadata
- This approach allows for offline enrichment without requiring additional API calls

---

## Troubleshooting
- **500 error from JDE**: Confirm endpoint paths, tokens, roles, and permissions in your `.env` and JDE setup. Check `JDEConnectionService.ts` for specific endpoints used.
- **Data fetch returns partial data**: Check the logic within the relevant module in `src/modules/` for limits or pagination needs.
- **Missing Excel files**: Ensure required Excel files (`F0101.xlsx`, `F0111.xlsx`, etc.) are present in the `data/` folder and match the loaders in `src/utils/`.
- **Type errors**: Run `npm run build` or check your TS configuration (`tsconfig.json`).

---

## Contribution & Support
This project is designed for rapid extension and adaptation to your JDE environment. Contributions and suggestions are welcome!

## Stay in touch

- Author - [Sina Ghazi](https://www.upwork.com/freelancers/sinaghazi)

## License
2025 by Innovategy Oy is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Support

For support, please open an issue in the GitHub repository or contact the development team.