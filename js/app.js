// Main application logic
// Global DOM elements
let fileInput, uploadArea, selectedFiles, previewPlaceholder, photosGrid, themeToggle, instructionsLink, tipsModal, modalClose;

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements and make them globally accessible
    fileInput = document.getElementById('fileInput');
    uploadArea = document.querySelector('.upload-area');
    selectedFiles = document.getElementById('selectedFiles');
    previewPlaceholder = document.getElementById('previewPlaceholder');
    photosGrid = document.getElementById('photosGrid');
    themeToggle = document.getElementById('themeToggle');
    instructionsLink = document.getElementById('instructionsLink');
    tipsModal = document.getElementById('tipsModal');
    modalClose = document.getElementById('modalClose');
    
    // Initialize theme
    initializeTheme();
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', toggleTheme);
    
    // Instructions modal functionality
    instructionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showTipsModal();
    });
    modalClose.addEventListener('click', hideTipsModal);
    tipsModal.addEventListener('click', (e) => {
        if (e.target === tipsModal) {
            hideTipsModal();
        }
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            handleFiles(files);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            handleFiles(files);
        }
    });
    
    // Handle window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            photos.forEach(photo => {
                const photoItem = document.querySelector(`[data-photo-id="${photo.id}"]`);
                if (photoItem) {
                    const canvas = photoItem.querySelector('.photo-canvas');
                    // Reset canvas size to allow recalculation
                    canvas.style.width = '';
                    canvas.style.height = '';
                    // Use requestAnimationFrame to ensure DOM has updated
                    requestAnimationFrame(() => {
                        updatePhotoCanvas(photo, canvas);
                    });
                }
            });
        }, 100); // Debounce resize events
    });
}); 

// Theme management functions
function initializeTheme() {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
    }
}

function toggleTheme() {
    const isLight = document.documentElement.classList.contains('light-theme');
    
    if (isLight) {
        // Switch to dark theme
        document.documentElement.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        // Switch to light theme
        document.documentElement.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    }
}

// Tips modal functions
function showTipsModal() {
    tipsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hideTipsModal() {
    tipsModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
} 