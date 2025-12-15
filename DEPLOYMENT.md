# Deployment Guide

## GitHub Pages Limitation

**⚠️ Important:** The GitHub Pages deployment (`https://btkcreations.github.io/prompt-engineering-studio/`) **cannot connect to local Ollama** due to browser security restrictions.

### Why It Doesn't Work

1. **Mixed Content**: GitHub Pages uses HTTPS, Ollama uses HTTP (localhost:11434)
2. **CORS Policy**: Browsers block cross-origin requests to localhost
3. **Security**: Browsers prevent external sites from accessing local services

## Recommended Solutions

### Option 1: Local Development (Best for Personal Use)

Run the app locally where it works perfectly:

```powershell
# In the project directory
python -m http.server 8000

# Open in browser
http://localhost:8000
```

This works because both the app and Ollama are on `localhost`.

### Option 2: Ollama with CORS (Advanced)

To allow GitHub Pages to access Ollama, you need to:

1. **Set Ollama Environment Variable**:
```powershell
# Windows PowerShell (restart Ollama after)
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', 'https://btkcreations.github.io', 'User')

# Restart Ollama service
Restart-Service Ollama
```

2. **Use HTTPS for Ollama** (requires SSL certificate):
   - Set up a reverse proxy (nginx/Caddy)
   - Get SSL certificate (Let's Encrypt)
   - Point to Ollama backend

### Option 3: Deploy Full Stack

Deploy both the app AND Ollama on a server:
- Use VPS/Cloud server
- Install Ollama on server
- Configure HTTPS and CORS
- Update API endpoint in code

### Option 4: Browser Extension (Workaround)

Install a CORS-bypass extension (development only):
- **Not recommended for production**
- Use "Allow CORS" Chrome extension
- Only for testing purposes

## Recommended Usage

**For Your Major Project Demo:**

1. **Local Demo**: 
   - Run `python -m http.server 8000`
   - Show working features at `http://localhost:8000`
   - Full functionality with Ollama

2. **GitHub Pages**:
   - Use for showcasing code/UI only
   - Display screenshots/documentation
   - Not for live Ollama connection

3. **Documentation**:
   - Add note in README about local setup
   - Provide video demo showing Ollama working
   - Screenshots of features

## Quick Local Setup

```powershell
# Clone/navigate to project
cd C:\Users\USER\.gemini\antigravity\scratch\prompt-engineering-studio

# Start server
python -m http.server 8000

# Open browser
start http://localhost:8000

# Ollama should already be running at localhost:11434
```

## Notes

- GitHub Pages is perfect for showcasing the **code and UI**
- For **actual Ollama functionality**, use local deployment
- This is a common limitation of static site hosting with local APIs
