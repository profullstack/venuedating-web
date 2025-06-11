#!/usr/bin/env node

/**
 * Script to add Google geographical location queries to city data files
 * This enhances ValueSERP API accuracy by providing specific location targeting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the data directory
const dataDir = path.join(__dirname, '..', 'data');

// Country-specific location formatters
const locationFormatters = {
  'us-cities-top-200.json': (city, state) => {
    // Convert state names to abbreviations for US
    const stateAbbreviations = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
      'District of Columbia': 'DC'
    };
    const stateAbbr = stateAbbreviations[state] || state;
    return `${city}, ${stateAbbr}, USA`;
  },

  'china-cities-top-200.json': (city, state) => `${city}, ${state}, China`,
  'india-cities-top-200.json': (city, state) => `${city}, ${state}, India`,
  'brazil-cities-top-200.json': (city, state) => `${city}, ${state}, Brazil`,
  'japan-cities-top-200.json': (city, state) => `${city}, ${state}, Japan`,
  'uk-cities-top-200.json': (city, state) => {
    // Use appropriate country codes for UK regions
    const regionMap = {
      'England': 'England, UK',
      'Scotland': 'Scotland, UK', 
      'Wales': 'Wales, UK',
      'Northern Ireland': 'Northern Ireland, UK'
    };
    const region = regionMap[state] || `${state}, UK`;
    return `${city}, ${region}`;
  }
};

// Files to update
const filesToUpdate = [
  'us-cities-top-200.json',
  'china-cities-top-200.json',
  'india-cities-top-200.json',
  'brazil-cities-top-200.json',
  'japan-cities-top-200.json',
  'uk-cities-top-200.json'
];

function updateCityFile(filename) {
  const filePath = path.join(dataDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  try {
    // Read the current file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const cities = JSON.parse(fileContent);
    
    // Get the appropriate formatter
    const formatter = locationFormatters[filename];
    if (!formatter) {
      console.log(`⚠️  No formatter found for: ${filename}`);
      return;
    }

    // Update each city entry
    const updatedCities = cities.map(cityEntry => {
      // Skip if location already exists
      if (cityEntry.location) {
        return cityEntry;
      }

      // Add location field
      return {
        ...cityEntry,
        location: formatter(cityEntry.city, cityEntry.state)
      };
    });

    // Write the updated file
    const updatedContent = JSON.stringify(updatedCities, null, 2);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`✅ Updated ${filename} with ${updatedCities.length} cities`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filename}:`, error.message);
  }
}

// Main execution
console.log('🌍 Adding Google geographical location queries to city files...\n');

filesToUpdate.forEach(filename => {
  updateCityFile(filename);
});

console.log('\n🎉 Location query update complete!');
console.log('\nUpdated files now include "location" field for ValueSERP API targeting:');
console.log('- Enhanced geographical accuracy');
console.log('- Better search result relevance');
console.log('- Improved venue discovery');