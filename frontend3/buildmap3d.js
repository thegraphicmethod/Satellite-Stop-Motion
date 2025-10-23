// buildmap3d.js - 3D Map application with FreeCamera API and path animation
import { ConfigManager } from './config.js';

class Map3DApplication {
    constructor() {
        this.map = null;
        this.configManager = new ConfigManager();
        this.pathCoordinates = [];
        this.isAnimating = false;
        this.animationId = null;
        this.animationDuration = 60000; // 60 seconds default
        this.cameraAltitude = 2000; // meters above ground
        this.startTime = null;
        this.cameraDistance = 0.008; // Distance behind target in degrees
        this.cameraHeight = 1700; // Height above ground in meters
        this.cameraRoute = []; // Pre-calculated camera positions
        this.smoothCameraPosition = null; // Current smoothed camera position
        this.smoothCameraTarget = null; // Current smoothed camera target
        this.cameraSmoothingFactor = 0.1; // How quickly camera catches up (0.1 = smooth, 1.0 = instant)
        
        // Animation controls
        this.startButton = null;
        this.stopButton = null;
        this.resetButton = null;
        this.speedSlider = null;
        this.speedValue = null;
    }

    async initialize() {
        try {
            // Load configurations
            await this.configManager.loadConfig();
            await this.configManager.loadVisualizationConfig();

            // Initialize mapbox
            this.initializeMapbox();

            // Create 3D map instance
            this.create3DMap();

            // Setup controls
            this.setupControls();

            // Setup map load handler
            this.setupMapLoadHandler();

            // Load path data
            await this.loadPathData();

        } catch (error) {
            console.error('Failed to initialize 3D application:', error);
        }
    }

    initializeMapbox() {
        mapboxgl.accessToken = this.configManager.getMapboxToken();
    }

    create3DMap() {
        this.map = new mapboxgl.Map({
          container: "map",
          style: "mapbox://styles/mapbox/standard-satellite", // 3D-friendly style
          center: [-0.4706550535457927, 38.70919986718257], // starting position
          zoom: 11,
          pitch: 65, // 3D perspective
          bearing: -180, // Camera angle
          interactive: true, // Allow user interaction
        });

        // Make map globally accessible
        window.map = this.map;
    }

