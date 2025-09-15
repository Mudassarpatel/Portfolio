document.addEventListener("DOMContentLoaded", () => {
  const pdfSection = document.querySelector(".pdf-section");
  if (!pdfSection) return;

  const url = pdfSection.getAttribute("data-pdf");

  // FIX: PDF.js worker set
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDoc = null,
      currentPage = 1,
      scale = 1.2,
      fsScale = 1.0,
      isPanning = false,
      startX = 0,
      startY = 0,
      translateX = 0,
      translateY = 0,
      initialDistance = null;

  const canvas = document.getElementById("pdf-canvas");
  const ctx = canvas.getContext("2d");

  const fsCanvas = document.getElementById("pdf-fullscreen-canvas");
  const fsCtx = fsCanvas.getContext("2d");
  const fsContainer = document.querySelector(".fullscreen-canvas-container");
  const fsWrapper = document.querySelector(".fullscreen-content");
  
  // Page counter elements
  const pageCounter = document.querySelector(".page-counter");
  const fsPageCounter = document.querySelector(".fullscreen-page-counter");
  const zoomLevelDisplay = document.querySelector(".fullscreen-zoom-level");

  // Check if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Load PDF
  pdfjsLib.getDocument(url).promise.then((pdf) => {
    pdfDoc = pdf;
    updatePageCounter();
    renderPage(currentPage);
  }).catch(err => {
    console.error("PDF load error:", err);
  });

  function updatePageCounter() {
    if (pdfDoc) {
      pageCounter.textContent = `Page ${currentPage} / ${pdfDoc.numPages}`;
      fsPageCounter.textContent = `Page ${currentPage} / ${pdfDoc.numPages}`;
      zoomLevelDisplay.textContent = `${Math.round(fsScale * 100)}%`;
    }
  }

  function renderPage(num) {
    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      page.render({ canvasContext: ctx, viewport });
      updatePageCounter();
    });
  }

  function renderFsPage(num) {
    pdfDoc.getPage(num).then((page) => {
      // For mobile, adjust initial scale to fit width
      if (isMobile && fsScale === 1.0) {
        const containerWidth = fsContainer.clientWidth;
        const pageWidth = page.getViewport({ scale: 1 }).width;
        fsScale = containerWidth / pageWidth;
      }
      
      // Create a new viewport with the current zoom scale
      const viewport = page.getViewport({ scale: fsScale });
      
      // Set canvas dimensions to match the scaled page size
      fsCanvas.width = viewport.width;
      fsCanvas.height = viewport.height;
      
      // Render the page
      page.render({ 
        canvasContext: fsCtx, 
        viewport: viewport
      });
      
      updatePageCounter();
      
      // Update panning cursor based on zoom level
      updatePanningCursor();
      
      // Reset translation when changing pages or zoom level
      translateX = 0;
      translateY = 0;
      updateFsTransform();
    });
  }

  function updateFsTransform() {
    fsCanvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
  }

  function updatePanningCursor() {
    if (fsScale > 1.1) {
      fsContainer.style.cursor = 'grab';
    } else {
      fsContainer.style.cursor = 'default';
    }
  }

  // Download PDF functionality
  document.querySelector(".download-pdf").addEventListener("click", () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Navigation
  document.querySelector(".prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });

  document.querySelector(".next-page").addEventListener("click", () => {
    if (currentPage < pdfDoc.numPages) {
      currentPage++;
      renderPage(currentPage);
    }
  });

  // Mouse wheel navigation
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      // Scroll down - go to next page
      if (currentPage < pdfDoc.numPages) {
        currentPage++;
        renderPage(currentPage);
      }
    } else {
      // Scroll up - go to previous page
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    }
  });

  // Fullscreen
  const fsOverlay = document.querySelector(".pdf-fullscreen-mode");
  const closeFsBtn = document.querySelector(".close-pdf-fullscreen");

  function openFullscreen() {
    fsOverlay.style.display = "flex";
    // Reset scale to fit width on mobile, 100% on desktop
    fsScale = isMobile ? 1.0 : 1.0; // Will be recalculated in renderFsPage for mobile
    translateX = 0;
    translateY = 0;
    renderFsPage(currentPage);
    document.body.style.overflow = "hidden";
  }

  function closeFullscreen() {
    fsOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  }

  document.querySelector(".pdf-fullscreen").addEventListener("click", openFullscreen);
  canvas.addEventListener("click", openFullscreen);

  closeFsBtn.addEventListener("click", closeFullscreen);

  // ESC key close
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && fsOverlay.style.display === "flex") {
      closeFullscreen();
    }
  });

  // Fullscreen navigation
  document.querySelector(".fs-prev-page").addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentPage > 1) {
      currentPage--;
      renderFsPage(currentPage);
    }
  });

  document.querySelector(".fs-next-page").addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentPage < pdfDoc.numPages) {
      currentPage++;
      renderFsPage(currentPage);
    }
  });

  // Mouse wheel navigation in fullscreen mode
  fsOverlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      // Scroll down - go to next page
      if (currentPage < pdfDoc.numPages) {
        currentPage++;
        renderFsPage(currentPage);
      }
    } else {
      // Scroll up - go to previous page
      if (currentPage > 1) {
        currentPage--;
        renderFsPage(currentPage);
      }
    }
  });

  // Fullscreen zoom buttons
  document.querySelector(".fs-zoom-in").addEventListener("click", (e) => {
    e.stopPropagation();
    if (fsScale < 5) {
      fsScale += 0.25;
      renderFsPage(currentPage);
    }
  });

  document.querySelector(".fs-zoom-out").addEventListener("click", (e) => {
    e.stopPropagation();
    if (fsScale > 0.5) {
      fsScale -= 0.25;
      renderFsPage(currentPage);
    }
  });

  // 100% zoom button
  document.querySelector(".fs-zoom-100").addEventListener("click", (e) => {
    e.stopPropagation();
    fsScale = 1.0;
    renderFsPage(currentPage);
  });

  // Mouse wheel zoom in fullscreen
  fsOverlay.addEventListener('wheel', (e) => {
    if (fsOverlay.style.display === "flex") {
      e.preventDefault();
      if (e.deltaY < 0) {
        // Zoom in
        fsScale = Math.min(5, fsScale + 0.1);
      } else {
        // Zoom out
        fsScale = Math.max(0.5, fsScale - 0.1);
      }
      
      // Update cursor based on zoom level
      updatePanningCursor();
      
      renderFsPage(currentPage);
    }
  });

  // Panning functionality for zoomed view (over 110%)
  fsContainer.addEventListener('mousedown', (e) => {
    if (fsScale > 1.1 && e.button === 0) { // Left mouse button only
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      fsContainer.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  fsContainer.addEventListener('mouseleave', () => {
    isPanning = false;
    updatePanningCursor();
  });

  fsContainer.addEventListener('mouseup', () => {
    isPanning = false;
    updatePanningCursor();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning || fsScale <= 1.1) return;
    
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    // Calculate boundaries to prevent panning beyond image edges
    const maxX = (fsCanvas.width - fsContainer.clientWidth) / 2;
    const maxY = (fsCanvas.height - fsContainer.clientHeight) / 2;
    
    translateX = Math.min(Math.max(translateX, -maxX), maxX);
    translateY = Math.min(Math.max(translateY, -maxY), maxY);
    
    updateFsTransform();
    
    e.preventDefault();
  });

  // Also handle mouse leaving the window while dragging
  window.addEventListener('mouseleave', () => {
    if (isPanning) {
      isPanning = false;
      updatePanningCursor();
    }
  });

  // Prevent default drag behavior
  fsContainer.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  // TOUCH EVENTS FOR MOBILE - FULLSCREEN MODE (only zoom/pan, no page navigation)
  let touchStartX = 0;
  let touchStartY = 0;
  let initialTouches = [];

  fsContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      e.preventDefault();
      initialTouches = [e.touches[0], e.touches[1]];
      initialDistance = Math.hypot(
        initialTouches[0].clientX - initialTouches[1].clientX,
        initialTouches[0].clientY - initialTouches[1].clientY
      );
    }
  }, { passive: false });

  fsContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && fsScale > 1.1) {
      // Single touch move - panning
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      
      translateX += deltaX;
      translateY += deltaY;
      
      // Calculate boundaries to prevent panning beyond image edges
      const maxX = (fsCanvas.width - fsContainer.clientWidth) / 2;
      const maxY = (fsCanvas.height - fsContainer.clientHeight) / 2;
      
      translateX = Math.min(Math.max(translateX, -maxX), maxX);
      translateY = Math.min(Math.max(translateY, -maxY), maxY);
      
      updateFsTransform();
      
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    } else if (e.touches.length === 2) {
      // Two touches - pinch to zoom
      e.preventDefault();
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (initialDistance !== null) {
        const zoomFactor = currentDistance / initialDistance;
        fsScale = Math.max(0.5, Math.min(5, fsScale * zoomFactor));
        
        // Update cursor based on zoom level
        updatePanningCursor();
        
        renderFsPage(currentPage);
        initialDistance = currentDistance;
      }
    }
  }, { passive: false });

  fsContainer.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialDistance = null;
      initialTouches = [];
    }
  }, { passive: true });

  // Double tap to zoom in/out in fullscreen mode
  let lastTap = 0;
  fsContainer.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      
      if (fsScale > 1.1) {
        // Zoom out to fit width
        fsScale = 1.0;
        translateX = 0;
        translateY = 0;
      } else {
        // Zoom in to 2x
        fsScale = 2.0;
      }
      
      renderFsPage(currentPage);
    }
    
    lastTap = currentTime;
  }, { passive: false });

  // SWIPE NAVIGATION FOR MAIN PDF VIEWER (not fullscreen)
  let pdfTouchStartX = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    pdfTouchStartX = e.touches[0].clientX;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const pdfTouchEndX = e.changedTouches[0].clientX;
    handlePdfSwipe(pdfTouchStartX, pdfTouchEndX);
  }, { passive: true });

  function handlePdfSwipe(startX, endX) {
    const minSwipeDistance = 50;
    
    if (startX - endX > minSwipeDistance) {
      // Left swipe - next page
      if (currentPage < pdfDoc.numPages) {
        currentPage++;
        renderPage(currentPage);
      }
    } else if (endX - startX > minSwipeDistance) {
      // Right swipe - previous page
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    }
  }
});
