// ==================================================
// MAIN APPLICATION
// ==================================================

import * as API from './api.js';
import * as Models from './models.js';
import * as Prompts from './prompts.js';
import * as Storage from './storage.js';

// Application state
let app = {
  initialized: false,
  ollamaConnected: false,
  currentPrompt: '',
  currentResults: [],
  isGenerating: false
};

/**
 * Initialize application
 */
export async function init() {
  console.log('🚀 Initializing Prompt Engineering Studio...');

  // Check Ollama connection
  showToast('Connecting to Ollama...', 'info');
  const connectionStatus = await API.checkConnection();

  if (!connectionStatus.success) {
    showToast('Failed to connect to Ollama. Make sure it\'s running on localhost:11434', 'error');
    updateConnectionStatus(false);
    return;
  }

  app.ollamaConnected = true;
  showToast(`Connected to Ollama v${connectionStatus.version}`, 'success');
  updateConnectionStatus(true, connectionStatus.version);

  // Load models
  const modelsResult = await Models.initializeModels();
  if (!modelsResult.success) {
    showToast('Failed to load models', 'error');
    return;
  }

  renderModelSelector();
  showToast(`Loaded ${modelsResult.models.length} models`, 'success');

  // Load techniques
  const techniquesResult = await Prompts.loadTechniques();
  if (!techniquesResult.success) {
    showToast('Failed to load techniques', 'error');
    return;
  }

  renderTechniqueSelector();
  showToast(`Loaded ${techniquesResult.techniques.length} techniques`, 'success');

  // Load history
  renderHistory();

  // Load draft if exists
  const draft = Storage.getDraft();
  if (draft) {
    document.getElementById('promptInput').value = draft.prompt;
    if (draft.technique) {
      Prompts.setCurrentTechnique(draft.technique);
      selectTechnique(draft.technique);
    }
  }

  // Set up event listeners
  setupEventListeners();

  // Auto-save draft
  if (Storage.getSettings().autoSave) {
    setupAutoSave();
  }

  app.initialized = true;
  console.log('✅ Application initialized');
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(connected, version = null) {
  const statusEl = document.getElementById('connectionStatus');
  const statusDot = document.getElementById('statusDot');

  if (connected) {
    statusEl.textContent = version ? `Ollama v${version}` : 'Connected';
    statusDot.classList.remove('offline');
    statusDot.classList.add('online');
  } else {
    statusEl.textContent = 'Disconnected';
    statusDot.classList.remove('online');
    statusDot.classList.add('offline');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Generate button
  document.getElementById('generateBtn').addEventListener('click', handleGenerate);

  // Clear button
  document.getElementById('clearBtn').addEventListener('click', handleClear);

  // Export button
  document.getElementById('exportBtn').addEventListener('click', handleExport);

  // Clear history button
  document.getElementById('clearHistoryBtn').addEventListener('click', handleClearHistory);

  // Prompt input character count
  document.getElementById('promptInput').addEventListener('input', updateCharCount);

  // Select all models button
  document.getElementById('selectAllModelsBtn')?.addEventListener('click', () => {
    Models.selectAllModels();
    renderModelSelector();
  });

  // Pull model button
  document.getElementById('pullModelBtn')?.addEventListener('click', handlePullModel);
}

/**
 * Handle pull model
 */
async function handlePullModel() {
  const input = document.getElementById('pullModelInput');
  const modelName = input.value.trim();

  if (!modelName) {
    showToast('Please enter a model name', 'error');
    return;
  }

  const btn = document.getElementById('pullModelBtn');
  const progressContainer = document.getElementById('pullProgress');
  const progressStatus = document.getElementById('progressStatus');
  const progressPercentage = document.getElementById('progressPercentage');
  const progressFill = document.getElementById('progressFill');

  // Disable input and button
  input.disabled = true;
  btn.disabled = true;
  btn.textContent = 'Pulling...';

  // Show progress
  progressContainer.classList.remove('hidden');
  progressStatus.textContent = 'Starting download...';
  progressPercentage.textContent = '0%';
  progressFill.style.width = '0%';

  showToast(`Pulling model: ${modelName}`, 'info');

  try {
    const result = await API.pullModel(modelName, (progress) => {
      // Update progress bar
      const percent = progress.progress || 0;
      progressFill.style.width = `${percent}%`;
      progressPercentage.textContent = `${percent}%`;
      progressStatus.textContent = progress.status || 'Downloading...';
    });

    if (result.success) {
      showToast(`Successfully pulled model: ${modelName}`, 'success');
      input.value = '';
      progressContainer.classList.add('hidden');

      // Reload models
      const modelsResult = await Models.initializeModels();
      if (modelsResult.success) {
        renderModelSelector();
        showToast(`Model list updated`, 'success');
      }
    } else {
      showToast(`Failed to pull model: ${result.error}`, 'error');
    }
  } catch (error) {
    showToast(`Error pulling model: ${error.message}`, 'error');
  } finally {
    // Re-enable input and button
    input.disabled = false;
    btn.disabled = false;
    btn.textContent = '📥 Pull';
  }
}

/**
 * Set up auto-save for drafts
 */
function setupAutoSave() {
  let saveTimeout;
  const promptInput = document.getElementById('promptInput');

  promptInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const technique = Prompts.getCurrentTechnique();
      Storage.saveDraft(promptInput.value, technique?.id);
    }, 1000); // Save after 1 second of inactivity
  });
}

