// public/dashboard.js
// Extensio.ai - Dashboard Functionality with Version Control
// Day 7 - Commits 17 & 18: Version display and regenerate feature

console.log('📊 Dashboard loaded with version control!');

// Global variables
let allExtensions = [];
let currentDeleteId = null;

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Initializing dashboard...');
    
    // Check authentication status
    const isLoggedIn = await checkAuth();
    
    if (!isLoggedIn) {
        // Redirect to home page if not logged in
        window.location.href = '/';
        return;
    }
    
    // Load user data and extensions
    await loadUserInfo();
    await loadExtensions();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success && data.user) {
            console.log('✅ User is logged in:', data.user.email);
            return true;
        } else {
            console.log('❌ User not logged in');
            return false;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Load user information
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success && data.user) {
            // Update user info in dashboard
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('userEmail').textContent = data.user.email;
            
            // Format member since date
            const memberDate = new Date(data.user.createdAt);
            const formattedDate = memberDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            document.getElementById('memberSince').textContent = formattedDate;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load all extensions from server
async function loadExtensions() {
    console.log('📦 Fetching extensions...');
    
    try {
        const response = await fetch('/api/extensions/my-extensions');
        const data = await response.json();
        
        if (data.success) {
            allExtensions = data.extensions || [];
            console.log(`✅ Loaded ${allExtensions.length} extensions`);
            
            // Update stats
            document.getElementById('extensionCount').textContent = allExtensions.length;
            
            // Display extensions
            displayExtensions(allExtensions);
        } else {
            console.error('Failed to load extensions:', data.error);
            showError('Failed to load extensions');
        }
    } catch (error) {
        console.error('Error loading extensions:', error);
        showError('Could not connect to server');
    }
}

// Display extensions in grid
function displayExtensions(extensions) {
    const grid = document.getElementById('extensionsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!extensions || extensions.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Build HTML for each extension
    grid.innerHTML = extensions.map(ext => createExtensionCard(ext)).join('');
    
    // Add event listeners to buttons
    attachCardEventListeners();
}

// Create HTML for a single extension card (UPDATED with version and regenerate button)
function createExtensionCard(extension) {
    const createdAt = new Date(extension.createdAt);
    const updatedAt = new Date(extension.updatedAt);
    const formattedDate = createdAt.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    const formattedUpdated = updatedAt.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get a preview of the prompt (first 80 chars)
    const promptPreview = extension.prompt.length > 80 
        ? extension.prompt.substring(0, 80) + '...' 
        : extension.prompt;
    
    // Determine icon based on extension name/prompt
    let icon = '🧩';
    if (extension.name.toLowerCase().includes('background')) icon = '🎨';
    else if (extension.name.toLowerCase().includes('image')) icon = '🖼️';
    else if (extension.name.toLowerCase().includes('button')) icon = '🔘';
    else if (extension.name.toLowerCase().includes('alert')) icon = '⚠️';
    else if (extension.name.toLowerCase().includes('color')) icon = '🌈';
    
    // Create version badge color based on version number
    const versionBadgeStyle = extension.version > 1 
        ? 'background: #fef3c7; color: #d97706;' 
        : 'background: #e0e7ff; color: #667eea;';
    
    // Version text
    const versionText = extension.version > 1 ? `v${extension.version}` : 'v1';
    
    return `
        <div class="extension-card" data-id="${extension.id}">
            <div class="extension-icon">${icon}</div>
            <div class="extension-name">${escapeHtml(extension.name)}</div>
            <div class="extension-prompt">"${escapeHtml(promptPreview)}"</div>
            <div class="extension-meta">
                <div class="meta-item">
                    <span>📅 ${formattedDate}</span>
                </div>
                <div class="meta-item">
                    <span class="extension-version" style="${versionBadgeStyle}">${versionText}</span>
                </div>
            </div>
            ${extension.version > 1 ? `
            <div class="extension-updated">
                <span>🔄 Updated: ${formattedUpdated}</span>
            </div>
            ` : ''}
            <div class="extension-actions">
                <button class="regenerate-card-btn" data-id="${extension.id}" data-prompt="${escapeHtml(extension.prompt)}">
                    🔄 Regenerate
                </button>
                <button class="download-card-btn" data-id="${extension.id}" data-url="${extension.downloadUrl}">
                    ⬇️ Download
                </button>
                <button class="delete-card-btn" data-id="${extension.id}" data-name="${escapeHtml(extension.name)}">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners to download, delete, and regenerate buttons
function attachCardEventListeners() {
    // Download buttons
    document.querySelectorAll('.download-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            if (url && url !== 'undefined') {
                downloadExtension(url);
            } else {
                showToast('⚠️ Download URL not available', 'error');
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            showDeleteModal(id, name);
        });
    });
    
    // Regenerate buttons
    document.querySelectorAll('.regenerate-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const prompt = btn.getAttribute('data-prompt');
            regenerateExtension(id, prompt);
        });
    });
}

// Download extension
function downloadExtension(url) {
    console.log('⬇️ Downloading extension from:', url);
    
    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Update download count (visual feedback)
    const downloadCountEl = document.getElementById('downloadCount');
    if (downloadCountEl) {
        let currentCount = parseInt(downloadCountEl.textContent) || 0;
        downloadCountEl.textContent = currentCount + 1;
    }
    
    // Show temporary success message
    showToast('✅ Download started!', 'success');
}

// Regenerate an extension with updated AI
async function regenerateExtension(extensionId, originalPrompt) {
    console.log(`🔄 Regenerating extension: ${extensionId}`);
    console.log(`📝 Original prompt: ${originalPrompt}`);
    
    // Find the regenerate button and show loading state
    const regenerateBtn = document.querySelector(`.regenerate-card-btn[data-id="${extensionId}"]`);
    if (!regenerateBtn) return;
    
    const originalText = regenerateBtn.innerHTML;
    regenerateBtn.innerHTML = '⏳ Generating...';
    regenerateBtn.disabled = true;
    
    try {
        // Step 1: Generate new version using AI
        showToast('🤖 AI is generating new version...', 'info');
        
        const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: originalPrompt })
        });
        
        const generateData = await generateResponse.json();
        
        if (!generateData.success) {
            throw new Error(generateData.error || 'Generation failed');
        }
        
        showToast('✨ New version generated! Saving...', 'info');
        
        // Step 2: Update the extension with new files
        const updateResponse = await fetch(`/api/extensions/${extensionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: generateData.files,
                downloadUrl: generateData.downloadUrl
            })
        });
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            showToast(`✅ Extension updated to version ${updateData.extension.version}!`, 'success');
            
            // Reload extensions to show new version
            await loadExtensions();
        } else {
            throw new Error(updateData.error || 'Update failed');
        }
        
    } catch (error) {
        console.error('Regeneration error:', error);
        showToast('❌ Failed to regenerate: ' + error.message, 'error');
        regenerateBtn.innerHTML = originalText;
        regenerateBtn.disabled = false;
    }
}

