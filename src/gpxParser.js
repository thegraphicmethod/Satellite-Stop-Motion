import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';

/**
 * Parses a GPX file and extracts coordinates as an array of [longitude, latitude] pairs
 * @param {string} gpxFilePath - Path to the GPX file
 * @returns {Promise<Array<[number, number]>>} Array of coordinate pairs
 */
export async function parseGPXFile(gpxFilePath) {
  try {
    const gpxContent = fs.readFileSync(gpxFilePath, 'utf8');
    const result = await parseStringPromise(gpxContent);
    
    const coordinates = [];
    
    // Handle different GPX structures
    if (result.gpx && result.gpx.trk) {
      // Single track
      const track = Array.isArray(result.gpx.trk) ? result.gpx.trk[0] : result.gpx.trk;
      if (track.trkseg && track.trkseg[0] && track.trkseg[0].trkpt) {
        const trackPoints = track.trkseg[0].trkpt;
        trackPoints.forEach(point => {
          const lat = parseFloat(point.$.lat);
          const lon = parseFloat(point.$.lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            coordinates.push([lon, lat]); // Note: GPX uses lat,lon but we need lon,lat
          }
        });
      }
    } else if (result.gpx && result.gpx.rte) {
      // Route
      const route = Array.isArray(result.gpx.rte) ? result.gpx.rte[0] : result.gpx.rte;
      if (route.rtept) {
        const routePoints = Array.isArray(route.rtept) ? route.rtept : [route.rtept];
        routePoints.forEach(point => {
          const lat = parseFloat(point.$.lat);
          const lon = parseFloat(point.$.lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            coordinates.push([lon, lat]);
          }
        });
      }
    }
    
    return coordinates;
  } catch (error) {
    throw new Error(`Error parsing GPX file: ${error.message}`);
  }
}

/**
 * Converts GPX file to JSON format compatible with the Satellite Stop Motion project
 * @param {string} gpxFilePath - Path to the GPX file
 * @param {string} outputPath - Optional output path. If not provided, uses same directory as GPX file
 * @returns {Promise<string>} Path to the created JSON file
 */
export async function convertGPXToJSON(gpxFilePath, outputPath = null) {
  try {
    const coordinates = await parseGPXFile(gpxFilePath);
    
    if (coordinates.length === 0) {
      throw new Error('No coordinates found in GPX file');
    }
    
    // Determine output path
    if (!outputPath) {
      const gpxDir = path.dirname(gpxFilePath);
      const gpxName = path.basename(gpxFilePath, path.extname(gpxFilePath));
      outputPath = path.join(gpxDir, `${gpxName}.json`);
    }
    
    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(coordinates, null, 2));
    
    console.log(`✅ Converted ${gpxFilePath} to ${outputPath}`);
    console.log(`📊 Extracted ${coordinates.length} coordinate points`);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Error converting GPX to JSON: ${error.message}`);
  }
}

/**
 * Helper function to wrap xml2js parseString in a Promise
 * @param {string} xmlString - XML string to parse
 * @returns {Promise<Object>} Parsed XML object
 */
function parseStringPromise(xmlString) {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Batch convert multiple GPX files to JSON
 * @param {Array<string>} gpxFilePaths - Array of GPX file paths
 * @param {string} outputDir - Optional output directory. If not provided, uses same directory as each GPX file
 * @returns {Promise<Array<string>>} Array of created JSON file paths
 */
export async function batchConvertGPXToJSON(gpxFilePaths, outputDir = null) {
  const results = [];
  
  for (const gpxFilePath of gpxFilePaths) {
    try {
      const outputPath = outputDir ? 
        path.join(outputDir, `${path.basename(gpxFilePath, path.extname(gpxFilePath))}.json`) : 
        null;
      
      const jsonPath = await convertGPXToJSON(gpxFilePath, outputPath);
      results.push(jsonPath);
    } catch (error) {
      console.error(`❌ Failed to convert ${gpxFilePath}: ${error.message}`);
    }
  }
  
  return results;
}

// CLI functionality - only runs when script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node gpxParser.js <gpx-file> [output-file]
       node gpxParser.js --batch <gpx-file1> <gpx-file2> ... [--output-dir <dir>]

Examples:
  node gpxParser.js paths/alcoi.gpx
  node gpxParser.js paths/alcoi.gpx paths/alcoi.json
  node gpxParser.js --batch paths/*.gpx --output-dir paths/json/
    `);
    process.exit(1);
  }
  
  if (args[0] === '--batch') {
    const gpxFiles = args.slice(1).filter(arg => arg !== '--output-dir');
    const outputDirIndex = args.indexOf('--output-dir');
    const outputDir = outputDirIndex !== -1 && outputDirIndex + 1 < args.length ? 
      args[outputDirIndex + 1] : null;
    
    batchConvertGPXToJSON(gpxFiles, outputDir)
      .then(results => {
        console.log(`\n🎉 Successfully converted ${results.length} GPX files`);
        results.forEach(result => console.log(`  - ${result}`));
      })
      .catch(error => {
        console.error('❌ Batch conversion failed:', error.message);
        process.exit(1);
      });
  } else {
    const gpxFile = args[0];
    const outputFile = args[1] || null;
    
    convertGPXToJSON(gpxFile, outputFile)
      .then(result => {
        console.log(`\n🎉 Conversion completed: ${result}`);
      })
      .catch(error => {
        console.error('❌ Conversion failed:', error.message);
        process.exit(1);
      });
  }
}
