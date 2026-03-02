import { GdsDcfPartner, GdsDcfReservation, GdsDcfValidationResult } from '@sixt/shared';

export class GdsDcfValidator {
  private partners: GdsDcfPartner[];
  private franchiseMandantCodes: string[];

  constructor(partners: GdsDcfPartner[], franchiseMandantCodes: string[]) {
    this.partners = partners;
    this.franchiseMandantCodes = franchiseMandantCodes;
  }

  validateReservation(reservation: GdsDcfReservation): GdsDcfValidationResult {
    const validationSteps: { step: string; passed: boolean; reason?: string }[] = [];
    
    const step1 = this.validateReservationNumber(reservation.resNumber);
    validationSteps.push(step1);
    if (!step1.passed) {
      return this.createFailedResult(reservation, validationSteps);
    }

    const step2 = this.validateSourceChannel(reservation.source);
    validationSteps.push(step2);
    if (!step2.passed) {
      return this.createFailedResult(reservation, validationSteps);
    }

    const partner = this.findPartnerBySource(reservation.source);
    
    const step3 = this.validatePartner(partner);
    validationSteps.push(step3);
    if (!step3.passed) {
      return this.createFailedResult(reservation, validationSteps);
    }

    const step4 = this.validateMandantCode(reservation.mandantCode);
    validationSteps.push(step4);
    if (!step4.passed) {
      return this.createFailedResult(reservation, validationSteps);
    }

    const step5 = this.validateStatus(reservation.status);
    validationSteps.push(step5);
    if (!step5.passed) {
      return this.createFailedResult(reservation, validationSteps);
    }

    const step6 = this.validateInvoiceType(reservation.invoiceType, reservation.serialNumber);
    validationSteps.push(step6);
    if (!step6.passed) {
      return this.createFailedResult(reservation, validationSteps);
    }

    const { fee, currency, region } = this.calculateFee(
      partner!,
      reservation.pos,
      reservation.voucherNumber,
      reservation.dfr
    );

    return {
      reservation,
      isChargeable: true,
      calculatedFee: fee,
      currency,
      partner: partner!.name,
      region,
      validationSteps,
    };
  }

  private validateReservationNumber(resNumber: string): { step: string; passed: boolean; reason?: string } {
    const passed = resNumber && resNumber.trim().length > 0;
    return {
      step: '1. Reservation Number Check',
      passed,
      reason: passed ? 'Reservation number exists' : 'No reservation number provided',
    };
  }

  private validateSourceChannel(source: string): { step: string; passed: boolean; reason?: string } {
    const validSources = ['SOAP', 'TPRA', 'GG', 'GW', 'GS', 'GA', 'Expedia02I6', 'PriceLine011S', 'Meili'];
    const passed = validSources.some(s => source && source.includes(s));
    return {
      step: '2. Interface/Booking Channel Check',
      passed,
      reason: passed 
        ? `Booking via GDS/DCF partner (${source})` 
        : `Not a GDS/DCF booking (source: ${source})`,
    };
  }

  private validatePartner(partner: GdsDcfPartner | null): { step: string; passed: boolean; reason?: string } {
    const passed = partner !== null;
    return {
      step: '3. Partner Check',
      passed,
      reason: passed 
        ? `Partner ${partner!.name} is configured in system` 
        : 'Partner not found in configuration',
    };
  }

  private validateMandantCode(mandantCode?: string): { step: string; passed: boolean; reason?: string } {
    if (!mandantCode) {
      return {
        step: '4. Mandant Code Pick-Up Branch Check',
        passed: false,
        reason: 'No mandant code provided',
      };
    }
    
    const passed = this.franchiseMandantCodes.includes(mandantCode);
    return {
      step: '4. Mandant Code Pick-Up Branch Check',
      passed,
      reason: passed 
        ? `Mandant code ${mandantCode} belongs to franchise` 
        : `Mandant code ${mandantCode} not in franchise list`,
    };
  }

  private validateStatus(status?: string): { step: string; passed: boolean; reason?: string } {
    if (!status) {
      return {
        step: '5. Reservation Status Check',
        passed: false,
        reason: 'No status information provided',
      };
    }

    const validStatuses = ['Invoice', 'No Show', 'Open'];
    const isCancelledViaOriginalChannel = status.toLowerCase().includes('cancellation not via original booking channel') 
      || status.toLowerCase().includes('cancelled via original') === false;
    
    const hasValidStatus = validStatuses.some(s => status.includes(s));
    const passed = hasValidStatus || isCancelledViaOriginalChannel;

    return {
      step: '5. Reservation Status Check',
      passed,
      reason: passed 
        ? `Status valid: ${status}` 
        : `Invalid status for fee charging: ${status}`,
    };
  }