// Show delete confirmation modal
function showDeleteModal(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteExtensionName').textContent = name;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteId = null;
}

// Confirm and execute delete
async function confirmDelete() {
    if (!currentDeleteId) return;
    
    try {
        const response = await fetch(`/api/extensions/${currentDeleteId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Extension deleted successfully!', 'success');
            closeModal();
            
            // Reload extensions list
            await loadExtensions();
        } else {
            showToast('❌ Failed to delete: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Error deleting extension', 'error');
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allExtensions.filter(ext => 
                ext.name.toLowerCase().includes(searchTerm) ||
                ext.prompt.toLowerCase().includes(searchTerm)
            );
            displayExtensions(filtered);
        });
    }
}

// Sort functionality
function setupSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            let sorted = [...allExtensions];
            
            switch(sortBy) {
                case 'newest':
                    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'oldest':
                    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    break;
                case 'az':
                    sorted.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'za':
                    sorted.sort((a, b) => b.name.localeCompare(a.name));
                    break;
            }
            
            displayExtensions(sorted);
        });
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
        
        // Add styles for toast
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.color = 'white';
        toast.style.zIndex = '1000';
        toast.style.transition = 'opacity 0.3s';
    }
    
    toast.textContent = message;
    toast.style.backgroundColor = type === 'success' ? '#22c55e' : (type === 'error' ? '#ef4444' : '#667eea');
    toast.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Show error message
function showError(message) {
    const grid = document.getElementById('extensionsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem;">⚠️</div>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Try Again
                </button>
            </div>
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

// Setup event listeners after page loads
document.addEventListener('DOMContentLoaded', () => {
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Setup search and sort after data loads
    setupSearch();
    setupSort();
});

// Make functions global for modal access
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;

// Helper function to escape HTML (prevent XSS)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}// Regenerate an extension with updated AI
async function regenerateExtension(extensionId, originalPrompt) {
    console.log(`🔄 Regenerating extension: ${extensionId}`);
    console.log(`📝 Original prompt: ${originalPrompt}`);
    
    // Show regenerating indicator on the button
    const regenerateBtn = document.querySelector(`.regenerate-card-btn[data-id="${extensionId}"]`);
    const originalText = regenerateBtn.textContent;
    regenerateBtn.textContent = '⏳ Generating...';
    regenerateBtn.disabled = true;
    
    try {
        // Step 1: Generate new version using AI
        const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: originalPrompt })
        });
        
        const generateData = await generateResponse.json();
        
        if (!generateData.success) {
            throw new Error(generateData.error || 'Generation failed');
        }
        
        // Step 2: Update the extension with new files
        const updateResponse = await fetch(`/api/extensions/${extensionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: generateData.files,
                downloadUrl: generateData.downloadUrl,
                name: generateExtensionName(originalPrompt)
            })
        });
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            showToast('✅ Extension updated to new version!', 'success');
            
            // Reload extensions to show new version
            await loadExtensions();
        } else {
            throw new Error(updateData.error || 'Update failed');
        }
        
    } catch (error) {
        console.error('Regeneration error:', error);
        showToast('❌ Failed to regenerate: ' + error.message, 'error');
        regenerateBtn.textContent = originalText;
        regenerateBtn.disabled = false;
    }
}

// Helper function to generate name from prompt
function generateExtensionName(prompt) {
    let name = prompt.substring(0, 50).replace(/["']/g, '');
    if (name.length < prompt.length) {
        name += '...';
    }
    return name;
}