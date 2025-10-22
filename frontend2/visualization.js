// visualization.js - Visualization features for paths and points
export class VisualizationManager {
    constructor(map) {
        this.map = map;
        this.isDebugMode = false;
    }

    setDebugMode(isDebug) {
        this.isDebugMode = isDebug;
    }

    addDebugLayers() {
        if (!this.isDebugMode) return;

        // Add dataset layers for debug mode
        this.map.addSource("datasetOriginal", {
            type: "geojson",
            data: "/dataset.json",
            tolerance: 0
        });

        this.map.addSource("datasetPoints", {
            type: "geojson",
            data: "/dataset_points.json",
            tolerance: 0
        });

        // Add line layer
        this.map.addLayer({
            id: "dataset-layer-line",
            type: "line",
            source: "datasetOriginal",
            paint: {
                "line-color": "#000",
                "line-opacity": 1,
                "line-width": 1.5,
            },
        });

        // Add points layer
        this.map.addLayer({
            id: "dataset-layer",
            type: "circle",
            source: "datasetPoints",
            paint: {
                "circle-color": "#000",
                "circle-opacity": 1,
                "circle-radius": 3,
            },
        });
    }

    addPathVisualization(coordinates) {
        if (!coordinates || coordinates.length === 0) return;

        console.log('Adding path visualization with coordinates:', coordinates);

        const pathGeoJSON = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: coordinates
            }
        };

        // Add path source and layer
        this.map.addSource("route-path", {
            type: "geojson",
            data: pathGeoJSON
        });

        this.map.addLayer({
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

    addCurrentPointVisualization() {
        // Add current point source (will be updated by flyTo function)
        this.map.addSource("current-point", {
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

        this.map.addLayer({
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

    updateCurrentPoint(lng, lat) {
        if (this.map.getSource("current-point")) {
            this.map.getSource("current-point").setData({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            });
        }
    }

    setupVisualization(visualizationConfig) {
        // Add path visualization if enabled
        if (visualizationConfig.showPath && visualizationConfig.coordinates.length > 0) {
            this.addPathVisualization(visualizationConfig.coordinates);
        }

        // Add current point visualization if enabled
        if (visualizationConfig.showCurrentPoint) {
            this.addCurrentPointVisualization();
        }
    }
}
