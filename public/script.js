// public/script.js
// Extensio.ai - Main Frontend with Save Feature
// Day 6 - Commit 16: Save button and navigation

console.log('🚀 Extensio.ai frontend loaded!');

// Get DOM elements
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const downloadBtn = document.getElementById('downloadBtn');
const saveToLibraryBtn = document.getElementById('saveToLibraryBtn'); // NEW
const newExtensionBtn = document.getElementById('newExtensionBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');

// Store the current generation data
let currentGeneration = {
    prompt: '',
    name: '',
    files: null,
    downloadUrl: ''
};

// Check if user is logged in (for showing save button)
let isLoggedIn = false;

// Generate extension when button is clicked
if (generateBtn) {
    generateBtn.addEventListener('click', generateExtension);
}

// Save to library button
if (saveToLibraryBtn) {
    saveToLibraryBtn.addEventListener('click', saveToLibrary);
}

// Download button handler
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (currentGeneration.downloadUrl) {
            window.location.href = currentGeneration.downloadUrl;
            updateDownloadCount();
        }
    });
}

// New extension button - reset the form
if (newExtensionBtn) {
    newExtensionBtn.addEventListener('click', resetToForm);
}

// Retry button - try again
if (retryBtn) {
    retryBtn.addEventListener('click', () => {
        hideError();
        generateExtension();
    });
}

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        isLoggedIn = data.success && data.user !== null;
        
        // Update UI based on login status
        updateAuthUI();
        
        return isLoggedIn;
    } catch (error) {
        console.error('Auth check error:', error);
        isLoggedIn = false;
        return false;
    }
}

// Update UI based on login status
function updateAuthUI() {
    const authLinks = document.querySelector('.auth-links');
    if (!authLinks) return;
    
    if (isLoggedIn) {
        authLinks.innerHTML = `
            <a href="/dashboard.html" class="nav-link">📁 My Library</a>
            <button id="logoutNavBtn" class="logout-nav-btn">🚪 Logout</button>
        `;
        
        const logoutBtn = document.getElementById('logoutNavBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    } else {
        authLinks.innerHTML = `
            <a href="/test-auth.html" class="nav-link">🔐 Login / Sign Up</a>
        `;
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// Function to generate extension
async function generateExtension() {
    const prompt = promptInput.value.trim();
    
    // Validate input
    if (!prompt) {
        showError('Please describe what Chrome extension you want to create!');
        return;
    }
    
    if (prompt.length < 10) {
        showError('Please provide a more detailed description (at least 10 characters)');
        return;
    }
    
    // Show loading, hide other sections
    showLoading();
    hideResult();
    hideError();
    
    console.log('📤 Sending request to server:', prompt);
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt })
        });
        
        const data = await response.json();
        console.log('📥 Received response:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate extension');
        }
        
        if (data.success) {
            // Store current generation data
            currentGeneration = {
                prompt: prompt,
                name: generateExtensionName(prompt),
                files: data.files || null,
                downloadUrl: data.downloadUrl
            };
            
            // Show success message
            showResult();
            
            // Check auth status to show/hide save button
            await checkAuthStatus();
            updateSaveButtonVisibility();
            
            console.log('✅ Extension generated successfully!');
            console.log('📦 Download URL:', currentGeneration.downloadUrl);
        } else {
            throw new Error(data.error || 'Something went wrong');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError(error.message || 'Failed to generate extension. Please check if the server is running.');
    } finally {
        hideLoading();
    }
}
// Auto-save prompt after successful generation
async function promptSaveToLibrary() {
    if (!isLoggedIn) {
        const shouldLogin = confirm('Want to save this extension to your library? Login or Sign up to save!');
        if (shouldLogin) {
            window.location.href = '/test-auth.html';
        }
        return;
    }
    
    const shouldSave = confirm('Save this extension to your library for future access?');
    if (shouldSave) {
        await saveToLibrary();
    }
}

// Call this after successful generation (in the success section)

