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
    
    // Get batch action buttons
    const exportAllBtn = document.getElementById('exportAllBtn');
    const clearProjectBtn = document.getElementById('clearProjectBtn');
    
    // Get label validation modal elements
    const labelValidationModal = document.getElementById('labelValidationModal');
    const labelModalClose = document.getElementById('labelModalClose');
    const labelValidationMessage = document.getElementById('labelValidationMessage');
    
    // Get iOS save modal elements
    const iosSaveModal = document.getElementById('iosSaveModal');
    const iosGotItBtn = document.getElementById('iosGotItBtn');
    
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
    
    // Label validation modal functionality
    if (labelModalClose) {
        labelModalClose.addEventListener('click', hideLabelValidationModal);
    }
    if (labelValidationModal) {
        labelValidationModal.addEventListener('click', (e) => {
            if (e.target === labelValidationModal) {
                hideLabelValidationModal();
            }
        });
    }
    
    // iOS save modal functionality
    if (iosGotItBtn) {
        iosGotItBtn.addEventListener('click', hideIosSaveModal);
    }
    if (iosSaveModal) {
        iosSaveModal.addEventListener('click', (e) => {
            if (e.target === iosSaveModal) {
                hideIosSaveModal();
            }
        });
    }
    
    // Batch action functionality
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', exportAllPhotos);
    }
    if (clearProjectBtn) {
        clearProjectBtn.addEventListener('click', clearProject);
    }
    
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

// Label validation modal functions
function showLabelValidationModal(message) {
    const labelValidationModal = document.getElementById('labelValidationModal');
    const labelValidationMessage = document.getElementById('labelValidationMessage');
    
    if (labelValidationMessage) {
        labelValidationMessage.textContent = message;
    }
    if (labelValidationModal) {
        labelValidationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function hideLabelValidationModal() {
    const labelValidationModal = document.getElementById('labelValidationModal');
    if (labelValidationModal) {
        labelValidationModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// iOS detection and modal functions
let pendingIosDownload = null;

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function showIosSaveModal(photo = null, removeAfterDownload = false) {
    // Store the pending download info
    if (photo) {
        pendingIosDownload = { photo, removeAfterDownload };
    }
    
    const iosSaveModal = document.getElementById('iosSaveModal');
    if (iosSaveModal) {
        iosSaveModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function hideIosSaveModal() {
    const iosSaveModal = document.getElementById('iosSaveModal');
    if (iosSaveModal) {
        iosSaveModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Trigger the pending download if there is one
        if (pendingIosDownload) {
            const { photo, removeAfterDownload } = pendingIosDownload;
            pendingIosDownload = null; // Clear the pending download
            performDownload(photo, removeAfterDownload);
        }
        // Handle batch export for iOS
        else if (window.pendingBatchExport) {
            const photosToExport = window.pendingBatchExport;
            window.pendingBatchExport = null; // Clear the pending batch export
            performBatchExport(photosToExport);
        }
    }
} 