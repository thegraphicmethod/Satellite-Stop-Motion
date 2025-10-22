import { parseGPXFile, convertGPXToJSON, batchConvertGPXToJSON } from './gpxParser.js';
import fs from 'fs';
import path from 'path';

/**
 * Example usage of the GPX parser as a function
 */
async function exampleUsage() {
  try {
    console.log('🚀 GPX Parser Example Usage\n');
    
    // Example 1: Parse a single GPX file and get coordinates
    console.log('1. Parsing GPX file to get coordinates...');
    const coordinates = await parseGPXFile('paths/alcoi.gpx');
    console.log(`   Found ${coordinates.length} coordinate points`);
    console.log(`   First point: [${coordinates[0][0]}, ${coordinates[0][1]}]`);
    console.log(`   Last point: [${coordinates[coordinates.length-1][0]}, ${coordinates[coordinates.length-1][1]}]\n`);
    
    // Example 2: Convert GPX to JSON with custom output path
    console.log('2. Converting GPX to JSON with custom output...');
    const jsonPath = await convertGPXToJSON('paths/alcoi.gpx', 'paths/alcoi_example.json');
    console.log(`   Created: ${jsonPath}\n`);
    
    // Example 3: Batch convert multiple GPX files
    console.log('3. Batch converting multiple GPX files...');
    const gpxFiles = fs.readdirSync('paths')
      .filter(file => file.endsWith('.gpx'))
      .map(file => path.join('paths', file));
    
    if (gpxFiles.length > 0) {
      const results = await batchConvertGPXToJSON(gpxFiles);
      console.log(`   Converted ${results.length} files:`);
      results.forEach(result => console.log(`     - ${result}`));
    } else {
      console.log('   No GPX files found in paths directory');
    }
    
    console.log('\n✅ Example completed successfully!');
    
  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Run the example
exampleUsage();
