# GDS & DCF Fee Calculation - User Guide

## Overview

The GDS & DCF Fee Calculation module automatically identifies chargeable reservations from GDS (Global Distribution Systems) and DCF (Direct Connect Fees) partners and calculates applicable fees based on configurable rules.

## Features

### 1. Calculation Rules Display (`/fsm/calculation`)
- Human-readable decision tree showing 6 validation steps
- Fee tables by partner and region
- Special rules for Amadeus (eVoucher) and Meili (DFR-based)
- Example scenarios with explanations

### 2. Parameter Management (`/fsm/parameters`)
- View all configured partners
- Edit fee amounts by region
- Modify source channel mappings
- Configure special voucher/DFR rules

### 3. Data Upload (`/fsm/data-upload`)
- Upload reservation data (Excel or CSV)
- Automatic validation on upload
- View upload history
- See summary statistics

### 4. Results View (`/fsm/results`)
- Detailed validation results per reservation
- Expandable validation steps for transparency
- Filter by partner, region, or chargeable status
- Export functionality (coming soon)

## Excel/CSV Format

### Required Columns:
- **RES-NUMBER**: Reservation number (required)
- **SOURCE**: Source channel (e.g., GDS_SABRE, GDS_GALILEO, XML_INTERFACE)
- **POS**: Point of sale country (2-letter ISO code)
- **PCI**: Pickup station code
- **PICK-UP**: Pickup date
- **RATECODE**: Rate code
- **AGENCY**: Agency number
- **IATA**: IATA code
- **FEE**: Original fee amount (if any)

### Optional Columns (for advanced validation):
- **MANDANT-CODE**: Mandant code for franchise check
- **STATUS**: Reservation status (Invoice, No Show, Open, Cancelled)
- **INVOICE-TYPE**: Invoice type (Main, Credit Note, etc.)
- **SERIAL-NUMBER**: Invoice serial number (MSER)
- **VOUCHER-NUMBER**: Voucher number (for Amadeus eVoucher detection)
- **DFR**: DFR code (for special discounts)

## Validation Logic

Every reservation goes through 6 validation steps:

1. **Reservation Number Check**: Must have a valid reservation number
2. **Source Channel Check**: Must be from a GDS/DCF partner
3. **Partner Check**: Partner must be configured in system
4. **Mandant Code Check**: Must be a franchise branch booking
5. **Status Check**: Must be Invoice, No Show, Open, or not cancelled via original channel
6. **Invoice Type Check**: Must be Main Invoice with MSER = 0 (prevents duplicates)

If ANY step fails → No fee charged
If ALL steps pass → Fee calculated based on partner and region

## Fee Calculation

### Standard Fees by Partner:

| Partner | EMEA | Americas | Other |
|---------|------|----------|-------|
| Travelport (Worldscan + Galileo) | USD 8.60 | USD 8.60 | USD 8.60 |
| Sabre | USD 7.17 | USD 7.17 | USD 7.17 |
| Amadeus | EUR 5.29 | EUR 5.29 | EUR 5.29 |
| Expedia (EMEA) | EUR 3.00 | EUR 4.00 | EUR 4.00 |
| Priceline (Americas) | USD 3.25 | USD 3.25 | USD 1.50 |
| Meili | EUR 5.50 | EUR 5.50 | EUR 5.50 |

### Special Rules:

**Amadeus eVoucher:**
- Base fee: EUR 5.29
- With eVoucher (DFR ≠ 10355): EUR 5.29 + EUR 0.26 = **EUR 6.55**
- Exception (DFR = 10355): EUR 5.29 (no adjustment)

**Meili Autoclub Australia:**
- Base fee: EUR 5.50
- With DFR 10897: EUR 5.50 - EUR 2.75 = **EUR 2.75**

## Usage Workflow

### Step 1: Review Calculation Rules
1. Navigate to `/fsm/calculation`
2. Review decision tree and fee tables
3. Understand validation logic

### Step 2: Configure Parameters (if needed)
1. Navigate to `/fsm/parameters`
2. View current partner configurations
3. Edit fees or add new partners (optional)

### Step 3: Upload Reservation Data
1. Navigate to `/fsm/data-upload`
2. Drag & drop Excel/CSV file or click to browse
3. System automatically:
   - Parses file
   - Validates each reservation
   - Calculates fees
   - Shows summary

### Step 4: Review Results
1. Click "View Results" on uploaded file
2. See summary statistics
3. Expand individual reservations to see validation details
4. Filter results as needed
5. Export for reporting (optional)

## Current Limitations (Mock Backend)

**Without PostgreSQL:**
- ✅ All features work
- ✅ Full validation logic
- ✅ Parameter management
- ⚠️ Data is stored in RAM
- ⚠️ Lost on server restart

**After PostgreSQL setup:**
- ✅ All data persists
- ✅ No code changes needed
- ✅ Production-ready

## Technical Details

### Backend Architecture:
- **Validator**: `packages/backend/src/services/gdsDcfValidator.ts`
- **Parser**: `packages/backend/src/services/gdsDcfParser.ts`
- **Routes**: `packages/backend/src/routes/gdsDcf.ts`
- **API Base**: `/api/gds-dcf`

### API Endpoints:
- `POST /api/gds-dcf/upload` - Upload file
- `POST /api/gds-dcf/validate/:uploadId` - Run validation
- `GET /api/gds-dcf/results/:uploadId` - Get results
- `GET /api/gds-dcf/uploads` - List all uploads
- `GET /api/gds-dcf/partners` - Get partner configs
- `POST /api/gds-dcf/partners` - Create/update partner
- `DELETE /api/gds-dcf/partners/:id` - Delete partner

### Data Types:
All TypeScript interfaces defined in `packages/shared/src/types.ts`

## Support

For questions or issues, use the "Features & Bugs" button to submit feedback.
