
  <!-- Scripts -->
  <script>
    // interior.js
    document.addEventListener('DOMContentLoaded', function() {
        // Get the modal and modal image elements
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.close');
        
        // Get all project links
        const projectLinks = document.querySelectorAll('.project-link');
        
        // Add click event to each project link
        projectLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the image source from the clicked project
                const imgSrc = this.querySelector('img').src;
                
                // Set the modal image source and show the modal
                modalImg.src = imgSrc;
                modal.style.display = 'block';
            });
        });
        
        // Close the modal when the close button is clicked
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Close the modal when clicking outside the image
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Close the modal with the Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        });
    });
  </script>