  private validateInvoiceType(invoiceType?: string, serialNumber?: number): { step: string; passed: boolean; reason?: string } {
    if (!invoiceType) {
      return {
        step: '6. Invoice Type and Serial Number Check',
        passed: false,
        reason: 'No invoice type provided',
      };
    }

    const isMainInvoice = invoiceType.toLowerCase().includes('main');
    const isFirstInSeries = serialNumber === 0 || serialNumber === undefined;
    const passed = isMainInvoice && isFirstInSeries;

    return {
      step: '6. Invoice Type and Serial Number Check',
      passed,
      reason: passed 
        ? 'Main invoice and first in series (MSER = 0)' 
        : `${!isMainInvoice ? 'Not main invoice' : ''} ${!isFirstInSeries ? 'Not first in series (MSER > 0)' : ''}`.trim(),
    };
  }

  private findPartnerBySource(source: string): GdsDcfPartner | null {
    return this.partners.find(p => 
      p.sourceChannels.some(channel => source && source.includes(channel))
    ) || null;
  }

  private calculateFee(
    partner: GdsDcfPartner, 
    pos: string, 
    voucherNumber?: string,
    dfr?: string
  ): { fee: number; currency: string; region: 'EMEA' | 'Americas' | 'Other' } {
    const region = this.determineRegion(pos);
    const regionFee = partner.feesByRegion.find(f => f.region === region);
    
    if (!regionFee) {
      return { fee: 0, currency: 'EUR', region };
    }

    let finalFee = regionFee.amount;
    let finalCurrency = regionFee.currency;

    // Check for DFR-specific fee override
    if (partner.voucherRules && dfr && partner.voucherRules.dfrFees[dfr] !== undefined) {
      finalFee = partner.voucherRules.dfrFees[dfr].amount;
      finalCurrency = partner.voucherRules.dfrFees[dfr].currency;
    }

    return {
      fee: finalFee,
      currency: finalCurrency,
      region,
    };
  }

  private determineRegion(pos: string): 'EMEA' | 'Americas' | 'Other' {
    const emea = ['AT', 'BE', 'CH', 'DE', 'DK', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PL', 'PT', 'SE', 'TR', 'AE', 'SA', 'ZA'];
    const americas = ['US', 'CA', 'MX', 'BR', 'AR', 'CL'];
    
    if (emea.includes(pos.toUpperCase())) return 'EMEA';
    if (americas.includes(pos.toUpperCase())) return 'Americas';
    return 'Other';
  }

  private createFailedResult(
    reservation: GdsDcfReservation,
    validationSteps: { step: string; passed: boolean; reason?: string }[]
  ): GdsDcfValidationResult {
    return {
      reservation,
      isChargeable: false,
      calculatedFee: 0,
      currency: 'EUR',
      partner: 'N/A',
      region: 'N/A',
      validationSteps,
    };
  }
}

export function getDefaultPartners(): GdsDcfPartner[] {
  return [
    {
      id: 'travelport',
      name: 'Travelport (Worldspan + Galileo)',
      sourceChannels: ['GW', 'GG'],
      feesByRegion: [
        { region: 'EMEA', amount: 8.60, currency: 'USD' },
        { region: 'Americas', amount: 8.60, currency: 'USD' },
        { region: 'Other', amount: 8.60, currency: 'USD' },
      ],
    },
    {
      id: 'sabre',
      name: 'Sabre',
      sourceChannels: ['GS'],
      feesByRegion: [
        { region: 'EMEA', amount: 7.17, currency: 'USD' },
        { region: 'Americas', amount: 7.17, currency: 'USD' },
        { region: 'Other', amount: 7.17, currency: 'USD' },
      ],
    },
    {
      id: 'amadeus',
      name: 'Amadeus',
      sourceChannels: ['GA'],
      feesByRegion: [
        { region: 'EMEA', amount: 6.55, currency: 'EUR' },
        { region: 'Americas', amount: 6.55, currency: 'EUR' },
        { region: 'Other', amount: 6.55, currency: 'EUR' },
      ],
      voucherRules: {
        dfrFees: {
          '10355': { amount: 5.29, currency: 'EUR' }, // Expedia exception
        },
      },
    },
    {
      id: 'expedia-emea',
      name: 'Expedia',
      sourceChannels: ['Expedia02I6'],
      feesByRegion: [
        { region: 'EMEA', amount: 3.00, currency: 'EUR' },
        { region: 'Americas', amount: 4.00, currency: 'EUR' },
        { region: 'Other', amount: 4.00, currency: 'EUR' },
      ],
    },
    {
      id: 'priceline-americas',
      name: 'Priceline',
      sourceChannels: ['PriceLine011S'],
      feesByRegion: [
        { region: 'EMEA', amount: 3.25, currency: 'USD' },
        { region: 'Americas', amount: 3.25, currency: 'USD' },
        { region: 'Other', amount: 1.50, currency: 'USD' },
      ],
    },
    {
      id: 'meili',
      name: 'Meili',
      sourceChannels: ['Meili'],
      feesByRegion: [
        { region: 'EMEA', amount: 5.50, currency: 'EUR' },
        { region: 'Americas', amount: 5.50, currency: 'EUR' },
        { region: 'Other', amount: 5.50, currency: 'EUR' },
      ],
      voucherRules: {
        dfrFees: {
          '10897': { amount: 2.75, currency: 'EUR' }, // Autoclub Australia
        },
      },
    },
  ];
}
