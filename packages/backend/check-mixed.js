const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMixedRecords() {
  // Find records that have Amadeus in sourceChannel2 but are NOT GDS
  const records = await prisma.gdsDcfValidationResult.findMany({
    where: { 
      uploadId: 4,
      region: { not: 'GDS' }
    },
    take: 20
  });
  
  console.log('\nNon-GDS records (should be DCF):');
  console.log(`Total: ${records.length}\n`);
  
  records.forEach((r, idx) => {
    const res = JSON.parse(r.reservationData);
    console.log(`${idx + 1}. ${res.resNumber}:`);
    console.log(`   Partner: ${r.partner}`);
    console.log(`   Region: ${r.region}`);
    console.log(`   Source Ch2: ${res.sourceChannel2}`);
    console.log(`   Source Ch3: ${res.sourceChannel3}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkMixedRecords();
