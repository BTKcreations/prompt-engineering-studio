// ==================================================
// OLLAMA API INTEGRATION
// ==================================================

const OLLAMA_BASE_URL = 'http://localhost:11434';

/**
 * Check if Ollama service is running
 */
export async function checkConnection() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/version`);
        if (response.ok) {
            const data = await response.json();
            return { success: true, version: data.version };
        }
        return { success: false, error: 'Service unavailable' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get list of available models
 */
export async function getModels() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        return {
            success: true,
            models: data.models.map(model => ({
                name: model.name,
                model: model.model,
                size: model.size,
                modified_at: model.modified_at,
                digest: model.digest,
                details: model.details,
                remote_model: model.remote_model || null,
                remote_host: model.remote_host || null,
                isCloud: !!model.remote_host
            }))
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Generate response from a model (non-streaming)
 */
export async function generateResponse(modelName, prompt, options = {}) {
    try {
        const requestBody = {
            model: modelName,
            prompt: prompt,
            stream: false,
            ...options
        };

        const startTime = performance.now();

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }

        const data = await response.json();
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2); // in seconds

        return {
            success: true,
            response: data.response,
            thinking: data.thinking || null,
            model: data.model,
            created_at: data.created_at,
            done: data.done,
            context: data.context,
            total_duration: data.total_duration,
            load_duration: data.load_duration,
            prompt_eval_count: data.prompt_eval_count,
            prompt_eval_duration: data.prompt_eval_duration,
            eval_count: data.eval_count,
            eval_duration: data.eval_duration,
            duration: duration, // calculated client-side
            tokens_per_second: data.eval_count && data.eval_duration
                ? (data.eval_count / (data.eval_duration / 1e9)).toFixed(2)
                : null
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate response with streaming (for real-time updates)
 */
export async function streamResponse(modelName, prompt, onChunk, options = {}) {
    try {
        const requestBody = {
            model: modelName,
            prompt: prompt,
            stream: true,
            ...options
        };

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let metrics = {};

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);

                    if (data.response) {
                        fullResponse += data.response;
                        onChunk({
                            type: 'content',
                            content: data.response,
                            fullContent: fullResponse
                        });
                    }

                    if (data.done) {
                        metrics = {
                            total_duration: data.total_duration,
                            load_duration: data.load_duration,
                            prompt_eval_count: data.prompt_eval_count,
                            eval_count: data.eval_count,
                            eval_duration: data.eval_duration
                        };
                        onChunk({
                            type: 'done',
                            metrics: metrics,
                            fullContent: fullResponse
                        });
                    }
                } catch (e) {
                    console.error('Error parsing chunk:', e);
                }
            }
        }

        return {
            success: true,
            response: fullResponse,
            ...metrics
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get detailed information about a specific model
 */
export async function getModelInfo(modelName) {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: modelName })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch model info');
        }

        const data = await response.json();
        return { success: true, info: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Pull/download a model from Ollama registry
 */
export async function pullModel(modelName, onProgress) {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: modelName })
        });

        if (!response.ok) {
            throw new Error('Failed to pull model');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);

                    if (onProgress) {
                        onProgress({
                            status: data.status,
                            digest: data.digest,
                            total: data.total,
                            completed: data.completed,
                            progress: data.total ? ((data.completed / data.total) * 100).toFixed(1) : 0
                        });
                    }

                    // Check if pull is complete
                    if (data.status && data.status.includes('success')) {
                        return { success: true, modelName };
                    }
                } catch (e) {
                    console.error('Error parsing pull progress:', e);
                }
            }
        }

        return { success: true, modelName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete a model
 */
export async function deleteModel(modelName) {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: modelName })
        });

        if (!response.ok) {
            throw new Error('Failed to delete model');
        }

        return { success: true, modelName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cancel a running generation (if possible)
 */
export function cancelGeneration(controller) {
    if (controller) {
        controller.abort();
    }
}

export default {
    checkConnection,
    getModels,
    generateResponse,
    streamResponse,
    getModelInfo,
    pullModel,
    deleteModel,
    cancelGeneration
};
