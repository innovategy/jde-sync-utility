# JDE Sync Utility

A modular, extensible Node.js/TypeScript utility for interacting with JD Edwards (JDE) EnterpriseOne via the AIS REST API. Designed for easy configuration, robust connection handling, and rapid extension to new JDE modules.

---

## Features
- **Modular architecture**: Each JDE table or business object (e.g., vendors, invoices) is implemented as a separate module.
- **Environment-based configuration**: All AIS connection settings are managed via a `.env` file.
- **Connection service**: Handles authentication, token management, and connection validation.
- **Logger utility**: Consistent, timestamped logging for info, errors, and debug output.
- **Field metadata utility**: Programmatically check if a field has UDC, enum, or metadata mapping using the JDE jargonservice.
- **Ready for extension**: Easily add new modules for other tables or business logic.

---

## Project Structure

```
├── src/
│   ├── index.ts                # Entry point: connection validation, demo usage
│   ├── services/
│   │   └── JDEConnectionService.ts  # Handles AIS authentication and token
│   ├── modules/
│   │   └── vendors.ts          # Fetches all vendor details from F0101
│   └── utils/
│       ├── logger.ts           # Logger utility
│       └── fieldMetadata.ts    # Utility to fetch field metadata/UDC info
├── .env                        # AIS connection configuration
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

Run the main script:
```bash
npx tsx src/index.ts
```
- Validates connection to the AIS server
- Fetches all vendors (from F0101)
- Demonstrates field metadata utility

---

## Extending the Utility

- **Add new modules**: Create a new file in `src/modules/` (e.g., `invoices.ts`) and export a function for your business logic.
- **Use the connection service**: Import and instantiate `JDEConnectionService` for token/auth.
- **Leverage the logger**: Use `info`, `error`, and `debug` from `logger.ts` for consistent logs.

---

## Advanced: Field Metadata & UDC Utility

The utility in `src/utils/fieldMetadata.ts` allows you to check if a field has UDC (User Defined Code), enum, or other metadata mappings by calling the AIS `/jargonservice` endpoint.

**Example usage:**
```typescript
import { checkFieldMetadata } from './utils/fieldMetadata';
await checkFieldMetadata('F0101', 'AT1'); // Check Address Type field
```
- The utility will log whether the field has UDC mapping, valid enum values, or neither.
- If your AIS server returns a 500 error, check server configuration, permissions, or endpoint path.

---

## Troubleshooting
- **500 error from /jargonservice**: Confirm endpoint path, token, and permissions. Some setups require extra headers or different endpoint versions (e.g., `/jderest/v2/jargonservice`).
- **Vendor fetch returns partial data**: Adjust `$limit` or add pagination logic in your module.

---

## Contribution & Support
This project is designed for rapid extension and adaptation to your JDE environment. Contributions and suggestions are welcome!

## Stay in touch

- Author - [Sina Ghazi](https://www.upwork.com/freelancers/sinaghazi)

## License
2025 by Innovategy Oy is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Support

For support, please open an issue in the GitHub repository or contact the development team.