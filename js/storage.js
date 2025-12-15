// ==================================================
// LOCAL STORAGE MANAGEMENT
// ==================================================

const STORAGE_KEYS = {
    HISTORY: 'prompt_history',
    FAVORITES: 'prompt_favorites',
    SETTINGS: 'app_settings',
    RECENT_MODELS: 'recent_models',
    DRAFTS: 'prompt_drafts'
};

/**
 * Save prompt to history
 */
export function saveToHistory(prompt, results, technique = null) {
    const history = getHistory();

    const entry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        prompt: prompt,
        technique: technique,
        results: results.map(r => ({
            modelName: r.modelName,
            success: r.success,
            response: r.response?.substring(0, 500), // Truncate for storage
            responseTime: r.responseTime,
            thinking: r.thinking ? r.thinking.substring(0, 200) : null
        })),
        models: results.map(r => r.modelName)
    };

    // Add to beginning of array
    history.unshift(entry);

    // Limit to last 100 entries
    const trimmedHistory = history.slice(0, 100);

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmedHistory));
    return entry;
}

/**
 * Get prompt history
 */
export function getHistory() {
    try {
        const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error reading history:', error);
        return [];
    }
}

/**
 * Clear all history
 */
export function clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    return true;
}

/**
 * Get history entry by ID
 */
export function getHistoryEntry(id) {
    const history = getHistory();
    return history.find(entry => entry.id === id);
}

/**
 * Delete history entry
 */
export function deleteHistoryEntry(id) {
    const history = getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    return true;
}

/**
 * Save prompt to favorites
 */
export function saveToFavorites(prompt, name, technique = null) {
    const favorites = getFavorites();

    const entry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        name: name,
        prompt: prompt,
        technique: technique
    };

    favorites.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return entry;
}

/**
 * Get favorites
 */
export function getFavorites() {
    try {
        const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('Error reading favorites:', error);
        return [];
    }
}

/**
 * Delete favorite
 */
export function deleteFavorite(id) {
    const favorites = getFavorites();
    const filtered = favorites.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
    return true;
}

/**
 * Save app settings
 */
export function saveSettings(settings) {
    const currentSettings = getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    return newSettings;
}

/**
 * Get app settings
 */
export function getSettings() {
    try {
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return settings ? JSON.parse(settings) : getDefaultSettings();
    } catch (error) {
        console.error('Error reading settings:', error);
        return getDefaultSettings();
    }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
    return {
        theme: 'dark',
        autoSave: true,
        showMetrics: true,
        compactMode: false,
        defaultModels: [],
        maxHistoryItems: 100
    };
}

/**
 * Save draft prompt
 */
export function saveDraft(prompt, technique = null) {
    const draft = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        technique: technique
    };
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(draft));
    return draft;
}

/**
 * Get draft prompt
 */
export function getDraft() {
    try {
        const draft = localStorage.getItem(STORAGE_KEYS.DRAFTS);
        return draft ? JSON.parse(draft) : null;
    } catch (error) {
        console.error('Error reading draft:', error);
        return null;
    }
}

/**
 * Clear draft
 */
export function clearDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    return true;
}

/**
 * Save recently used models
 */
export function saveRecentModels(models) {
    localStorage.setItem(STORAGE_KEYS.RECENT_MODELS, JSON.stringify(models));
}

/**
 * Get recently used models
 */
export function getRecentModels() {
    try {
        const models = localStorage.getItem(STORAGE_KEYS.RECENT_MODELS);
        return models ? JSON.parse(models) : [];
    } catch (error) {
        console.error('Error reading recent models:', error);
        return [];
    }
}

/**
 * Export all data
 */
export function exportAllData() {
    const data = {
        history: getHistory(),
        favorites: getFavorites(),
        settings: getSettings(),
        recentModels: getRecentModels(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
    };

    return data;
}

/**
 * Import data
 */
export function importData(data) {
    try {
        if (data.history) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
        }
        if (data.favorites) {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites));
        }
        if (data.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (data.recentModels) {
            localStorage.setItem(STORAGE_KEYS.RECENT_MODELS, JSON.stringify(data.recentModels));
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Clear all data
 */
export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    return true;
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
    const stats = {
        historyCount: getHistory().length,
        favoritesCount: getFavorites().length,
        hasDraft: getDraft() !== null,
        recentModelsCount: getRecentModels().length
    };

    // Calculate approximate storage size
    let totalSize = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
            totalSize += item.length * 2; // Rough estimate in bytes
        }
    });

    stats.storageSize = formatBytes(totalSize);
    stats.storageSizeBytes = totalSize;

    return stats;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default {
    saveToHistory,
    getHistory,
    clearHistory,
    getHistoryEntry,
    deleteHistoryEntry,
    saveToFavorites,
    getFavorites,
    deleteFavorite,
    saveSettings,
    getSettings,
    saveDraft,
    getDraft,
    clearDraft,
    saveRecentModels,
    getRecentModels,
    exportAllData,
    importData,
    clearAllData,
    getStorageStats
};
