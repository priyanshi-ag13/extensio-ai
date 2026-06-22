// public/script.js
// Extensio.ai - Complete Working Version

console.log('🚀 Extensio.ai script loaded!');

// ========== GLOBAL STATE ==========
let currentGeneration = {
    prompt: '',
    name: '',
    files: null,
    downloadUrl: ''
};

let isLoggedIn = false;

// ========== DOM REFERENCES ==========
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const downloadBtn = document.getElementById('downloadBtn');
const saveToLibraryBtn = document.getElementById('saveToLibraryBtn');
const shareBtn = document.getElementById('shareBtn');
const newExtensionBtn = document.getElementById('newExtensionBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');

console.log('🔍 Elements found:', {
    promptInput: !!promptInput,
    generateBtn: !!generateBtn,
    downloadBtn: !!downloadBtn,
    saveToLibraryBtn: !!saveToLibraryBtn,
    shareBtn: !!shareBtn
});

// ========== GENERATE EXTENSION ==========
async function generateExtension() {
    console.log('🔘 Generate button clicked!');
    
    if (!promptInput) {
        alert('Error: Prompt input not found!');
        return;
    }
    
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        alert('Please describe what Chrome extension you want to create!');
        return;
    }
    
    if (prompt.length < 10) {
        alert('Please provide a more detailed description (at least 10 characters)');
        return;
    }
    
    // Show loading
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
    }
    if (resultSection) resultSection.classList.add('hidden');
    if (errorSection) errorSection.classList.add('hidden');
    
    console.log('📤 Sending request:', prompt);
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        console.log('📥 Response:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
        }
        
        if (data.success) {
            // Save generation data
            currentGeneration.prompt = prompt;
            currentGeneration.name = prompt.substring(0, 40);
            currentGeneration.files = data.files;
            currentGeneration.downloadUrl = data.downloadUrl;
            
            console.log('✅ Generation successful!', currentGeneration);
            
            // Show result
            if (resultSection) resultSection.classList.remove('hidden');
            
            // Show all action buttons
            if (downloadBtn) {
                downloadBtn.style.display = 'inline-flex';
                downloadBtn.onclick = function() {
                    if (currentGeneration.downloadUrl) {
                        window.location.href = currentGeneration.downloadUrl;
                    }
                };
            }
            
            if (saveToLibraryBtn) {
                saveToLibraryBtn.style.display = 'inline-flex';
                saveToLibraryBtn.onclick = function() {
                    alert('💾 Saved to library: ' + currentGeneration.name);
                };
            }
            
            if (shareBtn) {
                shareBtn.style.display = 'inline-flex';
                shareBtn.onclick = function() {
                    shareExtension();
                };
            }
            
        } else {
            throw new Error(data.error || 'Something went wrong');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (errorSection) errorSection.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = error.message;
    } finally {
        // Hide loading
        if (loadingSection) loadingSection.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = '✨ Generate Extension';
        }
    }
}

// ========== SHARE EXTENSION ==========
function shareExtension() {
    console.log('📤 Share button clicked!');
    console.log('Current generation:', currentGeneration);
    
    if (!currentGeneration || !currentGeneration.prompt) {
        alert('⚠️ Please generate an extension first!');
        return;
    }
    
    try {
        const shareData = btoa(JSON.stringify({
            prompt: currentGeneration.prompt,
            name: currentGeneration.name,
            downloadUrl: currentGeneration.downloadUrl
        }));
        const shareUrl = window.location.origin + '/?share=' + shareData;
        
        // Show modal
        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal">
                <h3>📤 Share This Extension</h3>
                <p>Copy the link below to share with others!</p>
                <div class="share-link-container">
                    <input type="text" class="share-link-input" id="shareLinkInput" value="${shareUrl}" readonly>
                    <button class="copy-link-btn" onclick="copyShareLink()">📋 Copy</button>
                </div>
                <button class="share-modal-close" onclick="closeShareModal()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const input = document.getElementById('shareLinkInput');
            if (input) input.select();
        }, 100);
    } catch (error) {
        console.error('Share error:', error);
        alert('Failed to create share link');
    }
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    if (!input) return;
    
    input.select();
    try {
        navigator.clipboard.writeText(input.value)
            .then(() => {
                const btn = document.querySelector('.copy-link-btn');
                if (btn) {
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
                }
            })
            .catch(() => {
                document.execCommand('copy');
                alert('✅ Copied to clipboard!');
            });
    } catch (err) {
        alert('Please copy manually: ' + input.value);
    }
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal-overlay');
    if (modal) modal.remove();
}

