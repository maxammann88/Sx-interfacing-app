import { GdsDcfPartner, GdsDcfReservation, GdsDcfValidationResult } from '@sixt/shared';
import { ValidationRuleConfig } from './validationRuleConfigService';

// Historical USD to EUR exchange rates (end of month rates)
const USD_TO_EUR_RATES: { [key: string]: number } = {
  '2025-01': 0.95, // January 2025
  '2025-02': 0.94, // February 2025
  '2025-03': 0.93, // March 2025
  '2025-04': 0.92, // April 2025
  '2025-05': 0.91, // May 2025
  '2025-06': 0.90, // June 2025
  '2025-07': 0.91, // July 2025
  '2025-08': 0.92, // August 2025
  '2025-09': 0.93, // September 2025
  '2025-10': 0.92, // October 2025
  '2025-11': 0.91, // November 2025
  '2025-12': 0.90, // December 2025
  '2026-01': 0.91, // January 2026
  '2026-02': 0.92, // February 2026
  '2026-03': 0.92, // March 2026
};

const DEFAULT_USD_TO_EUR_RATE = 0.92; // Fallback rate

function getExchangeRate(handoverDate: string): number {
  if (!handoverDate || handoverDate.length < 7) {
    return DEFAULT_USD_TO_EUR_RATE;
  }
  
  // Extract YYYY-MM from handoverDate (format: YYYY-MM-DD)
  const yearMonth = handoverDate.substring(0, 7);
  
  return USD_TO_EUR_RATES[yearMonth] || DEFAULT_USD_TO_EUR_RATE;
}

export class GdsDcfValidator {
  private partners: GdsDcfPartner[];
  private franchiseMandantCodes: string[];
  private regionMappings: Map<string, string>;
  private ruleConfig: ValidationRuleConfig;

  constructor(
    partners: GdsDcfPartner[], 
    franchiseMandantCodes: string[], 
    regionMappings: Map<string, string> = new Map(),
    ruleConfig: ValidationRuleConfig
  ) {
    this.partners = partners;
    this.franchiseMandantCodes = franchiseMandantCodes;
    this.regionMappings = regionMappings;
    this.ruleConfig = ruleConfig;
  }

  validateReservation(reservation: GdsDcfReservation): GdsDcfValidationResult {
    const validationSteps: { step: string; passed: boolean; reason?: string }[] = [];
    
    // Step 1: Validate reservation number (always checked)
    const step1 = this.validateReservationNumber(reservation.resNumber);
    validationSteps.push(step1);
    if (!step1.passed) {
      return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
    }

    // Step 2: Determine if GDS or DCF (conditional based on config)
    if (this.ruleConfig.enableChannelCheck) {
      const isGDS = this.isGDSBooking(reservation.sourceChannel2, reservation.sourceChannel3);
      const isDCF = this.isDCFBooking(reservation.sourceChannel2, reservation.sourceChannel3);
      
      const step2 = {
        step: '2. GDS/DCF Channel Check',
        passed: isGDS || isDCF,
        reason: isGDS 
          ? `GDS booking detected (${reservation.sourceChannel2 || reservation.sourceChannel3})` 
          : isDCF 
          ? `DCF booking detected (${reservation.sourceChannel2}/${reservation.sourceChannel3})`
          : `Not a GDS/DCF booking (source: ${reservation.sourceChannel2}/${reservation.sourceChannel3})`,
      };
      validationSteps.push(step2);
      if (!step2.passed) {
        return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
      }
    }

    // Step 3: Validate mandant code (conditional based on config)
    if (this.ruleConfig.enableMandantCheck) {
      const step3 = this.validateMandantCode(reservation.mandantCode);
      validationSteps.push(step3);
      if (!step3.passed) {
        return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
      }
    }

    // Step 4: Validate status (conditional based on config)
    if (this.ruleConfig.enableStatusCheck) {
      const step4 = this.validateStatus(reservation.statusExtended);
      validationSteps.push(step4);
      if (!step4.passed) {
        return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
      }
    }

    // Calculate fee based on GDS or DCF
    const isGDS = this.isGDSBooking(reservation.sourceChannel2, reservation.sourceChannel3);
    const isDCF = this.isDCFBooking(reservation.sourceChannel2, reservation.sourceChannel3);
    
    let feeResult: { fee: number; currency: string; partner: string; region: string };
    let feeType: 'GDS' | 'DCF';
    
    if (isGDS) {
      feeType = 'GDS';
      feeResult = this.calculateGDSFee(
        reservation.sourceChannel2,
        reservation.sourceChannel3,
        reservation.voucherNumber,
        reservation.customerParentNum,
        reservation.posCountryCode
      );
    } else {
      feeType = 'DCF';
      feeResult = this.calculateDCFFee(
        reservation.sourceChannel2,
        reservation.sourceChannel3,
        reservation.posCountryCode,
        reservation.customerParentNum
      );
    }

    // Convert to EUR if needed using exchange rate from handover month
    const exchangeRate = getExchangeRate(reservation.handoverDate);
    const feeInEur = feeResult.currency === 'USD' 
      ? feeResult.fee * exchangeRate 
      : feeResult.fee;

    validationSteps.push({
      step: '5. Fee Calculation',
      passed: true,
      reason: `${feeResult.partner}: ${feeResult.currency} ${feeResult.fee.toFixed(2)} (EUR ${feeInEur.toFixed(2)}, rate: ${exchangeRate})`,
    });

    return {
      reservation,
      isChargeable: true,
      calculatedFee: feeInEur,
      currency: 'EUR', // Always return EUR
      partner: feeResult.partner,
      region: feeResult.region,
      feeType, // NEW: GDS or DCF
      validationSteps,
    };
  }

