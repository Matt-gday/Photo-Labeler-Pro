// Photo handling functions
let photos = [];
let photoIdCounter = 0;

function sortAndDisplayPhotos() {
    // Sort photos by aspect ratio: landscape (>1.1), square (0.9-1.1), portrait (<0.9)
    photos.sort((a, b) => {
        const aspectRatioA = a.image.width / a.image.height;
        const aspectRatioB = b.image.width / b.image.height;
        
        // Categorize aspect ratios
        const getCategoryOrder = (aspectRatio) => {
            if (aspectRatio > 1.1) return 1; // Landscape first
            if (aspectRatio >= 0.9) return 2; // Square second
            return 3; // Portrait third
        };
        
        const categoryA = getCategoryOrder(aspectRatioA);
        const categoryB = getCategoryOrder(aspectRatioB);
        
        // If same category, sort by aspect ratio within category
        if (categoryA === categoryB) {
            return categoryB === 3 ? aspectRatioB - aspectRatioA : aspectRatioA - aspectRatioB;
        }
        
        return categoryA - categoryB;
    });
    
    // Clear existing photo items
    photosGrid.innerHTML = '';
    
    // Update display state
    updateDisplay();
    
    // Create photo items in sorted order
    photos.forEach(photo => {
        createPhotoItem(photo);
    });
}

function handleFiles(files) {
    console.log(`Processing ${files.length} files:`, files.map(f => f.name));
    
    // Hide the selected files text since we're not showing status anymore
    selectedFiles.style.display = 'none';
    
    files.forEach((file, index) => {
        console.log(`Starting to process file ${index + 1}/${files.length}: ${file.name}`);
        
        const photoId = photoIdCounter++;
        const reader = new FileReader();
        
        reader.onerror = (error) => {
            console.error(`Error reading file ${file.name}:`, error);
        };
        
        reader.onload = (e) => {
            console.log(`File loaded: ${file.name}`);
            const imageData = e.target.result;
            let exifData = null;
            
            // Extract EXIF data
            try {
                exifData = piexif.load(imageData);
                console.log('EXIF data preserved for', file.name);
            } catch (error) {
                console.log('No EXIF data found for', file.name);
            }
            
            const img = new Image();
            
            img.onerror = (error) => {
                console.error(`Error loading image ${file.name}:`, error);
            };
            
            img.onload = () => {
                console.log(`Image created successfully: ${file.name}`);
                const photo = {
                    id: photoId,
                    name: file.name,
                    image: img,
                    imageData: imageData,
                    exifData: exifData,
                    title: '',
                    textColor: 'light' // 'light' for white text, 'dark' for black text
                };
                
                photos.push(photo);
                
                // Sort photos and refresh display
                sortAndDisplayPhotos();
            };
            
            img.src = imageData;
        };
        
        reader.readAsDataURL(file);
    });
}

