// public/script.js - COMPLETE WORKING VERSION

console.log('🚀 Extensio.ai loaded!');

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
const newExtensionBtn = document.getElementById('newExtensionBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');

// ========== CHECK LOGIN STATUS ==========
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        isLoggedIn = data.success && data.user !== null;
        console.log('Auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');
        return isLoggedIn;
    } catch (error) {
        console.error('Auth check error:', error);
        isLoggedIn = false;
        return false;
    }
}

// ========== GENERATE EXTENSION ==========
async function generateExtension() {
    console.log('🔘 Generate clicked!');
    
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
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
        }
        
        if (data.success) {
            // Save generation data
            currentGeneration = {
                prompt: prompt,
                name: prompt.substring(0, 40),
                files: data.files,
                downloadUrl: data.downloadUrl
            };
            
            console.log('✅ Generation successful!', currentGeneration);
            
            // Show result
            if (resultSection) resultSection.classList.remove('hidden');
            
            // Setup download button
            if (downloadBtn) {
                downloadBtn.onclick = function() {
                    if (currentGeneration.downloadUrl) {
                        window.location.href = currentGeneration.downloadUrl;
                    }
                };
            }
            
            // Check login status for save button
            await checkAuthStatus();
            
            // Show save button if logged in
            if (saveToLibraryBtn) {
                if (isLoggedIn) {
                    saveToLibraryBtn.style.display = 'inline-flex';
                    saveToLibraryBtn.textContent = '💾 Save to Library';
                    saveToLibraryBtn.onclick = saveToLibrary;
                } else {
                    saveToLibraryBtn.style.display = 'inline-flex';
                    saveToLibraryBtn.textContent = '🔐 Login to Save';
                    saveToLibraryBtn.onclick = function() {
                        window.location.href = '/test-auth.html';
                    };
                }
            }
        } else {
            throw new Error(data.error || 'Something went wrong');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (errorSection) errorSection.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = error.message;
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = '✨ Generate Extension';
        }
    }
}

// ========== SAVE TO LIBRARY ==========
async function saveToLibrary() {
    console.log('💾 Save to Library clicked!');
    
    if (!isLoggedIn) {
        alert('Please login first to save extensions!');
        window.location.href = '/test-auth.html';
        return;
    }
    
    if (!currentGeneration || !currentGeneration.files) {
        alert('Please generate an extension first!');
        return;
    }
    
    const originalText = saveToLibraryBtn.textContent;
    saveToLibraryBtn.textContent = '💾 Saving...';
    saveToLibraryBtn.disabled = true;
    
    try {
        const response = await fetch('/api/extensions/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: currentGeneration.prompt,
                name: currentGeneration.name,
                files: currentGeneration.files,
                downloadUrl: currentGeneration.downloadUrl
            })
        });
        
        const data = await response.json();
        console.log('Save response:', data);
        
        if (data.success) {
            alert('✅ Extension saved to your library!');
            saveToLibraryBtn.textContent = '✅ Saved!';
            setTimeout(() => {
                saveToLibraryBtn.textContent = originalText;
                saveToLibraryBtn.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.error || 'Save failed');
        }
    } catch (error) {
        console.error('❌ Save error:', error);
        alert('❌ Failed to save: ' + error.message);
        saveToLibraryBtn.textContent = originalText;
        saveToLibraryBtn.disabled = false;
    }
}

// ========== EVENT LISTENERS ==========
if (generateBtn) {
    generateBtn.addEventListener('click', generateExtension);
}

if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (generateBtn) generateBtn.click();
        }
    });
}

if (newExtensionBtn) {
    newExtensionBtn.addEventListener('click', function() {
        if (promptInput) promptInput.value = '';
        if (resultSection) resultSection.classList.add('hidden');
        if (errorSection) errorSection.classList.add('hidden');
        if (promptInput) promptInput.focus();
    });
}

if (retryBtn) {
    retryBtn.addEventListener('click', function() {
        if (errorSection) errorSection.classList.add('hidden');
        if (generateBtn) generateBtn.click();
    });
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    console.log('✅ Ready!');
});
// ========== DARK MODE ==========
function initDarkMode() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (!toggleBtn) return;
    
    // Check saved preference
    const saved = localStorage.getItem('extensio-theme');
    if (saved === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀️';
    }
    
    toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        this.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('extensio-theme', isDark ? 'dark' : 'light');
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', initDarkMode);
// ========== PROMPT SUGGESTIONS ==========
function initSuggestions() {
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const prompt = this.dataset.prompt;
            const input = document.getElementById('prompt');
            if (input) {
                input.value = prompt;
                // Auto-generate after a short delay
                setTimeout(() => {
                    const generateBtn = document.getElementById('generateBtn');
                    if (generateBtn) generateBtn.click();
                }, 300);
            }
        });
    });
}// ========== DARK MODE ==========
// This function handles the dark mode toggle
function initDarkMode() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (!toggleBtn) {
        console.log('⚠️ Dark mode button not found!');
        return;
    }
    
    console.log('✅ Dark mode button found!');
    
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('extensio-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀️';
        toggleBtn.style.background = '#2a2a4a';
        toggleBtn.style.color = '#e8e8f0';
    }
    
    // Toggle on click
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        
        const isDark = document.body.classList.contains('dark-mode');
        this.textContent = isDark ? '☀️' : '🌙';
        
        // Change button style
        if (isDark) {
            this.style.background = '#2a2a4a';
            this.style.color = '#e8e8f0';
            this.style.borderColor = '#444466';
        } else {
            this.style.background = 'white';
            this.style.color = '#1a1a2e';
            this.style.borderColor = '#e0e0e8';
        }
        
        localStorage.setItem('extensio-theme', isDark ? 'dark' : 'light');
        console.log('🌙 Dark mode:', isDark ? 'ON' : 'OFF');
    });
}

// Run dark mode when page loads
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
});

// Call this in DOMContentLoaded
document.addEventListener('DOMContentLoaded', initSuggestions);
// In the generate function, after response:
if (data.limitReached) {
    alert('⚠️ Free trial limit reached! Please upgrade to continue.');
    window.location.href = '/pricing.html';
    return;
}

// Update trial banner after generation
async function updateTrialInfo() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success && data.user) {
            const banner = document.getElementById('trialBanner');
            const text = document.getElementById('trialText');
            if (banner && text) {
                const remaining = data.user.maxTrialGenerations - data.user.trialGenerations;
                if (data.user.isPremium) {
                    banner.style.display = 'block';
                    banner.style.background = '#d1fae5';
                    banner.style.borderColor = '#22c55e';
                    text.textContent = '⭐ Premium Member - Unlimited Generations!';
                } else if (remaining > 0) {
                    banner.style.display = 'block';
                    text.textContent = `✅ ${remaining} free generations remaining`;
                } else {
                    banner.style.display = 'block';
                    banner.style.background = '#fee2e2';
                    banner.style.borderColor = '#ef4444';
                    text.textContent = '⚠️ Free trial exhausted! Please upgrade.';
                }
            }
        }
    } catch (error) {
        console.error('Trial info error:', error);
    }
}
