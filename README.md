# 🧠 Prompt Engineering Studio

A modern, feature-rich web application for testing and comparing prompts across multiple Ollama AI models with built-in prompt engineering techniques.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 **15+ Prompt Engineering Techniques**
- Zero-Shot, Few-Shot, Chain-of-Thought
- Role-Based, Structured Output, Constraint-Based
- Contrastive, Decomposition, Meta Prompting
- And many more with interactive templates!

### 🤖 **Multi-Model Testing**
- Test prompts across multiple Ollama models simultaneously
- Side-by-side comparison of responses
- Support for both local and cloud models
- Real-time performance metrics

### 📊 **Performance Analytics**
- Response time tracking
- Token count analysis
- Tokens per second calculation
- Model comparison charts

### 💾 **Smart Features**
- Auto-save drafts
- Prompt history (last 100 prompts)
- Export/import data
- Favorites system
- LocalStorage persistence
- **Pull models directly from the app**

### 🔧 **Model Management**
- Pull/download new models from within the app
- Real-time download progress tracking
- Automatic model list refresh
- Support for all Ollama models

### 🎨 **Premium Design**
- Modern glassmorphism UI
- Dark theme with vibrant gradients
- Smooth animations and transitions
- Fully responsive (mobile-ready)

## 🚀 Getting Started

### Prerequisites

- **Ollama** installed and running on `localhost:11434`
- At least one model pulled (e.g., `tinyllama`, `deepseek`, `gemini`)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone or download** this repository

2. **Open in browser**:
   ```bash
   # Simply open index.html in your browser
   # Or use a local server (recommended):
   
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Access the app**:
   - Direct file: `file:///path/to/index.html`
   - Local server: `http://localhost:8000`

> **⚠️ Important:** The GitHub Pages deployment cannot connect to local Ollama due to browser CORS/mixed-content restrictions. For full functionality with Ollama, run the app locally using the commands above. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

### Quick Start

1. **Check Connection**: The app will automatically connect to Ollama on startup
2. **Select Models**: Choose which models to test (left sidebar)
3. **Choose Technique**: Select a prompt engineering technique or write plain prompt
4. **Enter Prompt**: Write or build your prompt
5. **Generate**: Click "🚀 Generate" to test across all selected models
6. **Compare**: View responses side-by-side with metrics

## 📖 Usage Guide

### Using Prompt Templates

1. Click on a technique in the **Techniques** sidebar
2. Fill in the template variables
3. The prompt preview will update automatically
4. Click **Generate** to test

### Comparing Models

1. Select multiple models from the **Models** panel
2. Enter your prompt
3. All selected models will run concurrently
4. Compare responses, speed, and quality

### Saving & History

- **Auto-save**: Drafts are automatically saved
- **History**: Last 100 prompts saved automatically
- **Export**: Download all data as JSON
- **Import**: Restore from exported JSON

## 🏗️ Project Structure

```
prompt-engineering-studio/
├── index.html              # Main application
├── README.md              # This file
├── css/
│   ├── main.css          # Design system & global styles
│   └── components.css    # Component-specific styles
├── js/
│   ├── api.js            # Ollama API integration
│   ├── models.js         # Model management
│   ├── prompts.js        # Prompt techniques & templates
│   ├── storage.js        # LocalStorage management
│   └── app.js            # Main application logic
└── assets/
    └── templates.json    # Prompt engineering templates
```

## 🔧 Configuration

### Adding Custom Models

Models are automatically discovered from your Ollama installation. To add new models:

```bash
ollama pull <model-name>
```

Then refresh the application.

### Customizing Templates

Edit `assets/templates.json` to add your own prompt engineering techniques:

```json
{
  "id": "my-custom-technique",
  "name": "My Technique",
  "description": "Description of what it does",
  "template": "Your template with {{variables}}",
  "variables": ["variables"],
  "example": {
    "variables": "example value"
  }
}
```

## 🎯 Use Cases

- **Research**: Compare how different models interpret instructions
- **Education**: Learn prompt engineering techniques interactively
- **Development**: Test and optimize prompts for your applications
- **Experimentation**: Try different approaches and compare results
- **Documentation**: Save and organize effective prompts

## 🛠️ Technologies

- **Pure HTML/CSS/JavaScript** - No frameworks, no build tools
- **ES6 Modules** - Modern JavaScript modules
- **Fetch API** - For Ollama communication
- **LocalStorage** - Client-side data persistence
- **CSS Grid & Flexbox** - Responsive layouts
- **CSS Custom Properties** - Themeable design system

## 📊 Supported Models

Works with any Ollama model:
- ✅ TinyLlama
- ✅ DeepSeek
- ✅ Gemini (Cloud)
- ✅ GPT-OSS (Cloud)
- ✅ Llama 2/3
- ✅ Mistral
- ✅ And more!

## 🔐 Privacy

- **100% Local**: All data stays on your machine
- **No Tracking**: No analytics or external requests (except Ollama API)
- **No Account**: No sign-up or login required
- **Export Anytime**: Full control of your data

## 🤝 Contributing

This is a college Major Project. Contributions welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - feel free to use for any purpose

## 🙏 Acknowledgments

- **Ollama** - For the amazing local AI runtime
- **Google Fonts** - Inter & JetBrains Mono
- **Prompt Engineering Community** - For the techniques and best practices

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check Ollama documentation: https://ollama.ai/docs

## 🎓 Major Project

This application was developed as a Major Project demonstrating:
- Modern web development practices
- AI/ML integration
- User experience design
- Software architecture
- Real-world problem solving

---

**Made with 💜 for the prompt engineering community**
