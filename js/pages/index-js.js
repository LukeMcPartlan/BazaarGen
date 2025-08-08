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
      this.setupDefaultEffects();
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
          formData: true,
          isPreview: isPreview,
          container: isPreview ? document.getElementById('previewContainer') : document.getElementById('outputContainer'),
          includeControls: !isPreview,
          mode: isPreview ? 'preview' : 'generator'
        });

        if (cardElement && !isPreview) {
          // IMPORTANT: Get the card data that was just created
          const cardData = await CardGenerator.extractFormData();
          
          // Initialize cardsData array if it doesn't exist
          if (!window.cardsData) {
            window.cardsData = [];
          }
          
          // Add card data to the array
          window.cardsData.push(cardData);
          const cardIndex = window.cardsData.length - 1;
          
          // CRITICAL: Attach card data to the card element for export functions
          cardElement.cardData = cardData;
          cardElement.cardIndex = cardIndex;
          
          // Also update IndexPageController's array if it exists
          if (window.IndexPageController && IndexPageController.cardsData) {
            IndexPageController.cardsData.push(cardData);
          }
          
          // Setup the save buttons on this specific card
          this.setupCardSaveButtons(cardElement, cardData, cardIndex);
          
          // Dispatch event for gallery manager
          document.dispatchEvent(new CustomEvent('cardCreated', {
            detail: { 
              cardElement: cardElement,
              cardData: cardData
            }
          }));
        }

        return cardElement;
      } catch (error) {
        console.error('Error in createCard:', error);
        if (typeof Messages !== 'undefined') {
          Messages.showError(error.message);
        }
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
   * Setup save buttons for a specific card
   */
  static setupCardSaveButtons(cardElement, cardData, cardIndex) {
    console.log('🔧 Setting up save buttons for card:', cardData.itemName);
    
    // Find different types of buttons in this card
    const databaseButtons = cardElement.querySelectorAll('button[onclick*="🗃️"], .save-to-database, .database-save');
    const exportButtons = cardElement.querySelectorAll('button[onclick*="💾"], .export-menu-button, .export-button');
    const saveButtons = cardElement.querySelectorAll('button[class*="save"], .save-button');
    
    // Setup database save buttons (🗃️)
    databaseButtons.forEach(button => {
      console.log('🗃️ Found database save button:', button.textContent);
      
      // Remove any existing onclick handlers
      button.removeAttribute('onclick');
      
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🗃️ Database save clicked for card:', cardData.itemName);
        this.saveCardToDatabase(cardElement, cardData, button);
      };
    });

    // Setup export menu buttons (💾)
    exportButtons.forEach(button => {
      console.log('💾 Found export menu button:', button.textContent);
      
      // Remove any existing onclick handlers
      button.removeAttribute('onclick');
      
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('💾 Export menu clicked for card:', cardData.itemName);
        this.showCardExportMenu(button, cardElement, cardData);
      };
    });

    // Handle generic save buttons by checking their text/emoji content
    saveButtons.forEach(button => {
      const buttonText = button.textContent || button.innerHTML;
      
      if (buttonText.includes('🗃️') || buttonText.toLowerCase().includes('database')) {
        // Database save button
        console.log('🗃️ Found generic database save button:', buttonText);
        button.removeAttribute('onclick');
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.saveCardToDatabase(cardElement, cardData, button);
        };
      } else if (buttonText.includes('💾') || buttonText.toLowerCase().includes('export')) {
        // Export menu button  
        console.log('💾 Found generic export button:', buttonText);
        button.removeAttribute('onclick');
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showCardExportMenu(button, cardElement, cardData);
        };
      } else {
        // Fallback: if button has "save" in class but no specific emoji, make it database save
        console.log('🗃️ Generic save button, defaulting to database save:', buttonText);
        button.removeAttribute('onclick');
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.saveCardToDatabase(cardElement, cardData, button);
        };
      }
    });

    // Also setup any dropdown menus that might exist
    const exportMenus = cardElement.querySelectorAll('.export-menu, .save-menu');
    exportMenus.forEach(menu => {
      const pngOption = menu.querySelector('[data-action="png"], .export-png');
      const dataOption = menu.querySelector('[data-action="data"], .export-data');
      
      if (pngOption) {
        pngOption.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.exportCardAsPNG(cardElement, cardData);
          menu.style.display = 'none';
        };
      }
      
      if (dataOption) {
        dataOption.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.exportCardAsData(cardData);
          menu.style.display = 'none';
        };
      }
    });
  }

  /**
   * Save card to database (Supabase)
   */
  static async saveCardToDatabase(cardElement, cardData, button) {
    console.log('🗃️ Saving card to database:', cardData.itemName);
    
    // Check if user is signed in
    if (typeof GoogleAuth === 'undefined' || !GoogleAuth.isSignedIn()) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('Please sign in to save cards to the database');
      } else {
        alert('Please sign in to save cards to the database');
      }
      return;
    }

    // Check if SupabaseClient is available
    if (typeof SupabaseClient === 'undefined') {
      console.error('SupabaseClient not available');
      if (typeof Messages !== 'undefined') {
        Messages.showError('Database not available. Please refresh the page.');
      } else {
        alert('Database not available. Please refresh the page.');
      }
      return;
    }

    // Update button state to show saving
    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    
    button.textContent = '⏳ Saving...';
    button.disabled = true;

    try {
      // Save to database using SupabaseClient
      const result = await SupabaseClient.saveItem(cardData);
      
      if (result.success) {
        // Success feedback
        button.textContent = '✅ Saved!';
        
        if (typeof Messages !== 'undefined') {
          Messages.showSuccess(`Card "${cardData.itemName}" saved to database!`);
        }
        
        // Reset button after 2 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = originalDisabled;
        }, 2000);
        
      } else {
        throw new Error(result.error || 'Failed to save to database');
      }
      
    } catch (error) {
      console.error('Error saving card to database:', error);
      
      // Error feedback
      button.textContent = '❌ Failed';
      
      if (typeof Messages !== 'undefined') {
        Messages.showError(`Failed to save card: ${error.message}`);
      } else {
        alert(`Failed to save card: ${error.message}`);
      }
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = originalDisabled;
      }, 3000);
    }
  }

  /**
   * Show export menu for a card (💾 button functionality)
   */
  static showCardExportMenu(button, cardElement, cardData) {
    console.log('💾 Showing export menu for:', cardData.itemName);
    
    // Close any existing menus
    document.querySelectorAll('.card-export-menu').forEach(menu => menu.remove());
    
    // Create new menu
    const menu = document.createElement('div');
    menu.className = 'card-export-menu';
    menu.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 140px;
      display: block;
    `;
    
    menu.innerHTML = `
      <div class="export-option" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;">
        🖼️ Save as PNG
      </div>
      <div class="export-option" style="padding: 8px 12px; cursor: pointer;">
        📄 Export Data
      </div>
    `;
    
    // Add event listeners
    const pngOption = menu.querySelector('.export-option:first-child');
    const dataOption = menu.querySelector('.export-option:last-child');
    
    pngOption.onclick = (e) => {
      e.stopPropagation();
      this.exportCardAsPNG(cardElement, cardData);
      menu.remove();
    };
    
    dataOption.onclick = (e) => {
      e.stopPropagation();
      this.exportCardAsData(cardData);
      menu.remove();
    };
    
    // Position menu relative to button
    const buttonRect = button.getBoundingClientRect();
    const parentRect = button.offsetParent.getBoundingClientRect();
    
    menu.style.top = (buttonRect.bottom - parentRect.top) + 'px';
    menu.style.right = (parentRect.right - buttonRect.right) + 'px';
    
    // Add to button's parent
    const parent = button.closest('.card, .card-wrapper') || button.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!menu.contains(e.target) && e.target !== button) {
          menu.remove();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 10);
  }

  /**
   * Export card as PNG
   */
  static exportCardAsPNG(cardElement, cardData) {
    console.log('🖼️ Exporting card as PNG:', cardData.itemName);
    
    if (typeof ExportImport !== 'undefined') {
      ExportImport.exportCardAsPNG(cardElement);
    } else {
      console.error('ExportImport not available');
      alert('Export functionality not available');
    }
  }

  /**
   * Export card as data
   */
  static exportCardAsData(cardData) {
    console.log('📄 Exporting card data:', cardData.itemName);
    
    if (typeof ExportImport !== 'undefined') {
      ExportImport.exportSingleCardAsData(cardData);
    } else {
      console.error('ExportImport not available');
      alert('Export functionality not available');
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
    
         // Add event listeners for custom scaling inputs that are created dynamically
     IndexPageController.setupCustomScalingEventListeners();

    // File input special handling
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', () => {
        this.handleFormChange();
      });
    }

    // Custom hero handling
    const heroSelect = document.getElementById('heroSelect');
    const customHeroGroup = document.getElementById('customHeroGroup');
    const customHeroInput = document.getElementById('customHeroInput');
    
    if (heroSelect) {
      heroSelect.addEventListener('change', () => {
        if (heroSelect.value === 'Custom') {
          customHeroGroup.style.display = 'block';
        } else {
          customHeroGroup.style.display = 'none';
          if (customHeroInput) {
            customHeroInput.value = '';
          }
        }
        this.handleFormChange();
      });
    }

    // Custom hero image input handling
    if (customHeroInput) {
      customHeroInput.addEventListener('change', () => {
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
      
      // IMPORTANT: Clear the cards data array
      window.cardsData = [];
      
      if (window.IndexPageController) {
        IndexPageController.cardsData = [];
      }
      
      // Exit gallery mode if active
      if (window.GalleryManager && GalleryManager.isGalleryMode) {
        GalleryManager.toggleGalleryMode();
      }
      
      if (typeof Messages !== 'undefined') {
        Messages.showSuccess('All cards cleared');
      }
    };

    // Setup clear all button
    const clearAllButton = document.querySelector('button[onclick="clearAllCards()"]');
    if (clearAllButton) {
      clearAllButton.onclick = () => {
        if (this.cardsData.length > 0) {
          if (typeof Messages !== 'undefined') {
            Messages.showConfirmation(
              'Are you sure you want to clear all cards? This action cannot be undone.',
              () => window.clearAllCards(),
              () => {}
            );
          } else {
            if (confirm('Are you sure you want to clear all cards? This action cannot be undone.')) {
              window.clearAllCards();
            }
          }
        } else {
          if (typeof Messages !== 'undefined') {
            Messages.showInfo('No cards to clear');
          } else {
            alert('No cards to clear');
          }
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
      if (typeof ExportImport !== 'undefined') {
        ExportImport.exportAllCardsAsData(this.cardsData);
      } else {
        console.error('ExportImport not available');
      }
    };

    window.exportAllCardsAsPNG = () => {
      const cards = document.querySelectorAll('.card, .card-wrapper');
      if (typeof ExportImport !== 'undefined') {
        ExportImport.exportAllCardsAsPNG(Array.from(cards));
      } else {
        console.error('ExportImport not available');
      }
    };

    window.importCardData = (event) => {
      if (typeof ExportImport !== 'undefined') {
        ExportImport.importData(event, 'cards');
      } else {
        console.error('ExportImport not available');
      }
    };

    window.triggerImport = () => {
      if (typeof ExportImport !== 'undefined') {
        ExportImport.triggerFileInput('.json', window.importCardData);
      } else {
        console.error('ExportImport not available');
      }
    };

    // Setup dynamic input functions - use existing Forms methods
    window.addTagInput = () => {
      if (typeof Forms !== 'undefined') {
        Forms.addTagInput();
      }
    };

    window.addPassiveInput = () => {
      if (typeof Forms !== 'undefined') {
        Forms.addPassiveInput();
      } else {
        this.addPassiveInput();
      }
    };

    window.addOnUseInput = () => {
      if (typeof Forms !== 'undefined') {
        Forms.addOnUseInput();
      } else {
        this.addOnUseInput();
      }
    };

    // Enhanced global functions for individual cards with proper separation
    window.saveCardToDatabase = (button) => {
      console.log('🗃️ Global saveCardToDatabase called');
      const cardElement = button.closest('.card, .card-wrapper');
      if (cardElement && cardElement.cardData) {
        this.saveCardToDatabase(cardElement, cardElement.cardData, button);
      } else {
        console.error('Card or card data not found');
      }
    };

    window.showExportMenu = (button) => {
      console.log('💾 Global showExportMenu called');
      const cardElement = button.closest('.card, .card-wrapper');
      if (cardElement && cardElement.cardData) {
        this.showCardExportMenu(button, cardElement, cardElement.cardData);
      } else {
        console.error('Card or card data not found');
      }
    };

    // Direct export functions (for when called from export menu)
    window.saveCardAsPNG = (button) => {
      console.log('🖼️ Global saveCardAsPNG called');
      const cardElement = button.closest('.card, .card-wrapper');
      if (cardElement && cardElement.cardData) {
        this.exportCardAsPNG(cardElement, cardElement.cardData);
      } else {
        console.error('Card or card data not found');
      }
    };

    window.saveCardAsData = (button) => {
      console.log('📄 Global saveCardAsData called');
      const cardElement = button.closest('.card, .card-wrapper');
      if (cardElement && cardElement.cardData) {
        this.exportCardAsData(cardElement.cardData);
      } else {
        console.error('Card data not found');
      }
    };

    // Legacy function name for compatibility
    window.showCardMenu = (button) => {
      console.log('📋 Global showCardMenu called (legacy)');
      window.showExportMenu(button);
    };

    // Edit card function
    window.editCard = (cardData) => {
      console.log('✏️ Global editCard called');
      this.editCard(cardData);
    };

    // Make Forms available globally for edit functionality
    window.Forms = window.Forms || (typeof Forms !== 'undefined' ? Forms : null);
  }

  /**
   * Reset form with default effects
   */
  static resetForm() {
    if (typeof Forms !== 'undefined') {
      Forms.resetForm();
    }
    this.cardsData = [];
    window.cardsData = this.cardsData;
  }

  /**
   * Get current form data
   * @returns {Object} Current form data
   */
  static getCurrentFormData() {
    if (typeof Forms !== 'undefined') {
      return Forms.getFormData();
    }
    return {};
  }

  /**
   * Set form data
   * @param {Object} data - Form data to set
   */
  static setFormData(data) {
    if (typeof Forms !== 'undefined') {
      Forms.setFormData(data);
    }
  }

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
    if (typeof CardGenerator === 'undefined') {
      console.error('CardGenerator not available');
      return null;
    }

    const cardElement = CardGenerator.createCard({
      data: cardData,
      container: document.getElementById('outputContainer'),
      mode: 'generator',
      skipValidation: true // Skip validation for externally added cards
    });

    if (cardElement) {
      this.cardsData.push(cardData);
      window.cardsData = this.cardsData;
      
      // Attach data to element
      cardElement.cardData = cardData;
      cardElement.cardIndex = this.cardsData.length - 1;
      
      // Setup save buttons
      this.setupCardSaveButtons(cardElement, cardData, this.cardsData.length - 1);
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
          if (typeof Messages !== 'undefined') {
            Messages.showConfirmation(
              'Clear all cards?',
              () => window.clearAllCards(),
              () => {}
            );
          } else {
            if (confirm('Clear all cards?')) {
              window.clearAllCards();
            }
          }
        }
      }

      // Ctrl+E to export cards
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (this.cardsData.length > 0) {
          window.exportAllCardsAsData();
        } else {
          if (typeof Messages !== 'undefined') {
            Messages.showInfo('No cards to export');
          } else {
            alert('No cards to export');
          }
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
          const restoreHandler = () => {
            parsed.cards.forEach(cardData => this.addCard(cardData));
            if (typeof Messages !== 'undefined') {
              Messages.showSuccess(`Restored ${parsed.cards.length} cards from auto-save`);
            } else {
              alert(`Restored ${parsed.cards.length} cards from auto-save`);
            }
          };

          const cancelHandler = () => {
            localStorage.removeItem('bazaargen_cards_autosave');
          };

          if (typeof Messages !== 'undefined') {
            Messages.showConfirmation(
              `Found auto-saved data from ${saveTime.toLocaleString()}. Restore ${parsed.cards.length} cards?`,
              restoreHandler,
              cancelHandler
            );
          } else {
            if (confirm(`Found auto-saved data from ${saveTime.toLocaleString()}. Restore ${parsed.cards.length} cards?`)) {
              restoreHandler();
            } else {
              cancelHandler();
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore auto-save:', error);
    }
  }

  /**
   * Edit card - fill form with card data
   */
  static editCard(cardData) {
    console.log('✏️ Editing card:', cardData.itemName);
    
    try {
      // Fill in basic card info
      if (cardData.itemName) {
        document.getElementById('itemNameInput').value = cardData.itemName;
      }
      
      if (cardData.hero) {
        document.getElementById('heroSelect').value = cardData.hero;
        
        // Handle custom hero image
        if (cardData.hero === 'Custom' && cardData.customHeroImage) {
          const customHeroGroup = document.getElementById('customHeroGroup');
          const customHeroInput = document.getElementById('customHeroInput');
          
          if (customHeroGroup) {
            customHeroGroup.style.display = 'block';
          }
          
          if (customHeroInput && cardData.customHeroImage) {
            // Create a file from the data URL
            const base64Data = cardData.customHeroImage.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const file = new File([blob], 'custom-hero.png', { type: 'image/png' });
            
            // Create a new FileList-like object
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            // Set the file input
            customHeroInput.files = dataTransfer.files;
          }
        }
      }
      
      if (cardData.cooldown !== undefined) {
        document.getElementById('cooldownInput').value = cardData.cooldown;
      }
      
      if (cardData.ammo !== undefined) {
        document.getElementById('ammoInput').value = cardData.ammo;
      }
      
      if (cardData.itemSize) {
        document.getElementById('itemSizeSelect').value = cardData.itemSize;
      }
      
      if (cardData.border) {
        document.getElementById('borderSelect').value = cardData.border;
      }

      // Fill in scaling values
      if (cardData.scalingValues) {
        if (cardData.scalingValues.heal !== undefined) {
          document.getElementById('healScalingInput').value = cardData.scalingValues.heal;
        }
        if (cardData.scalingValues.regen !== undefined) {
          document.getElementById('regenScalingInput').value = cardData.scalingValues.regen;
        }
        if (cardData.scalingValues.shield !== undefined) {
          document.getElementById('shieldScalingInput').value = cardData.scalingValues.shield;
        }
        if (cardData.scalingValues.damage !== undefined) {
          document.getElementById('damageScalingInput').value = cardData.scalingValues.damage;
        }
        if (cardData.scalingValues.poison !== undefined) {
          document.getElementById('poisonScalingInput').value = cardData.scalingValues.poison;
        }
        if (cardData.scalingValues.burn !== undefined) {
          document.getElementById('burnScalingInput').value = cardData.scalingValues.burn;
        }
        
        // Handle custom scaling values
        if (cardData.scalingValues.custom && Array.isArray(cardData.scalingValues.custom)) {
          const customContainer = document.getElementById('customScalingContainer');
          customContainer.innerHTML = ''; // Clear existing custom inputs
          
          cardData.scalingValues.custom.forEach(customValue => {
            if (customValue.value) {
              // Add custom scaling input
              IndexPageController.addCustomScaling();
              
              // Get the last added input group
              const inputGroups = customContainer.querySelectorAll('.custom-scaling-input');
              const lastGroup = inputGroups[inputGroups.length - 1];
              
              if (lastGroup) {
                const valueInput = lastGroup.querySelector('.custom-scaling-value');
                const colorInput = lastGroup.querySelector('.custom-scaling-color');
                
                if (valueInput) {
                  valueInput.value = customValue.value;
                }
                
                if (colorInput && customValue.color) {
                  // Use the stored color value directly
                  colorInput.value = customValue.color;
                } else if (colorInput && customValue.hue !== undefined) {
                  // Fallback: Convert HSL back to hex for color picker (for backward compatibility)
                  const hue = customValue.hue;
                  const saturation = customValue.saturation || 1;
                  const lightness = customValue.brightness || 0.5;
                  
                  // Convert HSL to RGB to Hex
                  const h = hue / 360;
                  const s = saturation;
                  const l = lightness;
                  
                  const c = (1 - Math.abs(2 * l - 1)) * s;
                  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
                  const m = l - c / 2;
                  
                  let r, g, b;
                  if (h < 1/6) {
                    r = c; g = x; b = 0;
                  } else if (h < 2/6) {
                    r = x; g = c; b = 0;
                  } else if (h < 3/6) {
                    r = 0; g = c; b = x;
                  } else if (h < 4/6) {
                    r = 0; g = x; b = c;
                  } else if (h < 5/6) {
                    r = x; g = 0; b = c;
                  } else {
                    r = c; g = 0; b = x;
                  }
                  
                  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
                  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
                  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
                  
                  colorInput.value = `#${rHex}${gHex}${bHex}`;
                }
              }
            }
          });
        }
      }

      // Fill in passive effects
      if (cardData.passiveEffects && Array.isArray(cardData.passiveEffects)) {
        // Clear existing passive inputs
        const passiveContainer = document.getElementById('passiveInputs');
        passiveContainer.innerHTML = '';
        
        // Add passive effects
        cardData.passiveEffects.forEach((effect, index) => {
          if (index === 0) {
            // Add first input and set its value
            if (typeof Forms !== 'undefined' && Forms.addPassiveInput) {
              Forms.addPassiveInput();
            } else {
              // Fallback: create input manually
              const inputGroup = document.createElement("div");
              inputGroup.className = "passive-input-group";
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = "Enter passive effect description";
              input.className = "form-input";
              input.value = effect;
              inputGroup.appendChild(input);
              passiveContainer.appendChild(inputGroup);
            }
            const inputs = passiveContainer.querySelectorAll('input');
            if (inputs[0]) {
              inputs[0].value = effect;
            }
          } else {
            // Add additional inputs for other effects
            if (typeof Forms !== 'undefined' && Forms.addPassiveInput) {
              Forms.addPassiveInput();
            } else {
              // Fallback: create input manually
              const inputGroup = document.createElement("div");
              inputGroup.className = "passive-input-group";
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = "Enter passive effect description";
              input.className = "form-input";
              input.value = effect;
              inputGroup.appendChild(input);
              passiveContainer.appendChild(inputGroup);
            }
            const inputs = passiveContainer.querySelectorAll('input');
            if (inputs[index]) {
              inputs[index].value = effect;
            }
          }
        });
      }

      // Fill in tags
      if (cardData.tags && Array.isArray(cardData.tags)) {
        // Clear existing tag inputs
        const tagContainer = document.getElementById('tagInputs');
        tagContainer.innerHTML = '';
        
        // Add tags
        cardData.tags.forEach((tag, index) => {
          if (index === 0) {
            // Add first input and set its value
            if (typeof Forms !== 'undefined' && Forms.addTagInput) {
              Forms.addTagInput();
            } else {
              // Fallback: create input manually
              const inputGroup = document.createElement("div");
              inputGroup.className = "tag-input-group";
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = "Enter tag text";
              input.className = "form-input";
              input.value = tag;
              inputGroup.appendChild(input);
              tagContainer.appendChild(inputGroup);
            }
            const inputs = tagContainer.querySelectorAll('input');
            if (inputs[0]) {
              inputs[0].value = tag;
            }
          } else {
            // Add additional inputs for other tags
            if (typeof Forms !== 'undefined' && Forms.addTagInput) {
              Forms.addTagInput();
            } else {
              // Fallback: create input manually
              const inputGroup = document.createElement("div");
              inputGroup.className = "tag-input-group";
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = "Enter tag text";
              input.className = "form-input";
              input.value = tag;
              inputGroup.appendChild(input);
              tagContainer.appendChild(inputGroup);
            }
            const inputs = tagContainer.querySelectorAll('input');
            if (inputs[index]) {
              inputs[index].value = tag;
            }
          }
        });
      }

      // Fill in on-use effects
      if (cardData.onUseEffects && Array.isArray(cardData.onUseEffects)) {
        // Clear existing on-use inputs
        const onUseContainer = document.getElementById('onUseInputs');
        onUseContainer.innerHTML = '';
        
        // Add on-use effects
        cardData.onUseEffects.forEach((effect, index) => {
          if (index === 0) {
            // Add first input and set its value
            if (typeof Forms !== 'undefined' && Forms.addOnUseInput) {
              Forms.addOnUseInput();
            } else {
              // Fallback: create input manually
              const inputGroup = document.createElement("div");
              inputGroup.className = "on-use-input-group";
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = "Enter on use effect description";
              input.className = "form-input";
              input.value = effect;
              inputGroup.appendChild(input);
              onUseContainer.appendChild(inputGroup);
            }
            const inputs = onUseContainer.querySelectorAll('input');
            if (inputs[0]) {
              inputs[0].value = effect;
            }
          } else {
            // Add additional inputs for other effects
            if (typeof Forms !== 'undefined' && Forms.addOnUseInput) {
              Forms.addOnUseInput();
            } else {
              // Fallback: create input manually
              const inputGroup = document.createElement("div");
              inputGroup.className = "on-use-input-group";
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = "Enter on use effect description";
              input.className = "form-input";
              input.value = effect;
              inputGroup.appendChild(input);
              onUseContainer.appendChild(inputGroup);
            }
            const inputs = onUseContainer.querySelectorAll('input');
            if (inputs[index]) {
              inputs[index].value = effect;
            }
          }
        });
      }

      // Fill in crit and multicast
      if (cardData.crit !== undefined) {
        document.getElementById('critInput').value = cardData.crit;
      }
      
      if (cardData.multicast !== undefined) {
        document.getElementById('multicastInput').value = cardData.multicast;
      }

      // Handle image if present
      if (cardData.imageData) {
        // Create a file from the data URL
        const base64Data = cardData.imageData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], 'card-image.png', { type: 'image/png' });
        
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Set the file input
        const imageInput = document.getElementById('imageInput');
        imageInput.files = dataTransfer.files;
        
        // Trigger change event to update preview
        imageInput.dispatchEvent(new Event('change'));
      }

      // Show success message
      if (typeof Messages !== 'undefined') {
        Messages.showSuccess(`Card "${cardData.itemName}" loaded for editing`);
      } else {
        alert(`Card "${cardData.itemName}" loaded for editing`);
      }

      // Scroll to top of form
      document.querySelector('.form-column').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error editing card:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load card for editing: ' + error.message);
      } else {
        alert('Failed to load card for editing: ' + error.message);
      }
    }
  }
  
  // Custom scaling value functions
  static addCustomScaling() {
    // console.log('🎨 Adding custom scaling input group...');
    const container = document.getElementById('customScalingContainer');
    const customIndex = container.children.length;
    // console.log('🎨 Current custom scaling inputs:', customIndex);
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'custom-scaling-input';
    inputGroup.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      padding: 10px;
      background: rgba(74, 60, 46, 0.3);
      border-radius: 8px;
      border: 1px solid rgba(218, 165, 32, 0.3);
    `;
    
    // Value input
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'custom-scaling-value form-input';
    valueInput.placeholder = 'Value (e.g., 5)';
    valueInput.style.flex = '1';
    
    // Add event listener for value changes
    valueInput.addEventListener('input', function() {
      // console.log('🎨 Custom scaling value changed:', this.value);
      // console.log('🎨 Custom scaling color:', this.parentElement.querySelector('.custom-scaling-color').value);
    });
    
    // Color picker
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'custom-scaling-color';
    colorInput.value = '#00ff00';
    colorInput.style.width = '40px';
    colorInput.style.height = '30px';
    colorInput.style.border = 'none';
    colorInput.style.borderRadius = '4px';
    colorInput.style.cursor = 'pointer';
    
    // Add event listener for color changes
    colorInput.addEventListener('change', function() {
      // console.log('🎨 Custom scaling color changed:', this.value);
      // console.log('🎨 Custom scaling value:', this.parentElement.querySelector('.custom-scaling-value').value);
    });
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'form-button remove';
    removeBtn.innerHTML = '❌';
    removeBtn.style.padding = '5px 8px';
    removeBtn.onclick = function() {
      console.log('🎨 Removing custom scaling input group');
      container.removeChild(inputGroup);
    };
    
    inputGroup.appendChild(valueInput);
    inputGroup.appendChild(colorInput);
    inputGroup.appendChild(removeBtn);
    container.appendChild(inputGroup);
    
         // console.log('🎨 Custom scaling input group added successfully');
     // console.log('🎨 Total custom scaling inputs now:', container.children.length);
     
     // Setup event listeners for the new inputs
     IndexPageController.setupCustomScalingEventListeners();
   }
   
   /**
    * Setup event listeners for custom scaling inputs
    */
   static setupCustomScalingEventListeners() {
    const customScalingInputs = document.querySelectorAll('.custom-scaling-value, .custom-scaling-color');
         customScalingInputs.forEach(input => {
       // Remove existing listeners to avoid duplicates
       input.removeEventListener('input', IndexPageController.handleFormChange);
       input.removeEventListener('change', IndexPageController.handleFormChange);
      
             // Add new listeners
       input.addEventListener('input', () => {
         // console.log('🎨 Custom scaling input changed, triggering form update');
         IndexPageController.handleFormChange();
       });
       input.addEventListener('change', () => {
         console.log('🎨 Custom scaling input changed, triggering form update');
         IndexPageController.handleFormChange();
       });
    });
  }
}

// Auto-initialize
IndexPageController.init();

// Setup additional features
document.addEventListener('DOMContentLoaded', () => {
  IndexPageController.setupKeyboardShortcuts();
  IndexPageController.setupAutoSave();
});

// Make available globally
window.IndexPageController = IndexPageController;
window.addCustomScaling = IndexPageController.addCustomScaling;
