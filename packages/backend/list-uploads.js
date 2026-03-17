const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUploads() {
  const uploads = await prisma.gdsDcfUpload.findMany({ orderBy: { id: 'desc' } });
  console.log('\nAll Uploads:');
  uploads.forEach(u => {
    console.log(`ID: ${u.id}, File: ${u.filename}`);
    console.log(`  Records: ${u.recordCount}, Chargeable: ${u.chargeableCount}, Fees: €${u.totalFees.toFixed(2)}\n`);
  });
  
  // Check validation results for each
  for (const upload of uploads) {
    const count = await prisma.gdsDcfValidationResult.count({ where: { uploadId: upload.id } });
    const gds = await prisma.gdsDcfValidationResult.count({ where: { uploadId: upload.id, region: 'GDS' } });
    const dcf = await prisma.gdsDcfValidationResult.count({ where: { uploadId: upload.id, region: 'DCF' } });
    console.log(`Upload ${upload.id} validation results: Total=${count}, GDS=${gds}, DCF=${dcf}`);
  }
  
  await prisma.$disconnect();
}

listUploads();
