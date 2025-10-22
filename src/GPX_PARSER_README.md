# GPX Parser Utility

This utility extracts coordinates from GPX files and converts them to JSON format compatible with the Satellite Stop Motion project.

## Features

- ✅ Parse GPX files (tracks and routes)
- ✅ Convert to JSON array format `[[lon, lat], [lon, lat], ...]`
- ✅ Standalone CLI script
- ✅ Importable functions for use in other scripts
- ✅ Batch processing support
- ✅ Error handling and validation

## Installation

The parser requires the `xml2js` dependency which is already included in the project:

```bash
npm install
```

## Usage

### As a Standalone Script

Convert a single GPX file:
```bash
node src/gpxParser.js paths/alcoi.gpx
```

Convert with custom output path:
```bash
node src/gpxParser.js paths/alcoi.gpx paths/alcoi.json
```

Batch convert multiple GPX files:
```bash
node src/gpxParser.js --batch paths/*.gpx --output-dir paths/json/
```

### As Imported Functions

```javascript
import { parseGPXFile, convertGPXToJSON, batchConvertGPXToJSON } from './src/gpxParser.js';

// Parse GPX and get coordinates array
const coordinates = await parseGPXFile('paths/alcoi.gpx');

// Convert GPX to JSON file
const jsonPath = await convertGPXToJSON('paths/alcoi.gpx', 'paths/alcoi.json');

// Batch convert multiple files
const results = await batchConvertGPXToJSON(['paths/file1.gpx', 'paths/file2.gpx']);
```

## API Reference

### `parseGPXFile(gpxFilePath)`
- **Parameters**: `gpxFilePath` (string) - Path to the GPX file
- **Returns**: `Promise<Array<[number, number]>>` - Array of coordinate pairs [longitude, latitude]
- **Description**: Parses a GPX file and extracts all coordinate points

### `convertGPXToJSON(gpxFilePath, outputPath?)`
- **Parameters**: 
  - `gpxFilePath` (string) - Path to the GPX file
  - `outputPath` (string, optional) - Output JSON file path. If not provided, uses same directory as GPX file
- **Returns**: `Promise<string>` - Path to the created JSON file
- **Description**: Converts GPX file to JSON format and saves it

### `batchConvertGPXToJSON(gpxFilePaths, outputDir?)`
- **Parameters**:
  - `gpxFilePaths` (Array<string>) - Array of GPX file paths
  - `outputDir` (string, optional) - Output directory. If not provided, uses same directory as each GPX file
- **Returns**: `Promise<Array<string>>` - Array of created JSON file paths
- **Description**: Batch converts multiple GPX files to JSON format

## Output Format

The parser creates JSON files in the same format as the existing `castellana.json`:

```json
[
  [-0.4706550535457927, 38.70919986718257],
  [-0.4720409456200692, 38.70870591474519],
  [-0.4729557710407761, 38.708385164008206]
]
```

Each coordinate pair is `[longitude, latitude]` as required by the Satellite Stop Motion project.

## Supported GPX Formats

- **Tracks** (`<trk>` with `<trkseg>` and `<trkpt>`)
- **Routes** (`<rte>` with `<rtept>`)
- Standard GPX 1.1 format

## Error Handling

The parser includes comprehensive error handling:
- Invalid GPX file format
- Missing coordinate data
- File system errors
- XML parsing errors

## Example

See `src/example.js` for a complete usage example that demonstrates all functionality.

## Integration with Satellite Stop Motion

The generated JSON files can be used directly with the Satellite Stop Motion project by updating the `config/default.json` file:

```json
{
  "dataset": {
    "path": "/path/to/generated/file.json",
    "accesor": ""
  }
}
```

Since the parser generates a simple array format, the `accesor` field should be left empty.
