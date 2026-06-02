// public/script.js
// Extensio.ai - Frontend JavaScript
// Day 4 - Commit 10: Full Integration (Coming next!)
// public/script.js
// Extensio.ai - Frontend JavaScript
// Day 4 - Commit 10: Complete Frontend Integration

console.log("🚀 Extensio.ai frontend loaded!");

// Get DOM elements
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const downloadBtn = document.getElementById('downloadBtn');
const newExtensionBtn = document.getElementById('newExtensionBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');

// Store the current download URL
let currentDownloadUrl = '';

// Generate extension when button is clicked
generateBtn.addEventListener('click', generateExtension);

// Download button handler
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (currentDownloadUrl) {
            window.location.href = currentDownloadUrl;
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
        // Send request to backend
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
            // Save download URL
            currentDownloadUrl = data.downloadUrl;
            
            // Show success message
            showResult();
            
            console.log('✅ Extension generated successfully!');
            console.log('📦 Download URL:', currentDownloadUrl);
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

// Function to generate with example prompts (for testing)
function useExample(exampleText) {
    promptInput.value = exampleText;
    generateExtension();
}

// UI Helper Functions
function showLoading() {
    loadingSection.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.6';
}

function hideLoading() {
    loadingSection.classList.add('hidden');
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
}

function showResult() {
    resultSection.classList.remove('hidden');
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult() {
    resultSection.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
}

function hideError() {
    errorSection.classList.add('hidden');
}

function resetToForm() {
    // Hide result and error
    hideResult();
    hideError();
    
    // Clear the prompt
    promptInput.value = '';
    
    // Focus on input
    promptInput.focus();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add keyboard shortcut: Ctrl+Enter to generate
promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateExtension();
    }
});

// Add example prompts functionality (optional)
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
            btn.onclick = () => useExample(example);
            examplesDiv.appendChild(btn);
        });
        
        inputWrapper.appendChild(examplesDiv);
    }
}

// Add example buttons after page loads
setTimeout(addExampleButtons, 100);

// Check if server is reachable on page load
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'ok') {
            console.log('✅ Server is healthy!');
        }
    } catch (error) {
        console.warn('⚠️ Server health check failed. Make sure server is running.');
        showError('Cannot connect to server. Please make sure you have run "node server.js" in the terminal.');
    }
}

// Check server health after 1 second
setTimeout(checkServerHealth, 1000);