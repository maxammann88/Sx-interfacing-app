import { GdsDcfPartner } from '@sixt/shared';
import prisma from '../prismaClient';
import { validationRuleConfigService } from './validationRuleConfigService';

export interface CalculationRule {
  ruleId: string;
  ruleOrder: number;
  category: 'Validation' | 'Fee Calculation' | 'Currency' | 'Exceptions' | 'Partner Detection';
  title: string;
  description: string;
  logic: {
    condition: string;
    ifTrue: string;
    ifFalse: string;
  };
  appliesTo: string[];
  examples?: { input: any; output: any }[];
  feeStructure?: { [key: string]: { currency: string; amount: number; conditions: string | null } };
  rates?: { [key: string]: number };
  mapping?: { [key: string]: string[] };
}

export interface RuleSnapshot {
  validFrom: Date;
  validTo: Date | null;
  rulesetVersion: string;
  rules: CalculationRule[];
  partners: any[];
  regionMappings: any[];
}

export class RuleGenerator {
  async generateRuleSnapshot(validFrom: Date, validTo: Date | null = null): Promise<RuleSnapshot> {
    const partnersRaw = await (prisma as any).gdsDcfPartnerHistory.findMany({
      where: {
        validFrom: { lte: validFrom },
        OR: [
          { validTo: null },
          { validTo: { gte: validFrom } },
        ],
      },
    });

    const partners = partnersRaw.map((p: any) => {
      const partner: any = {
        id: p.partnerId,
        name: p.name,
        category: p.category,
        sourceChannels: JSON.parse(p.sourceChannels),
        feesByRegion: JSON.parse(p.feesByRegion),
      };

      // Parse optional voucher/DFR fields if present
      if (p.feesByRegionWithoutEVoucher) {
        partner.feesByRegionWithoutEVoucher = JSON.parse(p.feesByRegionWithoutEVoucher);
      }
      if (p.voucherRules) {
        partner.voucherRules = JSON.parse(p.voucherRules);
      }
      if (p.dfrFeesWithoutEVoucher) {
        partner.dfrFeesWithoutEVoucher = JSON.parse(p.dfrFeesWithoutEVoucher);
      }
      if (p.dfrFeesWithEVoucher) {
        partner.dfrFeesWithEVoucher = JSON.parse(p.dfrFeesWithEVoucher);
      }

      return partner;
    });

    const regionMappingsRaw = await (prisma as any).regionCountryMapping.findMany({
      where: {
        validFrom: { lte: validFrom },
        OR: [
          { validTo: null },
          { validTo: { gte: validFrom } },
        ],
      },
    });

    const regionMappings = regionMappingsRaw.map((m: any) => ({
      regionName: m.regionName,
      countryCode: m.countryCode,
    }));

    // Get validation rule config valid at the snapshot date
    const ruleConfig = await validationRuleConfigService.getConfigAtDate(validFrom);

    const rules: CalculationRule[] = [
      ...this.generateValidationRules(ruleConfig),
      ...this.generatePartnerDetectionRules(partners),
      ...this.generateFeeCalculationRules(partners, regionMappings),
      ...this.generateCurrencyRules(),
    ];

    return {
      validFrom,
      validTo,
      rulesetVersion: `v${Date.now()}`,
      rules,
      partners: partnersRaw,
      regionMappings: regionMappingsRaw,
    };
  }

