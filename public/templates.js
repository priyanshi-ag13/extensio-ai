// public/templates.js
// Extensio.ai - Pre-built Extension Templates
// Day 10 - Commit 29: Templates Gallery

const EXTENSION_TEMPLATES = [
    {
        id: 'dark-mode',
        icon: '🌙',
        name: 'Dark Mode Toggle',
        description: 'Adds a dark mode toggle to any website',
        prompt: 'Make a Chrome extension that adds a dark mode toggle button to any website. When clicked, it should switch the page to dark mode by changing background to dark gray and text to white.'
    },
    {
        id: 'image-blocker',
        icon: '🖼️',
        name: 'Image Blocker',
        description: 'Block all images on a webpage',
        prompt: 'Make a Chrome extension that blocks all images on a website and replaces them with a placeholder text saying "Image blocked".'
    },
    {
        id: 'font-changer',
        icon: '🔤',
        name: 'Font Changer',
        description: 'Change website fonts to your preferred style',
        prompt: 'Make a Chrome extension that changes all text on a website to use the Comic Sans font family with a size of 18px.'
    },
    {
        id: 'link-highlighter',
        icon: '🔗',
        name: 'Link Highlighter',
        description: 'Highlight all links in yellow',
        prompt: 'Make a Chrome extension that highlights all links on a website with a yellow background and makes them bold.'
    },
    {
        id: 'alert-popup',
        icon: '💬',
        name: 'Custom Alert',
        description: 'Show a custom alert message on any page',
        prompt: 'Make a Chrome extension that shows an alert popup saying "Welcome to Extensio.ai!" when any webpage loads.'
    },
    {
        id: 'color-picker',
        icon: '🎨',
        name: 'Background Color Changer',
        description: 'Change webpage background color',
        prompt: 'Make a Chrome extension that changes the background color of any webpage to a beautiful gradient from blue to purple.'
    }
];

// Function to render templates in UI
function renderTemplates() {
    const container = document.getElementById('templatesContainer');
    if (!container) {
        console.log('⚠️ templatesContainer not found in HTML');
        return;
    }
    
    console.log('✅ Rendering templates...');
    
    container.innerHTML = EXTENSION_TEMPLATES.map(template => `
        <div class="template-card" data-id="${template.id}" data-prompt="${escapeHtml(template.prompt)}">
            <div class="template-icon">${template.icon}</div>
            <div class="template-name">${escapeHtml(template.name)}</div>
            <div class="template-description">${escapeHtml(template.description)}</div>
            <button class="template-use-btn">Use Template</button>
        </div>
    `).join('');
    
    // Add event listeners to cards
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking the button (handled separately)
            if (e.target.classList.contains('template-use-btn')) return;
            useTemplate(this.dataset.id);
        });
        
        const btn = card.querySelector('.template-use-btn');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                useTemplate(card.dataset.id);
            });
        }
    });
    
    console.log('✅ Templates rendered successfully!');
}

// Function to use a template
function useTemplate(templateId) {
    console.log('📋 Using template:', templateId);
    
    const template = EXTENSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        console.error('❌ Template not found:', templateId);
        return;
    }
    
    // Fill the prompt input
    const promptInput = document.getElementById('prompt');
    if (promptInput) {
        promptInput.value = template.prompt;
        console.log('✅ Prompt filled:', template.prompt.substring(0, 50) + '...');
        
        // Auto-generate after a small delay
        setTimeout(() => {
            const generateBtn = document.getElementById('generateBtn');
            if (generateBtn) {
                console.log('🚀 Auto-generating from template...');
                generateBtn.click();
            } else {
                console.warn('⚠️ Generate button not found');
            }
        }, 500);
    } else {
        console.error('❌ Prompt input not found');
    }
    
    // Scroll to prompt
    if (promptInput) {
        promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make available globally
window.EXTENSION_TEMPLATES = EXTENSION_TEMPLATES;
window.useTemplate = useTemplate;
window.renderTemplates = renderTemplates;

console.log('✅ templates.js loaded successfully!');