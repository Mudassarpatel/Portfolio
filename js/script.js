document.addEventListener('DOMContentLoaded', () => {
  const mainImages = document.querySelectorAll('.main-image');
  const thumbnails = document.querySelectorAll('.thumbnail');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const zoomInBtn = document.querySelector('.zoom-in');
  const zoomOutBtn = document.querySelector('.zoom-out');
  const fullscreenBtn = document.querySelector('.fullscreen');
  const mainImageContainer = document.querySelector('.main-image-container');

  const fullscreenMode = document.querySelector('.fullscreen-mode');
  const closeFullscreenBtn = document.querySelector('.close-fullscreen');
  const fullscreenImage = document.querySelector('.fullscreen-image');
  const fullscreenWrapper = document.querySelector('.fullscreen-image-wrapper');

  let currentIndex = 0;
  let zoom = 1;
  let fsZoom = 1;
  let isDragging = false;
  let translateX = 0, translateY = 0;
  let startPosX = 0, startPosY = 0;

  function showImage(index) {
    mainImages.forEach((img, i) => {
      img.classList.toggle('active', i === index);
      img.style.transform = 'scale(1)';
    });
    thumbnails.forEach((t, i) => t.classList.toggle('active', i === index));
    zoom = 1;
  }

  // Thumbnail click
  thumbnails.forEach(t => {
    t.addEventListener('click', () => {
      currentIndex = parseInt(t.dataset.index);
      showImage(currentIndex);
    });
  });

  // Prev/Next
  prevBtn.addEventListener('click', e => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
    showImage(currentIndex);
  });
  
  nextBtn.addEventListener('click', e => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % mainImages.length;
    showImage(currentIndex);
  });

  // Zoom buttons
  zoomInBtn.addEventListener('click', e => {
    e.stopPropagation();
    zoom = Math.min(3, zoom + 0.2);
    mainImages[currentIndex].style.transform = `scale(${zoom})`;
  });
  
  zoomOutBtn.addEventListener('click', e => {
    e.stopPropagation();
    zoom = Math.max(0.5, zoom - 0.2);
    mainImages[currentIndex].style.transform = `scale(${zoom})`;
  });

  // Open fullscreen
  function openFullscreen() {
    fullscreenImage.src = mainImages[currentIndex].src;
    fsZoom = 1;
    translateX = translateY = 0;
    fullscreenWrapper.style.transform = 'translate(0,0) scale(1)';
    fullscreenMode.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    fullscreenWrapper.style.cursor = 'default';
  }
  
  fullscreenBtn.addEventListener('click', e => {
    e.stopPropagation();
    openFullscreen();
  });
  
  mainImages.forEach(img => {
    img.addEventListener('click', openFullscreen);
  });

  // Close fullscreen
  closeFullscreenBtn.addEventListener('click', () => {
    fullscreenMode.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  window.addEventListener('keydown', e => {
    if (e.key === "Escape" && fullscreenMode.style.display === 'flex') {
      fullscreenMode.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    
    // Keyboard navigation in fullscreen
    if (fullscreenMode.style.display === 'flex') {
      if (e.key === "ArrowLeft") {
        currentIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
        fullscreenImage.src = mainImages[currentIndex].src;
        fsZoom = 1;
        translateX = translateY = 0;
        fullscreenWrapper.style.transform = 'translate(0,0) scale(1)';
        fullscreenWrapper.style.cursor = 'default';
      } else if (e.key === "ArrowRight") {
        currentIndex = (currentIndex + 1) % mainImages.length;
        fullscreenImage.src = mainImages[currentIndex].src;
        fsZoom = 1;
        translateX = translateY = 0;
        fullscreenWrapper.style.transform = 'translate(0,0) scale(1)';
        fullscreenWrapper.style.cursor = 'default';
      }
    }
  });

  // Mouse wheel zoom in fullscreen
  fullscreenMode.addEventListener('wheel', e => {
    if (fullscreenMode.style.display === 'flex') {
      e.preventDefault();
      if (e.deltaY < 0) {
        fsZoom = Math.min(5, fsZoom + 0.1);
      } else {
        fsZoom = Math.max(0.5, fsZoom - 0.1);
      }
      
      // Update cursor based on zoom level
      fullscreenWrapper.style.cursor = fsZoom > 1 ? 'grab' : 'default';
      
      fullscreenWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${fsZoom})`;
    }
  });

  // FIXED: Mouse panning with proper release
  fullscreenWrapper.addEventListener('mousedown', (e) => {
    if (fsZoom > 1 && e.button === 0) { // Only left mouse button
      isDragging = true;
      startPosX = e.clientX - translateX;
      startPosY = e.clientY - translateY;
      fullscreenWrapper.style.cursor = 'grabbing';
      
      // Prevent text selection while dragging
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || fsZoom <= 1) return;
    
    translateX = e.clientX - startPosX;
    translateY = e.clientY - startPosY;
    
    // Calculate boundaries to prevent panning beyond image edges
    const maxX = (fullscreenWrapper.offsetWidth * (fsZoom - 1)) / 2;
    const maxY = (fullscreenWrapper.offsetHeight * (fsZoom - 1)) / 2;
    
    translateX = Math.min(Math.max(translateX, -maxX), maxX);
    translateY = Math.min(Math.max(translateY, -maxY), maxY);
    
    fullscreenWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${fsZoom})`;
  });

  // FIXED: Proper mouse release handling
  window.addEventListener('mouseup', (e) => {
    if (isDragging && e.button === 0) {
      isDragging = false;
      fullscreenWrapper.style.cursor = fsZoom > 1 ? 'grab' : 'default';
    }
  });

  // Also handle mouse leaving the window while dragging
  window.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      fullscreenWrapper.style.cursor = fsZoom > 1 ? 'grab' : 'default';
    }
  });

  // Touch events for mobile swipe
  let touchStartX = 0;
  
  mainImageContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  mainImageContainer.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    handleSwipe(touchStartX, touchEndX);
  }, { passive: true });

  function handleSwipe(startX, endX) {
    const minSwipeDistance = 50;
    
    if (startX - endX > minSwipeDistance) {
      // Left swipe - next image
      currentIndex = (currentIndex + 1) % mainImages.length;
      showImage(currentIndex);
    } else if (endX - startX > minSwipeDistance) {
      // Right swipe - previous image
      currentIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
      showImage(currentIndex);
    }
  }

  // Touch events for fullscreen on mobile
  fullscreenMode.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  fullscreenMode.addEventListener('touchend', e => {
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      handleFullscreenSwipe(touchStartX, touchEndX);
    }
  }, { passive: true });

  function handleFullscreenSwipe(startX, endX) {
    const minSwipeDistance = 50;
    
    if (startX - endX > minSwipeDistance) {
      // Left swipe - next image
      currentIndex = (currentIndex + 1) % mainImages.length;
      fullscreenImage.src = mainImages[currentIndex].src;
      fsZoom = 1;
      translateX = translateY = 0;
      fullscreenWrapper.style.transform = 'translate(0,0) scale(1)';
      fullscreenWrapper.style.cursor = 'default';
    } else if (endX - startX > minSwipeDistance) {
      // Right swipe - previous image
      currentIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
      fullscreenImage.src = mainImages[currentIndex].src;
      fsZoom = 1;
      translateX = translateY = 0;
      fullscreenWrapper.style.transform = 'translate(0,0) scale(1)';
      fullscreenWrapper.style.cursor = 'default';
    }
  }

  // Change cursor based on zoom level
  fullscreenWrapper.addEventListener('mouseenter', () => {
    if (fsZoom > 1 && !isDragging) {
      fullscreenWrapper.style.cursor = 'grab';
    }
  });

  fullscreenWrapper.addEventListener('mouseleave', () => {
    if (!isDragging) {
      fullscreenWrapper.style.cursor = 'default';
    }
  });

  showImage(currentIndex);
});
