import puppeteer from "puppeteer";
import JSON from "json5";
import fs from "fs";
import express from "express";
import _get from "lodash.get";
import path from "path";
import {
  generatePointsWithStep,
  slugify,
  createFrontConfigFile,
  copyDatafileToFrontend,
  generateFullArrayPoints,
  createGeoJsonLineFromPoints,
  writeDatafileToFrontend
} from "./utils.js";

/**
 * Main function for Satellite Stop Motion
 * @param {Object} config - Configuration object
 * @param {Object} config.dataset - Dataset configuration
 * @param {string} config.dataset.file - Path to the dataset file
 * @param {string} config.dataset.accesor - Accessor for coordinates in the dataset
 * @param {Object} config.map - Map configuration
 * @param {number} config.map.zoom - Map zoom level
 * @param {number} config.map.step - Step size for interpolation
 * @param {Object} config.map.mapbox - Mapbox configuration
 * @param {string} config.map.mapbox.mapboxToken - Mapbox token
 * @param {string} config.map.mapbox.mapboxStyle - Mapbox style
 * @param {Object} config.image - Image configuration
 * @param {number} config.image.jpgQuality - JPEG quality (0-100)
 * @param {number} config.image.width - Image width
 * @param {number} config.image.height - Image height
 * @param {string} config.image.name - Image name prefix
 * @param {string} config.image.folder - Optional subfolder within images directory
 * @param {boolean} config.headless - Whether to run in headless mode
 * @param {boolean} config.debug - Whether to run in debug mode
 * @param {boolean} config.runloop - Whether to run the full travel loop
 * @returns {Promise<Object>} Result object with browser instance and other data
 */
export async function satelliteStopMotion(config) {
  try {
    // Load and process dataset
    const loadJSON = (filename) => JSON.parse(fs.readFileSync(path.join(process.cwd(), filename), "utf8"));
    
    const jsonData = loadJSON(config.dataset.file);
    const accesor = config.dataset.accesor;
    let coordinatesArray = _get(jsonData, accesor);
    if (accesor === '') coordinatesArray = jsonData;
    
    const isDebug = config.debug;
    let headlessmode = config.headless;
    if (headlessmode === true) headlessmode = "new";
    if (isDebug) headlessmode = false;

    const zoom = config.map.zoom;
    const STEP_SIZE = config.map.step;
    const jpgQuality = config.image.jpgQuality;
    const frameWidth = config.image.width;
    const frameHeight = config.image.height;
    const imageFolder = config.image.folder || ''; // Optional subfolder
    const urlBase = "http://localhost:3300/";
    const urlDebug = "http://localhost:3300?debug=true";
    const imageName = config.image.name;
    const url = isDebug ? urlDebug : urlBase;
    const runloop = config.runloop;

    // Setup frontend files
    createFrontConfigFile(config.map.mapbox, fs);
    copyDatafileToFrontend(path.join(process.cwd(), config.dataset.file), 'dataset.json', fs);

    if (runloop) {
      return await travel(coordinatesArray, {
        headlessmode,
        zoom,
        STEP_SIZE,
        jpgQuality,
        frameWidth,
        frameHeight,
        url,
        imageName,
        imageFolder
      });
    } else {
      return await initWithoutTravel(coordinatesArray, {
        headlessmode,
        zoom,
        STEP_SIZE,
        frameWidth,
        frameHeight,
        url
      });
    }
  } catch (error) {
    console.error('Error in satelliteStopMotion:', error);
    throw error;
  }
}

/**
 * Travel function - captures screenshots along the route
 * @param {Array} coordinatesArray - Array of coordinate points
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Result object
 */
