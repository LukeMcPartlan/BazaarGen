/**
 * Export and Import Utilities
 * Handles data export/import for cards and skills
 */
class ExportImport {
  
  /**
   * Export all cards as JSON data
   * @param {Array} cardsData - Array of card data objects
   * @returns {void}
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
      cards: cardsData
    };

    this.downloadJSON(dataToExport, `Bazaar-cards-${this.getDateString()}.json`);
    Messages.showSuccess(`Exported ${cardsData.length} cards successfully!`);
  }

  /**
   * Export all skills as JSON data
   * @param {Array} skillsData - Array of skill data objects
   * @returns {void}
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
      skills: skillsData
    };

    this.downloadJSON(dataToExport, `Bazaar-skills-${this.getDateString()}.json`);
    Messages.showSuccess(`Exported ${skillsData.length} skills successfully!`);
  }

  /**
   * Export single card as JSON data
   * @param {Object} cardData - Card data object
   * @returns {void}
   */
  static exportSingleCardAsData(cardData) {
    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "cards",
      count: 1,
      cards: [cardData]
    };

    const filename = `${cardData.itemName.replace(/\s+/g, '-')}-card.json`;
    this.downloadJSON(dataToExport, filename);
    Messages.showSuccess('Card exported successfully!');
  }

  /**
   * Export single skill as JSON data
   * @param {Object} skillData - Skill data object
   * @returns {void}
   */
  static exportSingleSkillAsData(skillData) {
    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "skills",
      count: 1,
      skills: [skillData]
    };

    const filename = `${skillData.skillName.replace(/\s+/g, '-')}-skill.json`;
    this.downloadJSON(dataToExport, filename);
    Messages.showSuccess('Skill exported successfully!');
  }

  /**
   * Export all cards as PNG images
   * @param {Array} cardElements - Array of card DOM elements
   * @returns {void}
   */
  static async exportAllCardsAsPNG(cardElements) {
    if (!cardElements || cardElements.length === 0) {
      Messages.showError('No cards to export!');
      return;
    }

    Messages.showInfo('Generating PNG files...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < cardElements.length; i++) {
      try {
        await this.exportCardAsPNG(cardElements[i]);
        successCount++;
        
        // Small delay between exports to avoid overwhelming the browser
        if (i < cardElements.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`Failed to export card ${i + 1}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      Messages.showSuccess(`Exported ${successCount} cards as PNG!`);
    }
    if (errorCount > 0) {
      Messages.showWarning(`Failed to export ${errorCount} cards.`);
    }
  }

  /**
   * Export single card as PNG image
   * @param {HTMLElement} cardElement - Card DOM element
   * @returns {Promise<void>}
   */
  static async exportCardAsPNG(cardElement) {
    if (!window.html2canvas) {
      throw new Error('html2canvas library not loaded');
    }

    const visualContent = cardElement.querySelector('.card-visual-content');
    if (!visualContent) {
      throw new Error('Card visual content not found');
    }

    // Temporarily fix background for PNG export
    const cardContent = visualContent.querySelector('.card-content');
    let originalBackground = '';
    
    if (cardContent) {
      originalBackground = cardContent.style.background;
      cardContent.style.setProperty('background', 'rgb(45, 35, 22)', 'important');
    }

    try {
      const canvas = await html2canvas(visualContent, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });

      // Create final canvas with watermark
      const finalCanvas = this.addWatermarkToCanvas(canvas);
      
      // Get item name for filename
      const itemName = cardElement.querySelector('.item-title')?.textContent || 'card';
      const filename = `${itemName.replace(/\s+/g, '-')}-card.png`;
      
      this.downloadCanvas(finalCanvas, filename);

    } finally {
      // Restore original background
      if (cardContent) {
        cardContent.style.background = originalBackground;
      }
    }
  }

  /**
   * Export single skill as PNG image
   * @param {HTMLElement} skillElement - Skill DOM element
   * @returns {Promise<void>}
   */
  static async exportSkillAsPNG(skillElement) {
    if (!window.html2canvas) {
      throw new Error('html2canvas library not loaded');
    }

    try {
      const canvas = await html2canvas(skillElement, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });

      // Create final canvas with watermark
      const finalCanvas = this.addWatermarkToCanvas(canvas);
      
      // Get skill name for filename
      const skillName = skillElement.querySelector('.skill-title')?.textContent || 'skill';
      const filename = `${skillName.replace(/\s+/g, '-')}-skill.png`;
      
      this.downloadCanvas(finalCanvas, filename);

    } catch (error) {
      console.error('Error exporting skill as PNG:', error);
      throw error;
    }
  }

  /**
   * Import card/skill data from JSON file
   * @param {Event} event - File input change event
   * @param {string} type - 'cards' or 'skills'
   * @returns {Promise<void>}
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

      let importedCount = 0;
      const itemsArray = importedData[type] || [];

      for (const itemData of itemsArray) {
        try {
          if (type === 'cards') {
            await this.importSingleCard(itemData);
          } else if (type === 'skills') {
            await this.importSingleSkill(itemData);
          }
          importedCount++;
        } catch (error) {
          console.error(`Error importing ${type.slice(0, -1)}:`, error);
        }
      }

      if (importedCount > 0) {
        Messages.showSuccess(`Successfully imported ${importedCount} ${type}!`);
      } else {
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
   * Import single card
   * @param {Object} cardData - Card data to import
   * @returns {Promise<void>}
   */
  static async importSingleCard(cardData) {
    if (!window.CardGenerator) {
      throw new Error('CardGenerator not available');
    }

    const outputContainer = document.getElementById("outputContainer");
    if (!outputContainer) {
      throw new Error('Output container not found');
    }

    const cardElement = CardGenerator.createCard({
      data: cardData,
      container: outputContainer,
      mode: 'generator'
    });

    if (!cardElement) {
      throw new Error('Failed to create card element');
    }
  }

  /**
   * Import single skill
   * @param {Object} skillData - Skill data to import
   * @returns {Promise<void>}
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

  /**
   * Add watermark to canvas
   * @param {HTMLCanvasElement} canvas - Original canvas
   * @returns {HTMLCanvasElement} Canvas with watermark
   */
  static addWatermarkToCanvas(canvas) {
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    
    // Set final canvas size (original + space for watermark)
    const watermarkHeight = 30;
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height + watermarkHeight;
    
    // Draw original content
    ctx.drawImage(canvas, 0, 0);
    
    // Add watermark text
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Created on BazaarGen.com', finalCanvas.width / 2, canvas.height + 20);
    
    return finalCanvas;
  }

  /**
   * Download JSON data as file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename for download
   * @returns {void}
   */
  static downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    this.downloadBlob(dataBlob, filename);
  }

  /**
   * Download canvas as PNG file
   * @param {HTMLCanvasElement} canvas - Canvas to download
   * @param {string} filename - Filename for download
   * @returns {void}
   */
  static downloadCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      this.downloadBlob(blob, filename);
    }, 'image/png');
  }

  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename for download
   * @returns {void}
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
   