/**
 * Handle generate button click
 */
async function handleGenerate() {
  const promptInput = document.getElementById('promptInput');
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showToast('Please enter a prompt', 'error');
    return;
  }

  const selectedModels = Models.getSelectedModels();
  if (selectedModels.length === 0) {
    showToast('Please select at least one model', 'error');
    return;
  }

  app.currentPrompt = prompt;
  app.isGenerating = true;

  // Update UI
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('resultsContainer').innerHTML = '';

  // Create placeholder cards for each model
  selectedModels.forEach(modelName => {
    createResultCard(modelName, null, true);
  });

  showToast(`Testing with ${selectedModels.length} model(s)...`, 'info');

  // Run tests
  const results = await Models.testSelectedModels(prompt);

  // Update result cards
  results.forEach(result => {
    updateResultCard(result);
  });

  // Save to history
  const technique = Prompts.getCurrentTechnique();
  Storage.saveToHistory(prompt, results, technique?.id);
  renderHistory();

  // Show comparison metrics
  const metrics = Models.getComparisonMetrics(results);
  if (metrics) {
    renderComparisonMetrics(metrics);
  }

  app.currentResults = results;
  app.isGenerating = false;
  document.getElementById('generateBtn').disabled = false;

  const successCount = results.filter(r => r.success).length;
  showToast(`Completed: ${successCount}/${results.length} successful`, 'success');
}

/**
 * Create result card
 */
function createResultCard(modelName, result = null, isLoading = false) {
  const container = document.getElementById('resultsContainer');
  const modelInfo = Models.getModelDisplayInfo(modelName);

  const card = document.createElement('div');
  card.className = 'result-card';
  card.id = `result-${modelName.replace(/[^a-zA-Z0-9]/g, '-')}`;

  const icon = Models.getModelIcon(modelName);
  const gradient = Models.getModelColor(modelName);

  if (isLoading) {
    card.innerHTML = `
      <div class="result-header">
        <div class="result-model-name">
          <div class="result-model-icon" style="background: ${gradient}">${icon}</div>
          ${modelInfo?.displayName || modelName}
        </div>
      </div>
      <div class="result-body">
        <div class="result-loading">
          <div class="spinner"></div>
          <div class="result-loading-text">Generating response...</div>
        </div>
      </div>
    `;
  }

  container.appendChild(card);
  return card;
}

/**
 * Update result card with response
 */
