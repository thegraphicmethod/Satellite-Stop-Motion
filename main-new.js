import config from "config";
import { satelliteStopMotion, startServer } from "./src/satelliteStopMotion.js";

// Load configuration from default.json
const configObject = {
  dataset: {
    file: config.get("dataset.file"),
    accesor: config.get("dataset.accesor")
  },
  map: {
    zoom: config.get("map.zoom"),
    step: config.get("map.step"),
    mapbox: config.get("map.mapbox")
  },
  image: {
    jpgQuality: config.get("image.jpgQuality"),
    width: config.get("image.width"),
    height: config.get("image.height"),
    name: config.get("image.name"),
    folder: config.get("image.folder")
  },
  visualization: {
    showPath: config.get("visualization.showPath"),
    showCurrentPoint: config.get("visualization.showCurrentPoint")
  },
  headless: config.get("headless"),
  debug: config.get("debug"),
  runloop: config.get("runloop")
};

// Start the server
startServer();
console.log(configObject);
// Run the satellite stop motion
satelliteStopMotion(configObject)
  .then(result => {
    if (result.success) {
      if (result.imagesCreated) {
        console.log(`✅ Successfully created ${result.imagesCreated} images`);
        console.log(`📁 Images saved in: images/`);
        // Exit process after completion
        console.log("Exiting process...");
        process.exit(0);
      } else {
        console.log(`✅ Debug mode initialized successfully`);
        console.log(`🌐 Browser opened for debugging`);
      }
    }
  })
  .catch(error => {
    console.error('❌ Satellite Stop Motion failed:', error.message);
    process.exit(1);
  });
