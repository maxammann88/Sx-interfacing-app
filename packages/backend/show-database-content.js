const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showDatabaseContent() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('            SIXT INTERFACING APP - DATABASE OVERVIEW');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // 1. GDS/DCF Partner History
    console.log('📊 GDS/DCF PARTNER HISTORY (Versioned Partner Fees)\n');
    const partners = await prisma.gdsDcfPartnerHistory.findMany({
      orderBy: [{ name: 'asc' }, { revision: 'desc' }]
    });
    
    if (partners.length === 0) {
      console.log('   ⚠️  No partner data found\n');
    } else {
      console.log(`   Total Records: ${partners.length}\n`);
      const grouped = {};
      partners.forEach(p => {
        if (!grouped[p.name]) grouped[p.name] = [];
        grouped[p.name].push(p);
      });
      
      Object.keys(grouped).forEach(name => {
        const revisions = grouped[name];
        const current = revisions.find(r => !r.validTo || new Date(r.validTo) > new Date());
        console.log(`   🔹 ${name}`);
        console.log(`      Revisions: ${revisions.length}`);
        if (current) {
          const feesByRegion = JSON.parse(current.feesByRegion);
          console.log(`      Category: ${current.category}`);
          console.log(`      Fees by Region: ${JSON.stringify(feesByRegion)}`);
          console.log(`      Valid From: ${current.validFrom}`);
          if (current.feesByRegionWithoutEVoucher) {
            const withoutVoucher = JSON.parse(current.feesByRegionWithoutEVoucher);
            console.log(`      Fees without eVoucher: ${JSON.stringify(withoutVoucher)}`);
          }
        }
        console.log('');
      });
    }

    // 2. Region Country Mapping
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('🌍 REGION COUNTRY MAPPING (Versioned Regions)\n');
    const regions = await prisma.regionCountryMapping.findMany({
      orderBy: [{ regionName: 'asc' }, { createdAt: 'desc' }]
    });
    
    if (regions.length === 0) {
      console.log('   ⚠️  No region mappings found\n');
    } else {
      console.log(`   Total Mappings: ${regions.length}\n`);
      const grouped = {};
      regions.forEach(r => {
        const key = `${r.regionName}_${r.createdAt}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      
      Object.keys(grouped).forEach(key => {
        const mappings = grouped[key];
        const region = mappings[0];
        const active = mappings.filter(m => !m.validTo || new Date(m.validTo) > new Date());
        console.log(`   🔹 ${region.regionName}`);
        console.log(`      Version: ${region.createdAt}`);
        console.log(`      Valid From: ${region.validFrom}`);
        console.log(`      Countries (${active.length}): ${active.map(m => m.countryCode).join(', ')}`);
        console.log('');
      });
    }

    // 3. Validation Rule Config History
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('✅ VALIDATION RULE CONFIG HISTORY (Versioned Rules)\n');
    const validationConfigs = await prisma.validationRuleConfigHistory.findMany({
      orderBy: { revision: 'desc' }
    });
    
    if (validationConfigs.length === 0) {
      console.log('   ⚠️  No validation configs found\n');
    } else {
      console.log(`   Total Revisions: ${validationConfigs.length}\n`);
      validationConfigs.forEach(config => {
        const current = !config.validTo || new Date(config.validTo) > new Date();
        console.log(`   🔹 Revision ${config.revision} ${current ? '(CURRENT)' : ''}`);
        console.log(`      Valid From: ${config.validFrom}`);
        console.log(`      Valid To: ${config.validTo || 'ongoing'}`);
        console.log(`      Channel Check: ${config.enableChannelCheck ? '✓' : '✗'}`);
        console.log(`      Mandant Check: ${config.enableMandantCheck ? '✓' : '✗'}`);
        console.log(`      Status Check: ${config.enableStatusCheck ? '✓' : '✗'}`);
        if (config.validStatuses) {
          console.log(`      Valid Statuses: ${config.validStatuses}`);
        }
        console.log(`      Duplicate Strategy: ${config.duplicateStrategy}`);
        if (config.notes) {
          console.log(`      Notes: ${config.notes}`);
        }
        console.log('');
      });
    }

    // 4. Exchange Rates (stored in partner history as JSON)
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('💱 EXCHANGE RATES\n');
    console.log('   ℹ️  Exchange rates are managed within partner fees (feesByRegion)\n');

    // 5. GDS/DCF Uploads
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('📤 GDS/DCF UPLOADS\n');
    const uploads = await prisma.gdsDcfUpload.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 10
    });
    
    if (uploads.length === 0) {
      console.log('   ⚠️  No uploads found\n');
    } else {
      console.log(`   Recent Uploads (last 10 of ${uploads.length}):\n`);
      uploads.forEach(upload => {
        console.log(`   🔹 ${upload.fileName}`);
        console.log(`      Upload ID: ${upload.id}`);
        console.log(`      Uploaded: ${upload.uploadedAt}`);
        console.log(`      Uploaded By: ${upload.uploadedBy || 'Unknown'}`);
        console.log(`      Status: ${upload.validated ? 'Validated' : 'Pending'}`);
        console.log('');
      });
    }

    // 6. GDS/DCF Reservations (sample)
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('🎫 GDS/DCF RESERVATIONS (Sample)\n');
    const reservations = await prisma.gdsDcfReservation.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    
    if (reservations.length === 0) {
      console.log('   ⚠️  No reservations found\n');
    } else {
      const total = await prisma.gdsDcfReservation.count();
      console.log(`   Total Reservations: ${total}`);
      console.log(`   Recent 5:\n`);
      reservations.forEach(res => {
        console.log(`   🔹 Res #${res.resNumber || res.id}`);
        console.log(`      Source: ${res.sourceChannel2 || 'N/A'} / ${res.sourceChannel3 || 'N/A'}`);
        console.log(`      Mandant: ${res.mandantCode || 'N/A'}`);
        console.log(`      Status: ${res.statusExtended || 'N/A'}`);
        console.log(`      Handover: ${res.handoverDate || 'N/A'}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n✅ Database overview complete!\n');
    
    // Quick Stats
    const stats = {
      partners: await prisma.gdsDcfPartnerHistory.count(),
      regions: await prisma.regionCountryMapping.count(),
      validationConfigs: await prisma.validationRuleConfigHistory.count(),
      uploads: await prisma.gdsDcfUpload.count(),
      reservations: await prisma.gdsDcfReservation.count()
    };
    
    console.log('📈 QUICK STATS:');
    console.log(`   Partner History Records: ${stats.partners}`);
    console.log(`   Region Mappings: ${stats.regions}`);
    console.log(`   Validation Configs: ${stats.validationConfigs}`);
    console.log(`   Uploads: ${stats.uploads}`);
    console.log(`   Reservations: ${stats.reservations}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showDatabaseContent();
