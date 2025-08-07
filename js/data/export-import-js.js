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

    // Process cards and expand galleries into individual items
    const processedCards = [];
    let totalItems = 0;
    let galleryCount = 0;

    for (const cardData of cardsData) {
      if (cardData && cardData.isGallery && cardData.galleryItems) {
        // This is a gallery - add all individual items
        processedCards.push(...cardData.galleryItems);
        totalItems += cardData.galleryItems.length;
        galleryCount++;
        console.log(`🖼️ Expanded gallery "${cardData.itemName}" with ${cardData.galleryItems.length} items`);
      } else {
        // This is a regular card
        processedCards.push(cardData);
        totalItems++;
      }
    }

    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "cards",
      count: totalItems,
      collection: {
        name: `Card Collection ${this.getDateString()}`,
        description: `${totalItems} items exported from BazaarGen (${cardsData.length} cards/galleries)`,
        created_by: (typeof GoogleAuth !== 'undefined' && GoogleAuth.getUserDisplayName()) || 'Unknown',
        galleries_expanded: galleryCount
      },
      cards: processedCards
    };

    this.downloadJSON(dataToExport, `Bazaar-cards-${this.getDateString()}.json`);
    
    if (typeof Messages !== 'undefined') {
      Messages.showSuccess(`Exported ${totalItems} items successfully! (${galleryCount} galleries expanded)`);
    } else {
      alert(`Exported ${totalItems} items successfully! (${galleryCount} galleries expanded)`);
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

    if (typeof htmlToImage === 'undefined') {
      if (typeof Messages !== 'undefined') {
        Messages.showError('html-to-image library not loaded!');
      }
      return;
    }

    console.log(`🖼️ Starting bulk export of ${cardElements.length} cards/galleries...`);

    let totalExported = 0;
    let galleryCount = 0;

    for (let i = 0; i < cardElements.length; i++) {
      try {
        const cardElement = cardElements[i];
        
        // Check if this element represents a gallery by looking for gallery data
        const cardWrapper = cardElement.closest('[data-item-id]');
        if (cardWrapper) {
          const itemId = cardWrapper.getAttribute('data-item-id');
          // Try to get the item data from the page context
          // This is a simplified approach - in practice, the data might be stored differently
          const isGallery = cardElement.querySelector('.gallery-indicator') || 
                           cardElement.getAttribute('data-is-gallery') === 'true';
          
          if (isGallery) {
            // This is a gallery - we need to get the gallery data and export individual items
            console.log(`🖼️ Detected gallery at index ${i}, will export individual items`);
            galleryCount++;
            // Note: For bulk export, we'd need access to the gallery data
            // This would require additional context from the calling page
            continue;
          }
        }
        
        // Regular card export
        const cardNameElement = cardElement.querySelector('.card-name, .item-name, h3, h2');
        const cardName = cardNameElement ? cardNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : `card-${i + 1}`;
        
        await this.exportCardAsPNG(cardElement, `${cardName}-${this.getDateString()}.png`);
        totalExported++;
        
        // Small delay between exports to prevent overwhelming the browser
        await this.delay(300);
        
        console.log(`✅ Exported card ${i + 1}/${cardElements.length}: ${cardName}`);
      } catch (error) {
        console.error(`❌ Failed to export card ${i + 1}:`, error);
      }
    }

    if (typeof Messages !== 'undefined') {
      const message = galleryCount > 0 
        ? `Exported ${totalExported} cards as PNG! (${galleryCount} galleries detected - use individual export for galleries)`
        : `Exported ${totalExported} cards as PNG!`;
      Messages.showSuccess(message);
    }
    
    console.log(`🎉 Bulk export completed: ${totalExported} cards, ${galleryCount} galleries detected`);
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

    if (typeof htmlToImage === 'undefined') {
      if (typeof Messages !== 'undefined') {
        Messages.showError('html-to-image library not loaded!');
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
   * Temporarily remove gradients from element and children for html-to-image
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
   * Prepare skill element specifically for export with proper styling
   */
  static prepareSkillForExport(skillElement) {
    const originalStyles = [];
    const originalElements = [];
    
    // Set max-width to 500px for the skill card
    const skillCard = skillElement.querySelector('.skill-card') || skillElement;
    if (skillCard) {
      originalStyles.push({
        element: skillCard,
        property: 'maxWidth',
        originalValue: skillCard.style.maxWidth
      });
      skillCard.style.maxWidth = '500px';
    }
    
    // html-to-image handles border images properly, no manipulation needed
    console.log('🎨 Skill ready for export - html-to-image will handle border images automatically');
    
    // Ensure skill content has proper width (capped at 500px)
    const skillContent = skillElement.querySelector('.skill-content');
    if (skillContent) {
      originalStyles.push({
        element: skillContent,
        property: 'maxWidth',
        originalValue: skillContent.style.maxWidth
      });
      skillContent.style.maxWidth = '500px';
    }
    
    return { originalStyles, originalElements };
  }

  /**
   * Prepare card element specifically for export with proper styling
   */
  static prepareCardForExport(cardElement) {
    const originalStyles = [];
    
    // html-to-image handles border images properly, no manipulation needed
    console.log('🎨 Card ready for export - html-to-image will handle border images automatically');
    return originalStyles;
  }

  /**
   * Add watermark to canvas with creator alias
   */
  static addWatermarkToCanvas(canvas, cardElement = null) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Get creator alias
    let creatorAlias = 'Unknown';
    try {
      if (typeof GoogleAuth !== 'undefined' && GoogleAuth.getUserDisplayName) {
        creatorAlias = GoogleAuth.getUserDisplayName();
      }
    } catch (error) {
      console.warn('Could not get creator alias for watermark:', error);
    }
    
    // Create watermark text
    const watermarkText = `Created by ${creatorAlias} on BazaarGen.com`;
    
    // Set watermark styling - make it more visible
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 3;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Calculate position - account for canvas scaling
    let x = 40; // Default left margin (scaled)
    let y;
    
    if (cardElement) {
      // Get the scale factor from html-to-image (usually 2)
      const scale = canvas.width / cardElement.offsetWidth;
      console.log('💧 Canvas scale factor:', scale, 'Canvas size:', canvas.width, 'x', canvas.height, 'Element size:', cardElement.offsetWidth, 'x', cardElement.offsetHeight);
      
      // Check if this is a card (has tags container) or skill
      const tagsContainer = cardElement.querySelector('.tags-container');
      if (tagsContainer) {
        // This is a card - position watermark 5 pixels above the tags
        const tagsRect = tagsContainer.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        const tagsTop = (tagsRect.top - cardRect.top) * scale;
        const tagsLeft = (tagsRect.left - cardRect.left) * scale;
        // Position watermark 5 pixels above the tags, left-aligned with tags
        x = Math.max(tagsLeft, 40); // Use tags left edge or minimum 40px margin (scaled)
        y = Math.max(tagsTop - 10, 40); // 10px above tags (scaled from 5px), minimum 40px from top
        console.log('💧 Positioning watermark above tags at:', { x, y, tagsTop, scale });
      } else {
        // This is a skill - position watermark below the skill content
        const skillContent = cardElement.querySelector('.skill-content');
        if (skillContent) {
          const contentRect = skillContent.getBoundingClientRect();
          const cardRect = cardElement.getBoundingClientRect();
          const contentBottom = (contentRect.bottom - cardRect.top) * scale;
          const contentLeft = (contentRect.left - cardRect.left) * scale;
          // Position watermark below the skill content, left-aligned with content
          x = Math.max(contentLeft, 40);
          y = Math.min(contentBottom + 10, height - 60);
          console.log('💧 Positioning watermark below skill content at:', { x, y, contentBottom, scale });
        } else {
          // Fallback: position below the main card element
          const cardHeight = cardElement.offsetHeight * scale;
          y = Math.min(cardHeight + 10, height - 60);
          console.log('💧 Using fallback watermark position at:', { x, y, cardHeight, scale });
        }
      }
    } else {
      // Fallback: position near bottom of canvas
      y = height - 80;
      console.log('💧 Using canvas bottom fallback watermark position at:', { x, y });
    }
    
    // Draw watermark with outline
    ctx.strokeText(watermarkText, x, y);
    ctx.fillText(watermarkText, x, y);
    
    console.log('💧 Added watermark to canvas:', watermarkText, 'at position:', { x, y });
    return canvas;
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
      // Handle gradient background restoration
      if (styleData.originalBackgroundImage !== undefined) {
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
      }
      
      // Handle skill-specific style restoration
      if (styleData.property !== undefined) {
        const { element, property, originalValue } = styleData;
        
        if (originalValue) {
          element.style[property] = originalValue;
        } else {
          element.style.removeProperty(property);
        }
        
        // Also remove any !important inline styles we added
        if (property === 'position' || property === 'top' || property === 'left' || 
            property === 'width' || property === 'height' || property === 'transform' ||
            property === 'objectFit' || property === 'pointerEvents') {
          element.style.removeProperty(property);
        }
      }
    });
    
    console.log(`🔄 Restored ${originalStyles.length} style properties`);
  }

  /**
   * Export single card as PNG using html-to-image (with gradient removal)
   */
  static async exportCardAsPNG(cardElement, filename = null) {
    if (!cardElement) {
      console.error('No card element provided for PNG export');
      return;
    }

    // Check if html-to-image is available
    if (typeof htmlToImage === 'undefined') {
      const errorMsg = 'html-to-image library not loaded! Please ensure the library is included.';
      console.error(errorMsg);
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    let originalStyles = [];
    let hiddenElements = [];
    
    try {
      console.log('🖼️ Starting card PNG export with proper styling...');
      
      // Get card name for filename
      const cardNameElement = cardElement.querySelector('.card-name, .item-name, h3, h2');
      const cardName = cardNameElement ? cardNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'card';
      const finalFilename = filename || `${cardName}-${this.getDateString()}.png`;
      
      // Hide all control elements
      const controlElements = cardElement.querySelectorAll('.card-controls, .skill-controls, .item-controls, .export-btn, .export-button, .export-menu, .delete-btn, .delete-button, .upvote-btn, .upvote-button, .save-btn, .save-button');
      controlElements.forEach(el => {
        if (el.style.display !== 'none') {
          hiddenElements.push({
            element: el,
            originalDisplay: el.style.display
          });
          el.style.display = 'none';
        }
      });
      
      // Temporarily remove gradients and fix styling
      originalStyles = this.prepareElementForExport(cardElement);
      
      // Apply export-specific styling
      const exportStyles = this.prepareCardForExport(cardElement);
      originalStyles.push(...exportStyles);
      
      // Force reflow to ensure styles are applied
      cardElement.offsetHeight;
      
      // Configure html-to-image options
      const dataUrl = await htmlToImage.toPng(cardElement, {
        backgroundColor: null,
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight,
        pixelRatio: 2, // Equivalent to scale: 2 in html2canvas
        cacheBust: true, // Enable cache busting for images
        imagePlaceholder: '', // Empty placeholder for failed images
        filter: (node) => {
          // Skip any control elements
          return !(node.classList && (
            node.classList.contains('export-button') || 
            node.classList.contains('export-menu') ||
            node.classList.contains('card-controls') ||
            node.classList.contains('skill-controls') ||
            node.classList.contains('item-controls') ||
            node.classList.contains('delete-btn') ||
            node.classList.contains('upvote-btn') ||
            node.classList.contains('save-btn')
          ));
        }
      });

      console.log('✅ Card PNG created successfully');
      
      // Download the data URL directly
      this.downloadImage(dataUrl, finalFilename);
      
      if (typeof Messages !== 'undefined') {
        Messages.showSuccess(`Card exported as ${finalFilename}`);
      }
      console.log('✅ PNG export completed:', finalFilename);
      
    } catch (error) {
      console.error('❌ Error exporting card as PNG:', error);
      const errorMsg = `Failed to export card as PNG: ${error.message}`;
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      // Always restore original styles and show hidden elements
      if (originalStyles.length > 0) {
        // Small delay to ensure canvas is processed before restoring
        setTimeout(() => {
          this.restoreElementAfterExport(originalStyles);
        }, 100);
      }
      
      // Restore hidden elements
      hiddenElements.forEach(item => {
        item.element.style.display = item.originalDisplay;
      });
    }
  }

  /**
   * Export single skill as PNG using html-to-image (with gradient removal)
   */
  static async exportSkillAsPNG(skillElement, filename = null) {
    if (!skillElement) {
      console.error('No skill element provided for PNG export');
      return;
    }

    // Check if html-to-image is available
    if (typeof htmlToImage === 'undefined') {
      const errorMsg = 'html-to-image library not loaded! Please ensure the library is included.';
      console.error(errorMsg);
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    let originalStyles = [];
    let hiddenElements = [];

    try {
      console.log('🖼️ Starting skill PNG export with proper styling...');
      
      // Get skill name for filename
      const skillNameElement = skillElement.querySelector('.skill-name, .skill-title, h3, h2');
      const skillName = skillNameElement ? skillNameElement.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'skill';
      const finalFilename = filename || `${skillName}-${this.getDateString()}.png`;
      
      // Hide all control elements
      const controlElements = skillElement.querySelectorAll('.skill-controls, .card-controls, .item-controls, .export-btn, .export-button, .export-menu, .delete-btn, .delete-button, .upvote-btn, .upvote-button');
      controlElements.forEach(el => {
        if (el.style.display !== 'none') {
          hiddenElements.push({
            element: el,
            originalDisplay: el.style.display
          });
          el.style.display = 'none';
        }
      });
      
      // Temporarily remove gradients and fix styling
      originalStyles = this.prepareElementForExport(skillElement);
      
      // Apply export-specific styling
      const exportResult = this.prepareSkillForExport(skillElement);
      originalStyles.push(...exportResult.originalStyles);
      
      // Store original elements for restoration
      const originalElements = exportResult.originalElements;
      
      // Force reflow to ensure styles are applied
      skillElement.offsetHeight;
      
      // Configure html-to-image options
      const dataUrl = await htmlToImage.toPng(skillElement, {
        backgroundColor: null,
        width: skillElement.offsetWidth,
        height: skillElement.offsetHeight,
        pixelRatio: 2, // Equivalent to scale: 2 in html2canvas
        cacheBust: true, // Enable cache busting for images
        imagePlaceholder: '', // Empty placeholder for failed images
        filter: (node) => {
          // Skip any control elements
          return !(node.classList && (
            node.classList.contains('export-button') || 
            node.classList.contains('export-menu') ||
            node.classList.contains('skill-controls') ||
            node.classList.contains('card-controls') ||
            node.classList.contains('item-controls') ||
            node.classList.contains('delete-btn') ||
            node.classList.contains('upvote-btn')
          ));
        }
      });

      console.log('✅ Skill PNG created successfully');
      
      // Download the data URL directly
      this.downloadImage(dataUrl, finalFilename);
      
      if (typeof Messages !== 'undefined') {
        Messages.showSuccess(`Skill exported as ${finalFilename}`);
      }
      console.log('✅ Skill PNG export completed:', finalFilename);
      
    } catch (error) {
      console.error('❌ Error exporting skill as PNG:', error);
      const errorMsg = `Failed to export skill as PNG: ${error.message}`;
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      // Always restore original styles and show hidden elements
      if (originalStyles.length > 0) {
        // Small delay to ensure canvas is processed before restoring
        setTimeout(() => {
          this.restoreElementAfterExport(originalStyles);
        }, 100);
      }
      

      
      // Restore hidden elements
      hiddenElements.forEach(item => {
        item.element.style.display = item.originalDisplay;
      });
    }
  }

  /**
   * Export gallery as individual items (data)
   */
  static exportGalleryAsData(galleryData) {
    if (!galleryData || !galleryData.isGallery || !galleryData.galleryItems) {
      console.error('Invalid gallery data for export');
      return;
    }

    const galleryName = galleryData.itemName || 'Gallery';
    const items = galleryData.galleryItems;
    
    console.log(`🖼️ Exporting gallery "${galleryName}" with ${items.length} items as data...`);

    // Create a collection export with all gallery items
    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "gallery",
      count: items.length,
      collection: {
        name: galleryName,
        description: `Gallery containing ${items.length} items exported from BazaarGen`,
        created_by: galleryData.galleryInfo?.createdBy || 'Unknown',
        original_gallery: true
      },
      items: items
    };

    const fileName = `${galleryName}-Gallery-${this.getDateString()}.json`;
    this.downloadJSON(dataToExport, fileName);
    
    if (typeof Messages !== 'undefined') {
      Messages.showSuccess(`Exported gallery "${galleryName}" with ${items.length} items!`);
    }
    
    console.log(`✅ Gallery export completed: ${items.length} items`);
  }

  /**
   * Export gallery as individual PNG images
   */
  static async exportGalleryAsPNG(galleryData, galleryElement) {
    if (!galleryData || !galleryData.isGallery || !galleryData.galleryItems) {
      console.error('Invalid gallery data for PNG export');
      return;
    }

    if (typeof htmlToImage === 'undefined') {
      const errorMsg = 'html-to-image library not loaded! Please ensure the library is included.';
      console.error(errorMsg);
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    const galleryName = galleryData.itemName || 'Gallery';
    const items = galleryData.galleryItems;
    
    console.log(`🖼️ Starting gallery PNG export: "${galleryName}" with ${items.length} items...`);

    // Create temporary container for individual items
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      z-index: -1;
    `;
    document.body.appendChild(tempContainer);

    try {
      // Create individual card elements for each gallery item
      const cardElements = [];
      
      for (let i = 0; i < items.length; i++) {
        const itemData = items[i];
        
        // Create card element using CardGenerator
        if (typeof CardGenerator !== 'undefined') {
          const cardElement = await CardGenerator.createCard({
            data: itemData,
            container: tempContainer,
            mode: 'export',
            includeControls: false,
            skipValidation: true
          });
          
          if (cardElement) {
            cardElements.push(cardElement);
          }
        }
      }

      // Export each card as PNG
      for (let i = 0; i < cardElements.length; i++) {
        const cardElement = cardElements[i];
        const itemData = items[i];
        const itemName = itemData.itemName || `Item-${i + 1}`;
        const filename = `${galleryName}-${itemName}-${this.getDateString()}.png`;
        
        try {
          await this.exportCardAsPNG(cardElement, filename);
          console.log(`✅ Exported gallery item ${i + 1}/${cardElements.length}: ${itemName}`);
          
          // Small delay between exports
          await this.delay(300);
        } catch (error) {
          console.error(`❌ Failed to export gallery item ${i + 1}:`, error);
        }
      }

      if (typeof Messages !== 'undefined') {
        Messages.showSuccess(`Exported gallery "${galleryName}" with ${cardElements.length} items as PNG!`);
      }
      
      console.log(`🎉 Gallery PNG export completed: ${cardElements.length} items`);

    } catch (error) {
      console.error('❌ Error exporting gallery as PNG:', error);
      const errorMsg = `Failed to export gallery as PNG: ${error.message}`;
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      // Clean up temporary container
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }

  /**
   * Check if data represents a gallery and handle export accordingly
   */
  static async handleGalleryExport(itemData, element, type) {
    // Check if this is a gallery
    if (itemData && itemData.isGallery && itemData.galleryItems) {
      console.log('🖼️ Detected gallery, exporting individual items...');
      
      if (type === 'data') {
        this.exportGalleryAsData(itemData);
      } else if (type === 'png') {
        await this.exportGalleryAsPNG(itemData, element);
      }
      return true; // Indicates this was handled as a gallery
    }
    
    return false; // Not a gallery, use normal export
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
      mode: 'generator',
      skipValidation: true // Skip validation for imported cards
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
      dataOption.textContent = 'Export as Data';
      dataOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      dataOption.onclick = async () => {
        // Check if this is a gallery first
        const isGallery = await this.handleGalleryExport(itemData, button.closest('.card, .skill-card'), 'data');
        
        if (!isGallery) {
          // Use normal export for non-gallery items
          if (type === 'card') {
            this.exportSingleCardAsData(itemData);
          } else {
            this.exportSingleSkillAsData(itemData);
          }
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
      pngOption.onclick = async () => {
        const element = button.closest(type === 'card' ? '.card' : '.skill-card');
        
        // Check if this is a gallery first
        const isGallery = await this.handleGalleryExport(itemData, element, 'png');
        
        if (!isGallery) {
          // Use normal export for non-gallery items
          if (type === 'card') {
            this.exportCardAsPNG(element);
          } else {
            this.exportSkillAsPNG(element);
          }
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
        if (window.Database) {
          if (type === 'skill' && window.Database.saveSkill) {
            window.Database.saveSkill(itemData);
          } else if (type === 'card' && window.Database.saveCard) {
            window.Database.saveCard(itemData);
          } else {
            console.error('❌ Database save function not available for type:', type);
          }
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
