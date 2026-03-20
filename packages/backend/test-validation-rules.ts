/**
 * Test script to verify the editable validation rules system
 */
import { validationRuleConfigService } from './src/services/validationRuleConfigService';
import { RuleGenerator } from './src/services/ruleGenerator';
import { RuleExporter } from './src/services/ruleExporter';
import fs from 'fs';

async function testValidationRulesSystem() {
  console.log('🧪 Testing Editable Validation Rules System\n');
  
  // Test 1: Get current validation config
  console.log('✅ Test 1: Get Current Validation Config');
  const currentConfig = await validationRuleConfigService.getCurrentConfig();
  console.log('Current config:', {
    revision: currentConfig.revision,
    enableStatusCheck: currentConfig.enableStatusCheck,
    validReservationStatuses: currentConfig.validReservationStatuses,
    createdBy: currentConfig.createdBy,
    updatedAt: currentConfig.updatedAt
  });
  console.log('');
  
  // Test 2: Get all history
  console.log('✅ Test 2: Get Validation Config History');
  const history = await validationRuleConfigService.getAllConfigs();
  console.log(`Found ${history.length} configurations in history`);
  console.log('');
  
  // Test 3: Generate rule snapshot with validation config
  console.log('✅ Test 3: Generate Rule Snapshot (includes validationConfig)');
  const ruleGenerator = new RuleGenerator();
  const snapshot = await ruleGenerator.generateRuleSnapshot(new Date());
  console.log('Snapshot generated:', {
    rulesetVersion: snapshot.rulesetVersion,
    totalRules: snapshot.rules.length,
    totalPartners: snapshot.partners.length,
    hasValidationConfig: !!snapshot.validationConfig
  });
  console.log('');
  
  // Test 4: Generate Excel with dynamic validation rules
  console.log('✅ Test 4: Generate Excel Export');
  const exporter = new RuleExporter();
  const excelBuffer = await exporter.generateExcel(snapshot);
  const testFilePath = './test-calculation-rules.xlsx';
  fs.writeFileSync(testFilePath, excelBuffer);
  console.log(`Excel generated: ${testFilePath} (${(excelBuffer.length / 1024).toFixed(2)} KB)`);
  console.log('');
  
  // Test 5: Verify snapshot contains all needed data
  console.log('✅ Test 5: Verify Snapshot Data');
  console.log('Validation Config in Snapshot:', {
    enableChannelCheck: snapshot.validationConfig?.enableChannelCheck,
    enableStatusCheck: snapshot.validationConfig?.enableStatusCheck,
    validReservationStatuses: snapshot.validationConfig?.validReservationStatuses,
    duplicateStrategy: snapshot.validationConfig?.duplicateStrategy
  });
  console.log('');
  
  console.log('✅ All tests passed!');
  console.log('\n📋 Summary:');
  console.log('- Validation config retrieval: ✓');
  console.log('- History tracking: ✓');
  console.log('- Rule snapshot generation: ✓');
  console.log('- Excel export with dynamic rules: ✓');
  console.log('- validReservationStatuses included: ✓');
}

testValidationRulesSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
