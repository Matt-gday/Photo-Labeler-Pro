// Photo handling functions
let photos = [];
let photoIdCounter = 0;

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
                    title: ''
                };
                
                photos.push(photo);
                
                updateDisplay();
                createPhotoItem(photo);
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
        
        // Black glow effect
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = Math.max(5, fontSize / 5); // Darker glow with higher blur
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw white text with glow
        ctx.fillStyle = '#ffffff';
        ctx.fillText(title, textX, textY);
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
}

function downloadPhoto(photo, removeAfterDownload = true) {
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
        
        // Black glow effect
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = Math.max(5, fontSize / 5); // Darker glow with higher blur
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw white text with glow
        ctx.fillStyle = '#ffffff';
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
                
                const url = URL.createObjectURL(finalBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${photo.title || photo.name.split('.')[0] || 'titled_photo'}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Remove the photo from the app after successful download if requested
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