/**
 * Enhanced Export and Import Utilities with Bulk Upload Support
 * Handles data export/import for cards and skills with progress tracking
 */
class ExportImport {
  
  /**
   * Export all cards as JSON data
   */
  static exportAllCardsAsData(cardsData) {
    if (!cardsData || cardsData.length === 0) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('No cards to export!');
      } else {
        alert('No cards to export!');
      }
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
        created_by: (typeof GoogleAuth !== 'undefined' && GoogleAuth.getUserDisplayName()) || 'Unknown'
      },
      cards: cardsData
    };

    this.downloadJSON(dataToExport, `Bazaar-cards-${this.getDateString()}.json`);
    
    if (typeof Messages !== 'undefined') {
      Messages.showSuccess(`Exported ${cardsData.length} cards successfully!`);
    } else {
      alert(`Exported ${cardsData.length} cards successfully!`);
    }
  }

  /**
   * Export all skills as JSON data
   */
  static exportAllSkillsAsData(skillsData) {
    if (!skillsData || skillsData.length === 0) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('No skills to export!');
      } else {
        alert('No skills to export!');
      }
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
        created_by: (typeof GoogleAuth !== 'undefined' && GoogleAuth.getUserDisplayName()) || 'Unknown'
      },
      skills: skillsData
    };

    this.downloadJSON(dataToExport, `Bazaar-skills-${this.getDateString()}.json`);
    
    if (typeof Messages !== 'undefined') {
      Messages.showSuccess(`Exported ${skillsData.length} skills successfully!`);
    } else {
      alert(`Exported ${skillsData.length} skills successfully!`);
    }
  }

  /**
   * Export single card as JSON
   */
  static exportSingleCardAsData(cardData) {
    if (!cardData) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('No card data to export!');
      }
      return;
    }

    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "cards",
      count: 1,
      cards: [cardData]
    };

    const fileName = `${cardData.itemName || 'Card'}-${this.getDateString()}.json`;
    this.downloadJSON(dataToExport, fileName);
  }

  /**
   * Export single skill as JSON
   */
  static exportSingleSkillAsData(skillData) {
    if (!skillData) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('No skill data to export!');
      }
      return;
    }

    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "skills",
      count: 1,
      skills: [skillData]
    };

    const fileName = `${skillData.skillName || 'Skill'}-${this.getDateString()}.json`;
    this.downloadJSON(dataToExport, fileName);
  }

  /**
   * Export all cards as PNG images (with gradient removal)
   */
  static async exportAllCardsAsPNG(cardElements) {
    if (!cardElements || cardElements.length === 0) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('No cards to export as PNG!');
      }
      return;
    }

    if (typeof html2canvas === 'undefined') {
      if (typeof Messages !== 'undefined') {
        Messages.showError('html2canvas library not loaded!');
      }
      return;
    }

    console.log(`🖼️ Starting bulk export of ${cardElements.length} cards...`);

    for (let i = 0; i < cardElements.length; i++) {
      try {
        // Get card name for filename
        const cardNameElement = cardElements[i].querySelector('.card-name, .item-name, h3, h2');
        const cardName = cardNameElement ? cardNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : `card-${i + 1}`;
        
        await this.exportCardAsPNG(cardElements[i], `${cardName}-${this.getDateString()}.png`);
        
        // Small delay between exports to prevent overwhelming the browser
        await this.delay(300);
        
        console.log(`✅ Exported card ${i + 1}/${cardElements.length}: ${cardName}`);
      } catch (error) {
        console.error(`❌ Failed to export card ${i + 1}:`, error);
      }
    }

    if (typeof Messages !== 'undefined') {
      Messages.showSuccess(`Exported ${cardElements.length} cards as PNG!`);
    }
    
    console.log(`🎉 Bulk export completed: ${cardElements.length} cards`);
  }

  /**
   * Export all skills as PNG images (with gradient removal)
   */
  static async exportAllSkillsAsPNG(skillElements) {
    if (!skillElements || skillElements.length === 0) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('No skills to export as PNG!');
      }
      return;
    }

    if (typeof html2canvas === 'undefined') {
      if (typeof Messages !== 'undefined') {
        Messages.showError('html2canvas library not loaded!');
      }
      return;
    }

    console.log(`🖼️ Starting bulk export of ${skillElements.length} skills...`);

    for (let i = 0; i < skillElements.length; i++) {
      try {
        // Get skill name for filename
        const skillNameElement = skillElements[i].querySelector('.skill-name, .skill-title, h3, h2');
        const skillName = skillNameElement ? skillNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : `skill-${i + 1}`;
        
        await this.exportSkillAsPNG(skillElements[i], `${skillName}-${this.getDateString()}.png`);
        
        // Small delay between exports to prevent overwhelming the browser
        await this.delay(300);
        
        console.log(`✅ Exported skill ${i + 1}/${skillElements.length}: ${skillName}`);
      } catch (error) {
        console.error(`❌ Failed to export skill ${i + 1}:`, error);
      }
    }

    if (typeof Messages !== 'undefined') {
      Messages.showSuccess(`Exported ${skillElements.length} skills as PNG!`);
    }
    
    console.log(`🎉 Bulk skill export completed: ${skillElements.length} skills`);
  }

  /**
   * Temporarily remove gradients from element and children for html2canvas
   * Replaces gradients with solid colors extracted from the gradient
   */
  static prepareElementForExport(element) {
    const originalStyles = [];
    
    // Find all elements with gradient backgrounds
    const elementsWithGradients = [element, ...element.querySelectorAll('*')];
    
    elementsWithGradients.forEach((el, index) => {
      const computedStyle = window.getComputedStyle(el);
      const backgroundImage = computedStyle.backgroundImage;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Check if element has a gradient
      if (backgroundImage && (backgroundImage.includes('gradient') || backgroundImage.includes('linear-gradient') || backgroundImage.includes('radial-gradient'))) {
        // Store original style
        originalStyles.push({
          element: el,
          index: index,
          originalBackgroundImage: el.style.backgroundImage || '',
          originalBackground: el.style.background || '',
          originalBackgroundColor: el.style.backgroundColor || '',
          computedBackgroundImage: backgroundImage,
          computedBackgroundColor: backgroundColor
        });
        
        // Extract a representative color from the gradient
        let solidColor = this.extractColorFromGradient(backgroundImage, backgroundColor);
        
        console.log(`🎨 Replacing gradient with solid color for element ${index}: ${solidColor}`);
        
        // Apply solid background while preserving other background properties
        el.style.backgroundImage = 'none';
        el.style.backgroundColor = '#20160c';
        // Keep other background properties if they exist
        const bgSize = computedStyle.backgroundSize;
        const bgPosition = computedStyle.backgroundPosition;
        const bgRepeat = computedStyle.backgroundRepeat;
        
        if (bgSize && bgSize !== 'auto auto') {
          el.style.backgroundSize = bgSize;
        }
        if (bgPosition && bgPosition !== '0% 0%') {
          el.style.backgroundPosition = bgPosition;
        }
        if (bgRepeat && bgRepeat !== 'repeat') {
          el.style.backgroundRepeat = bgRepeat;
        }
      }
    });
    
    return originalStyles;
  }

  /**
   * Extract a representative solid color from a CSS gradient
   */
  static extractColorFromGradient(gradientString, fallbackColor = '#f0f0f0') {
    try {
      // Common gradient patterns to extract colors from
      const colorPatterns = [
        // RGBA colors
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/g,
        // HSL colors
        /hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)/g,
        // Hex colors
        /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g,
        // Named colors
        /\b(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey|cyan|magenta|lime|navy|olive|maroon|teal|silver|gold)\b/g
      ];

      let extractedColors = [];

      // Extract all colors from the gradient
      colorPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(gradientString)) !== null) {
          if (pattern.source.includes('rgba?')) {
            // RGB/RGBA color
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            const a = match[4] ? parseFloat(match[4]) : 1;
            if (a > 0.5) { // Only use colors that aren't too transparent
              extractedColors.push(`rgb(${r}, ${g}, ${b})`);
            }
          } else if (pattern.source.includes('hsla?')) {
            // HSL/HSLA color - convert to RGB
            const h = parseInt(match[1]);
            const s = parseInt(match[2]) / 100;
            const l = parseInt(match[3]) / 100;
            const a = match[4] ? parseFloat(match[4]) : 1;
            if (a > 0.5) {
              const rgb = this.hslToRgb(h, s, l);
              extractedColors.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
            }
          } else if (pattern.source.includes('#')) {
            // Hex color
            extractedColors.push(match[0]);
          } else {
            // Named color
            extractedColors.push(match[0]);
          }
        }
      });

      // If we found colors, use the first one (usually the dominant/starting color)
      if (extractedColors.length > 0) {
        return extractedColors[0];
      }

      // Try to use the computed background color as fallback
      if (fallbackColor && fallbackColor !== 'rgba(0, 0, 0, 0)' && fallbackColor !== 'transparent') {
        return fallbackColor;
      }

      // Ultimate fallback - a neutral color that works well for cards
      return '#f8f9fa';

    } catch (error) {
      console.warn('Error extracting color from gradient, using fallback:', error);
      return fallbackColor || '#f8f9fa';
    }
  }

  /**
   * Convert HSL to RGB
   */
  static hslToRgb(h, s, l) {
    h = h / 360;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 0.08333333333333333) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    return [f(0), f(8), f(4)];
  }

  /**
   * Restore original gradients after export
   */
  static restoreElementAfterExport(originalStyles) {
    originalStyles.forEach(styleData => {
      const { element, originalBackgroundImage, originalBackground, originalBackgroundColor } = styleData;
      
      // Restore original styles in the correct order
      if (originalBackgroundImage) {
        element.style.backgroundImage = originalBackgroundImage;
      } else {
        element.style.removeProperty('background-image');
      }
      
      if (originalBackgroundColor) {
        element.style.backgroundColor = originalBackgroundColor;
      } else if (!originalBackground) {
        element.style.removeProperty('background-color');
      }
      
      if (originalBackground) {
        element.style.background = originalBackground;
      } else if (!originalBackgroundImage && !originalBackgroundColor) {
        element.style.removeProperty('background');
      }
    });
    
    console.log(`🔄 Restored ${originalStyles.length} gradient backgrounds`);
  }

  /**
   * Export single card as PNG using html2canvas (with gradient removal)
   */
  static async exportCardAsPNG(cardElement, filename = null) {
    if (!cardElement) {
      console.error('No card element provided for PNG export');
      return;
    }

    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      const errorMsg = 'html2canvas library not loaded! Please ensure the library is included.';
      console.error(errorMsg);
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    let originalStyles = [];
    
    try {
      console.log('🖼️ Starting PNG export with gradient removal...');
      
      // Get card name for filename
      const cardNameElement = cardElement.querySelector('.card-name, .item-name, h3, h2');
      const cardName = cardNameElement ? cardNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'card';
      const finalFilename = filename || `${cardName}-${this.getDateString()}.png`;
      
      // Temporarily remove gradients
      originalStyles = this.prepareElementForExport(cardElement);
      
      // Force reflow to ensure styles are applied
      cardElement.offsetHeight;
      
      // Configure html2canvas options
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip any problematic elements
          return element.classList.contains('export-button') || 
                 element.classList.contains('export-menu');
        }
      });

      console.log('✅ Canvas created successfully');
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = finalFilename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(url), 100);
          
          if (typeof Messages !== 'undefined') {
            Messages.showSuccess(`Card exported as ${finalFilename}`);
          }
          console.log('✅ PNG export completed:', finalFilename);
        } else {
          throw new Error('Failed to create blob from canvas');
        }
      }, 'image/png', 0.95);
      
    } catch (error) {
      console.error('❌ Error exporting card as PNG:', error);
      const errorMsg = `Failed to export card as PNG: ${error.message}`;
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      // Always restore original styles
      if (originalStyles.length > 0) {
        // Small delay to ensure canvas is processed before restoring
        setTimeout(() => {
          this.restoreElementAfterExport(originalStyles);
        }, 100);
      }
    }
  }

  /**
   * Export single skill as PNG using html2canvas (with gradient removal)
   */
  static async exportSkillAsPNG(skillElement, filename = null) {
    if (!skillElement) {
      console.error('No skill element provided for PNG export');
      return;
    }

    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      const errorMsg = 'html2canvas library not loaded! Please ensure the library is included.';
      console.error(errorMsg);
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    let originalStyles = [];

    try {
      console.log('🖼️ Starting skill PNG export with gradient removal...');
      
      // Get skill name for filename
      const skillNameElement = skillElement.querySelector('.skill-name, .skill-title, h3, h2');
      const skillName = skillNameElement ? skillNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'skill';
      const finalFilename = filename || `${skillName}-${this.getDateString()}.png`;
      
      // Temporarily remove gradients
      originalStyles = this.prepareElementForExport(skillElement);
      
      // Force reflow to ensure styles are applied
      skillElement.offsetHeight;
      
      // Configure html2canvas options
      const canvas = await html2canvas(skillElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: skillElement.offsetWidth,
        height: skillElement.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip any problematic elements
          return element.classList.contains('export-button') || 
                 element.classList.contains('export-menu');
        }
      });

      console.log('✅ Skill canvas created successfully');
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = finalFilename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(url), 100);
          
          if (typeof Messages !== 'undefined') {
            Messages.showSuccess(`Skill exported as ${finalFilename}`);
          }
          console.log('✅ Skill PNG export completed:', finalFilename);
        } else {
          throw new Error('Failed to create blob from canvas');
        }
      }, 'image/png', 0.95);
      
    } catch (error) {
      console.error('❌ Error exporting skill as PNG:', error);
      const errorMsg = `Failed to export skill as PNG: ${error.message}`;
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      // Always restore original styles
      if (originalStyles.length > 0) {
        // Small delay to ensure canvas is processed before restoring
        setTimeout(() => {
          this.restoreElementAfterExport(originalStyles);
        }, 100);
      }
    }
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
      if (typeof Validation !== 'undefined') {
        const validation = Validation.validateImportData(importedData, type);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      const itemsArray = importedData[type] || [];
      const totalItems = itemsArray.length;

      if (totalItems === 0) {
        const errorMsg = `No ${type} found in the imported file.`;
        if (typeof Messages !== 'undefined') {
          Messages.showError(errorMsg);
        } else {
          alert(errorMsg);
        }
        return;
      }

      // Show bulk import confirmation for multiple items
      if (totalItems > 1) {
        const collectionName = importedData.collection?.name || `${totalItems} ${type}`;
        const confirmMessage = `Import ${totalItems} ${type} from "${collectionName}"?`;
        
        const confirmed = await this.showBulkImportConfirmation(confirmMessage, importedData);
        if (!confirmed) {
          if (typeof Messages !== 'undefined') {
            Messages.showInfo('Import cancelled');
          }
          return;
        }
      }

      // Bulk validation first
      console.log('🔍 Validating all items before import...');
      const validationErrors = [];
      
      if (typeof Validation !== 'undefined') {
        for (let i = 0; i < itemsArray.length; i++) {
          const item = itemsArray[i];
          let itemValidation;
          
          if (type === 'cards') {
            itemValidation = Validation.validateCardData(item);
          } else if (type === 'skills') {
            itemValidation = Validation.validateSkillData(item);
          }
          
          if (itemValidation && !itemValidation.valid) {
            validationErrors.push(`Item ${i + 1}: ${itemValidation.error}`);
          }
        }

        if (validationErrors.length > 0) {
          const errorMessage = `Found ${validationErrors.length} validation errors:\n\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? '\n...and more' : ''}`;
          if (typeof Messages !== 'undefined') {
            Messages.showError(errorMessage);
          } else {
            alert(errorMessage);
          }
          return;
        }
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
        
        if (typeof Messages !== 'undefined') {
          Messages.showSuccess(successMessage);
        } else {
          alert(successMessage);
        }

        // Add collection metadata to imported cards for gallery
        if (totalItems > 1 && importedData.collection) {
          this.markAsCollection(importedData.collection, importedCount);
        }
      }

      if (errors.length > 0) {
        console.warn('Import errors:', errors);
        const warningMsg = errors.length <= 3 
          ? `Some items failed to import: ${errors.join(', ')}`
          : `${errors.length} items failed to import. Check console for details.`;
        
        if (typeof Messages !== 'undefined') {
          Messages.showWarning(warningMsg);
        } else {
          alert(warningMsg);
        }
      }

      if (importedCount === 0) {
        const errorMsg = `No ${type} could be imported from this file.`;
        if (typeof Messages !== 'undefined') {
          Messages.showError(errorMsg);
        } else {
          alert(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = 'Error reading file: ' + error.message;
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      // Clear the input
      event.target.value = '';
    }
  }

  /**
   * Import single card
   */
  static async importSingleCard(cardData) {
    if (typeof CardGenerator === 'undefined') {
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

    return cardElement;
  }

  /**
   * Import single skill
   */
  static async importSingleSkill(skillData) {
    if (typeof SkillGenerator === 'undefined') {
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

    return skillElement;
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
      const preview = importData.cards?.slice(0, 3).map(card => card.itemName || 'Unnamed').join(', ') || 
                     importData.skills?.slice(0, 3).map(skill => skill.skillName || 'Unnamed').join(', ') || '';
      const itemCount = importData.cards?.length || importData.skills?.length || 0;
      const moreText = itemCount > 3 ? ` +${itemCount - 3} more` : '';

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
            <button class="cancel-btn" 
                    style="padding: 10px 20px; border: 2px solid rgb(251, 225, 183); background: transparent; color: rgb(251, 225, 183); border-radius: 6px; cursor: pointer;">
              Cancel
            </button>
            <button class="import-btn"
                    style="padding: 10px 20px; border: none; background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%); color: rgb(37, 26, 12); border-radius: 6px; cursor: pointer; font-weight: bold;">
              Import All
            </button>
          </div>
        </div>
      `;

      // Add event listeners
      modal.querySelector('.cancel-btn').onclick = () => {
        modal.remove();
        resolve(false);
      };

      modal.querySelector('.import-btn').onclick = () => {
        modal.remove();
        resolve(true);
      };

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
        <h3 style="margin: 0 0 20px 0;">⚔️ Importing Items ⚔️</h3>
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
    const collectionData = {
      ...collectionInfo,
      itemCount: itemCount,
      importedAt: new Date().toISOString()
    };
    
    try {
      const existingCollections = JSON.parse(sessionStorage.getItem('bazaargen_collections') || '[]');
      existingCollections.push(collectionData);
      sessionStorage.setItem('bazaargen_collections', JSON.stringify(existingCollections));
      
      console.log('📦 Collection marked:', collectionData);
    } catch (error) {
      console.warn('Failed to save collection info:', error);
    }
  }

  /**
   * Setup export menu for individual items
   */
  static setupExportMenu(button, itemData, type) {


    console.log('💾 [DEBUG] setupExportMenu called', {button, itemData, type});
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
      menu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: linear-gradient(135deg,rgb(87, 72, 38) 0%,rgb(131, 103, 47) 100%);
        border: 1px solid black;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        min-width: 120px;
        display: block;
      `;
      
      const dataOption = document.createElement('div');
      dataOption.className = 'export-option';
      dataOption.textContent = 'Export ALL as Data';
      dataOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      dataOption.onclick = () => {
        if (type === 'card') {
          this.exportSingleCardAsData(itemData);
        } else {
          this.exportSingleSkillAsData(itemData);
        }
        menu.style.display = 'none';
      };
      
      const pngOption = document.createElement('div');
      pngOption.className = 'export-option';
      pngOption.textContent = 'Save as PNG';
      pngOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      pngOption.onclick = () => {
        const element = button.closest(type === 'card' ? '.card' : '.skill-card');
        if (type === 'card') {
          this.exportCardAsPNG(element);
        } else {
          this.exportSkillAsPNG(element);
        }
        menu.style.display = 'none';
      };

      const profileOption = document.createElement('div');
      profileOption.className = 'export-option';
      profileOption.textContent = 'Save to Profile';
      profileOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-top: 1px solid #eee;
        color: #2e7d32;
        font-weight: bold;
      `;
      profileOption.onclick = () => {
        if (window.Database && window.Database.saveCard) {
          window.Database.saveCard(itemData);
        }
        menu.style.display = 'none';
      };
      
      menu.appendChild(dataOption);
      menu.appendChild(pngOption);
      menu.appendChild(profileOption);
      button.parentElement.appendChild(menu);
      console.log('💾 [DEBUG] Export menu should now be visible');
    }

    menu.style.display = 'block';
  }

  /**
   * Trigger file input for import
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
   * Get export statistics
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
   */
  static updateExportStats(type, count) {
    const currentCount = parseInt(localStorage.getItem('bazaargen_export_count') || '0');
    localStorage.setItem('bazaargen_export_count', (currentCount + count).toString());
    localStorage.setItem('bazaargen_last_export', new Date().toISOString());
  }

  // ===== UTILITY METHODS =====

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
   * Download image data as file
   */
  static downloadImage(dataURL, filename) {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  /**
   * Setup export/import event listeners
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
      const cards = document.querySelectorAll('.card, .card-wrapper');
      this.exportAllCardsAsPNG(Array.from(cards));
    };

    window.exportAllSkillsAsPNG = () => {
      const skills = document.querySelectorAll('.skill-card, .skill-card-wrapper');
      this.exportAllSkillsAsPNG(Array.from(skills));
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

    window.exportSkillAsPNG = (skillElement) => {
      this.exportSkillAsPNG(skillElement);
    };

    // Functions for individual card/skill export buttons
    window.saveCardAsPNG = (button) => {
      console.log('🖼️ saveCardAsPNG called');
      const cardElement = button.closest('.card, .card-wrapper');
      if (cardElement) {
        this.exportCardAsPNG(cardElement);
      } else {
        console.error('Card element not found');
        if (typeof Messages !== 'undefined') {
          Messages.showError('Card not found for export');
        }
      }
    };

    window.saveSkillAsPNG = (button) => {
      console.log('🖼️ saveSkillAsPNG called');
      const skillElement = button.closest('.skill-card, .skill-card-wrapper');
      if (skillElement) {
        this.exportSkillAsPNG(skillElement);
      } else {
        console.error('Skill element not found');
        if (typeof Messages !== 'undefined') {
          Messages.showError('Skill not found for export');
        }
      }
    };

    // Functions to export individual card/skill data
    window.exportCardData = (button) => {
      console.log('📄 exportCardData called');
      const cardElement = button.closest('.card, .card-wrapper');
      if (cardElement && cardElement.cardData) {
        this.exportSingleCardAsData(cardElement.cardData);
      } else {
        console.error('Card data not found');
        if (typeof Messages !== 'undefined') {
          Messages.showError('Card data not found for export');
        }
      }
    };

    window.exportSkillData = (button) => {
      console.log('📄 exportSkillData called');
      const skillElement = button.closest('.skill-card, .skill-card-wrapper');
      if (skillElement && skillElement.skillData) {
        this.exportSingleSkillAsData(skillElement.skillData);
      } else {
        console.error('Skill data not found');
        if (typeof Messages !== 'undefined') {
          Messages.showError('Skill data not found for export');
        }
      }
    };

    // Generic export menu function
    window.showExportMenu = (button, itemData, type) => {
      console.log('📋 showExportMenu called', { type, hasData: !!itemData });
      this.setupExportMenu(button, itemData, type);
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

    // Close export menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.card-export-btn, .skill-export-btn, .export-menu')) {
        document.querySelectorAll('.export-menu').forEach(menu => {
          menu.style.display = 'none';
        });
      }
    });

    console.log('✅ ExportImport event listeners set up');
  }
}

// Auto-setup event listeners when the class loads
if (typeof document !== 'undefined') {
  ExportImport.setupEventListeners();
}

// Global functions for easy access from HTML buttons
window.toggleExportMenu = (button, itemData) => {
  const type = button.className.includes('card') ? 'card' : 'skill';
  ExportImport.setupExportMenu(button, itemData, type);
};

// Simple export functions for direct button calls
window.exportThisCardAsPNG = (button) => {
  console.log('🖼️ Direct PNG export called');
  const cardElement = button.closest('.card, .card-wrapper');
  if (cardElement) {
    ExportImport.exportCardAsPNG(cardElement);
  } else {
    console.error('❌ Card element not found for PNG export');
  }
};

window.exportThisCardAsData = (button) => {
  console.log('📄 Direct data export called');
  const cardElement = button.closest('.card, .card-wrapper');
  if (cardElement && cardElement.cardData) {
    ExportImport.exportSingleCardAsData(cardElement.cardData);
  } else {
    // Try to get data from window.cardsData if not on element
    const cardIndex = Array.from(document.querySelectorAll('.card, .card-wrapper')).indexOf(cardElement);
    if (cardIndex >= 0 && window.cardsData && window.cardsData[cardIndex]) {
      ExportImport.exportSingleCardAsData(window.cardsData[cardIndex]);
    } else {
      console.error('❌ Card data not found for export');
      if (typeof Messages !== 'undefined') {
        Messages.showError('Card data not found for export');
      }
    }
  }
};

window.exportThisSkillAsPNG = (button) => {
  console.log('🖼️ Direct skill PNG export called');
  const skillElement = button.closest('.skill-card, .skill-card-wrapper');
  if (skillElement) {
    ExportImport.exportSkillAsPNG(skillElement);
  } else {
    console.error('❌ Skill element not found for PNG export');
  }
};

window.exportThisSkillAsData = (button) => {
  console.log('📄 Direct skill data export called');
  const skillElement = button.closest('.skill-card, .skill-card-wrapper');
  if (skillElement && skillElement.skillData) {
    ExportImport.exportSingleSkillAsData(skillElement.skillData);
  } else {
    // Try to get data from window.skillsData if not on element
    const skillIndex = Array.from(document.querySelectorAll('.skill-card, .skill-card-wrapper')).indexOf(skillElement);
    if (skillIndex >= 0 && window.skillsData && window.skillsData[skillIndex]) {
      ExportImport.exportSingleSkillAsData(window.skillsData[skillIndex]);
    } else {
      console.error('❌ Skill data not found for export');
      if (typeof Messages !== 'undefined') {
        Messages.showError('Skill data not found for export');
      }
    }
  }
};

// Make ExportImport available globally
window.ExportImport = ExportImport;
