#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const testCategories = {
  'critical': [
    'src/hooks/__tests__/useExerciseLogging.test.js',
    'src/hooks/__tests__/useFoodLogging.test.js',
    'src/firebase/__tests__/logExerciseEntry.test.js',
    'src/firebase/__tests__/logFoodEntry.test.js',
    'src/store/__tests__/useAuthStore.test.js'
  ],
  'services': [
    'src/services/__tests__/exerciseScoringService.test.js',
    'src/services/__tests__/levelService.test.js',
    'src/services/__tests__/foodScoringService.test.js'
  ],
  'components': [
    'src/components/__tests__/ExerciseDisplay.test.jsx',
    'src/components/__tests__/DailySummary.test.jsx'
  ],
  'utils': [
    'src/utils/__tests__/dataUtils.test.js',
    'src/utils/__tests__/timeUtils.test.js'
  ],
  'integration': [
    'src/integration/__tests__/exerciseWorkflow.test.js',
    'src/integration/__tests__/foodWorkflow.test.js'
  ]
};

const category = process.argv[2];

if (!category || !testCategories[category]) {
  console.log('Available test categories:');
  Object.keys(testCategories).forEach(cat => {
    console.log(`  ${cat}: ${testCategories[cat].length} test files`);
  });
  console.log('\nUsage: node scripts/run-tests.js <category>');
  console.log('Example: node scripts/run-tests.js critical');
  process.exit(1);
}

const testFiles = testCategories[category];
console.log(`Running ${category} tests (${testFiles.length} files)...`);

try {
  const command = `npx vitest run ${testFiles.join(' ')}`;
  execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  console.log(`✅ ${category} tests completed successfully`);
} catch (error) {
  console.error(`❌ ${category} tests failed`);
  process.exit(1);
} 