function updatePhotoCanvas(photo, canvas) {
    const ctx = canvas.getContext('2d');
    
    // Get device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Get the container dimensions
    const containerRect = canvas.getBoundingClientRect();
    const maxWidth = containerRect.width;
    
    // Calculate proper dimensions based on image aspect ratio with constraints
    const imageAspectRatio = photo.image.width / photo.image.height;
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / imageAspectRatio;
    
    // Apply reasonable height constraints
    const maxHeight = window.innerWidth <= 480 ? window.innerHeight * 0.6 : 400;
    const minHeight = 200;
    
    if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * imageAspectRatio;
    } else if (displayHeight < minHeight) {
        displayHeight = minHeight;
        displayWidth = displayHeight * imageAspectRatio;
    }
    
    // Ensure width doesn't exceed container
    if (displayWidth > maxWidth) {
        displayWidth = maxWidth;
        displayHeight = displayWidth / imageAspectRatio;
    }
    
    // Set canvas display size via CSS
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Set actual canvas size in memory (scaled up for high-DPI)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // Scale the context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Clear the canvas first
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Fill the entire canvas area with the image
    ctx.drawImage(photo.image, 0, 0, displayWidth, displayHeight);
    
    // Draw title text if there's a title
    if (photo.title.trim()) {
        const title = photo.title.trim();
        
        // Calculate font size as a percentage of the smaller dimension for consistency
        const baseFontSize = Math.min(displayWidth, displayHeight) * 0.04; // 4% of smaller dimension
        let fontSize = Math.max(12, baseFontSize); // Minimum 12px for preview
        
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Handle long text - adjust font size to fit within the image area
        const maxTextWidth = displayWidth * 0.9; // 90% of display width
        while (ctx.measureText(title).width > maxTextWidth && fontSize > 10) {
            fontSize -= 1;
            ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        }
        
        // Position text as a percentage from bottom (consistent with download)
        const textX = displayWidth / 2;
        const textY = displayHeight - (displayHeight * 0.03); // 3% from bottom
        
        // Apply text color and glow based on setting
        if (photo.textColor === 'dark') {
            // White glow effect for dark text
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = Math.max(5, fontSize / 5);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw black text with white glow
            ctx.fillStyle = '#000000';
        } else {
            // Black glow effect for light text (default)
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = Math.max(5, fontSize / 5);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw white text with black glow
            ctx.fillStyle = '#ffffff';
        }
        
        ctx.fillText(title, textX, textY);
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
}

function downloadPhoto(photo, labelModal = null, removeAfterDownload = false) {
    // Check if photo has a label
    if (!photo.title || photo.title.trim() === '') {
        if (labelModal) {
            labelModal.classList.add('show');
            // Hide modal after 3 seconds
            setTimeout(() => {
                labelModal.classList.remove('show');
            }, 3000);
        }
        return;
    }

    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use original image dimensions
    canvas.width = photo.image.width;
    canvas.height = photo.image.height;
    
    // Draw the original image at full resolution
    ctx.drawImage(photo.image, 0, 0);
    
    // Draw title text if there's a title
    if (photo.title.trim()) {
        const title = photo.title.trim();
        
        // Calculate font size as a percentage of the smaller dimension for consistency
        const baseFontSize = Math.min(canvas.width, canvas.height) * 0.04; // 4% of smaller dimension
        let fontSize = Math.max(16, baseFontSize); // Minimum 16px
        
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Handle long text - adjust font size to fit within the image area
        const maxTextWidth = canvas.width * 0.9; // 90% of image width
        while (ctx.measureText(title).width > maxTextWidth && fontSize > 12) {
            fontSize -= 1;
            ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        }
        
        // Position text as a percentage from bottom (consistent across all resolutions)
        const textX = canvas.width / 2;
        const textY = canvas.height - (canvas.height * 0.03); // 3% from bottom
        
        // Apply text color and glow based on setting
        if (photo.textColor === 'dark') {
            // White glow effect for dark text
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = Math.max(5, fontSize / 5);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw black text with white glow
            ctx.fillStyle = '#000000';
        } else {
            // Black glow effect for light text (default)
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = Math.max(5, fontSize / 5);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw white text with black glow
            ctx.fillStyle = '#ffffff';
        }
        
        ctx.fillText(title, textX, textY);
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
    
    // Download with EXIF preservation
    try {
        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                let finalImageData = reader.result;
                
                // Add EXIF data back if it exists
                if (photo.exifData) {
                    try {
                        const exifBytes = piexif.dump(photo.exifData);
                        finalImageData = piexif.insert(exifBytes, finalImageData);
                    } catch (error) {
                        console.log('Error inserting EXIF data:', error);
                    }
                }
                
                // Convert back to blob and download
                const byteString = atob(finalImageData.split(',')[1]);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < byteString.length; i++) {
                    uint8Array[i] = byteString.charCodeAt(i);
                }
                const finalBlob = new Blob([arrayBuffer], { type: 'image/jpeg' });
                
                if (isIOS) {
                    // For iOS, open image in new tab with instructions
                    const url = URL.createObjectURL(finalBlob);
                    const newWindow = window.open();
                    if (newWindow) {
                        newWindow.document.write(`
                            <html>
                                <head>
                                    <title>Save Image - ${photo.title || 'Photo'}</title>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                        body { 
                                            margin: 0; 
                                            padding: 20px; 
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background: #000;
                                            color: #fff;
                                            text-align: center;
                                        }
                                        img { 
                                            max-width: 100%; 
                                            height: auto; 
                                            border-radius: 8px;
                                            margin: 20px 0;
                                        }
                                        .instructions {
                                            background: #1a1a1a;
                                            padding: 15px;
                                            border-radius: 8px;
                                            margin: 20px 0;
                                            font-size: 16px;
                                            line-height: 1.4;
                                        }
                                        .step {
                                            margin: 10px 0;
                                            padding: 8px;
                                            background: #2a2a2a;
                                            border-radius: 6px;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <h2>Save to Photos</h2>
                                    <img src="${url}" alt="${photo.title || 'Labeled Photo'}">
                                    <div class="instructions">
                                        <div class="step">1. Tap and hold the image above</div>
                                        <div class="step">2. Select "Save to Photos" or "Add to Photos"</div>
                                        <div class="step">3. The image will be saved to your Photos app</div>
                                    </div>
                                </body>
                            </html>
                        `);
                        newWindow.document.close();
                    } else {
                        // Fallback if popup is blocked
                        alert('Please allow popups for this site to save images on iOS, or use the share button in your browser.');
                    }
                    
                    // Clean up URL after a delay
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 30000); // 30 seconds
                } else {
                    // Standard download for non-iOS devices
                    const url = URL.createObjectURL(finalBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${photo.title || photo.name.split('.')[0] || 'titled_photo'}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                
                // Only remove the photo if explicitly requested (for batch operations)
                if (removeAfterDownload) {
                    removePhoto(photo.id);
                }
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.95);
    } catch (error) {
        alert('Download may not work in this environment.');
    }
}

