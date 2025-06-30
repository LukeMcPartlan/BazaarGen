@@ -1,520 +1 @@
/**
 * Gallery Modal for Browse Page
 * Provides gallery functionality for viewing multiple cards from collections
 */
class GalleryModal {
  static currentGallery = null;
  static currentIndex = 0;
  static isOpen = false;

  /**
   * Open gallery modal with array of items
   * @param {Array} items - Array of item data
   * @param {number} startIndex - Starting index (default 0)
   * @param {Object} collectionInfo - Optional collection metadata
   */
  static open(items, startIndex = 0, collectionInfo = null) {
    if (!items || items.length === 0) {
      console.warn('No items provided for gallery');
      return;
    }

    this.currentGallery = items;
    this.currentIndex = Math.max(0, Math.min(startIndex, items.length - 1));
    this.isOpen = true;

    this.createModal(collectionInfo);
    this.updateGalleryContent();
    this.setupEventListeners();

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close gallery modal
   */
  static close() {
    const modal = document.getElementById('gallery-modal');
    if (modal) {
      modal.remove();
    }

    this.currentGallery = null;
    this.currentIndex = 0;
    this.isOpen = false;

    // Restore body scrolling
    document.body.style.overflow = '';

    // Remove event listeners
    this.removeEventListeners();
  }

  /**
   * Navigate to next item
   */
  static next() {
    if (!this.currentGallery || this.currentGallery.length <= 1) return;

    this.currentIndex = (this.currentIndex + 1) % this.currentGallery.length;
    this.updateGalleryContent();
  }

  /**
   * Navigate to previous item
   */
  static previous() {
    if (!this.currentGallery || this.currentGallery.length <= 1) return;

    this.currentIndex = this.currentIndex === 0 
      ? this.currentGallery.length - 1 
      : this.currentIndex - 1;
    this.updateGalleryContent();
  }

  /**
   * Navigate to specific index
   */
  static goTo(index) {
    if (!this.currentGallery || index < 0 || index >= this.currentGallery.length) return;

    this.currentIndex = index;
    this.updateGalleryContent();
  }

  /**
   * Create the modal structure
   */
  static createModal(collectionInfo) {
    const modal = document.createElement('div');
    modal.id = 'gallery-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    modal.innerHTML = `
      <!-- Gallery Header -->
      <div class="gallery-header" style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 20px;
        background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
        color: rgb(251, 225, 183);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10001;
      ">
        <div class="gallery-info">
          <div class="gallery-counter" style="font-size: 18px; font-weight: bold;">
            <span class="current-number">${this.currentIndex + 1}</span> of <span class="total-number">${this.currentGallery.length}</span>
          </div>
          ${collectionInfo ? `
            <div class="collection-name" style="font-size: 14px; color: rgb(218, 165, 32); margin-top: 4px;">
              📦 ${collectionInfo.name || 'Collection'}
            </div>
          ` : ''}
        </div>
        
        <button class="gallery-close" style="
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        " onclick="GalleryModal.close()">×</button>
      </div>

      <!-- Navigation Arrows -->
      ${this.currentGallery.length > 1 ? `
        <button class="gallery-nav gallery-prev" style="
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10001;
        " onclick="GalleryModal.previous()">‹</button>

        <button class="gallery-nav gallery-next" style="
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10001;
        " onclick="GalleryModal.next()">›</button>
      ` : ''}

      <!-- Gallery Content Container -->
      <div class="gallery-content" style="
        max-width: 90vw;
        max-height: 80vh;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      "></div>

      <!-- Gallery Thumbnails (if more than 1 item) -->
      ${this.currentGallery.length > 1 && this.currentGallery.length <= 10 ? `
        <div class="gallery-thumbnails" style="
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px;
          border-radius: 25px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        "></div>
      ` : ''}

      <!-- Gallery Instructions -->
      <div class="gallery-instructions" style="
        position: absolute;
        bottom: ${this.currentGallery.length > 1 && this.currentGallery.length <= 10 ? '70px' : '20px'};
        left: 50%;
        transform: translateX(-50%);
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        text-align: center;
      ">
        ${this.currentGallery.length > 1 ? 'Use ← → arrow keys or click arrows to navigate • ' : ''}Press ESC to close
      </div>
    `;

    document.body.appendChild(modal);

    // Fade in
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);

    // Create thumbnails if applicable
    if (this.currentGallery.length > 1 && this.currentGallery.length <= 10) {
      this.createThumbnails();
    }
  }

  /**
   * Update gallery content with current item
   */
  static async updateGalleryContent() {
    const contentContainer = document.querySelector('.gallery-content');
    const currentItem = this.currentGallery[this.currentIndex];
    
    if (!contentContainer || !currentItem) return;

    // Update counter
    const counterElement = document.querySelector('.current-number');
    if (counterElement) {
      counterElement.textContent = this.currentIndex + 1;
    }

    // Clear current content
    contentContainer.innerHTML = '<div style="color: white; font-size: 18px;">Loading...</div>';

    try {
      // Create card element for gallery display
      const cardElement = await CardGenerator.createCard({
        data: currentItem,
        mode: 'gallery',
        includeControls: false
      });

      if (cardElement) {
        // Style for gallery display
        cardElement.style.cssText = `
          transform: scale(1.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          border-radius: 15px;
          max-width: none;
          max-height: 70vh;
          overflow: visible;
        `;

        contentContainer.innerHTML = '';
        contentContainer.appendChild(cardElement);
      }

      // Update thumbnails
      this.updateThumbnails();

    } catch (error) {
      console.error('Error updating gallery content:', error);
      contentContainer.innerHTML = `
        <div style="color: rgb(251, 225, 183); text-align: center; padding: 40px;">
          <div style="font-size: 18px; margin-bottom: 10px;">⚠️ Error Loading Card</div>
          <div style="font-size: 14px; opacity: 0.8;">${error.message}</div>
        </div>
      `;
    }
  }

  /**
   * Create thumbnail navigation
   */
  static createThumbnails() {
    const thumbnailContainer = document.querySelector('.gallery-thumbnails');
    if (!thumbnailContainer) return;

    thumbnailContainer.innerHTML = '';

    this.currentGallery.forEach((item, index) => {
      const thumbnail = document.createElement('button');
      thumbnail.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 6px;
        border: 2px solid ${index === this.currentIndex ? 'rgb(218, 165, 32)' : 'rgba(255, 255, 255, 0.3)'};
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        overflow: hidden;
      `;
      
      // Show item number or first letter of name
      thumbnail.textContent = item.itemName ? item.itemName.charAt(0).toUpperCase() : (index + 1);
      thumbnail.title = item.itemName || `Item ${index + 1}`;
      
      thumbnail.onclick = () => this.goTo(index);
      
      // Hover effects
      thumbnail.onmouseenter = () => {
        if (index !== this.currentIndex) {
          thumbnail.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          thumbnail.style.background = 'rgba(255, 255, 255, 0.2)';
        }
      };
      
      thumbnail.onmouseleave = () => {
        if (index !== this.currentIndex) {
          thumbnail.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          thumbnail.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      };

      thumbnailContainer.appendChild(thumbnail);
    });
  }

  /**
   * Update thumbnail highlighting
   */
  static updateThumbnails() {
    const thumbnails = document.querySelectorAll('.gallery-thumbnails button');
    thumbnails.forEach((thumbnail, index) => {
      if (index === this.currentIndex) {
        thumbnail.style.borderColor = 'rgb(218, 165, 32)';
        thumbnail.style.background = 'rgba(218, 165, 32, 0.3)';
      } else {
        thumbnail.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        thumbnail.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    });
  }

  /**
   * Setup keyboard event listeners
   */
  static setupEventListeners() {
    this.keydownHandler = (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this.close();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previous();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.next();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.currentGallery.length - 1);
          break;
      }
    };

    // Click outside to close
    this.clickHandler = (e) => {
      if (e.target.id === 'gallery-modal') {
        this.close();
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('click', this.clickHandler);
  }

  /**
   * Remove event listeners
   */
  static removeEventListeners() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
  }

  /**
   * Check if items belong to the same collection
   * @param {Array} items - Array of items to check
   * @returns {Object|null} Collection info if found
   */
  static detectCollection(items) {
    if (!items || items.length <= 1) return null;

    try {
      // Check sessionStorage for collection info
      const collections = JSON.parse(sessionStorage.getItem('bazaargen_collections') || '[]');
      
      // Simple heuristic: if items were created around the same time, they might be a collection
      const timeThreshold = 60000; // 1 minute
      const firstItemTime = new Date(items[0].timestamp || items[0].created_at);
      
      for (let collection of collections) {
        const collectionTime = new Date(collection.importedAt);
        const timeDiff = Math.abs(firstItemTime - collectionTime);
        
        if (timeDiff < timeThreshold && collection.itemCount === items.length) {
          return collection;
        }
      }
      
      // Fallback: create a temporary collection
      return {
        name: `${items.length} Cards`,
        description: `Collection of ${items.length} items`,
        itemCount: items.length
      };
      
    } catch (error) {
      console.warn('Error detecting collection:', error);
      return null;
    }
  }

  /**
   * Add gallery button to card controls (for browse page integration)
   * @param {HTMLElement} cardElement - Card element
   * @param {Array} relatedItems - Array of related items for gallery
   * @param {number} currentIndex - Current item index in the collection
   */
  static addGalleryButton(cardElement, relatedItems, currentIndex = 0) {
    if (!relatedItems || relatedItems.length <= 1) return;

    const controls = cardElement.querySelector('.card-controls');
    if (!controls) return;

    const galleryBtn = document.createElement('button');
    galleryBtn.className = 'card-gallery-btn';
    galleryBtn.innerHTML = '🖼️';
    galleryBtn.title = `View gallery (${relatedItems.length} items)`;
    galleryBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%);
      color: white;
      border-color: rgb(63, 81, 181);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid;
    `;

    galleryBtn.onmouseenter = () => {
      galleryBtn.style.background = 'linear-gradient(135deg, rgb(92, 107, 192) 0%, rgb(63, 81, 181) 100%)';
      galleryBtn.style.transform = 'scale(1.1)';
    };

    galleryBtn.onmouseleave = () => {
      galleryBtn.style.background = 'linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%)';
      galleryBtn.style.transform = 'scale(1)';
    };

    galleryBtn.onclick = (e) => {
      e.stopPropagation();
      const collectionInfo = this.detectCollection(relatedItems);
      this.open(relatedItems, currentIndex, collectionInfo);
    };

    // Insert as first button
    controls.insertBefore(galleryBtn, controls.firstChild);
  }
}

// Make available globally
window.GalleryModal = GalleryModal;
