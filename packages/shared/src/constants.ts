export const SIXT_COLORS = {
  primary: '#FF5F00',
  secondary: '#000000',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#333333',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
} as const;

export const DEFAULT_PAYMENT_TERM_DAYS = 30;

export const SAP_CSV_HEADERS = [
  'Konto',
  'Buchungsschlüssel',
  'Belegart',
  'Referenzschlüssel 3',
  'Referenz',
  'Zuordnung',
  'Buchungsperiode',
  'Buchungsdatum',
  'Belegdatum',
  'Nettofälligkeit',
  'Konto Gegenbuchung',
  'Soll/Haben-Kennz.',
  'Steuerkennzeichen',
  'Belegnummer',
  'P',
  'Ausgleichsdatum',
  'Text',
  'Belegkopftext',
  'Buchungsprogramm',
  'Betrag in Hauswährung',
  'Hauswährung',
  'Type',
] as const;

export const COUNTRY_CSV_HEADERS = [
  'FIR',
  'DEBITOR (1)',
  'ISO',
  'KST',
  'Column1',
  'comment',
  'VERRKTO',
  'Kreditor',
  'revc',
  'DEBITOR (760)',
  'KREDITOR (760)',
  'St Schl LST RE',
  'St Schl LST GS',
  'revc2',
  'St Schl LIEF RE',
  'E-Mails',
  'Partner Status',
  'Zusatz',
  'Final Interfacing',
  'aktuelles Vertragsende',
  'DEBITOR (10)',
] as const;

export const SAP_TYPES = {
  CLEARING: 'Clearing',
  INVOICE: 'Invoice',
  CREDIT_NOTE: 'Credit Note',
  PAYMENT: 'Payment',
} as const;
