const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllRecords() {
  try {
    console.log('Checking all records from upload ID 4...\n');
    
    const allRecords = await prisma.gdsDcfValidationResult.findMany({
      where: { uploadId: 4 },
      take: 10
    });
    
    const gdsCount = allRecords.filter(r => r.region === 'GDS').length;
    const dcfCount = allRecords.filter(r => r.region === 'DCF').length;
    
    console.log(`Total records: ${allRecords.length}`);
    console.log(`GDS: ${gdsCount}, DCF: ${dcfCount}\n`);
    
    console.log('First 5 records:');
    allRecords.slice(0, 5).forEach((record, index) => {
      const reservation = JSON.parse(record.reservationData);
      console.log(`${index + 1}. ${reservation.resNumber}:`);
      console.log(`   Partner: ${record.partner}`);
      console.log(`   Region: ${record.region}`);
      console.log(`   Source Ch2: ${reservation.sourceChannel2}`);
      console.log(`   Source Ch3: ${reservation.sourceChannel3}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRecords();
