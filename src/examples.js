import { satelliteStopMotion, startServer } from './satelliteStopMotion.js';

/**
 * Example script showing how to use the modular satelliteStopMotion function
 * This demonstrates how to call the function from another Node.js script
 */

// Example 1: Using a custom configuration object
async function exampleWithCustomConfig() {
  console.log('🚀 Example 1: Using custom configuration');
  
  const customConfig = {
    dataset: {
      file: "paths/alcoi.json",
      accesor: ""
    },
    map: {
      zoom: 15,
      step: 0.002,
      mapbox: {
        mapboxToken: "pk.eyJ1IjoiaW52aWFibGUiLCJhIjoiY2xwYTRzMXRvMDRteDJqbmtucnk1Z3U0aCJ9.itMy9INBAXIfD08bQa7oiw",
        mapboxStyle: "mapbox://styles/mapbox/satellite-v9"
      }
    },
    image: {
      jpgQuality: 85,
      width: 1920,
      height: 1080,
      name: "alcoi_hd",
      folder: "hd_quality"  // Images will be saved in images/hd_quality/
    },
    headless: true,
    debug: false,
    runloop: true
  };

  try {
    const result = await satelliteStopMotion(customConfig);
    console.log(`✅ Created ${result.imagesCreated} images with custom config`);
    return result;
  } catch (error) {
    console.error('❌ Custom config failed:', error.message);
    throw error;
  }
}

// Example 2: Using debug mode
async function exampleDebugMode() {
  console.log('🚀 Example 2: Debug mode');
  
  const debugConfig = {
    dataset: {
      file: "paths/alcoi.json",
      accesor: ""
    },
    map: {
      zoom: 16,
      step: 0.001,
      mapbox: {
        mapboxToken: "pk.eyJ1IjoiaW52aWFibGUiLCJhIjoiY2xwYTRzMXRvMDRteDJqbmtucnk1Z3U0aCJ9.itMy9INBAXIfD08bQa7oiw",
        mapboxStyle: "mapbox://styles/mapbox/satellite-v9"
      }
    },
    image: {
      jpgQuality: 90,
      width: 1280,
      height: 720,
      name: "alcoi_debug"
    },
    headless: false, // Show browser window
    debug: true,     // Enable debug mode
    runloop: false   // Don't run the full loop, just initialize
  };

  try {
    const result = await satelliteStopMotion(debugConfig);
    console.log('✅ Debug mode initialized');
    console.log('🌐 Browser window should be open for debugging');
    
    // Keep the browser open for a few seconds to demonstrate
    setTimeout(() => {
      if (result.browser) {
        console.log('🔒 Closing browser after demo...');
        result.browser.close();
      }
    }, 5000);
    
    return result;
  } catch (error) {
    console.error('❌ Debug mode failed:', error.message);
    throw error;
  }
}

// Example 3: Batch processing multiple configurations
async function exampleBatchProcessing() {
  console.log('🚀 Example 3: Batch processing');
  
  const configs = [
    {
      dataset: { file: "paths/alcoi.json", accesor: "" },
      map: { zoom: 16, step: 0.001, mapbox: { mapboxToken: "pk.eyJ1IjoiaW52aWFibGUiLCJhIjoiY2xwYTRzMXRvMDRteDJqbmtucnk1Z3U0aCJ9.itMy9INBAXIfD08bQa7oiw", mapboxStyle: "mapbox://styles/mapbox/satellite-v9" } },
      image: { jpgQuality: 90, width: 1280, height: 720, name: "alcoi_batch1", folder: "alcoi_route" },
      headless: true, debug: false, runloop: true
    },
    {
      dataset: { file: "paths/castellana.json", accesor: "" },
      map: { zoom: 14, step: 0.002, mapbox: { mapboxToken: "pk.eyJ1IjoiaW52aWFibGUiLCJhIjoiY2xwYTRzMXRvMDRteDJqbmtucnk1Z3U0aCJ9.itMy9INBAXIfD08bQa7oiw", mapboxStyle: "mapbox://styles/mapbox/satellite-v9" } },
      image: { jpgQuality: 90, width: 1280, height: 720, name: "castellana_batch2", folder: "castellana_route" },
      headless: true, debug: false, runloop: true
    }
  ];

  const results = [];
  
  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`📸 Processing batch ${i + 1}/${configs.length}...`);
      const result = await satelliteStopMotion(configs[i]);
      results.push(result);
      console.log(`✅ Batch ${i + 1} completed: ${result.imagesCreated} images`);
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error.message);
    }
  }
  
  const totalImages = results.reduce((sum, result) => sum + result.imagesCreated, 0);
  console.log(`🎉 Batch processing completed: ${totalImages} total images created`);
  
  return results;
}

// Main execution
async function main() {
  console.log('🌟 Satellite Stop Motion - Modular Usage Examples\n');
  
  // Start the server
  startServer();
  
  try {
    // Run examples (uncomment the ones you want to test)
    
    // Example 1: Custom configuration
    // await exampleWithCustomConfig();
    
    // Example 2: Debug mode
    // await exampleDebugMode();
    
    // Example 3: Batch processing
    await exampleBatchProcessing();
    
  } catch (error) {
    console.error('❌ Examples failed:', error.message);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export functions for use in other scripts
export {
  exampleWithCustomConfig,
  exampleDebugMode,
  exampleBatchProcessing
};