function updateResultCard(result) {
  const cardId = `result-${result.modelName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const card = document.getElementById(cardId);
  if (!card) return;

  const modelInfo = Models.getModelDisplayInfo(result.modelName);
  const icon = Models.getModelIcon(result.modelName);
  const gradient = Models.getModelColor(result.modelName);

  if (result.success) {
    card.innerHTML = `
      <div class="result-header">
        <div class="result-model-name">
          <div class="result-model-icon" style="background: ${gradient}">${icon}</div>
          ${modelInfo?.displayName || result.modelName}
        </div>
        <span class="badge badge-success">✓ Success</span>
      </div>
      <div class="result-body">
        <div class="result-text">${escapeHtml(result.response)}</div>
        ${result.thinking ? `
          <div class="result-thinking">
            <div class="result-thinking-label">💭 Thinking Process</div>
            <div class="result-thinking-text">${escapeHtml(result.thinking)}</div>
          </div>
        ` : ''}
      </div>
      <div class="result-footer">
        <div class="result-metrics">
          <div class="metric">
            <div class="metric-label">Time</div>
            <div class="metric-value">${result.responseTime}s</div>
          </div>
          <div class="metric">
            <div class="metric-label">Tokens</div>
            <div class="metric-value">${result.eval_count || 'N/A'}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Speed</div>
            <div class="metric-value">${result.tokens_per_second || 'N/A'} t/s</div>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn-icon" onclick="copyToClipboard('${escapeHtml(result.response).replace(/'/g, "\\'")}')">📋</button>
        </div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="result-header">
        <div class="result-model-name">
          <div class="result-model-icon" style="background: ${gradient}">${icon}</div>
          ${modelInfo?.displayName || result.modelName}
        </div>
        <span class="badge badge-error">✗ Error</span>
      </div>
      <div class="result-body">
        <div class="result-error">
          <strong>Error:</strong> ${escapeHtml(result.error)}
        </div>
      </div>
    `;
  }
}

/**
 * Render model selector
 */
function renderModelSelector() {
  const container = document.getElementById('modelSelector');
  const models = Models.getAvailableModels();

  container.innerHTML = '';

  models.forEach(model => {
    const modelInfo = Models.getModelDisplayInfo(model.name);
    const isSelected = Models.isModelSelected(model.name);
    const status = Models.getModelStatus(model.name);

    const card = document.createElement('div');
    card.className = `model-card ${isSelected ? 'selected' : ''}`;
    card.onclick = () => {
      Models.toggleModelSelection(model.name);
      renderModelSelector();
    };

    card.innerHTML = `
      <div class="model-header">
        <div class="model-name">${modelInfo.displayName}</div>
        <div class="model-status">
          <span class="status-dot ${status.online ? 'online' : 'offline'}"></span>
        </div>
      </div>
      <div class="model-info">
        <span class="model-tag">${modelInfo.tag}</span>
        ${modelInfo.isCloud ? '<span class="model-tag">☁️ Cloud</span>' : '<span class="model-tag">💻 Local</span>'}
        ${modelInfo.parameters !== 'Unknown' ? `<span class="model-tag">${modelInfo.parameters}</span>` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Render technique selector
 */
function renderTechniqueSelector() {
  const container = document.getElementById('techniqueList');
  const techniques = Prompts.getTechniques();

  container.innerHTML = `
    <div class="technique-item" onclick="selectTechnique(null)">
      <div class="technique-name">✍️ Plain Prompt</div>
      <div class="technique-desc">Write your own prompt without a template</div>
    </div>
  `;

  techniques.forEach(technique => {
    const item = document.createElement('div');
    item.className = 'technique-item';
    item.onclick = () => selectTechnique(technique.id);

    item.innerHTML = `
      <div class="technique-name">${technique.name}</div>
      <div class="technique-desc">${technique.description}</div>
    `;

    container.appendChild(item);
  });
}

/**
 * Select a technique
 */
window.selectTechnique = function (techniqueId) {
  if (!techniqueId) {
    Prompts.clearCurrentTechnique();
    document.getElementById('templateVariables').classList.add('hidden');
    document.getElementById('promptInput').value = '';

    // Update active state
    const items = document.querySelectorAll('.technique-item');
    items.forEach((item, index) => {
      item.classList.remove('active');
      if (index === 0) item.classList.add('active');
    });

    return;
  }

  Prompts.setCurrentTechnique(techniqueId);

  // Update active state
  const items = document.querySelectorAll('.technique-item');
  items.forEach(item => item.classList.remove('active'));
  event.target.closest('.technique-item').classList.add('active');

  // Show variable inputs
  const variables = Prompts.getTemplateVariables(techniqueId);
  const container = document.getElementById('templateVariables');

  if (variables.length > 0) {
    container.classList.remove('hidden');
    container.innerHTML = '';

    variables.forEach(variable => {
      const div = document.createElement('div');
      div.className = 'variable-input';
      div.innerHTML = `
        <label class="variable-label">${variable.label}</label>
        <textarea 
          class="textarea" 
          placeholder="${variable.placeholder}"
          data-variable="${variable.name}"
          rows="3"
        ></textarea>
      `;
      container.appendChild(div);
    });

    // Update prompt when variables change
    container.querySelectorAll('textarea').forEach(textarea => {
      textarea.addEventListener('input', updatePromptFromTemplate);
    });

    // Load example
    const example = Prompts.getTechniqueExample(techniqueId);
    if (example) {
      document.getElementById('promptInput').value = example;
    }
  } else {
    container.classList.add('hidden');
  }
}

/**
 * Update prompt from template variables
 */
function updatePromptFromTemplate() {
  const technique = Prompts.getCurrentTechnique();
  if (!technique) return;

  const variables = {};
  document.querySelectorAll('[data-variable]').forEach(input => {
    variables[input.dataset.variable] = input.value;
  });

  const prompt = Prompts.buildPromptFromTemplate(technique.id, variables);
  document.getElementById('promptInput').value = prompt;
  updateCharCount();
}

/**
 * Render history
 */
function renderHistory() {
  const container = document.getElementById('historyList');
  const history = Storage.getHistory();

  if (history.length === 0) {
    container.innerHTML = '<div class="history-empty">No history yet</div>';
    return;
  }

  container.innerHTML = '';

  history.slice(0, 20).forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.onclick = () => loadHistoryEntry(entry.id);

    const date = new Date(entry.timestamp).toLocaleString();

    item.innerHTML = `
      <div class="history-date">${date}</div>
      <div class="history-prompt">${escapeHtml(entry.prompt)}</div>
    `;

    container.appendChild(item);
  });
}

