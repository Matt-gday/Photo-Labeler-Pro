// UI handling functions
function updateDisplay() {
    const batchActions = document.getElementById('batchActions');
    
    if (photos.length === 0) {
        previewPlaceholder.style.display = 'block';
        photosGrid.style.display = 'none';
        if (batchActions) batchActions.style.display = 'none';
        return;
    }
    
    previewPlaceholder.style.display = 'none';
    photosGrid.style.display = 'grid';
    if (batchActions) batchActions.style.display = 'flex';
}

function createPhotoItem(photo) {
    console.log(`Creating photo item for: ${photo.name} (ID: ${photo.id})`);
    
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.dataset.photoId = photo.id;
    
    const canvas = document.createElement('canvas');
    canvas.className = 'photo-canvas';
    
    // Set aspect ratio for mobile responsive design
    const aspectRatio = photo.image.width / photo.image.height;
    canvas.style.setProperty('--image-aspect-ratio', aspectRatio);
    
    const controls = document.createElement('div');
    controls.className = 'photo-controls';
    
    // Create label required modal
    const labelModal = document.createElement('div');
    labelModal.className = 'label-required-modal';
    labelModal.textContent = 'A label must be added to save this image';
    
    const titleInput = document.createElement('input');
    titleInput.className = 'photo-title-input';
    titleInput.type = 'text';
    titleInput.placeholder = 'Type text...';
    titleInput.maxLength = 100;
    titleInput.value = photo.title;
    titleInput.oninput = (e) => {
        photo.title = e.target.value;
        updatePhotoCanvas(photo, canvas);
        // Hide modal when user starts typing
        labelModal.classList.remove('show');
    };
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'photo-buttons';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'photo-download-btn';
    downloadBtn.textContent = 'Save';
    downloadBtn.onclick = () => downloadPhoto(photo, labelModal, false);
    
    const textColorToggle = document.createElement('button');
    textColorToggle.className = 'text-color-toggle';
    textColorToggle.innerHTML = `
        <div class="toggle-option ${photo.textColor === 'light' ? 'active' : ''}">light</div>
        <div class="toggle-option ${photo.textColor === 'dark' ? 'active' : ''}">dark</div>
    `;
    textColorToggle.title = 'Toggle text color';
    textColorToggle.onclick = () => {
        photo.textColor = photo.textColor === 'light' ? 'dark' : 'light';
        textColorToggle.innerHTML = `
            <div class="toggle-option ${photo.textColor === 'light' ? 'active' : ''}">light</div>
            <div class="toggle-option ${photo.textColor === 'dark' ? 'active' : ''}">dark</div>
        `;
        updatePhotoCanvas(photo, canvas);
    };
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'photo-remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => removePhoto(photo.id);
    
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(textColorToggle);
    buttonContainer.appendChild(removeBtn);
    
    controls.appendChild(labelModal);
    controls.appendChild(titleInput);
    controls.appendChild(buttonContainer);
    
    photoItem.appendChild(canvas);
    photoItem.appendChild(controls);
    
    photosGrid.appendChild(photoItem);
    
    console.log(`Photo item created and added to grid for: ${photo.name}`);
    console.log(`Total photo items in grid: ${photosGrid.children.length}`);
    
    // Use requestAnimationFrame to ensure the DOM is fully rendered before sizing
    requestAnimationFrame(() => {
        updatePhotoCanvas(photo, canvas);
    });
}

 