async function travel(coordinatesArray, options) {
  const {
    headlessmode,
    zoom,
    STEP_SIZE,
    jpgQuality,
    frameWidth,
    frameHeight,
    url,
    imageName,
    imageFolder
  } = options;

  // Create image directory structure
  const imagesDir = imageFolder ? `images/${imageFolder}` : 'images';
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`📁 Created directory: ${imagesDir}`);
  }

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: headlessmode });

  const page = await browser.newPage();

  // Set screen size
  await page.setViewport({ width: frameWidth, height: frameHeight });

  // Navigate the page to a URL
  await page.goto(url);

  // Capture a screenshot after the page is loaded
  await page.waitForSelector(".loaded");

  const POI = coordinatesArray;
  let lastUsedPoint = POI[0];
  /* screenshot at first point */
  const [lon0, lat0] = lastUsedPoint;
  const imagesInOrder = [];
  
  await page.evaluate(
    (lon0, lat0, zoom) => {
      flyTo(lon0, lat0, zoom);
    },
    lon0,
    lat0,
    zoom
  );
  
  await page.waitForSelector(".loaded");
  const element0 = await page.$(".loaded");
  await element0.screenshot({
    path: `${imagesDir}/${imageName}_${padNumber(0)}-${padNumber(0)}-${slugify(lon0)}-${slugify(lat0)}.jpg`,
    quality: jpgQuality,
    type: "jpeg",
  });
  imagesInOrder.push(`${imagesDir}/${imageName}_${padNumber(0)}-${padNumber(0)}-${slugify(lon0)}-${slugify(lat0)}.jpg`);
  
  // Fly to each POI and take a screenshot
  const nitems = POI.length - 1;
  for (let i = 1; i < POI.length; i++) {
    if (
      Math.sqrt(
        Math.pow(POI[i][0] - lastUsedPoint[0], 2) +
          Math.pow(POI[i][1] - lastUsedPoint[1], 2)
      ) < STEP_SIZE
    ) {
      continue;
    }
    const points = generatePointsWithStep(lastUsedPoint, POI[i], STEP_SIZE); // Generate n points
    lastUsedPoint = points[points.length - 1];
    for (let j = 0; j < points.length; j++) {
      const [lon, lat] = points[j];
      await page.evaluate(
        (lon, lat, zoom) => {
          flyTo(lon, lat, zoom);
        },
        lon,
        lat,
        zoom
      );
      // await page.waitForTimeout(1000); // Wait for the map to load
      await page.waitForSelector(".loaded");
      const element = await page.$(".loaded");
      await element.screenshot({
        path: `${imagesDir}/${imageName}_${padNumber(i)}-${padNumber(j)}-${slugify(
          lon
        )}-${slugify(lat)}.jpg`,
        quality: jpgQuality,
        type: "jpeg",
      });
      imagesInOrder.push(`${imagesDir}/${imageName}_${padNumber(i)}-${padNumber(j)}-${slugify(lon)}-${slugify(lat)}.jpg`);
      console.log(`Screenshot ${lon} ,${lat} saved`);
    }
  }
  
  await browser.close();
  
  return {
    success: true,
    imagesCreated: imagesInOrder.length,
    imagesList: imagesInOrder,
    browser: null // Browser is closed
  };
}

/**
 * Initialize without travel - sets up the map for debugging
 * @param {Array} coordinatesArray - Array of coordinate points
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Result object with browser instance
 */
async function initWithoutTravel(coordinatesArray, options) {
  const {
    headlessmode,
    zoom,
    STEP_SIZE,
    frameWidth,
    frameHeight,
    url
  } = options;

  const POI = coordinatesArray;
  const points = generateFullArrayPoints(POI, STEP_SIZE);
  const geoJsonLine = createGeoJsonLineFromPoints(points);
  writeDatafileToFrontend(geoJsonLine, "dataset_points.json", fs);

  let lastUsedPoint = POI[0];
  /* screenshot at first point */
  const [lon0, lat0] = lastUsedPoint;

  const browser = await puppeteer.launch({ headless: headlessmode });

  const page = await browser.newPage();

  // Set screen size
  await page.setViewport({ width: frameWidth, height: frameHeight });

  // Navigate the page to a URL
  await page.goto(url);

  // Capture a screenshot after the page is loaded
  await page.waitForSelector(".loaded");

  await page.evaluate(
    (lon0, lat0, zoom) => {
      flyTo(lon0, lat0, zoom);
    },
    lon0,
    lat0,
    zoom
  );
  
  return {
    success: true,
    browser: browser,
    page: page,
    coordinates: coordinatesArray,
    points: points
  };
}

/**
 * Start the Express server
 * @param {number} port - Port number (default: 3300)
 * @returns {Object} Express app instance
 */
export function startServer(port = 3300) {
  const app = express();
  app.use(express.static("./frontend/dist"));
  const server = app.listen(port, () => console.log(`Server ready on port ${port}`));
  return { app, server };
}

/**
 * Helper function to pad numbers with zeros
 * @param {number} number - Number to pad
 * @returns {string} Padded number string
 */
function padNumber(number) {
  return number.toString().padStart(4, "0");
}