  private validateReservationNumber(resNumber: string): { step: string; passed: boolean; reason?: string } {
    const passed = resNumber && resNumber.trim().length > 0 && resNumber !== '0';
    return {
      step: '1. Reservation Number Check',
      passed,
      reason: passed ? `Reservation number exists: ${resNumber}` : 'No valid reservation number provided',
    };
  }

  private isGDSBooking(channel2: string, channel3: string): boolean {
    const gdsKeywords = ['galileo', 'worldspan', 'sabre', 'amadeus'];
    const combined = `${channel2} ${channel3}`.toLowerCase();
    return gdsKeywords.some(keyword => combined.includes(keyword));
  }

  private isDCFBooking(channel2: string, channel3: string): boolean {
    const isDCFChannel2 = ['soap', 'tpra'].some(kw => channel2.toLowerCase().includes(kw));
    const isDCFChannel3 = ['expedia', 'priceline', 'meili'].some(kw => channel3.toLowerCase().includes(kw));
    return isDCFChannel2 && isDCFChannel3;
  }

  private validateMandantCode(mandantCode?: string): { step: string; passed: boolean; reason?: string } {
    if (!mandantCode || mandantCode.trim() === '') {
      return {
        step: '3. Franchise Mandant Check',
        passed: false,
        reason: 'Mandant code is missing',
      };
    }
    
    // If no franchise mandants uploaded, pass with warning
    if (this.franchiseMandantCodes.length === 0) {
      return {
        step: '3. Franchise Mandant Check',
        passed: true,
        reason: `Mandant code ${mandantCode} - no franchise list uploaded (lenient mode)`,
      };
    }
    
    const passed = this.franchiseMandantCodes.includes(mandantCode);
    
    return {
      step: '3. Franchise Mandant Check',
      passed,
      reason: passed 
        ? `Mandant code ${mandantCode} belongs to franchise` 
        : `Mandant code ${mandantCode} not in franchise list`,
    };
  }

  private validateStatus(status?: string): { step: string; passed: boolean; reason?: string } {
    if (!status || status.trim() === '') {
      return {
        step: '4. Reservation Status Check',
        passed: false,
        reason: 'Status is missing',
      };
    }

    const validStatuses = this.ruleConfig.validStatuses;
    const statusLower = status.toLowerCase();
    const passed = validStatuses.some(s => statusLower.includes(s.toLowerCase()));

    return {
      step: '4. Reservation Status Check',
      passed,
      reason: passed 
        ? `Status valid: ${status}` 
        : `Invalid status for fee charging: ${status} (valid: ${validStatuses.join(', ')})`,
    };
  }

  private calculateGDSFee(
    channel2: string, 
    channel3: string,
    voucherNumber?: string,
    customerParentNum?: string,
    posCountryCode?: string
  ): { fee: number; currency: string; partner: string; region: string } {
    const combined = `${channel2} ${channel3}`.toLowerCase();

    const partner = this.partners.find(p => 
      p.category === 'gds' && 
      p.sourceChannels.some(ch => combined.includes(ch.toLowerCase()))
    );

    if (!partner) {
      return {
        fee: 0,
        currency: 'EUR',
        partner: 'Unknown GDS',
        region: 'GDS',
      };
    }

    const region = this.determineRegion(posCountryCode || '');

    if (partner.id === 'amadeus') {
      if (combined.includes('tpra') && customerParentNum === '10355') {
        const tpraFee = partner.dfrFeesWithoutEVoucher?.['10355'];
        if (tpraFee) {
          return {
            fee: tpraFee.amount,
            currency: tpraFee.currency,
            partner: `${partner.name} (Special TPRA)`,
            region,
          };
        }
      }

      if (voucherNumber && voucherNumber.trim() !== '' && voucherNumber.trim() !== ' ') {
        const regionFee = partner.feesByRegion.find(f => f.region === region);
        if (regionFee) {
          return {
            fee: regionFee.amount,
            currency: regionFee.currency,
            partner: `${partner.name} (with eVoucher)`,
            region,
          };
        }
      }

      const withoutVoucherFees = partner.feesByRegionWithoutEVoucher || partner.feesByRegion;
      const regionFee = withoutVoucherFees.find(f => f.region === region);
      if (regionFee) {
        return {
          fee: regionFee.amount,
          currency: regionFee.currency,
          partner: partner.name,
          region,
        };
      }
    }

    const regionFee = partner.feesByRegion.find(f => f.region === region);
    if (regionFee) {
      return {
        fee: regionFee.amount,
        currency: regionFee.currency,
        partner: partner.name,
        region,
      };
    }

    return {
      fee: 0,
      currency: 'EUR',
      partner: partner.name,
      region,
    };
  }

