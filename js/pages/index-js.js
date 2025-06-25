/**
 * Index Page Controller (Item Generator)
 * Handles specific functionality for the main card generation page
 */
class IndexPageController {
  
  static cardsData = [];
  static isInitialized = false;

  /**
   * Initialize the index page
   */
  static init() {
    if (this.isInitialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.setupCardGeneration();
      this.setupFormEvents();
      this.setupCardManagement();
      this.setupGlobalVariables();
      this.setupDefaultEffects(); // Add default effects on load
      this.isInitialized = true;
    });
  }

  /**
   * Setup default passive and on-use effects when page loads
   */
  static setupDefaultEffects() {
    // Let Forms handle the default setup during initialization
    // This is now handled in Forms.setupPassiveInputs() and Forms.setupOnUseInputs()
  }

  /**
   * Enhanced addPassiveInput function with better UX
   */
  static addPassiveInput() {
    Forms.addPassiveInput();
  }

  /**
   * Enhanced addOnUseInput function with better UX
   */
  static addOnUseInput() {
    Forms.addOnUseInput();
  }

  /**
   * Setup card generation functionality
   */
  static setupCardGeneration() {
    // Main create card function
   window.createCard = async (isPreview = false) => {
  try {
    const cardElement = await CardGenerator.createCard({
      formData: true,  // Let CardGenerator handle the form extraction
      isPreview: isPreview,
      container: isPreview ? document.getElementById('previewContainer') : document.getElementById('outputContainer'),
      includeControls: !isPreview,
      mode: isPreview ? 'preview' : 'generator'
    });

    if (cardElement && !isPreview) {
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('cardCreated', {
        detail: { cardElement }
      }));
    }

    return cardElement;
  } catch (error) {
    console.error('Error in createCard:', error);
    Messages.showError(error.message);
    return null;
  }
};

    // Setup the main generate button
    const generateButton = document.querySelector('button[onclick="createCard()"]');
    if (generateButton) {
      generateButton.onclick = () => window.createCard(false);
    }
  }

  /**
   * Setup form event handlers
   */
  static setupFormEvents() {
    // Live preview on form changes
    document.querySelectorAll('input, select, textarea').forEach(element => {
      const eventType = element.tagName.toLowerCase() === 'select' ? 'change' : 'input';
      
      element.addEventListener(eventType, () => {
        this.handleFormChange();
      });
    });

    // File input special handling
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', () => {
        this.handleFormChange();
      });
    }
  }

  /**
   * Handle form changes for live preview
   */
  static handleFormChange() {
    // Debounce rapid changes
    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => {
      try {
        // Check if we have minimum required data
        const itemName = document.getElementById('itemNameInput')?.value;
        const imageInput = document.getElementById('imageInput');
        
        if (itemName && imageInput?.files?.[0]) {
          window.createCard(true); // Create preview
        } else {
          // Clear preview if insufficient data
          const previewContainer = document.getElementById('previewContainer');
          if (previewContainer) {
            previewContainer.innerHTML = '';
          }
        }
      } catch (error) {
        // Silently fail for preview updates
        console.log('Preview update skipped:', error.message);
      }
    }, 300);
  }

  /**
   * Setup card management functions
   */
  static setupCardManagement() {
    // Clear all cards
    window.clearAllCards = () => {
      const outputContainer = document.getElementById("outputContainer");
      const previewContainer = document.getElementById("previewContainer");
      
      if (outputContainer) outputContainer.innerHTML = '';
      if (previewContainer) previewContainer.innerHTML = '';
      
      this.cardsData = [];
      Messages.showSuccess('All cards cleared');
    };

    // Clear individual card
    window.clearCard = (cardElement) => {
      if (!cardElement) return;
      
      const cardIndex = Array.from(cardElement.parentNode.children).indexOf(cardElement);
      if (cardIndex >= 0 && cardIndex < this.cardsData.length) {
        this.cardsData.splice(cardIndex, 1);
      }
      
      cardElement.remove();
    };

    // Setup clear all button
    const clearAllButton = document.querySelector('button[onclick="clearAllCards()"]');
    if (clearAllButton) {
      clearAllButton.onclick = () => {
        if (this.cardsData.length > 0) {
          Messages.showConfirmation(
            'Are you sure you want to clear all cards? This action cannot be undone.',
            () => window.clearAllCards(),
            () => {}
          );
        } else {
          Messages.showInfo('No cards to clear');
        }
      };
    }
  }

  /**
   * Setup global variables for backward compatibility
   */
  static setupGlobalVariables() {
    // Make cardsData available globally for export functions
    window.cardsData = this.cardsData;

    // Setup export functions
    window.exportAllCardsAsData = () => {
      ExportImport.exportAllCardsAsData(this.cardsData);
    };

    window.exportAllCardsAsPNG = () => {
      const cards = document.querySelectorAll('.card');
      ExportImport.exportAllCardsAsPNG(Array.from(cards));
    };

    window.importCardData = (event) => {
      ExportImport.importData(event, 'cards');
    };

    window.triggerImport = () => {
      ExportImport.triggerFileInput('.json', window.importCardData);
    };

    // Setup dynamic input functions - use existing Forms methods
    window.addTagInput = () => {
      Forms.addTagInput();
    };

    window.addPassiveInput = () => {
      Forms.addPassiveInput();
    };

    window.addOnUseInput = () => {
      Forms.addOnUseInput();
    };
  }

  /**
   * Reset form with default effects
   */
  static resetForm() {
    Forms.resetForm();
    this.cardsData = [];
    window.cardsData = this.cardsData;
  }

  /**
   * Get current form data
   * @returns {Object} Current form data
   */
  static getCurrentFormData() {
    return Forms.getFormData();
  }

  /**
   * Set form data
   * @param {Object} data - Form data to set
   */
  static setFormData(data) {
    Forms.setFormData(data);
  }

  // ... rest of the existing methods remain the same ...

  /**
   * Get all generated cards data
   * @returns {Array} Array of card data objects
   */
  static getAllCards() {
    return [...this.cardsData];
  }

  /**
   * Add a card from external source (like import)
   * @param {Object} cardData - Card data to add
   */
  static addCard(cardData) {
    const cardElement = CardGenerator.createCard({
      data: cardData,
      container: document.getElementById('outputContainer'),
      mode: 'generator'
    });

    if (cardElement) {
      this.cardsData.push(cardData);
      window.cardsData = this.cardsData;
    }

    return cardElement;
  }

  /**
   * Show card generation statistics
   */
  static showStatistics() {
    const stats = this.getStatistics();
    
    const statsHtml = `
      <div class="generation-stats">
        <h3>Card Generation Statistics</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">${stats.totalCards}</div>
            <div class="stat-label">Total Cards</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.heroCount}</div>
            <div class="stat-label">Heroes Used</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.averageEffects}</div>
            <div class="stat-label">Avg Effects</div>
          </div>
        </div>
        <div class="stats-breakdown">
          <h4>Cards by Hero:</h4>
          ${Object.entries(stats.cardsByHero)
            .map(([hero, count]) => `<div>${hero}: ${count}</div>`)
            .join('')}
        </div>
        <div class="stats-breakdown">
          <h4>Cards by Rarity:</h4>
          ${Object.entries(stats.cardsByRarity)
            .map(([rarity, count]) => `<div>${rarity}: ${count}</div>`)
            .join('')}
        </div>
      </div>
    `;

    console.log('Card Statistics:', stats);
    return statsHtml;
  }

  /**
   * Get generation statistics
   * @returns {Object} Statistics object
   */
  static getStatistics() {
    const cardsByHero = {};
    const cardsByRarity = {};
    let totalEffects = 0;

    this.cardsData.forEach(card => {
      // Count by hero
      const hero = card.hero || 'Neutral';
      cardsByHero[hero] = (cardsByHero[hero] || 0) + 1;

      // Count by rarity
      const rarity = card.border || 'gold';
      cardsByRarity[rarity] = (cardsByRarity[rarity] || 0) + 1;

      // Count effects
      const effectCount = (card.onUseEffects?.length || 0) + (card.passiveEffect ? 1 : 0);
      totalEffects += effectCount;
    });

    return {
      totalCards: this.cardsData.length,
      heroCount: Object.keys(cardsByHero).length,
      averageEffects: this.cardsData.length > 0 ? (totalEffects / this.cardsData.length).toFixed(1) : 0,
      cardsByHero,
      cardsByRarity
    };
  }

  /**
   * Setup keyboard shortcuts specific to card generation
   */
  static setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+G to generate card
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        const generateButton = document.querySelector('button[onclick="createCard()"]');
        if (generateButton && !generateButton.disabled) {
          window.createCard(false);
        }
      }

      // Ctrl+Shift+C to clear all cards
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (this.cardsData.length > 0) {
          Messages.showConfirmation(
            'Clear all cards?',
            () => window.clearAllCards(),
            () => {}
          );
        }
      }

      // Ctrl+E to export cards
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (this.cardsData.length > 0) {
          window.exportAllCardsAsData();
        } else {
          Messages.showInfo('No cards to export');
        }
      }
    });
  }

  /**
   * Setup auto-save functionality
   */
  static setupAutoSave() {
    // Auto-save cards data to localStorage every 30 seconds
    setInterval(() => {
      if (this.cardsData.length > 0) {
        try {
          localStorage.setItem('bazaargen_cards_autosave', JSON.stringify({
            timestamp: new Date().toISOString(),
            cards: this.cardsData
          }));
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 30000);

    // Restore auto-saved data on page load
    try {
      const autoSaveData = localStorage.getItem('bazaargen_cards_autosave');
      if (autoSaveData) {
        const parsed = JSON.parse(autoSaveData);
        const saveTime = new Date(parsed.timestamp);
        const now = new Date();
        
        // Only restore if save is less than 1 hour old
        if (now - saveTime < 60 * 60 * 1000) {
          Messages.showConfirmation(
            `Found auto-saved data from ${saveTime.toLocaleString()}. Restore ${parsed.cards.length} cards?`,
            () => {
              parsed.cards.forEach(cardData => this.addCard(cardData));
              Messages.showSuccess(`Restored ${parsed.cards.length} cards from auto-save`);
            },
            () => {
              localStorage.removeItem('bazaargen_cards_autosave');
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to restore auto-save:', error);
    }
  }
}

// Auto-initialize
IndexPageController.init();

// Setup additional features
document.addEventListener('DOMContentLoaded', () => {
  IndexPageController.setupKeyboardShortcuts();
  IndexPageController.setupAutoSave();
});
