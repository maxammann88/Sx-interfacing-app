import prisma from '../prismaClient';
import { GdsDcfPartner } from '@sixt/shared';
import { serializePartner, deserializePartner } from '../utils/jsonHelpers';

export interface ComparisonResult {
  partnerId: string;
  revision1: number;
  revision2: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export class PartnerHistoryService {
  async saveRevision(
    partner: GdsDcfPartner, 
    validFrom: Date, 
    validTo: Date | null, 
    createdBy: string,
    notes?: string
  ): Promise<number> {
    const latestRevision = await (prisma as any).gdsDcfPartnerHistory.findFirst({
      where: { partnerId: partner.id },
      orderBy: { revision: 'desc' },
    });

    const newRevision = latestRevision ? latestRevision.revision + 1 : 1;

    if (latestRevision && !latestRevision.validTo) {
      await (prisma as any).gdsDcfPartnerHistory.update({
        where: { id: latestRevision.id },
        data: { validTo: validFrom },
      });
    }

    const serialized = serializePartner(partner);

    await (prisma as any).gdsDcfPartnerHistory.create({
      data: {
        partnerId: partner.id,
        revision: newRevision,
        name: serialized.name,
        category: serialized.category,
        sourceChannels: serialized.sourceChannels,
        feesByRegion: serialized.feesByRegion,
        feesByRegionWithoutEVoucher: serialized.feesByRegionWithoutEVoucher || null,
        voucherRules: serialized.voucherRules || null,
        dfrFeesWithoutEVoucher: serialized.dfrFeesWithoutEVoucher || null,
        dfrFeesWithEVoucher: serialized.dfrFeesWithEVoucher || null,
        validFrom,
        validTo,
        createdBy,
        notes,
      },
    });

    return newRevision;
  }

  async getPartnerAtDate(partnerId: string, date: Date): Promise<GdsDcfPartner | null> {
    const history = await (prisma as any).gdsDcfPartnerHistory.findFirst({
      where: {
        partnerId,
        validFrom: { lte: date },
        OR: [
          { validTo: null },
          { validTo: { gte: date } },
        ],
      },
      orderBy: { revision: 'desc' },
    });

    if (!history) {
      return null;
    }

    const partner: GdsDcfPartner = {
      id: history.partnerId,
      name: history.name,
      category: history.category,
      sourceChannels: JSON.parse(history.sourceChannels),
      feesByRegion: JSON.parse(history.feesByRegion),
      voucherRules: history.voucherRules ? JSON.parse(history.voucherRules) : undefined,
      dfrFeesWithoutEVoucher: history.dfrFeesWithoutEVoucher ? JSON.parse(history.dfrFeesWithoutEVoucher) : undefined,
      dfrFeesWithEVoucher: history.dfrFeesWithEVoucher ? JSON.parse(history.dfrFeesWithEVoucher) : undefined,
      feesByRegionWithoutEVoucher: history.feesByRegionWithoutEVoucher ? JSON.parse(history.feesByRegionWithoutEVoucher) : undefined,
    };

    return partner;
  }

  async getPartnerHistory(partnerId: string): Promise<any[]> {
    const history = await (prisma as any).gdsDcfPartnerHistory.findMany({
      where: { partnerId },
      orderBy: { revision: 'desc' },
    });

    return history.map((h: any) => ({
      id: h.id,
      partnerId: h.partnerId,
      revision: h.revision,
      validFrom: h.validFrom,
      validTo: h.validTo,
      createdBy: h.createdBy,
      createdAt: h.createdAt,
      notes: h.notes,
      name: h.name,
      category: h.category,
      feesByRegion: h.feesByRegion ? JSON.parse(h.feesByRegion) : [],
      feesByRegionWithoutEVoucher: h.feesByRegionWithoutEVoucher ? JSON.parse(h.feesByRegionWithoutEVoucher) : null,
      dfrFeesWithoutEVoucher: h.dfrFeesWithoutEVoucher ? JSON.parse(h.dfrFeesWithoutEVoucher) : null,
      dfrFeesWithEVoucher: h.dfrFeesWithEVoucher ? JSON.parse(h.dfrFeesWithEVoucher) : null,
      voucherRules: h.voucherRules ? JSON.parse(h.voucherRules) : null,
    }));
  }

  async compareRevisions(partnerId: string, revision1: number, revision2: number): Promise<ComparisonResult> {
    const [rev1, rev2] = await Promise.all([
      (prisma as any).gdsDcfPartnerHistory.findFirst({
        where: { partnerId, revision: revision1 },
      }),
      (prisma as any).gdsDcfPartnerHistory.findFirst({
        where: { partnerId, revision: revision2 },
      }),
    ]);

    if (!rev1 || !rev2) {
      throw new Error('One or both revisions not found');
    }

    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    const fields = [
      'name', 'category', 'sourceChannels', 'feesByRegion', 'feesByRegionWithoutEVoucher',
      'voucherRules', 'dfrFeesWithoutEVoucher', 'dfrFeesWithEVoucher'
    ];

    for (const field of fields) {
      const oldVal = rev1[field];
      const newVal = rev2[field];

      if (oldVal !== newVal) {
        changes.push({
          field,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    return {
      partnerId,
      revision1,
      revision2,
      changes,
    };
  }

  async getCurrentPartners(): Promise<GdsDcfPartner[]> {
    const now = new Date();
    const partnerIds = await (prisma as any).gdsDcfPartnerHistory.findMany({
      where: {
        validFrom: { lte: now },
        OR: [
          { validTo: null },
          { validTo: { gte: now } },
        ],
      },
      distinct: ['partnerId'],
      select: { partnerId: true },
    });

    const partners = await Promise.all(
      partnerIds.map((p: any) => this.getPartnerAtDate(p.partnerId, now))
    );

    return partners.filter((p): p is GdsDcfPartner => p !== null);
  }
}

export const partnerHistoryService = new PartnerHistoryService();
