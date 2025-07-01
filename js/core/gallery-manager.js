/**
 * Gallery Manager - Fixed Implementation with Database Support
 * Handles selecting multiple cards and saving as gallery
 */
class GalleryManager {
  static selectedCards = new Set();
  static isGalleryMode = false;

  /**
   * Initialize gallery functionality
   */
  static init() {
    // Add gallery mode button
    this.addGalleryButton();
    
    // Listen for card creation
    document.addEventListener('cardCreated', (event) => {
      if (this.isGalleryMode && event.detail.cardElement) {
        this.makeCardSelectable(event.detail.cardElement);
      }
    });
  }

  /**
   * Add gallery mode toggle button
   */
  static addGalleryButton() {
    // Find the button container
    const buttonContainer = document.querySelector('.management-actions') || 
                           document.querySelector('.preview-actions') ||
                           document.querySelector('button[onclick="createCard()"]')?.parentElement;
    
    if (!buttonContainer) return;

    // Create gallery mode button
    const galleryBtn = document.createElement('button');
    galleryBtn.id = 'galleryModeBtn';
    galleryBtn.className = 'form-button secondary';
    galleryBtn.innerHTML = '📦 Gallery Mode';
    galleryBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%);
      border: 2px solid rgb(63, 81, 181);
      color: white;
    `;
    galleryBtn.onclick = () => this.toggleGalleryMode();
    
    buttonContainer.appendChild(galleryBtn);
  }

  /**
   * Toggle gallery mode
   */
  static toggleGalleryMode() {
    this.isGalleryMode = !this.isGalleryMode;
    const btn = document.getElementById('galleryModeBtn');
    
    if (this.isGalleryMode) {
      // Enter gallery mode
      btn.style.background = 'linear-gradient(135deg, rgb(46, 125, 50) 0%, rgb(27, 94, 32) 100%)';
      btn.innerHTML = '✅ Gallery Mode Active';
      
      // Show gallery controls
      this.showGalleryControls();
      
      // Make existing cards selectable
      document.querySelectorAll('#outputContainer .card').forEach(card => {
        this.makeCardSelectable(card);
      });
      
      Messages.showInfo('Gallery mode enabled. Click cards to select them.');
    } else {
      // Exit gallery mode
      btn.style.background = 'linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%)';
      btn.innerHTML = '📦 Gallery Mode';
      
      // Hide gallery controls
      this.hideGalleryControls();
      
      // Remove selection UI
      this.clearSelection();
      document.querySelectorAll('.card-checkbox').forEach(cb => cb.remove());
    }
  }

  /**
   * Show gallery controls
   */
  static showGalleryControls() {
    // Remove existing controls if any
    const existing = document.getElementById('galleryControls');
    if (existing) existing.remove();

    // Create controls
    const controls = document.createElement('div');
    controls.id = 'galleryControls';
    controls.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%);
      border: 2px solid rgb(218, 165, 32);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    `;

