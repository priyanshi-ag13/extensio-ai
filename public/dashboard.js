// public/dashboard.js
// Dashboard Functionality - WORKING VERSION

console.log('📊 Dashboard loaded!');

let allExtensions = [];
let currentDeleteId = null;

// ========== CHECK AUTH ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Initializing dashboard...');
    
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
        console.log('❌ Not logged in, redirecting...');
        window.location.href = '/';
        return;
    }
    
    console.log('✅ User is logged in');
    await loadUserInfo();
    await loadExtensions();
});

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        console.log('Auth check:', data);
        return data.success && data.user !== null;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// ========== USER INFO ==========
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        console.log('User info:', data);
        
        if (data.success && data.user) {
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('userEmail').textContent = data.user.email;
            const date = new Date(data.user.createdAt);
            document.getElementById('memberSince').textContent = date.toLocaleDateString();
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        document.getElementById('userName').textContent = 'User';
        document.getElementById('userEmail').textContent = 'user@email.com';
    }
}

// ========== LOAD EXTENSIONS ==========
async function loadExtensions() {
    console.log('📦 Loading extensions...');
    const grid = document.getElementById('extensionsGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Show loading state
    if (grid) {
        grid.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="spinner" style="width:40px;height:40px;border:4px solid #f0f0f5;border-top-color:#4f46e5;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
                <p>Loading your extensions...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/api/extensions/my-extensions');
        const data = await response.json();
        console.log('Extensions response:', data);
        
        if (data.success) {
            allExtensions = data.extensions || [];
            document.getElementById('extensionCount').textContent = allExtensions.length;
            
            // Calculate download count (mock)
            document.getElementById('downloadCount').textContent = allExtensions.length * 2;
            
            if (allExtensions.length === 0) {
                grid.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            
            if (emptyState) emptyState.style.display = 'none';
            
            // Render extensions
            if (grid) {
                grid.innerHTML = allExtensions.map(ext => createCard(ext)).join('');
                attachEventListeners();
            }
        } else {
            console.error('Failed to load extensions:', data.error);
            if (grid) {
                grid.innerHTML = `<p style="text-align:center;padding:40px;color:#ef4444;">❌ ${data.error || 'Failed to load extensions'}</p>`;
            }
        }
    } catch (error) {
        console.error('Error loading extensions:', error);
        if (grid) {
            grid.innerHTML = `<p style="text-align:center;padding:40px;color:#ef4444;">❌ Connection error: ${error.message}</p>`;
        }
    }
}

// ========== CREATE CARD ==========
function createCard(extension) {
    const date = new Date(extension.createdAt).toLocaleDateString();
    let icon = '🧩';
    const name = (extension.name || '').toLowerCase();
    if (name.includes('dark')) icon = '🌙';
    else if (name.includes('image') || name.includes('block')) icon = '🖼️';
    else if (name.includes('alert')) icon = '💬';
    else if (name.includes('color') || name.includes('background')) icon = '🎨';
    else if (name.includes('link')) icon = '🔗';
    else if (name.includes('font')) icon = '🔤';
    
    return `
        <div class="extension-card" data-id="${extension.id || 'unknown'}">
            <div class="extension-icon">${icon}</div>
            <div class="extension-name">${escapeHtml(extension.name || 'Untitled')}</div>
            <div class="extension-prompt">"${escapeHtml((extension.prompt || '').substring(0, 80))}..."</div>
            <div class="extension-meta">
                <span>📅 ${date}</span>
                <span class="extension-version">v${extension.version || 1}</span>
            </div>
            <div class="extension-actions">
                <button class="btn-download" data-url="${extension.downloadUrl || '#'}">⬇️ Download</button>
                <button class="btn-regenerate" data-id="${extension.id}" data-prompt="${escapeHtml(extension.prompt || '')}">🔄 Regenerate</button>
                <button class="btn-delete" data-id="${extension.id}" data-name="${escapeHtml(extension.name || 'Untitled')}">🗑️ Delete</button>
            </div>
        </div>
    `;
}

// ========== EVENT LISTENERS ==========
function attachEventListeners() {
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const url = this.dataset.url;
            if (url && url !== '#') {
                window.location.href = url;
            } else {
                alert('Download URL not available');
            }
        };
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            showDeleteModal(this.dataset.id, this.dataset.name);
        };
    });
    
    document.querySelectorAll('.btn-regenerate').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            regenerateExtension(this.dataset.id, this.dataset.prompt);
        };
    });
}

// ========== DELETE ==========
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
            closeModal();
            await loadExtensions();
        } else {
            alert('Failed to delete: ' + data.error);
        }
    } catch (error) {
        alert('Failed to delete');
    }
}

// ========== REGENERATE ==========
async function regenerateExtension(id, prompt) {
    if (!prompt) {
        alert('No prompt found for this extension');
        return;
    }
    
    try {
        // Generate new version
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        
        if (data.success) {
            // Update extension
            const updateResponse = await fetch(`/api/extensions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: data.files,
                    downloadUrl: data.downloadUrl
                })
            });
            const updateData = await updateResponse.json();
            
            if (updateData.success) {
                await loadExtensions();
                alert('✅ Extension regenerated to version ' + updateData.extension.version);
            }
        }
    } catch (error) {
        console.error('Regenerate error:', error);
        alert('Failed to regenerate');
    }
}

// ========== HELPERS ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== SEARCH ==========
document.getElementById('searchInput')?.addEventListener('input', function() {
    const term = this.value.toLowerCase();
    const filtered = allExtensions.filter(ext => 
        (ext.name || '').toLowerCase().includes(term) ||
        (ext.prompt || '').toLowerCase().includes(term)
    );
    const grid = document.getElementById('extensionsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h2').textContent = 'No matching extensions';
        }
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    grid.innerHTML = filtered.map(ext => createCard(ext)).join('');
    attachEventListeners();
});

// ========== SORT ==========
document.getElementById('sortSelect')?.addEventListener('change', function() {
    const sortBy = this.value;
    let sorted = [...allExtensions];
    
    switch(sortBy) {
        case 'newest':
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'az':
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
    }
    
    const grid = document.getElementById('extensionsGrid');
    grid.innerHTML = sorted.map(ext => createCard(ext)).join('');
    attachEventListeners();
});

// ========== LOGOUT ==========
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
});

// ========== REFRESH ==========
document.querySelector('.refresh-btn')?.addEventListener('click', loadExtensions);

// ========== MAKE GLOBAL ==========
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
window.loadExtensions = loadExtensions;

console.log('✅ Dashboard ready!');