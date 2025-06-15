// Photo handling functions
let photos = [];
let photoIdCounter = 0;

function handleFiles(files) {
    console.log(`Processing ${files.length} files:`, files.map(f => f.name));
    
    const fileNames = files.map(f => f.name);
    selectedFiles.textContent = `Processing ${files.length} files: ${fileNames.join(', ')}`;
    selectedFiles.style.display = 'block';
    
    let processedCount = 0;
    let successCount = 0;
    
    files.forEach((file, index) => {
        console.log(`Starting to process file ${index + 1}/${files.length}: ${file.name}`);
        
        const photoId = photoIdCounter++;
        const reader = new FileReader();
        
        reader.onerror = (error) => {
            console.error(`Error reading file ${file.name}:`, error);
            processedCount++;
            updateFileStatus();
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
                processedCount++;
                updateFileStatus();
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
                successCount++;
                processedCount++;
                
                updateDisplay();
                createPhotoItem(photo);
                updateFileStatus();
            };
            
            img.src = imageData;
        };
        
        reader.readAsDataURL(file);
    });
    
    function updateFileStatus() {
        if (processedCount === files.length) {
            selectedFiles.textContent = `Loaded ${successCount} of ${files.length} images successfully`;
            console.log(`Finished processing all files. Success: ${successCount}/${files.length}`);
        }
    }
}

function updatePhotoCanvas(photo, canvas) {
    const ctx = canvas.getContext('2d');
    
    // Get device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Get the fixed dimensions from CSS
    const canvasStyle = window.getComputedStyle(canvas);
    const displayWidth = parseInt(canvasStyle.width);
    const displayHeight = parseInt(canvasStyle.height);
    
    // Set actual canvas size in memory (scaled up for high-DPI)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // Scale the context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Clear the canvas first
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Calculate how to fit the image within the fixed canvas size
    const imageAspectRatio = photo.image.width / photo.image.height;
    const canvasAspectRatio = displayWidth / displayHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imageAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas - fit to width
        drawWidth = displayWidth;
        drawHeight = displayWidth / imageAspectRatio;
        drawX = 0;
        drawY = (displayHeight - drawHeight) / 2;
    } else {
        // Image is taller than canvas - fit to height
        drawHeight = displayHeight;
        drawWidth = displayHeight * imageAspectRatio;
        drawX = (displayWidth - drawWidth) / 2;
        drawY = 0;
    }
    
    // Draw the image centered within the canvas
    ctx.drawImage(photo.image, drawX, drawY, drawWidth, drawHeight);
    
    // Draw title text if there's a title
    if (photo.title.trim()) {
        const title = photo.title.trim();
        let fontSize = Math.max(14, Math.min(drawWidth, drawHeight) / 45); // Smaller font size for preview
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`; // Semi-bold font weight
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Handle long text - adjust font size to fit within the image area
        const maxTextWidth = drawWidth - 40;
        while (ctx.measureText(title).width > maxTextWidth && fontSize > 12) {
            fontSize -= 1;
            ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        }
        
        // Position text lower on the image (closer to bottom)
        const textX = drawX + (drawWidth / 2);
        const textY = drawY + drawHeight - 8;
        
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
        let fontSize = Math.max(20, Math.min(canvas.width, canvas.height) / 25); // Larger font size for save
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`; // Semi-bold font weight
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Handle long text - adjust font size to fit within the image area
        const maxTextWidth = canvas.width - 40;
        while (ctx.measureText(title).width > maxTextWidth && fontSize > 12) {
            fontSize -= 1;
            ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        }
        
        // Position text higher up from bottom
        const textX = canvas.width / 2;
        const textY = canvas.height - 35; // Moved up more from -20 to -35
        
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