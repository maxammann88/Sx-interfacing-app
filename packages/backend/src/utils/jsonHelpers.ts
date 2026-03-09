// Helper functions for SQLite JSON field serialization
import { GdsDcfPartner } from '@sixt/shared';

export function serializePartner(partner: GdsDcfPartner) {
  return {
    id: partner.id,
    name: partner.name,
    category: partner.category,
    sourceChannels: JSON.stringify(partner.sourceChannels),
    feesByRegion: JSON.stringify(partner.feesByRegion),
    voucherRules: partner.voucherRules ? JSON.stringify(partner.voucherRules) : null,
    dfrFeesWithoutEVoucher: partner.dfrFeesWithoutEVoucher ? JSON.stringify(partner.dfrFeesWithoutEVoucher) : null,
    dfrFeesWithEVoucher: partner.dfrFeesWithEVoucher ? JSON.stringify(partner.dfrFeesWithEVoucher) : null,
  };
}

export function deserializePartner(dbPartner: any): GdsDcfPartner {
  return {
    id: dbPartner.id,
    name: dbPartner.name,
    category: dbPartner.category,
    sourceChannels: JSON.parse(dbPartner.sourceChannels),
    feesByRegion: JSON.parse(dbPartner.feesByRegion),
    voucherRules: dbPartner.voucherRules ? JSON.parse(dbPartner.voucherRules) : undefined,
    dfrFeesWithoutEVoucher: dbPartner.dfrFeesWithoutEVoucher ? JSON.parse(dbPartner.dfrFeesWithoutEVoucher) : undefined,
    dfrFeesWithEVoucher: dbPartner.dfrFeesWithEVoucher ? JSON.parse(dbPartner.dfrFeesWithEVoucher) : undefined,
  };
}

export function deserializeValidationResult(dbResult: any) {
  return {
    ...dbResult,
    reservation: JSON.parse(dbResult.reservationData), // Rename to match frontend expectations
    validationSteps: JSON.parse(dbResult.validationSteps),
  };
}
