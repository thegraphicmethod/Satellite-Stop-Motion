import puppeteer from "puppeteer";
import JSON from "json5";
import fs from "fs";
import config from "config";
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
} from "./src/utils.js";

const loadJSON = (filename) =>

  JSON.parse(fs.readFileSync(path.join(process.cwd(), filename), "utf8"))

const jsonData = loadJSON(config.get("dataset.file"));
const accesor = config.get("dataset.accesor");
let coordinatesArray = _get(jsonData, accesor);
if (accesor == '') coordinatesArray = jsonData;
const isDebug = config.get("debug");

let headlessmode = config.get("headless");
if (headlessmode == true) headlessmode = "new";
if( isDebug ) headlessmode = false;

const zoom = config.get("map.zoom"); 
const STEP_SIZE = config.get("map.step"); // tamaño del salto. 0.001 es aproximadamente 100 metros por el ecuador
const jpgQuality = config.get("image.jpgQuality"); // calidad de la imagen jpg
const frameWidth = config.get("image.width"); // ancho de la imagen
const frameHeight = config.get("image.height"); // alto de la imagen
const urlBase = "http://localhost:3300/";
const urlDebug = "http://localhost:3300?debug=true";
const imageName = config.get("image.name"); // nombre de la imagen
const url = isDebug ? urlDebug : urlBase;
const runloop = config.get("runloop");
createFrontConfigFile(config.get("map.mapbox"), fs);
copyDatafileToFrontend(path.join(process.cwd(), config.get("dataset.file")), 'dataset.json', fs);

// esto de arriba es el archivo geojson. Solo vale que sea de tipo línea ya que leeremos las coordenadas como un array
// cargando: features[0].geometry.coordinatesArray

// Latitud: 25.15, Longitud: -12.3667
// A esta distancia  una decima de grado de cambio en la latitud son aproximadamente 11.12km
// https://www.meridianoutpost.com/resources/etools/calculators/calculator-latitude-longitude-distance.php
// una decima de grado de longitud son aproximadamente  9.85km

async function travel() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: headlessmode }); //'new' or false con esto ocultas o muestras la ventana del navegador

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
    (lon0, lat0,zoom) => {
      flyTo(lon0, lat0, zoom);
    },
    lon0,
    lat0,
    zoom
  );
  await page.waitForSelector(".loaded");
  const element0 = await page.$(".loaded");
  await element0.screenshot({
    path: `images/${imageName}_${padNumber(0)}-${padNumber(0)}-${slugify(lon0)}-${slugify(lat0)}.jpg`,
    quality: jpgQuality,
    type: "jpeg",
  });
  imagesInOrder.push(`images/${imageName}_${padNumber(0)}-${padNumber(0)}-${slugify(lon0)}-${slugify(lat0)}.jpg`);
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
        (lon, lat,zoom) => {
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
        path: `images/${imageName}_${padNumber(i)}-${padNumber(j)}-${slugify(
          lon
        )}-${slugify(lat)}.jpg`,
        quality: jpgQuality,
        type: "jpeg",
      });
      imagesInOrder.push(`images/${imageName}_${padNumber(i)}-${padNumber(j)}-${slugify(lon)}-${slugify(lat)}.jpg`);
      console.log(`Screenshot ${lon} ,${lat} $saved`);
    }
  }
  await browser.close();
}

async function initWithoutTravel() {
  // Launch the browser and open a new blank page
  
  const POI = coordinatesArray;
  const points = generateFullArrayPoints(POI, STEP_SIZE);
  const geoJsonLine = createGeoJsonLineFromPoints(points);
  writeDatafileToFrontend(geoJsonLine, "dataset_points.json", fs);

  let lastUsedPoint = POI[0];
  /* screenshot at first point */
  const [lon0, lat0] = lastUsedPoint;

  const browser = await puppeteer.launch({ headless: headlessmode }); //'new' or false con esto ocultas o muestras la ventana del navegador

  const page = await browser.newPage();

  // Set screen size
  await page.setViewport({ width: frameWidth, height: frameHeight });

  // Navigate the page to a URL
  await page.goto(url);

  // Capture a screenshot after the page is loaded

  await page.waitForSelector(".loaded");


  await page.evaluate(
    (lon0, lat0,zoom) => {
      flyTo(lon0, lat0, zoom);
    },
    lon0,
    lat0,
    zoom
  );
  return browser;
}

function padNumber(number) {
  return number.toString().padStart(4, "0");
}

function startServer() {
  const app = express();
  app.use(express.static("./frontend/dist"));
  app.listen(3300, () => console.log("Server ready"));
}
startServer();
if (runloop) travel();
else {
  initWithoutTravel();
}
