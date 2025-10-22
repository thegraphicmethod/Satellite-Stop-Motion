// config.js - Configuration management and data loading
export class ConfigManager {
    constructor() {
        this.config = null;
        this.visualizationConfig = null;
    }

    async loadConfig() {
        try {
            const response = await fetch('/config.json');
            this.config = await response.json();
            return this.config;
        } catch (error) {
            console.error('Failed to load config:', error);
            throw error;
        }
    }

    async loadVisualizationConfig() {
        try {
            const response = await fetch('/visualization.json');
            this.visualizationConfig = await response.json();
            return this.visualizationConfig;
        } catch (error) {
            console.log("No visualization config found, using defaults");
            this.visualizationConfig = { 
                showPath: false, 
                showCurrentPoint: false, 
                coordinates: [] 
            };
            return this.visualizationConfig;
        }
    }

    getMapboxToken() {
        return this.config?.mapboxToken;
    }

    getMapboxStyle() {
        return this.config?.mapboxStyle;
    }

    getVisualizationConfig() {
        return this.visualizationConfig;
    }

    isDebugMode() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const debug = urlParams.get("debug");
        return debug === "true";
    }
}
