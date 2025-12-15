// ==================================================
// PROMPT ENGINEERING TECHNIQUES & TEMPLATES
// ==================================================

let techniques = [];
let currentTechnique = null;

/**
 * Load prompt engineering techniques from templates.json
 */
export async function loadTechniques() {
    try {
        const response = await fetch('./assets/templates.json');
        if (!response.ok) {
            throw new Error('Failed to load templates');
        }
        const data = await response.json();
        techniques = data.techniques;
        return { success: true, techniques };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all available techniques
 */
export function getTechniques() {
    return techniques;
}

/**
 * Get a specific technique by ID
 */
export function getTechniqueById(id) {
    return techniques.find(t => t.id === id) || null;
}

/**
 * Set current active technique
 */
export function setCurrentTechnique(techniqueId) {
    currentTechnique = getTechniqueById(techniqueId);
    return currentTechnique;
}

/**
 * Get current active technique
 */
export function getCurrentTechnique() {
    return currentTechnique;
}

/**
 * Clear current technique (return to plain prompt mode)
 */
export function clearCurrentTechnique() {
    currentTechnique = null;
}

/**
 * Build prompt from template with variables
 */
export function buildPromptFromTemplate(techniqueId, variables) {
    const technique = getTechniqueById(techniqueId);
    if (!technique) return '';

    let prompt = technique.template;

    // Replace variables in template
    technique.variables.forEach(varName => {
        const value = variables[varName] || '';
        const placeholder = `{{${varName}}}`;
        prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });

    return prompt;
}

/**
 * Extract variables from a technique's template
 */
export function getTemplateVariables(techniqueId) {
    const technique = getTechniqueById(techniqueId);
    if (!technique) return [];

    return technique.variables.map(varName => ({
        name: varName,
        label: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        placeholder: technique.example?.[varName] || `Enter ${varName}...`,
        exampleValue: technique.example?.[varName] || ''
    }));
}

/**
 * Get example prompt for a technique
 */
export function getTechniqueExample(techniqueId) {
    const technique = getTechniqueById(techniqueId);
    if (!technique || !technique.example) return null;

    return buildPromptFromTemplate(techniqueId, technique.example);
}

/**
 * Validate prompt against technique requirements
 */
export function validatePrompt(techniqueId, variables) {
    const technique = getTechniqueById(techniqueId);
    if (!technique) return { valid: false, errors: ['Technique not found'] };

    const errors = [];

    // Check if all required variables are filled
    technique.variables.forEach(varName => {
        if (!variables[varName] || variables[varName].trim() === '') {
            errors.push(`${varName} is required`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get technique categories (for grouping)
 */
export function getTechniqueCategories() {
    return [
        {
            name: 'Basic',
            ids: ['zero-shot', 'few-shot', 'role-based']
        },
        {
            name: 'Advanced Reasoning',
            ids: ['chain-of-thought', 'meta-prompting', 'decomposition']
        },
        {
            name: 'Output Control',
            ids: ['structured-output', 'constraint-based', 'template-based']
        },
        {
            name: 'Refinement',
            ids: ['contrastive', 'negative', 'iterative-refinement']
        },
        {
            name: 'Interactive',
            ids: ['socratic', 'contextual', 'comparative']
        }
    ];
}

/**
 * Search techniques by keyword
 */
export function searchTechniques(query) {
    if (!query || query.trim() === '') return techniques;

    const lowerQuery = query.toLowerCase();
    return techniques.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.id.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get recommended technique based on task type
 */
export function getRecommendedTechnique(taskType) {
    const recommendations = {
        'classification': 'zero-shot',
        'translation': 'few-shot',
        'reasoning': 'chain-of-thought',
        'coding': 'role-based',
        'data-extraction': 'structured-output',
        'creative': 'constraint-based',
        'comparison': 'comparative',
        'learning': 'socratic',
        'analysis': 'contextual'
    };

    const techniqueId = recommendations[taskType.toLowerCase()];
    return getTechniqueById(techniqueId);
}

/**
 * Format prompt with syntax highlighting hints
 */
export function formatPromptWithHighlights(prompt) {
    // Add markers for variables, instructions, examples, etc.
    // This could be expanded for visual highlighting in the UI
    return {
        raw: prompt,
        hasVariables: /{{.*?}}/.test(prompt),
        variableCount: (prompt.match(/{{.*?}}/g) || []).length,
        lineCount: prompt.split('\n').length,
        charCount: prompt.length,
        wordCount: prompt.split(/\s+/).filter(w => w.length > 0).length
    };
}

/**
 * Save custom technique (for future enhancement)
 */
export function saveCustomTechnique(technique) {
    // This would save to localStorage or backend
    const customTechniques = JSON.parse(localStorage.getItem('customTechniques') || '[]');
    customTechniques.push({
        ...technique,
        id: `custom-${Date.now()}`,
        custom: true
    });
    localStorage.setItem('customTechniques', JSON.stringify(customTechniques));
    return technique;
}

/**
 * Load custom techniques (for future enhancement)
 */
export function loadCustomTechniques() {
    const customTechniques = JSON.parse(localStorage.getItem('customTechniques') || '[]');
    techniques = [...techniques, ...customTechniques];
    return customTechniques;
}

export default {
    loadTechniques,
    getTechniques,
    getTechniqueById,
    setCurrentTechnique,
    getCurrentTechnique,
    clearCurrentTechnique,
    buildPromptFromTemplate,
    getTemplateVariables,
    getTechniqueExample,
    validatePrompt,
    getTechniqueCategories,
    searchTechniques,
    getRecommendedTechnique,
    formatPromptWithHighlights,
    saveCustomTechnique,
    loadCustomTechniques
};