    controls.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: rgb(251, 225, 183);">Gallery Selection</h4>
      <div id="selectionCount" style="color: rgb(218, 165, 32); margin-bottom: 15px;">
        0 cards selected
      </div>
      <button onclick="GalleryManager.saveGallery()" 
              id="saveGalleryBtn"
              style="padding: 10px 20px; margin-right: 10px;
                     background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%);
                     border: 2px solid rgb(37, 26, 12); border-radius: 6px;
                     color: rgb(37, 26, 12); font-weight: bold; cursor: pointer;
                     opacity: 0.5; cursor: not-allowed;"
              disabled>
        Save as Gallery
      </button>
      <button onclick="GalleryManager.clearSelection()"
              style="padding: 10px 20px;
                     background: transparent;
                     border: 2px solid rgb(251, 225, 183); border-radius: 6px;
                     color: rgb(251, 225, 183); cursor: pointer;">
        Clear Selection
      </button>
    `;

    document.body.appendChild(controls);
  }

  /**
   * Hide gallery controls
   */
  static hideGalleryControls() {
    const controls = document.getElementById('galleryControls');
    if (controls) controls.remove();
  }

  /**
   * Make a card selectable
   */
  static makeCardSelectable(cardElement) {
    if (cardElement.querySelector('.card-checkbox')) return;

    // Add checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'card-checkbox';
    checkbox.style.cssText = `
      position: absolute;
      top: 15px;
      left: 15px;
      width: 30px;
      height: 30px;
      background: white;
      border: 3px solid rgb(63, 81, 181);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      z-index: 101;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    // Handle selection
    checkbox.onclick = (e) => {
      e.stopPropagation();
      const cardIndex = Array.from(cardElement.parentNode.children).indexOf(cardElement);
      
      if (this.selectedCards.has(cardIndex)) {
        // Deselect
        this.selectedCards.delete(cardIndex);
        checkbox.innerHTML = '';
        checkbox.style.background = 'white';
        cardElement.style.outline = '';
      } else {
        // Select
        this.selectedCards.add(cardIndex);
        checkbox.innerHTML = '✓';
        checkbox.style.background = 'rgb(63, 81, 181)';
        checkbox.style.color = 'white';
        cardElement.style.outline = '3px solid rgb(63, 81, 181)';
      }
      
      this.updateSelectionCount();
    };

    cardElement.style.position = 'relative';
    cardElement.appendChild(checkbox);
  }

  /**
   * Update selection count
   */
  static updateSelectionCount() {
    const count = this.selectedCards.size;
    const countEl = document.getElementById('selectionCount');
    if (countEl) {
      countEl.textContent = `${count} cards selected`;
    }

    // Enable/disable save button
    const saveBtn = document.getElementById('saveGalleryBtn');
    if (saveBtn) {
      saveBtn.disabled = count < 2;
      saveBtn.style.opacity = count < 2 ? '0.5' : '1';
      saveBtn.style.cursor = count < 2 ? 'not-allowed' : 'pointer';
    }
  }

  /**
   * Clear selection
   */
  static clearSelection() {
    this.selectedCards.clear();
    
    document.querySelectorAll('.card').forEach(card => {
      card.style.outline = '';
      const checkbox = card.querySelector('.card-checkbox');
      if (checkbox) {
        checkbox.innerHTML = '';
        checkbox.style.background = 'white';
        checkbox.style.color = 'black';
      }
    });
    
    this.updateSelectionCount();
  }

  /**
   * Create a composite image from selected cards
   */
  static async createCompositeImage(selectedCardData) {
    // Use the first card's image as the gallery image
    // You could enhance this to create a collage of images
    return selectedCardData[0]?.imageData || '';
  }

  /**
   * Save selected cards as gallery
   */
  static async saveGallery() {
    if (this.selectedCards.size < 2) {
      Messages.showError('Please select at least 2 cards for a gallery.');
      return;
    }

    // Get gallery name from user
    const galleryName = prompt('Enter a name for your gallery:');
    if (!galleryName || !galleryName.trim()) {
      Messages.showError('Gallery name is required.');
      return;
    }

    // Get gallery description (optional)
    const galleryDescription = prompt('Enter a description for your gallery (optional):') || '';

    try {
      // Get selected card data
      const selectedCardData = [];
      const cards = Array.from(this.selectedCards).sort((a, b) => a - b);
      
      for (const index of cards) {
        if (window.cardsData && window.cardsData[index]) {
          selectedCardData.push(window.cardsData[index]);
        }
      }

      if (selectedCardData.length === 0) {
        throw new Error('No card data found. Please make sure cards are properly created.');
      }

      // First, save all individual cards to get their IDs
      Messages.showInfo('Saving gallery items to database...');
      const savedItemIds = [];
      
      for (const cardData of selectedCardData) {
        try {
          // Use a modified version of Database.saveCard that returns the ID
          const result = await this.saveIndividualCard(cardData);
          if (result && result.id) {
            savedItemIds.push(result.id);
          }
        } catch (error) {
          console.warn('Failed to save individual card:', error);
        }
      }

      // Create gallery metadata as a special card
      const galleryData = {
        itemName: galleryName,
        hero: 'Neutral',
        itemSize: 'Large',
        border: 'legendary',
        tags: ['Gallery', `${selectedCardData.length} Items`],
        passiveEffects: [
          `Gallery: ${selectedCardData.length} unique items`,
          galleryDescription || `A collection of ${selectedCardData.length} carefully selected items`
        ],
        onUseEffects: [],
        scalingValues: {},
        imageData: await this.createCompositeImage(selectedCardData),
        timestamp: new Date().toISOString(),
        
        // Store gallery metadata in a format compatible with the database
        // We'll store the item IDs and basic info in the passiveEffects as JSON
        cooldown: JSON.stringify({
          isGallery: true,
          itemCount: selectedCardData.length,
          itemIds: savedItemIds,
          itemNames: selectedCardData.map(item => item.itemName),
          createdBy: GoogleAuth?.getUserDisplayName() || 'Unknown'
        })
      };

      // Save the gallery metadata
      Messages.showInfo('Creating gallery record...');
      
      if (window.Database && Database.saveCard) {
        await Database.saveCard(galleryData);
        
        // Clear selection and exit gallery mode
        this.clearSelection();
        this.toggleGalleryMode();
        
        Messages.showSuccess(`Gallery "${galleryName}" saved successfully with ${selectedCardData.length} items!`);
      } else {
        throw new Error('Database not available. Please make sure you are signed in.');
      }

    } catch (error) {
      console.error('Error saving gallery:', error);
      Messages.showError('Failed to save gallery: ' + error.message);
    }
  }

  /**
   * Save individual card and return its database ID
   */
  static async saveIndividualCard(cardData) {
    return new Promise((resolve, reject) => {
      if (!SupabaseClient || !SupabaseClient.isReady()) {
        reject(new Error('Database not ready'));
        return;
      }

      // Save card and get the result with ID
      SupabaseClient.saveCard(cardData).then(result => {
        if (result.success && result.data) {
          resolve({ id: result.data.id });
        } else {
          resolve(null);
        }
      }).catch(error => {
        console.warn('Failed to save card:', error);
        resolve(null);
      });
    });
  }

  /**
   * Load and display a gallery
   */
  static async loadGallery(galleryData) {
    try {
      // Parse gallery metadata from the cooldown field
      const metadata = JSON.parse(galleryData.cooldown || '{}');
      
      if (!metadata.isGallery) {
        console.warn('Not a gallery item');
        return;
      }

      // Load individual items if we have their IDs
      const items = [];
      if (metadata.itemIds && metadata.itemIds.length > 0) {
        // Load items from database using their IDs
        // This would require a method to fetch items by IDs
        console.log('Gallery contains items:', metadata.itemNames);
      }

      // Show gallery modal
      if (window.GalleryModal) {
        GalleryModal.open(items, 0, {
          name: galleryData.itemName,
          itemCount: metadata.itemCount,
          createdBy: metadata.createdBy
        });
      }

    } catch (error) {
      console.error('Error loading gallery:', error);
      Messages.showError('Failed to load gallery');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  GalleryManager.init();
});

// Make available globally
window.GalleryManager = GalleryManager;