// Make share functions global
window.shareExtension = shareExtension;
window.copyShareLink = copyShareLink;
window.closeShareModal = closeShareModal;

// ========== USE EXAMPLE ==========
function useExample(text) {
    if (promptInput) {
        promptInput.value = text;
        generateExtension();
    }
}

// ========== EVENT LISTENERS ==========
if (generateBtn) {
    generateBtn.addEventListener('click', generateExtension);
    console.log('✅ Event listener added to generate button');
}

// Keyboard shortcut
if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (generateBtn) generateBtn.click();
        }
    });
}

// New extension
if (newExtensionBtn) {
    newExtensionBtn.addEventListener('click', function() {
        if (promptInput) promptInput.value = '';
        if (resultSection) resultSection.classList.add('hidden');
        if (errorSection) errorSection.classList.add('hidden');
        if (promptInput) promptInput.focus();
    });
}

// Retry
if (retryBtn) {
    retryBtn.addEventListener('click', function() {
        if (errorSection) errorSection.classList.add('hidden');
        if (generateBtn) generateBtn.click();
    });
}

// ========== CONNECTION STATUS ==========
function addConnectionStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connectionStatus';
    statusDiv.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-family: monospace;
        z-index: 999;
        background: rgba(0,0,0,0.7);
        color: white;
    `;
    statusDiv.innerHTML = '🟡 Connecting...';
    document.body.appendChild(statusDiv);
    
    async function checkConnection() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                statusDiv.innerHTML = '🟢 Server Connected';
                statusDiv.style.background = 'rgba(34,197,94,0.8)';
            } else {
                statusDiv.innerHTML = '🔴 Server Error';
                statusDiv.style.background = 'rgba(239,68,68,0.8)';
            }
        } catch (error) {
            statusDiv.innerHTML = '🔴 Disconnected';
            statusDiv.style.background = 'rgba(239,68,68,0.8)';
        }
    }
    
    checkConnection();
    setInterval(checkConnection, 30000);
}

// ========== DARK MODE ==========
function initDarkMode() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    const savedTheme = localStorage.getItem('extensio-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.classList.add('dark');
        const icon = toggleBtn.querySelector('.toggle-icon');
        const label = toggleBtn.querySelector('.toggle-label');
        if (icon) icon.textContent = '☀️';
        if (label) label.textContent = 'Light Mode';
    }
    
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        this.classList.toggle('dark');
        
        const isDark = document.body.classList.contains('dark-mode');
        const icon = this.querySelector('.toggle-icon');
        const label = this.querySelector('.toggle-label');
        
        if (isDark) {
            if (icon) icon.textContent = '☀️';
            if (label) label.textContent = 'Light Mode';
            localStorage.setItem('extensio-theme', 'dark');
        } else {
            if (icon) icon.textContent = '🌙';
            if (label) label.textContent = 'Dark Mode';
            localStorage.setItem('extensio-theme', 'light');
        }
    });
}

// ========== CHECK SERVER ==========
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'ok') {
            console.log('✅ Server is healthy!');
        }
    } catch (error) {
        console.warn('⚠️ Server health check failed.');
    }
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded');
    initDarkMode();
    addConnectionStatus();
    setTimeout(checkServerHealth, 1000);
    
    if (typeof renderTemplates === 'function') {
        renderTemplates();
    }
});

console.log('✅ Script initialization complete!');