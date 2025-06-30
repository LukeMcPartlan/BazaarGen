/**
 * Enhanced Export and Import Utilities with Bulk Upload Support
 * Handles data export/import for cards and skills with progress tracking
 */
class ExportImport {
  
  /**
   * Export all cards as JSON data (unchanged)
   */
  static exportAllCardsAsData(cardsData) {
    if (!cardsData || cardsData.length === 0) {
      Messages.showError('No cards to export!');
      return;
    }

    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "cards",
      count: cardsData.length,
      collection: {
        name: `Card Collection ${this.getDateString()}`,
        description: `${cardsData.length} cards exported from BazaarGen`,
        created_by: GoogleAuth?.getUserDisplayName() || 'Unknown'
      },
      cards: cardsData
    };

    this.downloadJSON(dataToExport, `Bazaar-cards-${this.getDateString()}.json`);
    Messages.showSuccess(`Exported ${cardsData.length} cards successfully!`);
  }

  /**
   * Enhanced import with bulk processing and progress tracking
   */
  static async importData(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileContent = await this.readFileAsText(file);
      const importedData = JSON.parse(fileContent);
      
      // Validate import data
      const validation = Validation.validateImportData(importedData, type);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const itemsArray = importedData[type] || [];
      const totalItems = itemsArray.length;

      if (totalItems === 0) {
        Messages.showError(`No ${type} found in the imported file.`);
        return;
      }

      // Show bulk import confirmation for multiple items
      if (totalItems > 1) {
        const collectionName = importedData.collection?.name || `${totalItems} ${type}`;
        const confirmMessage = `Import ${totalItems} ${type} from "${collectionName}"?`;
        
        const confirmed = await this.showBulkImportConfirmation(confirmMessage, importedData);
        if (!confirmed) {
          Messages.showInfo('Import cancelled');
          return;
        }
      }

      // Bulk validation first
      console.log('🔍 Validating all items before import...');
      const validationErrors = [];
      
      for (let i = 0; i < itemsArray.length; i++) {
        const item = itemsArray[i];
        let itemValidation;
        
        if (type === 'cards') {
          itemValidation = Validation.validateCardData(item);
        } else if (type === 'skills') {
          itemValidation = Validation.validateSkillData(item);
        }
        
        if (!itemValidation.valid) {
          validationErrors.push(`Item ${i + 1}: ${itemValidation.error}`);
        }
      }

      if (validationErrors.length > 0) {
        const errorMessage = `Found ${validationErrors.length} validation errors:\n\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? '\n...and more' : ''}`;
        Messages.showError(errorMessage);
        return;
      }

      // Show progress for bulk imports
      const progressModal = totalItems > 1 ? this.createProgressModal(totalItems) : null;

      let importedCount = 0;
      let errors = [];

      // Import items with progress tracking
      for (let i = 0; i < itemsArray.length; i++) {
        try {
          if (progressModal) {
            this.updateProgress(progressModal, i + 1, totalItems, itemsArray[i]);
          }

          if (type === 'cards') {
            await this.importSingleCard(itemsArray[i]);
          } else if (type === 'skills') {
            await this.importSingleSkill(itemsArray[i]);
          }
          
          importedCount++;
          
          // Small delay for UI updates on large imports
          if (totalItems > 5 && i < itemsArray.length - 1) {
            await this.delay(100);
          }
          
        } catch (error) {
          console.error(`Error importing ${type.slice(0, -1)} ${i + 1}:`, error);
          errors.push(`Item ${i + 1}: ${error.message}`);
        }
      }

      // Close progress modal
      if (progressModal) {
        progressModal.remove();
      }

      // Show results
      if (importedCount > 0) {
        const successMessage = totalItems > 1 
          ? `Successfully imported ${importedCount}/${totalItems} ${type}!`
          : `Successfully imported ${type.slice(0, -1)}!`;
        Messages.showSuccess(successMessage);

        // Add collection metadata to imported cards for gallery
        if (totalItems > 1 && importedData.collection) {
          this.markAsCollection(importedData.collection, importedCount);
        }
      }

      if (errors.length > 0) {
        console.warn('Import errors:', errors);
        if (errors.length <= 3) {
          Messages.showWarning(`Some items failed to import: ${errors.join(', ')}`);
        } else {
          Messages.showWarning(`${errors.length} items failed to import. Check console for details.`);
        }
      }

      if (importedCount === 0) {
        Messages.showError(`No ${type} could be imported from this file.`);
      }

    } catch (error) {
      Messages.showError('Error reading file: ' + error.message);
    } finally {
      // Clear the input
      event.target.value = '';
    }
  }

  /**
   * Show bulk import confirmation modal
   */
  static showBulkImportConfirmation(message, importData) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
      `;

      const collection = importData.collection || {};
      const preview = importData.cards?.slice(0, 3).map(card => card.itemName || 'Unnamed').join(', ') || '';
      const moreText = importData.cards?.length > 3 ? ` +${importData.cards.length - 3} more` : '';

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%);
          border: 2px solid rgb(251, 225, 183);
          border-radius: 15px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          color: rgb(251, 225, 183);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        ">
          <h3 style="margin: 0 0 15px 0; color: rgb(251, 225, 183); text-align: center;">
            📦 Bulk Import
          </h3>
          <p style="margin: 0 0 10px 0; font-size: 16px; text-align: center;">
            ${message}
          </p>
          ${collection.name ? `
            <div style="background: rgba(37, 26, 12, 0.5); padding: 15px; border-radius: 8px; margin: 15px 0;">
              <strong>Collection:</strong> ${collection.name}<br>
              ${collection.description ? `<em>${collection.description}</em><br>` : ''}
              ${collection.created_by ? `<small>Created by: ${collection.created_by}</small><br>` : ''}
            </div>
          ` : ''}
          ${preview ? `
            <div style="background: rgba(37, 26, 12, 0.3); padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 14px;">
              <strong>Preview:</strong> ${preview}${moreText}
            </div>
          ` : ''}
          <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove(); resolve(false);" 
                    style="padding: 10px 20px; border: 2px solid rgb(251, 225, 183); background: transparent; color: rgb(251, 225, 183); border-radius: 6px; cursor: pointer;">
              Cancel
            </button>
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove(); resolve(true);"
                    style="padding: 10px 20px; border: none; background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%); color: rgb(37, 26, 12); border-radius: 6px; cursor: pointer; font-weight: bold;">
              Import All
            </button>
          </div>
        </div>
      `;

      // Make resolve available to buttons
      modal.resolve = resolve;

      // Close on overlay click
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      };

      document.body.appendChild(modal);
    });
  }

  /**
   * Create progress modal for bulk operations
   */
  static createProgressModal(totalItems) {
    const modal = document.createElement('div');
    modal.className = 'progress-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); z-index: 10001;
      display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%);
        border: 2px solid rgb(251, 225, 183);
        border-radius: 15px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        color: rgb(251, 225, 183);
        text-align: center;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      ">
        <h3 style="margin: 0 0 20px 0;">⚔️ Importing Cards ⚔️</h3>
        <div class="progress-info">
          <div class="progress-text" style="margin-bottom: 15px; font-size: 16px;">
            Processing item <span class="current-item">1</span> of <span class="total-items">${totalItems}</span>
          </div>
          <div class="current-item-name" style="margin-bottom: 15px; font-style: italic; color: rgb(218, 165, 32);"></div>
          <div class="progress-bar-container" style="width: 100%; background: rgba(37, 26, 12, 0.5); border-radius: 10px; overflow: hidden; height: 20px;">
            <div class="progress-bar" style="height: 100%; background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%); width: 0%; transition: width 0.3s ease;"></div>
          </div>
          <div class="progress-percentage" style="margin-top: 10px; font-size: 14px;">0%</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Update progress modal
   */
  static updateProgress(modal, current, total, currentItem) {
    const percentage = Math.round((current / total) * 100);
    
    modal.querySelector('.current-item').textContent = current;
    modal.querySelector('.total-items').textContent = total;
    modal.querySelector('.current-item-name').textContent = currentItem.itemName || currentItem.skillName || 'Processing...';
    modal.querySelector('.progress-bar').style.width = percentage + '%';
    modal.querySelector('.progress-percentage').textContent = percentage + '%';
  }

  /**
   * Mark imported items as part of a collection
   */
  static markAsCollection(collectionInfo, itemCount) {
    // Store collection info for gallery functionality
    const collectionData = {
      ...collectionInfo,
      itemCount: itemCount,
      importedAt: new Date().toISOString()
    };
    
    try {
      // Save to sessionStorage for current session
      const existingCollections = JSON.parse(sessionStorage.getItem('bazaargen_collections') || '[]');
      existingCollections.push(collectionData);
      sessionStorage.setItem('bazaargen_collections', JSON.stringify(existingCollections));
      
      console.log('📦 Collection marked:', collectionData);
    } catch (error) {
      console.warn('Failed to save collection info:', error);
    }
  }

  // ... rest of the existing methods remain the same ...
  
  /**
   * Export all skills as JSON data (unchanged)
   */
  static exportAllSkillsAsData(skillsData) {
    if (!skillsData || skillsData.length === 0) {
      Messages.showError('No skills to export!');
      return;
    }

    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "skills",
      count: skillsData.length,
      collection: {
        name: `Skill Collection ${this.getDateString()}`,
        description: `${skillsData.length} skills exported from BazaarGen`,
        created_by: GoogleAuth?.getUserDisplayName() || 'Unknown'
      },
      skills: skillsData
    };

    this.downloadJSON(dataToExport, `Bazaar-skills-${this.getDateString()}.json`);
    Messages.showSuccess(`Exported ${skillsData.length} skills successfully!`);
  }

  /**
   * Import single card (unchanged)
   */
  static async importSingleCard(cardData) {
    if (!window.CardGenerator) {
      throw new Error('CardGenerator not available');
    }

    const outputContainer = document.getElementById("outputContainer");
    if (!outputContainer) {
      throw new Error('Output container not found');
    }

    const cardElement = await CardGenerator.createCard({
      data: cardData,
      container: outputContainer,
      mode: 'generator'
    });

    if (!cardElement) {
      throw new Error('Failed to create card element');
    }
  }

  /**
   * Import single skill (unchanged)
   */
  static async importSingleSkill(skillData) {
    if (!window.SkillGenerator) {
      throw new Error('SkillGenerator not available');
    }

    const outputContainer = document.getElementById("outputContainer");
    if (!outputContainer) {
      throw new Error('Output container not found');
    }

    const skillElement = SkillGenerator.createSkill({
      data: skillData,
      container: outputContainer,
      mode: 'generator'
    });

    if (!skillElement) {
      throw new Error('Failed to create skill element');
    }
  }

  // ... rest of helper methods remain the same ...

  /**
   * Create delay for sequential operations
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Read file as text
   */
  static readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get formatted date string for filenames
   */
  static getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Download JSON data as file
   */
  static downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    this.downloadBlob(dataBlob, filename);
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // ... rest of the existing methods remain unchanged ...
}

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File content as text
   */
  static readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get formatted date string for filenames
   * @returns {string} Date string in YYYY-MM-DD format
   */
  static getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Create delay for sequential operations
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Trigger file input for import
   * @param {string} accept - File types to accept
   * @param {Function} callback - Callback function for file selection
   * @returns {void}
   */
  static triggerFileInput(accept = '.json', callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    
    input.addEventListener('change', callback);
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  /**
   * Setup export/import event listeners
   * @returns {void}
   */
  static setupEventListeners() {
    // Global functions for HTML onclick handlers
    window.exportAllCardsAsData = () => {
      this.exportAllCardsAsData(window.cardsData || []);
    };

    window.exportAllSkillsAsData = () => {
      this.exportAllSkillsAsData(window.skillsData || []);
    };

    window.exportAllCardsAsPNG = () => {
      const cards = document.querySelectorAll('.card');
      this.exportAllCardsAsPNG(Array.from(cards));
    };

    window.exportSingleCardAsData = (cardData) => {
      this.exportSingleCardAsData(cardData);
    };

    window.exportSingleSkillAsData = (skillData) => {
      this.exportSingleSkillAsData(skillData);
    };

    window.exportCardAsPNG = (cardElement) => {
      this.exportCardAsPNG(cardElement);
    };

    window.triggerImport = () => {
      this.triggerFileInput('.json', (event) => {
        const currentPage = window.location.pathname.includes('skills') ? 'skills' : 'cards';
        this.importData(event, currentPage);
      });
    };

    window.importCardData = (event) => {
      this.importData(event, 'cards');
    };

    window.importSkillData = (event) => {
      this.importData(event, 'skills');
    };
  }

  /**
   * Setup export menu for individual items
   * @param {HTMLElement} button - Export button element
   * @param {Object} itemData - Item data (card or skill)
   * @param {string} type - 'card' or 'skill'
   * @returns {void}
   */
  static setupExportMenu(button, itemData, type) {
    // Close all other export menus
    document.querySelectorAll('.export-menu').forEach(menu => {
      if (menu.parentElement !== button.parentElement) {
        menu.classList.remove('show');
      }
    });

    let menu = button.parentElement.querySelector('.export-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'export-menu';
      
      const dataOption = document.createElement('div');
      dataOption.className = 'export-option';
      dataOption.textContent = 'Export as Data';
      dataOption.onclick = () => {
        if (type === 'card') {
          this.exportSingleCardAsData(itemData);
        } else {
          this.exportSingleSkillAsData(itemData);
        }
        menu.classList.remove('show');
      };
      
      const pngOption = document.createElement('div');
      pngOption.className = 'export-option';
      pngOption.textContent = 'Save as PNG';
      pngOption.onclick = () => {
        const element = button.closest(type === 'card' ? '.card' : '.skill-card');
        if (type === 'card') {
          this.exportCardAsPNG(element);
        } else {
          this.exportSkillAsPNG(element);
        }
        menu.classList.remove('show');
      };
      
      menu.appendChild(dataOption);
      menu.appendChild(pngOption);
      button.parentElement.appendChild(menu);
    }

    menu.classList.toggle('show');
  }

  /**
   * Get export statistics
   * @returns {Object} Export statistics
   */
  static getExportStats() {
    return {
      totalCards: window.cardsData?.length || 0,
      totalSkills: window.skillsData?.length || 0,
      lastExport: localStorage.getItem('bazaargen_last_export') || 'Never',
      exportCount: parseInt(localStorage.getItem('bazaargen_export_count') || '0')
    };
  }

  /**
   * Update export statistics
   * @param {string} type - Export type ('cards' or 'skills')
   * @param {number} count - Number of items exported
   * @returns {void}
   */
  static updateExportStats(type, count) {
    const currentCount = parseInt(localStorage.getItem('bazaargen_export_count') || '0');
    localStorage.setItem('bazaargen_export_count', (currentCount + count).toString());
    localStorage.setItem('bazaargen_last_export', new Date().toISOString());
  }
}

// Auto-setup event listeners
ExportImport.setupEventListeners();

// Global function for export menu (used in HTML)
window.toggleExportMenu = (button, itemData) => {
  const type = button.className.includes('card') ? 'card' : 'skill';
  ExportImport.setupExportMenu(button, itemData, type);
};
   
