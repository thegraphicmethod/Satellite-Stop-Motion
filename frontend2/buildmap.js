// buildmap.js - Main application logic and map initialization
import { ConfigManager } from './config.js';
import { VisualizationManager } from './visualization.js';

class MapApplication {
    constructor() {
        this.map = null;
        this.configManager = new ConfigManager();
        this.visualizationManager = null;
        this.zoomLevel = 16;
        this.isDebugMode = false;
        this.INITZOOM = 16;
    }

    async initialize() {
        try {
            // Load configurations
            await this.configManager.loadConfig();
            await this.configManager.loadVisualizationConfig();

            // Check debug mode
            this.isDebugMode = this.configManager.isDebugMode();

            // Initialize mapbox
            this.initializeMapbox();

            // Create map instance
            this.createMap();

            // Setup visualization manager
            this.visualizationManager = new VisualizationManager(this.map);
            this.visualizationManager.setDebugMode(this.isDebugMode);

            // Setup event listeners
            this.setupEventListeners();

            // Setup map load handler
            this.setupMapLoadHandler();

            // Remove attribution
            this.removeAttribution();

        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }

    initializeMapbox() {
        mapboxgl.accessToken = this.configManager.getMapboxToken();
    }

    createMap() {
        this.map = new mapboxgl.Map({
            container: "map",
            style: this.configManager.getMapboxStyle(),
            center: [-0.4706550535457927, 38.70919986718257], // starting position [lng, lat]
            zoom: this.INITZOOM,
            attributionControl: false,
        });

        // Make map globally accessible
        window.map = this.map;
    }

    setupEventListeners() {
        // Zoom level tracking
        this.map.on("zoom", () => {
            this.zoomLevel = this.map.getZoom();
            this.updateZoomDisplay();
        });
    }

    setupMapLoadHandler() {
        this.map.on("load", () => {
            // Add debug layers if in debug mode
            if (this.isDebugMode) {
                this.addDebugControls();
                this.visualizationManager.addDebugLayers();
            }

            // Setup visualization
            const visualizationConfig = this.configManager.getVisualizationConfig();
            this.visualizationManager.setupVisualization(visualizationConfig);

            // Hide loading spinner
            this.hideLoadingSpinner();
        });
    }

    addDebugControls() {
        // Add navigation control
        const nav = new mapboxgl.NavigationControl();
        this.map.addControl(nav, "top-left");

        // Add scale control
        this.map.addControl(new mapboxgl.ScaleControl(), "bottom-right");

        // Show zoom display
        this.showZoomDisplay();
    }

    showZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay) {
            zoomDisplay.style.display = 'block';
        }
    }

    updateZoomDisplay() {
        const zoomLevelElement = document.getElementById('zoom-level');
        if (zoomLevelElement) {
            zoomLevelElement.textContent = this.zoomLevel.toFixed(2);
        }
    }

    hideLoadingSpinner() {
        document.querySelector("body").classList.add("loaded");
    }

    removeAttribution() {
        // Remove attribution control
        const attributionElement = document.querySelector(".mapboxgl-ctrl-bottom-left");
        if (attributionElement) {
            attributionElement.remove();
        }
    }

    // Global flyTo function (maintains compatibility with original Vue app)
    flyTo(lng, lat, zoom, showCurrentPoint = false) {
        // Hide loading spinner during transition
        document.querySelector("body").classList.remove("loaded");

        // Update map position and zoom
        this.map.setZoom(zoom);
        this.map.setCenter([lng, lat]);

        // Update current point if enabled
        if (showCurrentPoint && this.visualizationManager) {
            this.visualizationManager.updateCurrentPoint(lng, lat);
        }

        // Show loading spinner when map is idle
        this.map.once("idle", () => {
            document.querySelector("body").classList.add("loaded");
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new MapApplication();
    await app.initialize();

    // Make flyTo function globally accessible (for compatibility)
    window.flyTo = (lng, lat, zoom, showCurrentPoint = false) => {
        app.flyTo(lng, lat, zoom, showCurrentPoint);
    };
});
