const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRegions() {
  const all = await prisma.gdsDcfValidationResult.findMany({
    where: { uploadId: 4 },
    select: { id: true, region: true, partner: true }
  });
  
  const regions = {};
  all.forEach(r => {
    regions[r.region] = (regions[r.region] || 0) + 1;
  });
  
  console.log('\nRegion distribution:');
  Object.entries(regions).forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`);
  });
  
  // Show samples of non-GDS records
  const nonGDS = all.filter(r => r.region !== 'GDS').slice(0, 5);
  console.log(`\nSample non-GDS records (showing ${nonGDS.length}):`);
  nonGDS.forEach(r => {
    console.log(`  ID: ${r.id}, Region: "${r.region}", Partner: ${r.partner}`);
  });
  
  await prisma.$disconnect();
}

checkRegions();
