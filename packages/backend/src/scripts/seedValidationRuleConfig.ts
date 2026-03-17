import prisma from '../prismaClient';
import { validationRuleConfigService } from '../services/validationRuleConfigService';

async function seedInitialValidationConfig() {
  console.log('════════════════════════════════════════════════════════');
  console.log('  Seed Initial Validation Rule Configuration');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Check if config already exists
    const existingConfig = await (prisma as any).validationRuleConfigHistory.findFirst({
      where: { configId: 'default' },
    });

    if (existingConfig) {
      console.log('⚠️  Initial configuration already exists. Skipping...');
      console.log(`   - Config ID: ${existingConfig.configId}`);
      console.log(`   - Revision: ${existingConfig.revision}`);
      console.log(`   - Valid From: ${existingConfig.validFrom}`);
      return;
    }

    // Create initial configuration with default values
    const initialConfig = await validationRuleConfigService.saveRevision(
      {
        configId: 'default',
        enableDuplicateCheck: true,
        enableStatusCheck: true,
        enableMandantCheck: true,
        enableChannelCheck: true,
        validStatuses: ['invoice', 'no show', 'open'],
        duplicateStrategy: 'first',
        validFrom: new Date('2025-01-01'),
        validTo: null,
        createdBy: 'Migration Script',
      },
      new Date('2025-01-01'),
      null,
      'Migration Script',
      'Initial validation rule configuration - all rules enabled with default settings'
    );

    console.log('✅ Initial validation configuration created successfully!');
    console.log(`   - Config ID: ${initialConfig.configId}`);
    console.log(`   - Revision: ${initialConfig.revision}`);
    console.log(`   - Valid From: ${initialConfig.validFrom.toISOString().split('T')[0]}`);
    console.log(`   - Duplicate Strategy: ${initialConfig.duplicateStrategy}`);
    console.log(`   - Valid Statuses: ${initialConfig.validStatuses.join(', ')}`);
    console.log('\n📋 Configuration Summary:');
    console.log(`   - Channel Check: ${initialConfig.enableChannelCheck ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`   - Mandant Check: ${initialConfig.enableMandantCheck ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`   - Status Check: ${initialConfig.enableStatusCheck ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`   - Duplicate Check: ${initialConfig.enableDuplicateCheck ? '✓ Enabled' : '✗ Disabled'}`);

  } catch (error) {
    console.error('❌ Failed to seed initial configuration:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedInitialValidationConfig();
    
    console.log('\n════════════════════════════════════════════════════════');
    console.log('  ✅ Migration completed successfully!');
    console.log('════════════════════════════════════════════════════════\n');

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