function removePhoto(photoId) {
    photos = photos.filter(photo => photo.id !== photoId);
    const photoItem = document.querySelector(`[data-photo-id="${photoId}"]`);
    if (photoItem) {
        photoItem.remove();
    }
    updateDisplay();
    
    // Update all remaining canvases as grid layout may have changed
    photos.forEach(photo => {
        const photoItem = document.querySelector(`[data-photo-id="${photo.id}"]`);
        if (photoItem) {
            const canvas = photoItem.querySelector('.photo-canvas');
            updatePhotoCanvas(photo, canvas);
        }
    });
}

function exportAllPhotos() {
    if (photos.length === 0) {
        alert('No photos to export.');
        return;
    }
    
    // Check if all photos have labels
    const photosWithoutLabels = photos.filter(photo => !photo.title || photo.title.trim() === '');
    if (photosWithoutLabels.length > 0) {
        const message = photosWithoutLabels.length === 1 
            ? 'One image is missing a label.'
            : `${photosWithoutLabels.length} images are missing labels.`;
        showLabelValidationModal(message);
        return;
    }
    
    const photosToExport = [...photos]; // Create a copy to avoid issues during iteration
    let exportCount = 0;
    
    photosToExport.forEach((photo, index) => {
        // Stagger downloads to avoid overwhelming the browser
        setTimeout(() => {
            downloadPhoto(photo, null, false); // Never remove after download
            exportCount++;
            
            // Show completion message when all photos are exported
            if (exportCount === photosToExport.length) {
                setTimeout(() => {
                    alert(`Successfully exported ${exportCount} photo${exportCount !== 1 ? 's' : ''}! Images remain in the project for further editing.`);
                }, 500);
            }
        }, index * 300); // 300ms delay between downloads
    });
}

function clearProject() {
    if (photos.length === 0) {
        return;
    }
    
    if (confirm(`Are you sure you want to clear all ${photos.length} photo${photos.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
        photos = [];
        photosGrid.innerHTML = '';
        updateDisplay();
    }
} 