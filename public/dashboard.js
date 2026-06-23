// public/dashboard.js
// Extensio.ai - Dashboard Functionality

console.log('📊 Dashboard loaded!');

// Global variables
let allExtensions = [];
let currentDeleteId = null;

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Initializing dashboard...');
    
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
        window.location.href = '/';
        return;
    }
    
    await loadUserInfo();
    await loadExtensions();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        return data.success && data.user !== null;
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
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('userEmail').textContent = data.user.email;
            
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
            
            document.getElementById('extensionCount').textContent = allExtensions.length;
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
    grid.innerHTML = extensions.map(ext => createExtensionCard(ext)).join('');
    attachCardEventListeners();
}

// Create HTML for a single extension card
function createExtensionCard(extension) {
    const createdAt = new Date(extension.createdAt);
    const formattedDate = createdAt.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    const promptPreview = extension.prompt.length > 80 
        ? extension.prompt.substring(0, 80) + '...' 
        : extension.prompt;
    
    // Determine icon
    let icon = '🧩';
    if (extension.name.toLowerCase().includes('background')) icon = '🎨';
    else if (extension.name.toLowerCase().includes('image')) icon = '🖼️';
    else if (extension.name.toLowerCase().includes('button')) icon = '🔘';
    else if (extension.name.toLowerCase().includes('alert')) icon = '⚠️';
    else if (extension.name.toLowerCase().includes('color')) icon = '🌈';
    
    const versionBadgeStyle = extension.version > 1 
        ? 'background: #fef3c7; color: #d97706;' 
        : 'background: #e0e7ff; color: #667eea;';
    
    return `
        <div class="extension-card" data-id="${extension.id}">
            <div class="extension-icon">${icon}</div>
            <div class="extension-name">${escapeHtml(extension.name)}</div>
            <div class="extension-prompt">"${escapeHtml(promptPreview)}"</div>
            <div class="extension-meta">
                <span>📅 ${formattedDate}</span>
                <span class="extension-version" style="${versionBadgeStyle}">v${extension.version}</span>
            </div>
            <div class="extension-actions">
                <button class="download-card-btn" data-id="${extension.id}" data-url="${extension.downloadUrl}">
                    ⬇️ Download
                </button>
                <button class="regenerate-card-btn" data-id="${extension.id}" data-prompt="${escapeHtml(extension.prompt)}">
                    🔄 Regenerate
                </button>
                <button class="delete-card-btn" data-id="${extension.id}" data-name="${escapeHtml(extension.name)}">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners
function attachCardEventListeners() {
    // Download buttons
    document.querySelectorAll('.download-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            if (url && url !== 'undefined') {
                downloadExtension(url);
            } else {
                alert('Download URL not available');
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
    console.log('⬇️ Downloading:', url);
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Regenerate extension
async function regenerateExtension(extensionId, originalPrompt) {
    console.log(`🔄 Regenerating: ${extensionId}`);
    
    const regenerateBtn = document.querySelector(`.regenerate-card-btn[data-id="${extensionId}"]`);
    if (!regenerateBtn) return;
    
    const originalText = regenerateBtn.innerHTML;
    regenerateBtn.innerHTML = '⏳ Generating...';
    regenerateBtn.disabled = true;
    
    try {
        const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: originalPrompt })
        });
        const generateData = await generateResponse.json();
        
        if (!generateData.success) {
            throw new Error(generateData.error || 'Generation failed');
        }
        
        const updateResponse = await fetch(`/api/extensions/${extensionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: generateData.files,
                downloadUrl: generateData.downloadUrl
            })
        });
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            alert(`✅ Extension updated to version ${updateData.extension.version}!`);
            await loadExtensions();
        } else {
            throw new Error(updateData.error || 'Update failed');
        }
    } catch (error) {
        console.error('Regeneration error:', error);
        alert('❌ Failed to regenerate: ' + error.message);
        regenerateBtn.innerHTML = originalText;
        regenerateBtn.disabled = false;
    }
}

// Delete functions
function showDeleteModal(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteExtensionName').textContent = name;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteId = null;
}

async function confirmDelete() {
    if (!currentDeleteId) return;
    
    try {
        const response = await fetch(`/api/extensions/${currentDeleteId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            alert('✅ Extension deleted successfully!');
            closeModal();
            await loadExtensions();
        } else {
            alert('❌ Failed to delete: ' + data.error);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Error deleting extension');
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
            }
            displayExtensions(sorted);
        });
    }
}

// Helper functions
function showError(message) {
    const grid = document.getElementById('extensionsGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px;">
                <div style="font-size:3rem;">⚠️</div>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="padding:10px 20px; background:#667eea; color:white; border:none; border-radius:8px; cursor:pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
});

// Setup search and sort
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupSort();
});

// Make functions global
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
window.loadExtensions = loadExtensions;

console.log('✅ Dashboard ready!');