  private calculateDCFFee(
    channel2: string,
    channel3: string,
    posCountryCode: string,
    customerParentNum?: string
  ): { fee: number; currency: string; partner: string; region: string } {
    const channel3Lower = channel3.toLowerCase();

    const partner = this.partners.find(p => 
      p.category === 'dcf' && 
      p.sourceChannels.some(ch => channel3Lower.includes(ch.toLowerCase()))
    );

    if (!partner) {
      return {
        fee: 0,
        currency: 'EUR',
        partner: 'Unknown DCF',
        region: 'DCF',
      };
    }

    const region = this.determineRegion(posCountryCode);

    if (customerParentNum && partner.voucherRules?.dfrFees?.[customerParentNum]) {
      const dfrFee = partner.voucherRules.dfrFees[customerParentNum];
      return {
        fee: dfrFee.amount,
        currency: dfrFee.currency,
        partner: `${partner.name} (DFR ${customerParentNum})`,
        region,
      };
    }

    const regionFee = partner.feesByRegion.find(f => f.region === region);
    if (regionFee) {
      return {
        fee: regionFee.amount,
        currency: regionFee.currency,
        partner: partner.name,
        region,
      };
    }

    return {
      fee: 0,
      currency: 'EUR',
      partner: partner.name,
      region,
    };
  }

  private determineRegion(posCountryCode: string): 'EMEA' | 'Americas' | 'Other' {
    if (!posCountryCode) {
      return 'EMEA';
    }

    const mappedRegion = this.regionMappings.get(posCountryCode.toLowerCase());
    if (mappedRegion) {
      if (mappedRegion === 'Americas') return 'Americas';
      if (mappedRegion === 'Other') return 'Other';
      return 'EMEA';
    }

    return 'EMEA';
  }

  private createFailedResult(
    reservation: GdsDcfReservation,
    validationSteps: { step: string; passed: boolean; reason?: string }[],
    partner: string,
    region: string
  ): GdsDcfValidationResult {
    return {
      reservation,
      isChargeable: false,
      calculatedFee: 0,
      currency: 'EUR',
      partner,
      region,
      feeType: 'GDS', // Default to GDS for failed results
      validationSteps,
    };
  }
}

export function getDefaultPartners(): GdsDcfPartner[] {
  return [
    {
      id: 'travelport',
      name: 'Travelport (Worldspan + Galileo)',
      category: 'gds',
      sourceChannels: ['Galileo', 'Worldspan', 'GG', 'GW'],
      feesByRegion: [
        { region: 'EMEA', amount: 8.60, currency: 'USD' },
        { region: 'Americas', amount: 8.60, currency: 'USD' },
        { region: 'Other', amount: 8.60, currency: 'USD' },
      ],
    },
    {
      id: 'sabre',
      name: 'Sabre',
      category: 'gds',
      sourceChannels: ['Sabre', 'GS'],
      feesByRegion: [
        { region: 'EMEA', amount: 7.17, currency: 'USD' },
        { region: 'Americas', amount: 7.17, currency: 'USD' },
        { region: 'Other', amount: 7.17, currency: 'USD' },
      ],
    },
    {
      id: 'amadeus',
      name: 'Amadeus',
      category: 'gds',
      sourceChannels: ['Amadeus', 'GA'],
      feesByRegion: [
        { region: 'EMEA', amount: 5.29, currency: 'EUR' },
        { region: 'Americas', amount: 5.29, currency: 'EUR' },
        { region: 'Other', amount: 5.29, currency: 'EUR' },
      ],
      dfrFeesWithoutEVoucher: {},
      dfrFeesWithEVoucher: {
        '10335': { amount: 6.55, currency: 'EUR' },
      },
    },
    {
      id: 'expedia',
      name: 'Expedia',
      category: 'dcf',
      sourceChannels: ['Expedia'],
      feesByRegion: [
        { region: 'EMEA', amount: 3.00, currency: 'EUR' },
        { region: 'Americas', amount: 4.00, currency: 'EUR' },
        { region: 'Other', amount: 4.00, currency: 'EUR' },
      ],
    },
    {
      id: 'priceline',
      name: 'Priceline',
      category: 'dcf',
      sourceChannels: ['PriceLine'],
      feesByRegion: [
        { region: 'EMEA', amount: 3.25, currency: 'USD' },
        { region: 'Americas', amount: 3.25, currency: 'USD' },
        { region: 'Other', amount: 1.50, currency: 'USD' },
      ],
    },
    {
      id: 'meili',
      name: 'Meili',
      category: 'dcf',
      sourceChannels: ['Meili'],
      feesByRegion: [
        { region: 'EMEA', amount: 5.50, currency: 'EUR' },
        { region: 'Americas', amount: 5.50, currency: 'EUR' },
        { region: 'Other', amount: 5.50, currency: 'EUR' },
      ],
      voucherRules: {
        dfrFees: {
          '10897': { amount: 2.75, currency: 'EUR' },
        },
      },
    },
  ];
}