  private generateValidationRules(ruleConfig: any): CalculationRule[] {
    const rules: CalculationRule[] = [];
    
    // VAL-001: Always active
    rules.push({
      ruleId: 'VAL-001',
      ruleOrder: 1,
      category: 'Validation',
      title: 'Reservation Number Validation',
      description: 'Reservation number must not be empty',
      logic: {
        condition: 'resNumber is not null AND resNumber != ""',
        ifTrue: 'Continue to next validation',
        ifFalse: 'Reject: No reservation number',
      },
      appliesTo: ['all'],
      examples: [
        { input: { resNumber: '12345' }, output: 'PASS' },
        { input: { resNumber: '' }, output: 'FAIL' },
      ],
    });
    
    // VAL-002: Conditional based on config
    if (ruleConfig.enableChannelCheck) {
      rules.push({
        ruleId: 'VAL-002',
        ruleOrder: 2,
        category: 'Validation',
        title: 'GDS/DCF Channel Detection',
        description: 'Reservation must be from a recognized GDS or DCF channel. GDS keywords: galileo, worldspan, sabre, amadeus. DCF: SOAP/TPRA in channel2 AND expedia/priceline/meili in channel3.',
        logic: {
          condition: 'sourceChannel2 OR sourceChannel3 contains GDS keywords (galileo, worldspan, sabre, amadeus) OR (channel2 contains SOAP/TPRA AND channel3 contains expedia/priceline/meili)',
          ifTrue: 'Continue to next validation',
          ifFalse: 'Reject: Not a GDS/DCF booking',
        },
        appliesTo: ['all'],
      });
    }
    
    // VAL-003: Conditional based on config
    if (ruleConfig.enableMandantCheck) {
      rules.push({
        ruleId: 'VAL-003',
        ruleOrder: 3,
        category: 'Validation',
        title: 'Franchise Mandant Validation',
        description: 'Mandant code must be in the franchise mandant list',
        logic: {
          condition: 'mandantCode IN franchiseMandantCodes',
          ifTrue: 'Continue to next validation',
          ifFalse: 'Reject: Non-franchise mandant',
        },
        appliesTo: ['all'],
      });
    }
    
    // VAL-004: Conditional based on config
    if (ruleConfig.enableStatusCheck) {
      rules.push({
        ruleId: 'VAL-004',
        ruleOrder: 4,
        category: 'Validation',
        title: 'Status Validation',
        description: `Only completed reservations are chargeable. Valid statuses: ${ruleConfig.validStatuses.join(', ')} (case-insensitive partial match in statusExtended field).`,
        logic: {
          condition: `statusExtended contains "${ruleConfig.validStatuses.join('" OR "')}" (case-insensitive)`,
          ifTrue: 'Continue to next validation',
          ifFalse: 'Reject: Non-completed reservation',
        },
        appliesTo: ['all'],
      });
    }
    
    // VAL-005: Conditional based on config
    if (ruleConfig.enableDuplicateCheck) {
      let description = '';
      if (ruleConfig.duplicateStrategy === 'first') {
        description = 'If multiple entries exist for the same reservation number in the uploaded file, only the first occurrence is processed.';
      } else if (ruleConfig.duplicateStrategy === 'latest') {
        description = 'If multiple entries exist for the same reservation number in the uploaded file, only the latest occurrence is processed.';
      } else if (ruleConfig.duplicateStrategy === 'all') {
        description = 'All entries are processed, including duplicates. Each occurrence is charged separately.';
      }
      
      rules.push({
        ruleId: 'VAL-005',
        ruleOrder: 5,
        category: 'Validation',
        title: 'Duplicate Reservation Handling',
        description,
        logic: {
          condition: 'Reservation number appears multiple times in upload file',
          ifTrue: `Strategy: ${ruleConfig.duplicateStrategy}`,
          ifFalse: 'Process reservation normally',
        },
        appliesTo: ['all'],
      });
    }
    
    return rules;
  }

  private generatePartnerDetectionRules(partners: any[]): CalculationRule[] {
    return partners.map((partner, idx) => ({
      ruleId: `DET-${(idx + 1).toString().padStart(3, '0')}`,
      ruleOrder: 100 + idx,
      category: 'Partner Detection' as const,
      title: `Detect ${partner.name}`,
      description: `Identify bookings from ${partner.name}`,
      logic: {
        condition: `sourceChannel2 OR sourceChannel3 contains any of: ${partner.sourceChannels.join(', ')}`,
        ifTrue: `Partner = ${partner.name}, Category = ${partner.category.toUpperCase()}`,
        ifFalse: 'Check next partner',
      },
      appliesTo: [partner.id],
    }));
  }