// Generate a name from the prompt
function generateExtensionName(prompt) {
    // Take first 50 characters of prompt, remove quotes
    let name = prompt.substring(0, 50).replace(/["']/g, '');
    if (name.length === prompt.length) {
        return name;
    }
    return name + '...';
}

// Save extension to user's library
async function saveToLibrary() {
    if (!isLoggedIn) {
        showError('Please login or sign up to save extensions to your library!');
        setTimeout(() => {
            window.location.href = '/test-auth.html';
        }, 2000);
        return;
    }
    
    if (!currentGeneration.files) {
        showError('No extension data to save. Please generate an extension first.');
        return;
    }
    
    // Show saving indicator
    const saveBtn = document.getElementById('saveToLibraryBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '💾 Saving...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch('/api/extensions/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: currentGeneration.prompt,
                name: currentGeneration.name,
                files: currentGeneration.files,
                downloadUrl: currentGeneration.downloadUrl
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSaveSuccessMessage();
            saveBtn.textContent = '✅ Saved!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.error || 'Failed to save');
        }
    } catch (error) {
        console.error('Save error:', error);
        saveBtn.textContent = '❌ Failed';
        showError('Failed to save extension: ' + error.message);
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }, 3000);
    }
}

// Show save success message
function showSaveSuccessMessage() {
    const resultSection = document.getElementById('resultSection');
    const successCard = resultSection.querySelector('.success-card');
    
    // Check if save message already exists
    let saveMsg = successCard.querySelector('.save-success-msg');
    if (!saveMsg) {
        saveMsg = document.createElement('div');
        saveMsg.className = 'save-success-msg';
        const downloadCard = successCard.querySelector('.download-card');
        downloadCard.insertAdjacentElement('afterend', saveMsg);
    }
    
    saveMsg.innerHTML = `
        <div style="background: #e0e7ff; color: #667eea; padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center;">
            ✅ Extension saved to your library! 
            <a href="/dashboard.html" style="color: #667eea; font-weight: bold;">View My Library →</a>
        </div>
    `;
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (saveMsg) saveMsg.style.display = 'none';
    }, 5000);
}

// Update save button visibility based on login status
function updateSaveButtonVisibility() {
    const saveBtn = document.getElementById('saveToLibraryBtn');
    if (saveBtn) {
        if (!isLoggedIn) {
            saveBtn.textContent = '🔐 Login to Save';
        } else {
            saveBtn.textContent = '💾 Save to My Library';
        }
    }
}

// Update download count (visual feedback)
function updateDownloadCount() {
    // Optional: Track downloads
    console.log('Download initiated');
}

// UI Helper Functions
function showLoading() {
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
    }
}

function hideLoading() {
    if (loadingSection) loadingSection.classList.add('hidden');
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
    }
}

function showResult() {
    if (resultSection) resultSection.classList.remove('hidden');
    if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult() {
    if (resultSection) resultSection.classList.add('hidden');
}

function showError(message) {
    if (errorMessage) errorMessage.textContent = message;
    if (errorSection) errorSection.classList.remove('hidden');
}

function hideError() {
    if (errorSection) errorSection.classList.add('hidden');
}

function resetToForm() {
    hideResult();
    hideError();
    if (promptInput) {
        promptInput.value = '';
        promptInput.focus();
    }
    currentGeneration = {
        prompt: '',
        name: '',
        files: null,
        downloadUrl: ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add keyboard shortcut: Ctrl+Enter to generate
if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generateExtension();
        }
    });
}

// Add example prompts functionality
function addExampleButtons() {
    const examples = [
        "Make a Chrome extension that blocks all images and replaces them with a cute cat picture",
        "Make a Chrome extension that highlights all links in yellow",
        "Make a Chrome extension that shows an alert saying 'Hello from Extensio.ai!'"
    ];
    
    const inputWrapper = document.querySelector('.input-wrapper');
    if (inputWrapper && !document.querySelector('.examples-section')) {
        const examplesDiv = document.createElement('div');
        examplesDiv.className = 'examples-section';
        examplesDiv.style.marginTop = '15px';
        examplesDiv.innerHTML = '<p style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">💡 Try these examples:</p>';
        
        examples.forEach(example => {
            const btn = document.createElement('button');
            btn.textContent = example.substring(0, 50) + '...';
            btn.style.background = '#f0f0f0';
            btn.style.border = 'none';
            btn.style.padding = '6px 12px';
            btn.style.borderRadius = '20px';
            btn.style.margin = '0 5px 5px 0';
            btn.style.fontSize = '0.8rem';
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                promptInput.value = example;
                generateExtension();
            };
            examplesDiv.appendChild(btn);
        });
        
        inputWrapper.appendChild(examplesDiv);
    }
}

// Check server health
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'ok') {
            console.log('✅ Server is healthy!');
        }
    } catch (error) {
        console.warn('⚠️ Server health check failed.');
        showError('Cannot connect to server. Please make sure server is running.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    addExampleButtons();
    setTimeout(checkServerHealth, 1000);
});