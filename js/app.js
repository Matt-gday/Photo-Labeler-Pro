// Main application logic
// Global DOM elements
let fileInput, uploadArea, selectedFiles, previewPlaceholder, photosGrid, downloadAllBtn, clearAllBtn;

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements and make them globally accessible
    fileInput = document.getElementById('fileInput');
    uploadArea = document.querySelector('.upload-area');
    selectedFiles = document.getElementById('selectedFiles');
    previewPlaceholder = document.getElementById('previewPlaceholder');
    photosGrid = document.getElementById('photosGrid');
    downloadAllBtn = document.getElementById('downloadAllBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    
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
    
    // Download all photos
    downloadAllBtn.addEventListener('click', () => {
        photos.forEach((photo, index) => {
            setTimeout(() => downloadPhoto(photo, false), index * 500); // Stagger downloads, don't remove after download
        });
    });
    
    // Clear all photos
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove all photos?')) {
            photos.length = 0; // Clear array properly
            photosGrid.innerHTML = '';
            selectedFiles.style.display = 'none';
            fileInput.value = ''; // Reset file input
            updateDisplay();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        photos.forEach(photo => {
            const photoItem = document.querySelector(`[data-photo-id="${photo.id}"]`);
            if (photoItem) {
                const canvas = photoItem.querySelector('.photo-canvas');
                updatePhotoCanvas(photo, canvas);
            }
        });
        

    });
}); 