  private generateFeeCalculationRules(partners: any[], regionMappings: any[]): CalculationRule[] {
    const rules: CalculationRule[] = [];
    let order = 200;

    for (const partner of partners) {
      // Build feeStructure from feesByRegion
      const feeStructure: any = {};
      
      for (const fee of partner.feesByRegion) {
        feeStructure[fee.region] = {
          currency: fee.currency,
          amount: fee.amount,
          conditions: 'Standard rate',
        };
      }

      // Add special voucher rules for Amadeus
      if (partner.id === 'amadeus') {
        // Add "without eVoucher" regional fees if available
        if (partner.feesByRegionWithoutEVoucher) {
          for (const fee of partner.feesByRegionWithoutEVoucher) {
            feeStructure[`${fee.region} (without eVoucher)`] = {
              currency: fee.currency,
              amount: fee.amount,
              conditions: 'Only when no eVoucher',
            };
          }
        }
        
        // Add DFR-specific eVoucher fees
        if (partner.dfrFeesWithEVoucher) {
          for (const [dfr, fee] of Object.entries(partner.dfrFeesWithEVoucher)) {
            feeStructure[`DFR ${dfr} (with eVoucher)`] = {
              currency: (fee as any).currency,
              amount: (fee as any).amount,
              conditions: 'Only when eVoucher present',
            };
          }
        }
        if (partner.dfrFeesWithoutEVoucher) {
          for (const [dfr, fee] of Object.entries(partner.dfrFeesWithoutEVoucher)) {
            feeStructure[`DFR ${dfr} (without eVoucher)`] = {
              currency: (fee as any).currency,
              amount: (fee as any).amount,
              conditions: 'Only when no eVoucher',
            };
          }
        }
      }

      // Add DFR exceptions for DCF partners
      if (partner.category === 'dcf' && partner.voucherRules?.dfrFees) {
        for (const [dfr, fee] of Object.entries(partner.voucherRules.dfrFees)) {
          feeStructure[`DFR ${dfr}`] = {
            currency: (fee as any).currency,
            amount: (fee as any).amount,
            conditions: `Special rate for Customer Parent ${dfr}`,
          };
        }
      }

      rules.push({
        ruleId: `FEE-${partner.id.toUpperCase()}`,
        ruleOrder: order++,
        category: 'Fee Calculation',
        title: `${partner.name} Fee Calculation`,
        description: `Calculate fee for ${partner.name} based on POS region`,
        logic: {
          condition: `Partner = ${partner.name}`,
          ifTrue: `Map posCountryCode to Region, Apply fee from feesByRegion[Region]`,
          ifFalse: 'Skip',
        },
        appliesTo: [partner.id],
        feeStructure,
      });
    }

    const regionGroups = new Map<string, string[]>();
    for (const mapping of regionMappings) {
      if (!regionGroups.has(mapping.regionName)) {
        regionGroups.set(mapping.regionName, []);
      }
      regionGroups.get(mapping.regionName)!.push(mapping.countryCode);
    }

    Array.from(regionGroups.entries()).forEach(([regionName, countries], idx) => {
      rules.push({
        ruleId: `REG-${(idx + 1).toString().padStart(3, '0')}`,
        ruleOrder: 300 + idx,
        category: 'Exceptions',
        title: `Region Mapping: ${regionName}`,
        description: `Countries assigned to ${regionName} region`,
        logic: {
          condition: `posCountryCode IN [${countries.join(', ')}]`,
          ifTrue: `Region = ${regionName}`,
          ifFalse: 'Default Region = EMEA',
        },
        appliesTo: ['all'],
        mapping: { [regionName]: countries },
      });
    });

    return rules;
  }

  private generateCurrencyRules(): CalculationRule[] {
    // Import exchange rates from gdsDcfValidator
    const exchangeRates: { [key: string]: number } = {
      '2025-01': 0.95,
      '2025-02': 0.94,
      '2025-03': 0.93,
      '2025-04': 0.92,
      '2025-05': 0.91,
      '2025-06': 0.90,
      '2025-07': 0.91,
      '2025-08': 0.92,
      '2025-09': 0.93,
      '2025-10': 0.92,
      '2025-11': 0.91,
      '2025-12': 0.90,
      '2026-01': 0.91,
      '2026-02': 0.92,
      '2026-03': 0.92,
    };

    return [
      {
        ruleId: 'CUR-001',
        ruleOrder: 400,
        category: 'Currency',
        title: 'USD to EUR Conversion',
        description: 'Convert USD fees to EUR using month-specific exchange rates',
        logic: {
          condition: 'Fee currency == USD',
          ifTrue: 'Convert: Fee * ExchangeRate[handoverDate.month]',
          ifFalse: 'Use fee as is (already in EUR)',
        },
        appliesTo: ['all'],
        rates: exchangeRates,
      },
      {
        ruleId: 'CUR-002',
        ruleOrder: 401,
        category: 'Currency',
        title: 'Default Exchange Rate',
        description: 'Fallback rate when month not found',
        logic: {
          condition: 'Month not in ExchangeRate table',
          ifTrue: 'Use default rate: 0.92',
          ifFalse: 'N/A',
        },
        appliesTo: ['all'],
      },
    ];
  }

  async saveSnapshot(snapshot: RuleSnapshot, createdBy: string = 'System'): Promise<number> {
    const result = await (prisma as any).calculationRuleSnapshot.create({
      data: {
        snapshotDate: new Date(),
        validFrom: snapshot.validFrom,
        validTo: snapshot.validTo,
        rulesetName: 'GDS/DCF Fee Calculation',
        rulesetVersion: snapshot.rulesetVersion,
        fullRulesetJson: JSON.stringify({
          rules: snapshot.rules,
          partners: snapshot.partners,
          regionMappings: snapshot.regionMappings,
        }),
        createdBy,
      },
    });

    return result.id;
  }
}

export const ruleGenerator = new RuleGenerator();
