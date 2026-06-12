// public/dashboard.js
// Extensio.ai - Dashboard Functionality with Version Control
// Day 7 - Complete Version

console.log('📊 Dashboard loaded with version control!');

// Global variables
let allExtensions = [];
let currentDeleteId = null;

// ========== INITIALIZATION ==========

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Initializing dashboard...');
    
    // Check authentication status
    const isLoggedIn = await checkAuth();
    
    if (!isLoggedIn) {
        window.location.href = '/';
        return;
    }
    
    // Load user data and extensions
    await loadUserInfo();
    await loadExtensions();
    
    // Setup event listeners
    setupSearch();
    setupSort();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// ========== AUTHENTICATION ==========

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

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// ========== USER INFO ==========

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

// ========== EXTENSIONS CRUD ==========

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

// ========== EXTENSION CARD ==========

function createExtensionCard(extension) {
    const createdAt = new Date(extension.createdAt);
    const updatedAt = new Date(extension.updatedAt);
    const formattedDate = createdAt.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
    });
    
    const formattedUpdated = updatedAt.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const promptPreview = extension.prompt.length > 80 
        ? extension.prompt.substring(0, 80) + '...' 
        : extension.prompt;
    
    let icon = '🧩';
    if (extension.name.toLowerCase().includes('background')) icon = '🎨';
    else if (extension.name.toLowerCase().includes('image')) icon = '🖼️';
    else if (extension.name.toLowerCase().includes('button')) icon = '🔘';
    else if (extension.name.toLowerCase().includes('alert')) icon = '⚠️';
    else if (extension.name.toLowerCase().includes('color')) icon = '🌈';
    
    const versionBadgeStyle = extension.version > 1 
        ? 'background: #fef3c7; color: #d97706;' 
        : 'background: #e0e7ff; color: #667eea;';
    
    const versionText = extension.version > 1 ? `v${extension.version}` : 'v1';
    
    return `
        <div class="extension-card" data-id="${extension.id}">
            <div class="extension-icon">${icon}</div>
            <div class="extension-name">${escapeHtml(extension.name)}</div>
            <div class="extension-prompt">"${escapeHtml(promptPreview)}"</div>
            <div class="extension-meta">
                <div class="meta-item"><span>📅 ${formattedDate}</span></div>
                <div class="meta-item"><span class="extension-version" style="${versionBadgeStyle}">${versionText}</span></div>
            </div>
            ${extension.version > 1 ? `<div class="extension-updated"><span>🔄 Updated: ${formattedUpdated}</span></div>` : ''}
            <div class="extension-actions">
                <button class="history-card-btn" data-id="${extension.id}" data-name="${escapeHtml(extension.name)}">📜 History</button>
                <button class="regenerate-card-btn" data-id="${extension.id}" data-prompt="${escapeHtml(extension.prompt)}">🔄 Regenerate</button>
                <button class="download-card-btn" data-id="${extension.id}" data-url="${extension.downloadUrl}">⬇️ Download</button>
                <button class="delete-card-btn" data-id="${extension.id}" data-name="${escapeHtml(extension.name)}">🗑️ Delete</button>
            </div>
        </div>
    `;
}

function attachCardEventListeners() {
    // History buttons
    document.querySelectorAll('.history-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            showVersionHistory(id, name);
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
}

// ========== ACTIONS ==========

function downloadExtension(url) {
    console.log('⬇️ Downloading extension from:', url);
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    updateDownloadCount();
    showToast('✅ Download started!', 'success');
}

async function regenerateExtension(extensionId, originalPrompt) {
    console.log(`🔄 Regenerating extension: ${extensionId}`);
    
    const regenerateBtn = document.querySelector(`.regenerate-card-btn[data-id="${extensionId}"]`);
    if (!regenerateBtn) return;
    
    const originalText = regenerateBtn.innerHTML;
    regenerateBtn.innerHTML = '⏳ Generating...';
    regenerateBtn.disabled = true;
    
    try {
        showToast('🤖 AI is generating new version...', 'info');
        
        const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: originalPrompt })
        });
        
        const generateData = await generateResponse.json();
        
        if (!generateData.success) {
            throw new Error(generateData.error || 'Generation failed');
        }
        
        showToast('✨ New version generated! Saving...', 'info');
        
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
            showToast(`✅ Extension updated to version ${updateData.extension.version}!`, 'success');
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

