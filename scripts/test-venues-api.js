#!/usr/bin/env node

/**
 * BarCrush Venues API Test CLI
 * 
 * A command-line tool to test the venues API and verify data is available
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const { program } = require('commander');
const chalk = require('chalk');

import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Error: Supabase URL and anon key are required.'));
  console.error(chalk.yellow('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Set up the CLI
program
  .name('test-venues-api')
  .description('CLI tool to test the BarCrush venues API')
  .version('1.0.0');

// Command to get nearby venues
program
  .command('nearby')
  .description('Get venues near a specific location')
  .option('-lat, --latitude <number>', 'Latitude', parseFloat)
  .option('-lng, --longitude <number>', 'Longitude', parseFloat)
  .option('-r, --radius <number>', 'Radius in kilometers', parseFloat, 5)
  .action(async (options) => {
    const lat = options.latitude || 37.7749;
    const lng = options.longitude || -122.4194;
    const radius = options.radius || 5;
    
    console.log(chalk.blue('🔍 Testing getNearbyVenues API...'));
    console.log(chalk.gray(`📍 Location: ${lat}, ${lng} (Radius: ${radius}km)`));
    
    try {
      console.log(chalk.yellow('🚀 Calling get_nearby_venues RPC...'));
      
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('get_nearby_venues', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radius
      });
      const endTime = Date.now();
      
      if (error) {
        console.error(chalk.red('❌ API Error:'), error);
        return;
      }
      
      console.log(chalk.green(`✅ Success! Found ${data.length} venues in ${endTime - startTime}ms`));
      
      if (data.length === 0) {
        console.log(chalk.yellow('⚠️ No venues found in this area.'));
      } else {
        console.log(chalk.blue('\n📊 Venue Summary:'));
        data.forEach((venue, index) => {
          console.log(chalk.cyan(`\n#${index + 1}: ${venue.name || 'Unnamed Venue'}`));
          console.log(chalk.gray(`   ID: ${venue.id}`));
          console.log(chalk.gray(`   Rating: ${venue.rating || 'N/A'}`));
          console.log(chalk.gray(`   Active Users: ${venue.active_users || 0}`));
          
          // Check if venue has valid coordinates
          const hasValidCoords = venue.location && 
                               venue.location.coordinates && 
                               venue.location.coordinates.length === 2;
          
          if (hasValidCoords) {
            console.log(chalk.gray(`   Coordinates: ${venue.location.coordinates[1]}, ${venue.location.coordinates[0]}`));
          } else {
            console.log(chalk.red(`   ⚠️ Invalid coordinates!`));
          }
        });
      }
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err);
    }
  });

// Command to search venues by name
program
  .command('search')
  .description('Search venues by name or description')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Maximum number of results', parseInt, 10)
  .action(async (query, options) => {
    console.log(chalk.blue(`🔍 Searching venues with query: "${query}"...`));
    
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(options.limit);
      
      if (error) {
        console.error(chalk.red('❌ API Error:'), error);
        return;
      }
      
      console.log(chalk.green(`✅ Success! Found ${data.length} matching venues`));
      
      if (data.length === 0) {
        console.log(chalk.yellow('⚠️ No venues found matching your query.'));
      } else {
        console.log(chalk.blue('\n📊 Search Results:'));
        data.forEach((venue, index) => {
          console.log(chalk.cyan(`\n#${index + 1}: ${venue.name || 'Unnamed Venue'}`));
          console.log(chalk.gray(`   ID: ${venue.id}`));
          console.log(chalk.gray(`   Description: ${venue.description || 'No description'}`));
        });
      }
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err);
    }
  });

// Command to get venue by ID
program
  .command('get')
  .description('Get venue details by ID')
  .argument('<id>', 'Venue ID')
  .action(async (id) => {
    console.log(chalk.blue(`🔍 Getting venue with ID: ${id}...`));
    
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(chalk.red('❌ API Error:'), error);
        return;
      }
      
      if (!data) {
        console.log(chalk.yellow(`⚠️ No venue found with ID: ${id}`));
        return;
      }
      
      console.log(chalk.green('✅ Success! Venue details:'));
      console.log(chalk.cyan(`\nVenue: ${data.name || 'Unnamed Venue'}`));
      console.log(chalk.gray(`ID: ${data.id}`));
      console.log(chalk.gray(`Description: ${data.description || 'No description'}`));
      console.log(chalk.gray(`Address: ${data.address || 'No address'}`));
      console.log(chalk.gray(`Rating: ${data.rating || 'N/A'}`));
      console.log(chalk.gray(`Active Users: ${data.active_users || 0}`));
      
      // Check if venue has valid coordinates
      const hasValidCoords = data.location && 
                           data.location.coordinates && 
                           data.location.coordinates.length === 2;
      
      if (hasValidCoords) {
        console.log(chalk.gray(`Coordinates: ${data.location.coordinates[1]}, ${data.location.coordinates[0]}`));
      } else {
        console.log(chalk.red(`⚠️ Invalid coordinates!`));
      }
      
      // Check for images
      if (data.images && data.images.length > 0) {
        console.log(chalk.gray(`Images: ${data.images.length} available`));
        data.images.forEach((img, i) => {
          console.log(chalk.gray(`   Image ${i+1}: ${img}`));
        });
      } else {
        console.log(chalk.yellow(`⚠️ No images available`));
      }
      
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err);
    }
  });

// Parse command line arguments
program.parse();

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
