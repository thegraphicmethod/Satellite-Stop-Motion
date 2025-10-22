<script setup>
// init a map instance
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl"; // or "const mapboxgl = require('mapbox-gl');"
import { onMounted, ref } from "vue";
import {json} from "d3-fetch"
const mapcontainer = ref(null);
let isTest = ref(false);
// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com

const INITZOOM = 16;
 onMounted(async () => {
  console.log(json)
  const config = await json("/config.json"); // pre-existing
  
  // Load visualization configuration
  let visualizationConfig = null;
  try {
    visualizationConfig = await json("/visualization.json");
  } catch (error) {
    console.log("No visualization config found, using defaults");
    visualizationConfig = { showPath: false, showCurrentPoint: false, coordinates: [] };
  }

  mapboxgl.accessToken =
    config.mapboxToken;

  window.map = new mapboxgl.Map({
    container: "map", // container ID
    style: config.mapboxStyle, // style URL
    center: [  -0.4706550535457927,
            38.70919986718257], // starting position [lng, lat]
    zoom: INITZOOM, // starting zoom
    attributionControl: false,
  });

  window.map.on("zoom", () => {
    const currentZoom = window.map.getZoom();
    zoomlevel.value = currentZoom;
  });

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const debug = urlParams.get("debug");
  isTest.value = debug === "true"? true : false;  
  if (isTest.value) {
    const nav = new mapboxgl.NavigationControl();
    window.map.addControl(nav, "top-left");
    window.map.addControl(new mapboxgl.ScaleControl(), "bottom-right");
    /*** geojson */

    // add geojson layer
    window.map.on("load", () => {
      window.map.addSource("datasetOriginal", {
        type: "geojson",
        data: "/dataset.json",
        tolerance: 0
      });

      window.map.addSource("datasetPoints", {
        type: "geojson",
        data: "/dataset_points.json",
        tolerance: 0
      });

      window.map.addLayer({
        id: "dataset-layer-line",
        type: "line",
        source: "datasetOriginal",
        paint: {
          "line-color": "#000",
          "line-opacity": 1,
          "line-width": 1.5,
        },
      }); 
       window.map.addLayer({
        id: "dataset-layer",
        type: "circle",
        source: "datasetPoints",
        paint: {
          "circle-color": "#000",
          "circle-opacity": 1,
          "circle-radius": 3,
        },
      });
    });
  }
  /*** geojson */

  window.map.on("load", function () {
    // Add visualization layers if enabled
    if (visualizationConfig.showPath && visualizationConfig.coordinates.length > 0) {
      // Create GeoJSON for the path
      console.log('visualizationConfig.coordinates ---- DEBUG ---');
      const pathGeoJSON = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: visualizationConfig.coordinates
        }
      };

      // Add path source and layer
      window.map.addSource("route-path", {
        type: "geojson",
        data: pathGeoJSON
      });

      window.map.addLayer({
        id: "route-path-layer",
        type: "line",
        source: "route-path",
        paint: {
          "line-color": "#ff0000",
          "line-opacity": 0.8,
          "line-width": 3,
        },
      });
    }

    if (visualizationConfig.showCurrentPoint) {
      // Add current point source (will be updated by flyTo function)
      window.map.addSource("current-point", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      });

      window.map.addLayer({
        id: "current-point-layer",
        type: "circle",
        source: "current-point",
        paint: {
          "circle-color": "#00ff00",
          "circle-opacity": 1,
          "circle-radius": 8,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }

    // add class to body to remove loading spinner
    document.querySelector("body").classList.add("loaded");
  });

  document.querySelector(".mapboxgl-ctrl-bottom-left").remove();
});
//fin mounted

const zoomlevel = ref(INITZOOM);

// remove element .mapboxgl-ctrl-bottom-left from body:

window.flyTo = function (lng, lat, zoom, showCurrentPoint = false) {
  // map.flyTo({
  //   center: [lng, lat],
  //   zoom: zoom
  // });
  document.querySelector("body").classList.remove("loaded");
  window.map.setZoom(zoom);
  window.map.setCenter([lng, lat]);
  
  // Update current point if enabled
  if (showCurrentPoint && window.map.getSource("current-point")) {
    window.map.getSource("current-point").setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [lng, lat]
      }
    });
  }
  
  window.map.once("idle", async (e) => {
    document.querySelector("body").classList.add("loaded");
  });
};
</script>

<template>
  <div id="map" style="width: 100vw; height: 100vh" ref="mapcontainer">  </div>
    <div
      style="
        position: absolute;
        top: 20px;
        right: 60px;
        z-index: 10;
        background-color: black;
        color: #ccc;
        padding: 0.5rem;
        font-size: 20px;
      "
      v-if="isTest"
    >
      zoom: {{ zoomlevel.toFixed(2) }}
    </div>

</template>

<style>
body {
  overflow: hidden;
}
</style>
