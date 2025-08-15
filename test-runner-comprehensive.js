#!/usr/bin/env node

/**
 * Comprehensive Test Runner for BarCrush Web Application
 * Runs both API backend tests and UI frontend tests
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

const testSuites = {
  api: [
    'test/auth-routes.test.js',
    'test/venues-routes.test.js',
    'test/matching-routes.test.js',
    'test/stripe-payments.test.js',
    'test/exchange-rate-routes.test.js',
    'test/exchange-rate-service.test.js',
    'test/data-id-converter.test.js',
    'test/photo-fetching.test.js'
  ],
  ui: [
    'ui-tests/auth-ui.test.js',
    'ui-tests/discover-ui.test.js',
    'ui-tests/location-button-test.js'
  ],
  integration: [
    'test/integration-tests.js'
  ]
};

class TestRunner {
  constructor() {
    this.results = {
      api: { passed: 0, failed: 0, total: 0 },
      ui: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 }
    };
  }

  async runTestSuite(suiteName, testFiles) {
    console.log(chalk.blue(`\n🧪 Running ${suiteName.toUpperCase()} Tests`));
    console.log(chalk.gray('='.repeat(50)));

    for (const testFile of testFiles) {
      if (!fs.existsSync(testFile)) {
        console.log(chalk.yellow(`⚠️  Test file not found: ${testFile}`));
        continue;
      }

      console.log(chalk.cyan(`\n📋 Running: ${testFile}`));
      
      try {
        const result = await this.runSingleTest(testFile);
        this.updateResults(suiteName, result);
        
        if (result.success) {
          console.log(chalk.green(`✅ ${testFile} - PASSED`));
        } else {
          console.log(chalk.red(`❌ ${testFile} - FAILED`));
          console.log(chalk.red(result.error));
        }
      } catch (error) {
        console.log(chalk.red(`💥 Error running ${testFile}: ${error.message}`));
        this.results[suiteName].failed++;
        this.results[suiteName].total++;
      }
    }
  }

  async runSingleTest(testFile) {
    return new Promise((resolve) => {
      const mocha = spawn('npx', ['mocha', testFile, '--reporter', 'json'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      mocha.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      mocha.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mocha.on('close', (code) => {
        try {
          if (code === 0) {
            const results = JSON.parse(stdout);
            resolve({
              success: true,
              passed: results.stats.passes,
              failed: results.stats.failures,
              total: results.stats.tests
            });
          } else {
            resolve({
              success: false,
              error: stderr || stdout,
              passed: 0,
              failed: 1,
              total: 1
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`,
            passed: 0,
            failed: 1,
            total: 1
          });
        }
      });
    });
  }

  updateResults(suiteName, result) {
    this.results[suiteName].passed += result.passed;
    this.results[suiteName].failed += result.failed;
    this.results[suiteName].total += result.total;
  }

  printSummary() {
    console.log(chalk.blue('\n📊 Test Results Summary'));
    console.log(chalk.gray('='.repeat(50)));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    Object.entries(this.results).forEach(([suiteName, results]) => {
      const { passed, failed, total } = results;
      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;

      const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
      const status = failed === 0 ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');

      console.log(`\n${chalk.bold(suiteName.toUpperCase())} Tests:`);
      console.log(`  ${status}`);
      console.log(`  Passed: ${chalk.green(passed)}`);
      console.log(`  Failed: ${chalk.red(failed)}`);
      console.log(`  Total:  ${total}`);
      console.log(`  Pass Rate: ${passRate}%`);
    });

    console.log(chalk.blue('\n🎯 Overall Results:'));
    console.log(`  Total Passed: ${chalk.green(totalPassed)}`);
    console.log(`  Total Failed: ${chalk.red(totalFailed)}`);
    console.log(`  Total Tests:  ${totalTests}`);
    
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
    console.log(`  Overall Pass Rate: ${overallPassRate}%`);

    if (totalFailed === 0) {
      console.log(chalk.green('\n🎉 All tests passed!'));
    } else {
      console.log(chalk.red(`\n⚠️  ${totalFailed} test(s) failed. Please review and fix.`));
    }
  }

  async runAll() {
    console.log(chalk.bold.blue('🚀 Starting Comprehensive Test Suite for BarCrush Web'));
    console.log(chalk.gray(`Started at: ${new Date().toISOString()}`));

    // Check if required dependencies are installed
    await this.checkDependencies();

    // Run test suites
    for (const [suiteName, testFiles] of Object.entries(testSuites)) {
      await this.runTestSuite(suiteName, testFiles);
    }

    this.printSummary();

    // Exit with appropriate code
    const totalFailed = Object.values(this.results).reduce((sum, result) => sum + result.failed, 0);
    process.exit(totalFailed > 0 ? 1 : 0);
  }

  async checkDependencies() {
    const requiredDeps = ['mocha', 'chai', 'sinon', 'jsdom'];
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    console.log(chalk.blue('\n🔍 Checking test dependencies...'));

    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        console.log(chalk.yellow(`⚠️  Missing dependency: ${dep}`));
        console.log(chalk.gray(`   Install with: npm install --save-dev ${dep}`));
      } else {
        console.log(chalk.green(`✅ ${dep} - ${allDeps[dep]}`));
      }
    }
  }

  async runSpecific(pattern) {
    console.log(chalk.blue(`🎯 Running tests matching pattern: ${pattern}`));
    
    const allTests = [...testSuites.api, ...testSuites.ui, ...testSuites.integration];
    const matchingTests = allTests.filter(test => test.includes(pattern));

    if (matchingTests.length === 0) {
      console.log(chalk.yellow(`No tests found matching pattern: ${pattern}`));
      return;
    }

    for (const testFile of matchingTests) {
      if (fs.existsSync(testFile)) {
        console.log(chalk.cyan(`\n📋 Running: ${testFile}`));
        const result = await this.runSingleTest(testFile);
        
        if (result.success) {
          console.log(chalk.green(`✅ ${testFile} - PASSED`));
        } else {
          console.log(chalk.red(`❌ ${testFile} - FAILED`));
          console.log(chalk.red(result.error));
        }
      }
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const runner = new TestRunner();

if (args.length === 0) {
  // Run all tests
  runner.runAll();
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(chalk.blue('BarCrush Test Runner'));
  console.log('\nUsage:');
  console.log('  node test-runner-comprehensive.js           # Run all tests');
  console.log('  node test-runner-comprehensive.js api       # Run only API tests');
  console.log('  node test-runner-comprehensive.js ui        # Run only UI tests');
  console.log('  node test-runner-comprehensive.js auth      # Run tests matching "auth"');
  console.log('  node test-runner-comprehensive.js --help    # Show this help');
} else if (testSuites[args[0]]) {
  // Run specific test suite
  runner.runTestSuite(args[0], testSuites[args[0]]).then(() => {
    runner.printSummary();
    const totalFailed = runner.results[args[0]].failed;
    process.exit(totalFailed > 0 ? 1 : 0);
  });
} else {
  // Run tests matching pattern
  runner.runSpecific(args[0]);
}
