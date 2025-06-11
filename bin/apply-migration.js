#!/usr/bin/env node

// Apply migrations using Supabase CLI
// This script is a wrapper around the supabase-db.sh script for convenience

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(path.join(__dirname, '..'));

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m'; // No Color

console.log(`${YELLOW}Applying Supabase migrations...${NC}`);

try {
  // Change to project root directory
  process.chdir(projectRoot);
  
  // Run the supabase-db.sh migrate command
  console.log(`${YELLOW}Running: ./bin/supabase-db.sh migrate${NC}`);
  
  const output = execSync('./bin/supabase-db.sh migrate', {
    stdio: 'inherit',
    encoding: 'utf8'
  });
  
  console.log(`${GREEN}✅ Migrations applied successfully!${NC}`);
  
} catch (error) {
  console.error(`${RED}❌ Error applying migrations:${NC}`, error.message);
  console.log(`\n${YELLOW}Alternative approaches:${NC}`);
  console.log('1. Run the migration script directly:');
  console.log('   ./bin/supabase-db.sh migrate');
  console.log('2. Or deploy with migrations:');
  console.log('   ./bin/deploy-with-migrations.sh');
  console.log('3. Or apply manually in Supabase dashboard SQL Editor');
  
  process.exit(1);
}
