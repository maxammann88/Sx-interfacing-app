export interface Country {
  id: number;
  fir: number;
  debitor1: string;
  iso: string;
  kst: number | null;
  name: string;
  comment: string | null;
  verrkto: string | null;
  kreditor: string | null;
  revc: string | null;
  debitor760: string | null;
  kreditor760: string | null;
  stSchlLstRe: string | null;
  stSchlLstGs: string | null;
  revc2: string | null;
  stSchlLiefRe: string | null;
  emails: string | null;
  partnerStatus: string | null;
  zusatz: string | null;
  finalInterfacing: string | null;
  vertragsende: string | null;
  debitor10: string | null;
}

export interface MasterData {
  id: number;
  uid: string | null;
  ktod: string;
  nam1: string | null;
  nam2: string | null;
  nam3: string | null;
  str: string | null;
  ort: string | null;
  plz: string | null;
  lanb: string | null;
  payt: number | null;
}

export interface SapImport {
  id: number;
  uploadId: number;
  konto: string;
  buchungsschluessel: string | null;
  belegart: string | null;
  referenzschluessel3: string | null;
  referenz: string | null;
  zuordnung: string | null;
  buchungsperiode: string | null;
  buchungsdatum: string | null;
  belegdatum: string | null;
  nettofaelligkeit: string | null;
  kontoGegenbuchung: string | null;
  sollHabenKennz: string | null;
  steuerkennzeichen: string | null;
  belegnummer: string | null;
  p: string | null;
  ausgleichsdatum: string | null;
  text: string | null;
  belegkopftext: string | null;
  buchungsprogramm: string | null;
  betragHauswaehrung: number;
  hauswaehrung: string | null;
  type: string | null;
}

export interface Upload {
  id: number;
  filename: string;
  uploadType: string;
  accountingPeriod: string | null;
  uploadedAt: string;
  recordCount: number;
}

export interface BillingRun {
  id: number;
  accountingPeriod: string;
  releaseDate: string;
  paymentTermDays: number;
  createdAt: string;
}

export interface BillingBreakdownLine {
  description: string;
  amount: number;
}

export interface BillingBreakdown {
  sapDescription: string;
  sapAmount: number;
  uploadAmount: number;
  hasDeviation: boolean;
  lines: BillingBreakdownLine[];
}

export interface StatementData {
  country: Country;
  masterData: MasterData | null;
  accountingPeriod: string;
  releaseDate: string;
  paymentTermDays: number;
  clearing: StatementLine[];
  clearingSubtotal: number;
  billing: StatementLine[];
  billingSubtotal: number;
  billingBreakdowns?: BillingBreakdown[];
  totalInterfacingDue: number;
  accountStatement: AccountStatement;
  depositHeld: number;
}

export interface StatementLine {
  type: string;
  reference: string;
  documentType?: string;
  date?: string;
  description: string;
  amount: number;
}

export interface PreviousMonthItem {
  nettofaelligkeit: string | null;
  description: string;
  amount: number;
}

export interface PaymentItem {
  date: string;
  description: string;
  amount: number;
}

export interface AccountStatement {
  previousPeriodBalance: number;
  lastSubmissionDate: string;
  periodEndDate: string;
  overdueBalance: number;
  dueBalance: number;
  dueUntilDate: string;
  paymentBySixt: number;
  paymentByPartner: number;
  paymentBySixtItems: PaymentItem[];
  paymentByPartnerItems: PaymentItem[];
  totalInterfacingAmount: number;
  totalInterfacingDueDate: string;
  balanceOpenItems: number;
  previousMonthItems: PreviousMonthItem[];
}

export interface CountryWithMasterData extends Country {
  masterData?: MasterData | null;
}

export interface OverviewSubBreakdown {
  label: string;
  amount: number;
}

export interface OverviewRow {
  countryId: number;
  fir: number;
  iso: string;
  name: string;
  status: string | null;
  clearingSubtotal: number;
  billingSubtotal: number;
  totalInterfacingDue: number;
  previousPeriodBalance: number;
  overdueBalance: number;
  dueBalance: number;
  paymentBySixt: number;
  paymentByPartner: number;
  balanceOpenItems: number;
  clearingBreakdown: OverviewSubBreakdown[];
  operationalBreakdown: OverviewSubBreakdown[];
  contractualBreakdown: OverviewSubBreakdown[];
}

export interface InterfacingPlan {
  id: number;
  period: string;
  releaseDate: string | null;
  creator: string | null;
  reviewer: string | null;
  updatedAt: string;
}

export type UploadType = 'sap' | 'countries' | 'master-data' | 'gds-dcf';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GdsDcfPartner {
  id: string;
  name: string;
  sourceChannels: string[];
  feesByRegion: {
    region: 'EMEA' | 'Americas' | 'Other';
    amount: number;
    currency: string;
  }[];
  voucherRules?: {
    dfrFees: { 
      [dfrCode: string]: { 
        amount: number; 
        currency: string; 
      }; 
    };
  };
}

export interface GdsDcfReservation {
  resNumber: string;
  source: string;
  pos: string;
  pci: string;
  pickupDate: string;
  rateCode: string;
  agency: string;
  iata: string;
  fee: number;
  mandantCode?: string;
  status?: string;
  invoiceType?: string;
  serialNumber?: number;
  voucherNumber?: string;
  dfr?: string;
}

export interface GdsDcfValidationResult {
  reservation: GdsDcfReservation;
  isChargeable: boolean;
  calculatedFee: number;
  currency: string;
  partner: string;
  region: string;
  validationSteps: {
    step: string;
    passed: boolean;
    reason?: string;
  }[];
}

export interface GdsDcfUpload {
  id: number;
  filename: string;
  uploadedAt: string;
  recordCount: number;
  chargeableCount: number;
  totalFees: number;
}
