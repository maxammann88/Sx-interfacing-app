import prisma from '../prismaClient';
import { partnerHistoryService } from '../services/partnerHistoryService';
import { regionMappingService } from '../services/regionMappingService';
import { GdsDcfPartner } from '@sixt/shared';

async function migrateExistingPartners() {
  console.log('Starting migration of existing GDS/DCF partners to history tables...');

  try {
    const partners = await (prisma as any).gdsDcfPartner.findMany();

    console.log(`Found ${partners.length} partners to migrate`);

    for (const partner of partners) {
      const partnerData: GdsDcfPartner = {
        id: partner.id,
        name: partner.name,
        category: partner.category,
        sourceChannels: JSON.parse(partner.sourceChannels),
        feesByRegion: JSON.parse(partner.feesByRegion),
        voucherRules: partner.voucherRules ? JSON.parse(partner.voucherRules) : undefined,
        dfrFeesWithoutEVoucher: partner.dfrFeesWithoutEVoucher ? JSON.parse(partner.dfrFeesWithoutEVoucher) : undefined,
        dfrFeesWithEVoucher: partner.dfrFeesWithEVoucher ? JSON.parse(partner.dfrFeesWithEVoucher) : undefined,
        feesByRegionWithoutEVoucher: partner.feesByRegionWithoutEVoucher ? JSON.parse(partner.feesByRegionWithoutEVoucher) : undefined,
      };

      const validFrom = partner.createdAt || new Date('2025-01-01');

      await partnerHistoryService.saveRevision(
        partnerData,
        validFrom,
        null,
        'Migration Script',
        'Initial migration from GdsDcfPartner table'
      );

      console.log(`✓ Migrated partner: ${partner.name} (${partner.id})`);
    }

    console.log(`\n✅ Successfully migrated ${partners.length} partners to history tables`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function seedRegionMappings() {
  console.log('\nSeeding default region-country mappings...');

  try {
    const americasCountriesExpedia = ['ar', 'au', 'br', 'mx', 'nz'];
    const americasCountriesPriceline = [
      'us', 'ca', 'ai', 'ag', 'ar', 'aw', 'bs', 'bb', 'bz', 'bo', 'br',
      'vg', 'bq', 'ky', 'cl', 'co', 'cr', 'cw', 'dm', 'do', 'ec', 'sv',
      'gf', 'gd', 'gp', 'gt', 'gy', 'ht', 'hn', 'jm', 'mq', 'mx', 'ms',
      'ni', 'pa', 'py', 'pe', 'kn', 'lc', 'mf', 'vc', 'sx', 'sr', 'tt',
      'tc', 'uy', 've'
    ];

    const allAmericasCountries = [...new Set([...americasCountriesExpedia, ...americasCountriesPriceline])];

    await regionMappingService.saveMapping(
      'Americas',
      allAmericasCountries,
      new Date('2025-01-01'),
      null,
      'Migration Script'
    );

    console.log(`✓ Created ${allAmericasCountries.length} country mappings for Americas region`);

    const otherCountries = ['cn', 'jp', 'kr', 'in', 'sg', 'my', 'th', 'ph', 'id', 'vn'];
    
    await regionMappingService.saveMapping(
      'Other',
      otherCountries,
      new Date('2025-01-01'),
      null,
      'Migration Script'
    );

    console.log(`✓ Created ${otherCountries.length} country mappings for Other region`);
    console.log('\n✅ Region mappings seeded successfully');
    console.log('   Note: EMEA is the default region for all countries not explicitly mapped');
  } catch (error) {
    console.error('❌ Region seeding failed:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\nVerifying migration...');

  try {
    const historyCount = await (prisma as any).gdsDcfPartnerHistory.count();
    const mappingCount = await (prisma as any).regionCountryMapping.count();

    console.log(`\n📊 Migration Summary:`);
    console.log(`   - Partner history records: ${historyCount}`);
    console.log(`   - Region-country mappings: ${mappingCount}`);

    const samplePartner = await (prisma as any).gdsDcfPartnerHistory.findFirst({
      orderBy: { revision: 'asc' },
    });

    if (samplePartner) {
      console.log(`\n📝 Sample Partner History Record:`);
      console.log(`   - Partner: ${samplePartner.name} (${samplePartner.partnerId})`);
      console.log(`   - Revision: ${samplePartner.revision}`);
      console.log(`   - Valid From: ${samplePartner.validFrom}`);
      console.log(`   - Valid To: ${samplePartner.validTo || 'Indefinite'}`);
    }

    const sampleMapping = await (prisma as any).regionCountryMapping.findFirst();

    if (sampleMapping) {
      console.log(`\n🗺️  Sample Region Mapping:`);
      console.log(`   - Region: ${sampleMapping.regionName}`);
      console.log(`   - Country: ${sampleMapping.countryCode}`);
      console.log(`   - Valid From: ${sampleMapping.validFrom}`);
    }

    console.log('\n✅ Migration verification complete');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════════');
  console.log('  GDS/DCF Parameter Migration to Revision-Safe System');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    await migrateExistingPartners();
    await seedRegionMappings();
    await verifyMigration();

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  ✅ Migration completed successfully!');
    console.log('════════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Test the Parameter Maintenance UI with temporal fields');
    console.log('2. Validate the calculation logic uses the correct partner versions');
    console.log('3. Test Excel/PDF export functionality');
    console.log('4. Review the Calculation Rules page for dynamic content\n');

  } catch (error) {
    console.error('\n════════════════════════════════════════════════════════');
    console.error('  ❌ Migration failed!');
    console.error('════════════════════════════════════════════════════════\n');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