// ========== DELETE MODAL ==========

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
            showToast('✅ Extension deleted successfully!', 'success');
            closeModal();
            await loadExtensions();
        } else {
            showToast('❌ Failed to delete: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Error deleting extension', 'error');
    }
}

// ========== VERSION HISTORY MODAL ==========

async function showVersionHistory(extensionId, extensionName) {
    console.log(`📜 Showing version history for: ${extensionName}`);
    
    const modal = document.getElementById('versionModal');
    const body = document.getElementById('versionHistoryBody');
    
    modal.style.display = 'flex';
    body.innerHTML = '<div class="loading-spinner-small"><div class="spinner"></div><p>Loading version history...</p></div>';
    
    try {
        const response = await fetch(`/api/extensions/${extensionId}/history`);
        const data = await response.json();
        
        if (data.success) {
            displayVersionHistory(data, extensionId, extensionName);
        } else {
            body.innerHTML = `<div class="error-state"><p>❌ ${data.error}</p></div>`;
        }
    } catch (error) {
        console.error('Error loading version history:', error);
        body.innerHTML = '<div class="error-state"><p>❌ Failed to load version history</p></div>';
    }
}

function displayVersionHistory(data, extensionId, extensionName) {
    const body = document.getElementById('versionHistoryBody');
    
    if (!data.history || data.history.length === 0) {
        body.innerHTML = `<div class="empty-state"><p>No version history yet. Generate updates to see previous versions!</p></div>`;
        return;
    }
    
    const historyHtml = `
        <div class="version-list">
            <div class="version-item current">
                <div>
                    <div class="version-number">Version ${data.currentVersion}</div>
                    <div class="version-date">Current version</div>
                </div>
                <span class="version-badge">Current</span>
            </div>
            ${data.history.map(v => `
                <div class="version-item">
                    <div>
                        <div class="version-number">Version ${v.version}</div>
                        <div class="version-date">${new Date(v.createdAt).toLocaleString()}</div>
                    </div>
                    <button class="restore-version-btn" onclick="restoreVersion('${extensionId}', ${v.version})">🔄 Restore</button>
                </div>
            `).join('')}
        </div>
    `;
    
    body.innerHTML = historyHtml;
}

async function restoreVersion(extensionId, versionNumber) {
    console.log(`🔄 Restoring version ${versionNumber}`);
    
    closeVersionModal();
    showToast(`⏳ Restoring version ${versionNumber}...`, 'info');
    
    try {
        const response = await fetch(`/api/extensions/${extensionId}/restore/${versionNumber}`, { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ Restored to version ${versionNumber}!`, 'success');
            await loadExtensions();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Restore error:', error);
        showToast(`❌ Failed to restore: ${error.message}`, 'error');
    }
}

function closeVersionModal() {
    document.getElementById('versionModal').style.display = 'none';
}

// ========== SEARCH & SORT ==========

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

function setupSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            let sorted = [...allExtensions];
            
            switch(sortBy) {
                case 'newest': sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
                case 'oldest': sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
                case 'az': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
                case 'za': sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
            }
            
            displayExtensions(sorted);
        });
    }
}

// ========== UI HELPERS ==========

function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
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
    
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function showError(message) {
    const grid = document.getElementById('extensionsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem;">⚠️</div>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
            </div>
        `;
    }
}

function updateDownloadCount() {
    console.log('Download tracked');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== EXPOSE GLOBALS ==========
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
window.closeVersionModal = closeVersionModal;
window.restoreVersion = restoreVersion;
// Connection status indicator
let isConnected = true;

async function checkConnection() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        isConnected = data.status === 'ok';
        
        const statusIndicator = document.getElementById('connectionStatus');
        if (statusIndicator) {
            statusIndicator.textContent = isConnected ? '🟢 Connected' : '🔴 Disconnected';
            statusIndicator.style.color = isConnected ? '#22c55e' : '#ef4444';
        }
    } catch (error) {
        isConnected = false;
        const statusIndicator = document.getElementById('connectionStatus');
        if (statusIndicator) {
            statusIndicator.textContent = '🔴 Disconnected';
            statusIndicator.style.color = '#ef4444';
        }
    }
}

// Check connection every 30 seconds
setInterval(checkConnection, 30000);