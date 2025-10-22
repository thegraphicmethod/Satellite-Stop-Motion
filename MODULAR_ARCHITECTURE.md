# Satellite Stop Motion - Modular Architecture

This document explains the new modular architecture that allows the Satellite Stop Motion functionality to be used from other Node.js scripts.

## Architecture Overview

The code has been refactored into a modular structure with the following components:

1. **`src/satelliteStopMotion.js`** - Core modular functionality
2. **`main-new.js`** - New main entry point using the modular function
3. **`main.js`** - Original main file (preserved for backward compatibility)
4. **`src/examples.js`** - Usage examples

## Core Module: `satelliteStopMotion.js`

### Main Function: `satelliteStopMotion(config)`

The main function that can be imported and used from other scripts.

#### Parameters

```javascript
const config = {
  dataset: {
    file: "paths/alcoi.json",        // Path to dataset file
    accesor: ""                      // Accessor for coordinates (empty for simple arrays)
  },
  map: {
    zoom: 16,                        // Map zoom level
    step: 0.001,                     // Step size for interpolation
    mapbox: {
      mapboxToken: "your_token",     // Mapbox API token
      mapboxStyle: "mapbox://styles/mapbox/satellite-v9"
    }
  },
  image: {
    jpgQuality: 90,                  // JPEG quality (0-100)
    width: 1280,                     // Image width
    height: 720,                     // Image height
    name: "alcoi",                   // Image name prefix
    folder: "alcoi_route"             // Optional subfolder within images directory
  },
  visualization: {
    showPath: true,                  // Show the full route path line
    showCurrentPoint: true            // Show current position marker
  },
  headless: true,                    // Run in headless mode
  debug: false,                      // Enable debug mode
  runloop: true                      // Run full travel loop
};
```

#### Returns

```javascript
// For runloop: true
{
  success: true,
  imagesCreated: 150,
  imagesList: ["images/alcoi_0000-0000-...jpg", "..."],
  browser: null
}

// For runloop: false (debug mode)
{
  success: true,
  browser: browserInstance,
  page: pageInstance,
  coordinates: [...],
  points: [...]
}
```

### Helper Function: `startServer(port)`

Starts the Express server for serving the frontend.

```javascript
const { app, server } = startServer(3300);
```

## Usage Examples

### Basic Usage

```javascript
import { satelliteStopMotion, startServer } from './src/satelliteStopMotion.js';

// Start server
startServer();

// Define configuration
const config = {
  dataset: { file: "paths/alcoi.json", accesor: "" },
  map: { zoom: 16, step: 0.001, mapbox: { /* ... */ } },
  image: { jpgQuality: 90, width: 1280, height: 720, name: "alcoi" },
  headless: true,
  debug: false,
  runloop: true
};

// Run satellite stop motion
const result = await satelliteStopMotion(config);
console.log(`Created ${result.imagesCreated} images`);
```

### Debug Mode

```javascript
const debugConfig = {
  // ... same config structure
  headless: false,  // Show browser window
  debug: true,      // Enable debug mode
  runloop: false    // Don't run full loop
};

const result = await satelliteStopMotion(debugConfig);
// Browser window opens for debugging
// result.browser contains the browser instance
```

### Batch Processing

```javascript
const configs = [
  { /* config for first dataset */ },
  { /* config for second dataset */ },
  { /* config for third dataset */ }
];

for (const config of configs) {
  const result = await satelliteStopMotion(config);
  console.log(`Processed: ${result.imagesCreated} images`);
}
```

### Image Folder Organization

The `image.folder` parameter allows you to organize images into subdirectories:

```javascript
const config = {
  // ... other config
  image: {
    name: "alcoi",
    folder: "alcoi_route"  // Images saved in images/alcoi_route/
  }
};

// Without folder parameter - images saved in images/
const config2 = {
  // ... other config
  image: {
    name: "castellana"
    // folder not specified - images saved in images/
  }
};
```

**Folder Structure:**
```
images/
├── alcoi_route/
│   ├── alcoi_0000-0000-...jpg
│   └── alcoi_0001-0000-...jpg
├── castellana_route/
│   ├── castellana_0000-0000-...jpg
│   └── castellana_0001-0000-...jpg
└── direct_images/
    ├── direct_0000-0000-...jpg
    └── direct_0001-0000-...jpg
```

### Path Visualization Features

The `visualization` configuration allows you to add visual elements to your captured images:

```javascript
const config = {
  // ... other config
  visualization: {
    showPath: true,        // Show red line for the full route
    showCurrentPoint: true // Show green marker for current position
  }
};
```

**Visualization Options:**
- **`showPath`**: Displays a red line showing the complete route path
- **`showCurrentPoint`**: Shows a green circle marker at the current capture position

**Visual Elements:**
- **Path Line**: Red line (`#ff0000`) with 3px width and 80% opacity
- **Current Point**: Green circle (`#00ff00`) with white border, 8px radius

**Use Cases:**
- **Route Documentation**: Show the complete path for context
- **Progress Tracking**: Highlight current position during capture
- **Educational Content**: Visualize the journey for presentations
- **Debug Mode**: Verify route accuracy and capture points

### Custom Configuration from External Source

```javascript
import fs from 'fs';

// Load config from external file
const externalConfig = JSON.parse(fs.readFileSync('my-config.json', 'utf8'));

// Use with satellite stop motion
const result = await satelliteStopMotion(externalConfig);
```

## File Structure

```
Satellite-Stop-Motion/
├── src/
│   ├── satelliteStopMotion.js    # Core modular functionality
│   ├── examples.js               # Usage examples
│   ├── gpxParser.js              # GPX parser utility
│   └── utils.js                  # Utility functions
├── main.js                       # Original main file
├── main-new.js                   # New modular main file
├── config/
│   └── default.json              # Default configuration
└── paths/
    ├── alcoi.json                # Generated from GPX
    └── castellana.json            # Sample dataset
```

## Migration Guide

### From Original `main.js` to Modular Usage

**Before:**
```bash
node main.js
```

**After:**
```bash
node main-new.js
```

### For Custom Scripts

**Before:** (Not possible - everything was in main.js)

**After:**
```javascript
import { satelliteStopMotion, startServer } from './src/satelliteStopMotion.js';

const config = { /* your configuration */ };
const result = await satelliteStopMotion(config);
```

## Benefits of Modular Architecture

1. **Reusability**: Core functionality can be imported into other scripts
2. **Flexibility**: Easy to create custom configurations programmatically
3. **Testability**: Functions can be tested independently
4. **Maintainability**: Clear separation of concerns
5. **Batch Processing**: Easy to process multiple datasets
6. **Integration**: Can be integrated into larger applications

## Error Handling

The modular functions include comprehensive error handling:

```javascript
try {
  const result = await satelliteStopMotion(config);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

## Performance Considerations

- **Headless Mode**: Use `headless: true` for production runs
- **Image Quality**: Adjust `jpgQuality` based on your needs (lower = faster)
- **Step Size**: Smaller steps = more images = longer processing time
- **Batch Processing**: Process datasets sequentially to avoid memory issues

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Change the port in `startServer(3301)`
2. **Missing Dataset**: Ensure dataset file exists and is accessible
3. **Invalid Configuration**: Check all required config properties are present
4. **Browser Launch Issues**: Try different headless modes or add Puppeteer args

### Debug Mode

Use debug mode to troubleshoot issues:

```javascript
const debugConfig = {
  // ... your config
  headless: false,
  debug: true,
  runloop: false
};
```

This will open a browser window where you can inspect the map and route.