/**
 * Load history entry
 */
function loadHistoryEntry(id) {
  const entry = Storage.getHistoryEntry(id);
  if (!entry) return;

  document.getElementById('promptInput').value = entry.prompt;

  if (entry.technique) {
    selectTechnique(entry.technique);
  }

  showToast('Prompt loaded from history', 'info');
}

/**
 * Render comparison metrics
 */
function renderComparisonMetrics(metrics) {
  const container = document.getElementById('metricsComparison');
  if (!container) return;

  container.innerHTML = `
    <h3>📊 Comparison</h3>
    <div class="metric-card">
      <div class="metric-card-label">Fastest</div>
      <div class="metric-card-value">${metrics.fastestModel}</div>
    </div>
    <div class="metric-card">
      <div class="metric-card-label">Avg Response Time</div>
      <div class="metric-card-value">${metrics.averageResponseTime}s</div>
    </div>
    <div class="metric-card">
      <div class="metric-card-label">Total Tokens</div>
      <div class="metric-card-value">${metrics.totalTokens}</div>
    </div>
  `;
}

/**
 * Update character count
 */
function updateCharCount() {
  const input = document.getElementById('promptInput');
  const counter = document.getElementById('charCount');
  const count = input.value.length;
  counter.textContent = `${count} characters`;
}

/**
 * Handle clear button
 */
function handleClear() {
  document.getElementById('promptInput').value = '';
  document.getElementById('resultsContainer').innerHTML = '';
  Prompts.clearCurrentTechnique();
  document.getElementById('templateVariables').classList.add('hidden');
  Storage.clearDraft();
  updateCharCount();

  // Reset technique selection
  const items = document.querySelectorAll('.technique-item');
  items.forEach((item, index) => {
    item.classList.remove('active');
    if (index === 0) item.classList.add('active');
  });
}

/**
 * Handle export
 */
function handleExport() {
  const data = Storage.exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-studio-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully', 'success');
}

/**
 * Handle clear history
 */
function handleClearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    Storage.clearHistory();
    renderHistory();
    showToast('History cleared', 'success');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Copy to clipboard
 */
window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard', 'success');
  }).catch(err => {
    showToast('Failed to copy', 'error');
  });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

export default {
  init,
  showToast
};
