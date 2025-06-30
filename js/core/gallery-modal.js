/**
 * Gallery Modal - Simple Implementation
 * Displays collections of cards in a modal gallery view
 */
class GalleryModal {
  static currentGallery = null;
  static currentIndex = 0;
  static modalElement = null;

  /**
   * Open the gallery modal
   */
  static open(items, startIndex = 0, collectionInfo = null) {
    if (!items || items.length === 0) return;

    this.currentGallery = items;
    this.currentIndex = startIndex;

    // Create modal if it doesn't exist
    if (!this.modalElement) {
      this.createModal();
    }

    // Update content
    this.updateContent(collectionInfo);

    // Show modal
    this.modalElement.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Add keyboard navigation
    document.addEventListener('keydown', this.handleKeyboard);
  }

  /**
   * Create the modal structure
   */
  static createModal() {
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'galleryModal';
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    this.modalElement.innerHTML = `
      <div class="gallery-container" style="
        position: relative;
        max-width: 90%;
        max-height: 90%;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <!-- Close button -->
        <button onclick="GalleryModal.close()" style="
          position: absolute;
          top: -40px;
          right: 0;
          background: transparent;
          border: none;
          color: white;
          font-size: 36px;
          cursor: pointer;
          padding: 0 10px;
          z-index: 10001;
        ">×</button>

        <!-- Gallery header -->
        <div id="galleryHeader" style="
          background: linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%);
          color: white;
          padding: 15px 30px;
          border-radius: 8px 8px 0 0;
          width: 100%;
          text-align: center;
          margin-bottom: -2px;
          display: none;
        "></div>

        <!-- Main content area -->
        <div id="galleryContent" style="
          background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%);
          border: 2px solid rgb(218, 165, 32);
          border-radius: 12px;
          padding: 30px;
          overflow: auto;
          max-height: 70vh;
        "></div>

        <!-- Navigation -->
        <div class="gallery-nav" style="
          display: flex;
          gap: 20px;
          margin-top: 20px;
          align-items: center;
        ">
          <button onclick="GalleryModal.previous()" id="prevBtn" style="
            background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%);
            border: 2px solid rgb(37, 26, 12);
            color: rgb(37, 26, 12);
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">← Previous</button>

          <span id="galleryCounter" style="
            color: white;
            font-size: 18px;
            font-weight: bold;
            min-width: 100px;
            text-align: center;
          ">1 / 1</span>

          <button onclick="GalleryModal.next()" id="nextBtn" style="
            background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%);
            border: 2px solid rgb(37, 26, 12);
            color: rgb(37, 26, 12);
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">Next →</button>
        </div>
      </div>
    `;

    // Close on background click
    this.modalElement.onclick = (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    };

    document.body.appendChild(this.modalElement);
  }

  /**
   * Update modal content
   */
  static async updateContent(collectionInfo) {
    const header = document.getElementById('galleryHeader');
    const content = document.getElementById('galleryContent');
    const counter = document.getElementById('galleryCounter');

    // Update header if collection info provided
    if (collectionInfo && collectionInfo.name) {
      header.innerHTML = `
        <h2 style="margin: 0;">📦 ${collectionInfo.name}</h2>
        ${collectionInfo.itemCount ? `<p style="margin: 5px 0 0 0; opacity: 0.8;">${collectionInfo.itemCount} items</p>` : ''}
      `;
      header.style.display = 'block';
      content.style.borderRadius = '0 0 12px 12px';
    } else {
      header.style.display = 'none';
      content.style.borderRadius = '12px';
    }

    // Update counter
    counter.textContent = `${this.currentIndex + 1} / ${this.currentGallery.length}`;

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = this.currentIndex === 0;
    document.getElementById('nextBtn').disabled = this.currentIndex === this.currentGallery.length - 1;

    // Display current card
    content.innerHTML = '';
    const currentItem = this.currentGallery[this.currentIndex];
    
    if (currentItem && window.CardGenerator) {
      const cardElement = await CardGenerator.createCard({
        data: currentItem,
        mode: 'browser',
        includeControls: false
      });

      if (cardElement) {
        content.appendChild(cardElement);
      }
    }
  }

  /**
   * Navigate to previous item
   */
  static previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateContent();
    }
  }

  /**
   * Navigate to next item
   */
  static next() {
    if (this.currentIndex < this.currentGallery.length - 1) {
      this.currentIndex++;
      this.updateContent();
    }
  }

  /**
   * Handle keyboard navigation
   */
  static handleKeyboard = (e) => {
    switch(e.key) {
      case 'ArrowLeft':
        this.previous();
        break;
      case 'ArrowRight':
        this.next();
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  /**
   * Close the gallery modal
   */
  static close() {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', this.handleKeyboard);
    }
    
    this.currentGallery = null;
    this.currentIndex = 0;
  }

  /**
   * Add gallery button to a card element
   */
  static addGalleryButton(cardElement, galleryItems, currentIndex = 0) {
    if (!cardElement || !galleryItems || galleryItems.length < 2) return;

    // Find or create controls container
    let controls = cardElement.querySelector('.card-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'card-controls';
      controls.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 5px;
        z-index: 100;
      `;
      cardElement.style.position = 'relative';
      cardElement.appendChild(controls);
    }

    // Add gallery button
    const galleryBtn = document.createElement('button');
    galleryBtn.className = 'card-gallery-btn';
    galleryBtn.innerHTML = '🖼️';
    galleryBtn.title = `View gallery (${galleryItems.length} items)`;
    galleryBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%);
      border: 2px solid rgb(48, 63, 159);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    galleryBtn.onclick = (e) => {
      e.stopPropagation();
      this.open(galleryItems, currentIndex);
    };

    controls.insertBefore(galleryBtn, controls.firstChild);
  }
}

// Make available globally
window.GalleryModal = GalleryModal;