    setupControls() {
        this.startButton = document.getElementById('start-animation');
        this.stopButton = document.getElementById('stop-animation');
        this.resetButton = document.getElementById('reset-camera');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedValue = document.getElementById('speed-value');

        // Event listeners
        this.startButton.addEventListener('click', () => this.startAnimation());
        this.stopButton.addEventListener('click', () => this.stopAnimation());
        this.resetButton.addEventListener('click', () => this.resetCamera());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animationDuration = parseInt(e.target.value) * 1000; // Convert to milliseconds
            this.speedValue.textContent = e.target.value + 's';
        });
    }

    async loadPathData() {
        try {
            const visualizationConfig = this.configManager.getVisualizationConfig();
            if (visualizationConfig && visualizationConfig.coordinates) {
                this.pathCoordinates = visualizationConfig.coordinates;
                console.log('Loaded path with', this.pathCoordinates.length, 'coordinates');
                
                // Pre-calculate camera route for smooth drone following
                this.calculateCameraRoute();
            } else {
                console.warn('No path coordinates found in visualization config');
            }
        } catch (error) {
            console.error('Failed to load path data:', error);
        }
    }

    calculateCameraRoute() {
        if (this.pathCoordinates.length < 2) return;

        console.log('Calculating camera route...');
        this.cameraRoute = [];

        // Create a line from the path coordinates
        const pathLine = turf.lineString(this.pathCoordinates);
        const pathLength = turf.lineDistance(pathLine, { units: 'kilometers' });
        
        // Sample points along the path for smooth camera movement
        const sampleCount = Math.max(100, this.pathCoordinates.length * 2);
        
        for (let i = 0; i <= sampleCount; i++) {
            const distance = (i / sampleCount) * pathLength;
            const targetPoint = turf.along(pathLine, distance, { units: 'kilometers' });
            
            // Calculate camera position behind the target
            const cameraPosition = this.calculateCameraPositionBehindTarget(targetPoint, pathLine, distance, pathLength);
            
            this.cameraRoute.push({
                target: targetPoint.geometry.coordinates,
                camera: cameraPosition,
                distance: distance
            });
        }
        
        console.log(`Camera route calculated with ${this.cameraRoute.length} points`);
    }

    calculateCameraPositionBehindTarget(targetPoint, pathLine, currentDistance, totalLength) {
        // Look ahead to determine direction
        const lookAheadDistance = Math.min(0.1, totalLength * 0.05); // 5% of total path or 100m
        const futureDistance = Math.min(totalLength, currentDistance + lookAheadDistance);
        const futurePoint = turf.along(pathLine, futureDistance, { units: 'kilometers' });
        
        // Calculate bearing from target to future point
        const bearing = turf.bearing(targetPoint, futurePoint);
        
        // Calculate camera position behind target
        const cameraDistanceKm = this.cameraDistance * 111; // Convert degrees to km (rough approximation)
        const cameraPoint = turf.destination(targetPoint, cameraDistanceKm, bearing + 180, { units: 'kilometers' });
        
        return cameraPoint.geometry.coordinates;
    }

    setupMapLoadHandler() {
        this.map.on('style.load', () => {
            // Add terrain and sky for 3D effect
            this.addTerrainAndSky();
        });

        this.map.on('load', () => {
            // Add path visualization
            this.addPathVisualization();
            
            // Hide loading spinner
            this.hideLoadingSpinner();
        });
    }

    addTerrainAndSky() {
        // Add terrain source
        this.map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });

        // Set terrain with exaggeration for dramatic effect
        this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

        // Add sky layer for atmospheric effect
        this.map.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });
    }

    addPathVisualization() {
        if (this.pathCoordinates.length === 0) return;

        // Create GeoJSON for the path
        const pathGeoJSON = {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': this.pathCoordinates
            }
        };

        // Add path source
        this.map.addSource('trace', {
            type: 'geojson',
            data: pathGeoJSON
        });

        // Add path layer
        this.map.addLayer({
            type: 'line',
            source: 'trace',
            id: 'path-line',
            paint: {
                'line-color': '#ff0000',
                'line-width': 5,
                'line-opacity': 0.8
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });

        // Add moving point source (will be updated during animation)
        this.map.addSource('moving-point', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: this.pathCoordinates[0] || [-0.4706550535457927, 38.70919986718257]
                }
            }
        });

        // Add moving point layer
        this.map.addLayer({
            type: 'circle',
            source: 'moving-point',
            id: 'moving-point-layer',
            paint: {
                'circle-color': '#00ff00',
                'circle-opacity': 1,
                'circle-radius': 12,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3,
                'circle-stroke-opacity': 1
            }
        });

        console.log('Path visualization and moving point added');
    }

    startAnimation() {
        if (this.isAnimating || this.pathCoordinates.length === 0) return;

        this.isAnimating = true;
        this.startTime = null;
        
        // Update button states
        this.startButton.disabled = true;
        this.stopButton.disabled = false;

        if (this.cameraRoute.length === 0) {
            console.error('Camera route not calculated');
            return;
        }

        console.log('Starting drone animation with', this.cameraRoute.length, 'camera positions');

        const animate = (time) => {
            if (!this.startTime) this.startTime = time;
            
            // Calculate animation phase (0 to 1)
            const phase = (time - this.startTime) / this.animationDuration;

            if (phase > 1) {
                // Animation complete
                this.stopAnimation();
                return;
            }

            // Smooth interpolation between route points
            const interpolatedPositions = this.getInterpolatedPositions(phase);
            
            // Update the moving point visualization
            this.updateMovingPoint(interpolatedPositions.target[0], interpolatedPositions.target[1]);

            // Update camera position with smooth movement
            this.updateCameraPositionSmooth(
                interpolatedPositions.camera[0], 
                interpolatedPositions.camera[1], 
                interpolatedPositions.target[0], 
                interpolatedPositions.target[1]
            );

            // Continue animation
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
        console.log('Animation started');
    }

    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Update button states
        this.startButton.disabled = false;
        this.stopButton.disabled = true;

        console.log('Animation stopped');
    }

    getInterpolatedPositions(phase) {
        // Calculate exact position in the route array
        const exactIndex = phase * (this.cameraRoute.length - 1);
        const lowerIndex = Math.floor(exactIndex);
        const upperIndex = Math.min(lowerIndex + 1, this.cameraRoute.length - 1);
        const interpolationFactor = exactIndex - lowerIndex;

        // Get the two points to interpolate between
        const lowerPoint = this.cameraRoute[lowerIndex];
        const upperPoint = this.cameraRoute[upperIndex];

        // Linear interpolation for both target and camera positions
        const interpolatedTarget = this.interpolateCoordinates(
            lowerPoint.target, 
            upperPoint.target, 
            interpolationFactor
        );

        const interpolatedCamera = this.interpolateCoordinates(
            lowerPoint.camera, 
            upperPoint.camera, 
            interpolationFactor
        );

        return {
            target: interpolatedTarget,
            camera: interpolatedCamera
        };
    }

    interpolateCoordinates(point1, point2, factor) {
        // Linear interpolation between two coordinate points
        return [
            point1[0] + (point2[0] - point1[0]) * factor,
            point1[1] + (point2[1] - point1[1]) * factor
        ];
    }

    updateMovingPoint(lng, lat) {
        // Update the moving point visualization
        if (this.map.getSource('moving-point')) {
            this.map.getSource('moving-point').setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                }
            });
        }
    }

    updateCameraPositionSmooth(targetCameraLng, targetCameraLat, targetLng, targetLat) {
        const camera = this.map.getFreeCameraOptions();

        // Initialize smooth positions if not set
        if (!this.smoothCameraPosition) {
            this.smoothCameraPosition = [targetCameraLng, targetCameraLat];
            this.smoothCameraTarget = [targetLng, targetLat];
        }

        // Smooth camera position using exponential smoothing
        this.smoothCameraPosition[0] += (targetCameraLng - this.smoothCameraPosition[0]) * this.cameraSmoothingFactor;
        this.smoothCameraPosition[1] += (targetCameraLat - this.smoothCameraPosition[1]) * this.cameraSmoothingFactor;

        // Smooth camera target (what camera looks at) - this is the key for smooth movement
        this.smoothCameraTarget[0] += (targetLng - this.smoothCameraTarget[0]) * this.cameraSmoothingFactor;
        this.smoothCameraTarget[1] += (targetLat - this.smoothCameraTarget[1]) * this.cameraSmoothingFactor;

        // Set camera position with altitude
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
            { lng: this.smoothCameraPosition[0], lat: this.smoothCameraPosition[1] },
            this.cameraHeight
        );

        // Always look at the smoothed target
        camera.lookAtPoint({
            lng: this.smoothCameraTarget[0],
            lat: this.smoothCameraTarget[1]
        });

        // Maintain 3D perspective by setting pitch after lookAtPoint
        camera.pitch = 65; // Keep the 3D tilt

        this.map.setFreeCameraOptions(camera);
    }

    resetCamera() {
        this.stopAnimation();
        
        // Reset smooth positions
        this.smoothCameraPosition = null;
        this.smoothCameraTarget = null;
        
        if (this.cameraRoute.length > 0) {
            // Reset to first position in camera route
            const firstRoutePoint = this.cameraRoute[0];
            this.updateMovingPoint(firstRoutePoint.target[0], firstRoutePoint.target[1]);
            this.updateCameraPositionSmooth(
                firstRoutePoint.camera[0], 
                firstRoutePoint.camera[1], 
                firstRoutePoint.target[0], 
                firstRoutePoint.target[1]
            );
        } else {
            // Fallback to original position
            this.updateMovingPoint(-0.4706550535457927, 38.70919986718257);
            
            const camera = this.map.getFreeCameraOptions();
            camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                { lng: -0.4706550535457927, lat: 38.70919986718257 },
                this.cameraHeight
            );
            
            camera.lookAtPoint({
                lng: -0.4706550535457927,
                lat: 38.70919986718257
            });
            
            camera.pitch = 65;
            this.map.setFreeCameraOptions(camera);
        }
        
        console.log('Camera and moving point reset with smooth movement');
    }

    hideLoadingSpinner() {
        document.querySelector("body").classList.add("loaded");
    }

    // Global flyTo function (maintains compatibility)
    flyTo(lng, lat, zoom, showCurrentPoint = false) {
        this.stopAnimation();
        
        // Hide loading spinner during transition
        document.querySelector("body").classList.remove("loaded");

        // Update map position and zoom
        this.map.setZoom(zoom);
        this.map.setCenter([lng, lat]);

        // Show loading spinner when map is idle
        this.map.once("idle", () => {
            document.querySelector("body").classList.add("loaded");
        });
    }
}

// Initialize 3D application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new Map3DApplication();
    await app.initialize();

    // Make flyTo function globally accessible (for compatibility)
    window.flyTo = (lng, lat, zoom, showCurrentPoint = false) => {
        app.flyTo(lng, lat, zoom, showCurrentPoint);
    };
});
