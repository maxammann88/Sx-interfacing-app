import { GdsDcfPartner, GdsDcfReservation, GdsDcfValidationResult } from '@sixt/shared';

const USD_TO_EUR_RATE = 0.92; // Stand März 2026

// Track how many validations we've logged
let loggedValidationCount = 0;

export class GdsDcfValidator {
  private partners: GdsDcfPartner[];
  private franchiseMandantCodes: string[];

  constructor(partners: GdsDcfPartner[], franchiseMandantCodes: string[]) {
    this.partners = partners;
    this.franchiseMandantCodes = franchiseMandantCodes;
  }

  validateReservation(reservation: GdsDcfReservation): GdsDcfValidationResult {
    const validationSteps: { step: string; passed: boolean; reason?: string }[] = [];
    
    // #region agent log
    if (loggedValidationCount < 5) { fetch('http://127.0.0.1:7547/ingest/248c0622-6415-452e-9b8c-db914f2f5ef1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f53c65'},body:JSON.stringify({sessionId:'f53c65',location:'gdsDcfValidator.ts:22',message:'Validating reservation',data:{resNumber:reservation.resNumber,sourceChannel2:reservation.sourceChannel2,sourceChannel3:reservation.sourceChannel3,statusExtended:reservation.statusExtended,mandantCode:reservation.mandantCode,serialNumber:reservation.serialNumber,valNum:loggedValidationCount},hypothesisId:'BCDE',timestamp:Date.now()})}).catch(()=>{}); loggedValidationCount++; }
    // #endregion
    
    // Step 1: Validate reservation number
    const step1 = this.validateReservationNumber(reservation.resNumber);
    validationSteps.push(step1);
    if (!step1.passed) {
      return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
    }

    // Step 2: Determine if GDS or DCF
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

    // Step 3: Validate mandant code
    const step3 = this.validateMandantCode(reservation.mandantCode);
    validationSteps.push(step3);
    if (!step3.passed) {
      return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
    }

    // Step 4: Validate status
    const step4 = this.validateStatus(reservation.statusExtended);
    validationSteps.push(step4);
    if (!step4.passed) {
      return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
    }

    // Step 5: Validate first time fee (serial number = 0 or empty)
    const step5 = this.validateFirstTimeFee(reservation.serialNumber);
    validationSteps.push(step5);
    if (!step5.passed) {
      return this.createFailedResult(reservation, validationSteps, 'N/A', 'N/A');
    }

    // Calculate fee based on GDS or DCF
    let feeResult: { fee: number; currency: string; partner: string; region: string };
    
    if (isGDS) {
      feeResult = this.calculateGDSFee(
        reservation.sourceChannel2,
        reservation.sourceChannel3,
        reservation.voucherNumber,
        reservation.customerParentNum
      );
    } else {
      feeResult = this.calculateDCFFee(
        reservation.sourceChannel2,
        reservation.sourceChannel3,
        reservation.posCountryCode,
        reservation.customerParentNum
      );
    }

    // Convert to EUR if needed
    const feeInEur = feeResult.currency === 'USD' 
      ? feeResult.fee * USD_TO_EUR_RATE 
      : feeResult.fee;

    validationSteps.push({
      step: '6. Fee Calculation',
      passed: true,
      reason: `${feeResult.partner}: ${feeResult.currency} ${feeResult.fee.toFixed(2)} (EUR ${feeInEur.toFixed(2)})`,
    });

    return {
      reservation,
      isChargeable: true,
      calculatedFee: feeInEur,
      currency: 'EUR', // Always return EUR
      partner: feeResult.partner,
      region: feeResult.region,
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
    const result = gdsKeywords.some(keyword => combined.includes(keyword));
    
    // #region agent log
    if (loggedValidationCount <= 5) { fetch('http://127.0.0.1:7547/ingest/248c0622-6415-452e-9b8c-db914f2f5ef1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f53c65'},body:JSON.stringify({sessionId:'f53c65',location:'gdsDcfValidator.ts:125',message:'GDS check',data:{channel2,channel3,combined,result},hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion
    
    return result;
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
      // #region agent log
      if (loggedValidationCount <= 5) { fetch('http://127.0.0.1:7547/ingest/248c0622-6415-452e-9b8c-db914f2f5ef1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f53c65'},body:JSON.stringify({sessionId:'f53c65',location:'gdsDcfValidator.ts:153',message:'Mandant check lenient mode',data:{mandantCode,franchiseMandantsLength:this.franchiseMandantCodes.length},hypothesisId:'D',timestamp:Date.now()})}).catch(()=>{}); }
      // #endregion
      
      return {
        step: '3. Franchise Mandant Check',
        passed: true,
        reason: `Mandant code ${mandantCode} - no franchise list uploaded (lenient mode)`,
      };
    }
    
    const passed = this.franchiseMandantCodes.includes(mandantCode);
    
    // #region agent log
    if (loggedValidationCount <= 5) { fetch('http://127.0.0.1:7547/ingest/248c0622-6415-452e-9b8c-db914f2f5ef1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f53c65'},body:JSON.stringify({sessionId:'f53c65',location:'gdsDcfValidator.ts:165',message:'Mandant check strict mode',data:{mandantCode,franchiseMandants:this.franchiseMandantCodes.length,passed,firstMandant:this.franchiseMandantCodes[0]},hypothesisId:'D',timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion
    
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

    const validStatuses = ['invoice', 'no show', 'open'];
    const statusLower = status.toLowerCase();
    const passed = validStatuses.some(s => statusLower.includes(s));

    // #region agent log
    if (loggedValidationCount <= 5) { fetch('http://127.0.0.1:7547/ingest/248c0622-6415-452e-9b8c-db914f2f5ef1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f53c65'},body:JSON.stringify({sessionId:'f53c65',location:'gdsDcfValidator.ts:179',message:'Status check',data:{status,statusLower,passed,validStatuses},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion

    return {
      step: '4. Reservation Status Check',
      passed,
      reason: passed 
        ? `Status valid: ${status}` 
        : `Invalid status for fee charging: ${status}`,
    };
  }

  private validateFirstTimeFee(serialNumber?: number): { step: string; passed: boolean; reason?: string } {
    const isFirstTime = serialNumber === undefined || serialNumber === null || serialNumber === 0;
    
    // #region agent log
    if (loggedValidationCount <= 5) { fetch('http://127.0.0.1:7547/ingest/248c0622-6415-452e-9b8c-db914f2f5ef1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f53c65'},body:JSON.stringify({sessionId:'f53c65',location:'gdsDcfValidator.ts:203',message:'Serial number check',data:{serialNumber,isFirstTime,type:typeof serialNumber},hypothesisId:'E',timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion
    
    return {
      step: '5. First Time Fee Check',
      passed: isFirstTime,
      reason: isFirstTime 
        ? 'Fee charged for first time (MSER = 0 or empty)' 
        : `Fee already charged (MSER = ${serialNumber})`,
    };
  }

  private calculateGDSFee(
    channel2: string, 
    channel3: string,
    voucherNumber?: string,
    customerParentNum?: string
  ): { fee: number; currency: string; partner: string; region: string } {
    const combined = `${channel2} ${channel3}`.toLowerCase();

    // Galileo or Worldspan: USD 8.60
    if (combined.includes('galileo') || combined.includes('worldspan')) {
      return {
        fee: 8.60,
        currency: 'USD',
        partner: 'Travelport (Galileo/Worldspan)',
        region: 'GDS',
      };
    }

    // Sabre: USD 7.17
    if (combined.includes('sabre')) {
      return {
        fee: 7.17,
        currency: 'USD',
        partner: 'Sabre',
        region: 'GDS',
      };
    }

    // Amadeus: Complex rules
    if (combined.includes('amadeus')) {
      // Rule 1 (highest priority): TPRA + parent 10355 -> EUR 5.29
      if (combined.includes('tpra') && customerParentNum === '10355') {
        return {
          fee: 5.29,
          currency: 'EUR',
          partner: 'Amadeus (Special TPRA)',
          region: 'GDS',
        };
      }

      // Rule 2: Voucher filled -> EUR 6.55
      if (voucherNumber && voucherNumber.trim() !== '' && voucherNumber.trim() !== ' ') {
        return {
          fee: 6.55,
          currency: 'EUR',
          partner: 'Amadeus (with eVoucher)',
          region: 'GDS',
        };
      }

      // Rule 3 (default): No voucher -> EUR 5.29
      return {
        fee: 5.29,
        currency: 'EUR',
        partner: 'Amadeus',
        region: 'GDS',
      };
    }

    // Fallback (should not reach here if validation passed)
    return {
      fee: 0,
      currency: 'EUR',
      partner: 'Unknown GDS',
      region: 'GDS',
    };
  }

  private calculateDCFFee(
    channel2: string,
    channel3: string,
    posCountryCode: string,
    customerParentNum?: string
  ): { fee: number; currency: string; partner: string; region: string } {
    const channel3Lower = channel3.toLowerCase();

    // Expedia
    if (channel3Lower.includes('expedia')) {
      const americasCountries = ['ar', 'au', 'br', 'mx', 'nz'];
      const isAmericas = americasCountries.includes(posCountryCode.toLowerCase());
      
      return {
        fee: isAmericas ? 4.00 : 3.00,
        currency: 'EUR',
        partner: 'Expedia',
        region: isAmericas ? 'Americas' : 'EMEA',
      };
    }

    // Priceline
    if (channel3Lower.includes('priceline')) {
      const americasCountries = [
        'us', 'ca', 'ai', 'ag', 'ar', 'aw', 'bs', 'bb', 'bz', 'bo', 'br', 
        'vg', 'bq', 'ky', 'cl', 'co', 'cr', 'cw', 'dm', 'do', 'ec', 'sv', 
        'gf', 'gd', 'gp', 'gt', 'gy', 'ht', 'hn', 'jm', 'mq', 'mx', 'ms', 
        'ni', 'pa', 'py', 'pe', 'kn', 'lc', 'mf', 'vc', 'sx', 'sr', 'tt', 
        'tc', 'uy', 've'
      ];
      const isAmericas = americasCountries.includes(posCountryCode.toLowerCase());
      
      return {
        fee: isAmericas ? 3.25 : 1.50,
        currency: 'USD',
        partner: 'Priceline',
        region: isAmericas ? 'Americas' : 'Other',
      };
    }

    // Meili
    if (channel3Lower.includes('meili')) {
      const isSpecialCustomer = customerParentNum === '10897';
      
      return {
        fee: isSpecialCustomer ? 2.75 : 5.50,
        currency: 'EUR',
        partner: 'Meili',
        region: isSpecialCustomer ? 'Special' : 'Standard',
      };
    }

    // Fallback
    return {
      fee: 0,
      currency: 'EUR',
      partner: 'Unknown DCF',
      region: 'DCF',
    };
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
