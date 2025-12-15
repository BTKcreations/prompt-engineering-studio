// ==================================================
// MODEL MANAGEMENT
// ==================================================

import * as API from './api.js';

let availableModels = [];
let selectedModels = [];
let modelStatuses = new Map();

/**
 * Initialize models - fetch from API and set up tracking
 */
export async function initializeModels() {
    const result = await API.getModels();

    if (result.success) {
        availableModels = result.models;
        // Initialize all models as selected
        selectedModels = availableModels.map(m => m.name);

        // Set initial statuses
        availableModels.forEach(model => {
            modelStatuses.set(model.name, {
                online: true,
                lastResponse: null,
                averageResponseTime: null,
                totalRequests: 0,
                successfulRequests: 0
            });
        });

        return { success: true, models: availableModels };
    }

    return result;
}

/**
 * Get all available models
 */
export function getAvailableModels() {
    return availableModels;
}

/**
 * Get selected models
 */
export function getSelectedModels() {
    return selectedModels;
}

/**
 * Toggle model selection
 */
export function toggleModelSelection(modelName) {
    const index = selectedModels.indexOf(modelName);

    if (index > -1) {
        selectedModels.splice(index, 1);
    } else {
        selectedModels.push(modelName);
    }

    return selectedModels;
}

/**
 * Select all models
 */
export function selectAllModels() {
    selectedModels = availableModels.map(m => m.name);
    return selectedModels;
}

/**
 * Deselect all models
 */
export function deselectAllModels() {
    selectedModels = [];
    return selectedModels;
}

/**
 * Check if a model is selected
 */
export function isModelSelected(modelName) {
    return selectedModels.includes(modelName);
}

/**
 * Get model status
 */
export function getModelStatus(modelName) {
    return modelStatuses.get(modelName) || {
        online: false,
        lastResponse: null,
        averageResponseTime: null,
        totalRequests: 0,
        successfulRequests: 0
    };
}

/**
 * Update model status after a request
 */
export function updateModelStatus(modelName, success, responseTime) {
    const status = modelStatuses.get(modelName) || {
        online: true,
        lastResponse: null,
        averageResponseTime: null,
        totalRequests: 0,
        successfulRequests: 0
    };

    status.totalRequests++;
    if (success) {
        status.successfulRequests++;
        status.lastResponse = Date.now();

        // Calculate running average response time
        if (status.averageResponseTime === null) {
            status.averageResponseTime = responseTime;
        } else {
            status.averageResponseTime =
                (status.averageResponseTime * (status.successfulRequests - 1) + responseTime) /
                status.successfulRequests;
        }
    }

    status.online = success;
    modelStatuses.set(modelName, status);

    return status;
}

/**
 * Get model display information
 */
export function getModelDisplayInfo(modelName) {
    const model = availableModels.find(m => m.name === modelName);
    if (!model) return null;

    return {
        name: model.name,
        displayName: model.name.split(':')[0],
        tag: model.name.split(':')[1] || 'latest',
        isCloud: model.isCloud,
        size: formatSize(model.size),
        sizeBytes: model.size,
        family: model.details?.family || 'Unknown',
        parameters: model.details?.parameter_size || 'Unknown',
        quantization: model.details?.quantization_level || 'Unknown',
        modifiedAt: new Date(model.modified_at).toLocaleDateString(),
        remoteModel: model.remote_model,
        remoteHost: model.remote_host
    };
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/**
 * Test all selected models with a prompt
 */
export async function testSelectedModels(prompt, options = {}) {
    const results = [];

    // Create promises for all selected models
    const promises = selectedModels.map(async (modelName) => {
        const startTime = performance.now();
        const result = await API.generateResponse(modelName, prompt, options);
        const endTime = performance.now();
        const responseTime = (endTime - startTime) / 1000; // in seconds

        // Update model status
        updateModelStatus(modelName, result.success, responseTime);

        return {
            modelName,
            ...result,
            responseTime: responseTime.toFixed(2)
        };
    });

    // Execute all requests concurrently
    const responses = await Promise.allSettled(promises);

    // Process results
    responses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
            results.push(response.value);
        } else {
            results.push({
                modelName: selectedModels[index],
                success: false,
                error: response.reason?.message || 'Unknown error'
            });
        }
    });

    return results;
}

/**
 * Get comparison metrics for all models
 */
export function getComparisonMetrics(results) {
    if (!results || results.length === 0) return null;

    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) return null;

    const responseTimes = successfulResults.map(r => parseFloat(r.responseTime));
    const tokenCounts = successfulResults.map(r => r.eval_count || 0);
    const tokensPerSecond = successfulResults.map(r => parseFloat(r.tokens_per_second) || 0);

    return {
        fastestModel: successfulResults[responseTimes.indexOf(Math.min(...responseTimes))].modelName,
        slowestModel: successfulResults[responseTimes.indexOf(Math.max(...responseTimes))].modelName,
        averageResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2),
        totalTokens: tokenCounts.reduce((a, b) => a + b, 0),
        averageTokensPerSecond: (tokensPerSecond.reduce((a, b) => a + b, 0) / tokensPerSecond.length).toFixed(2),
        mostVerboseModel: successfulResults[tokenCounts.indexOf(Math.max(...tokenCounts))].modelName,
        leastVerboseModel: successfulResults[tokenCounts.indexOf(Math.min(...tokenCounts))].modelName
    };
}

/**
 * Get model icon initial
 */
export function getModelIcon(modelName) {
    const name = modelName.toLowerCase();
    if (name.includes('gemini')) return 'G';
    if (name.includes('deepseek')) return 'D';
    if (name.includes('gpt')) return 'G';
    if (name.includes('llama')) return 'L';
    return modelName.charAt(0).toUpperCase();
}

/**
 * Get model color
 */
export function getModelColor(modelName) {
    const name = modelName.toLowerCase();
    if (name.includes('gemini')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (name.includes('deepseek')) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    if (name.includes('gpt')) return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    if (name.includes('llama')) return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

export default {
    initializeModels,
    getAvailableModels,
    getSelectedModels,
    toggleModelSelection,
    selectAllModels,
    deselectAllModels,
    isModelSelected,
    getModelStatus,
    updateModelStatus,
    getModelDisplayInfo,
    testSelectedModels,
    getComparisonMetrics,
    getModelIcon,
    getModelColor
};
