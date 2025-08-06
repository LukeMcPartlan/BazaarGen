/**
 * Skill Generator Module
 * Handles creation and validation of skill cards
 */
class SkillGenerator {
  static debugMode = true;

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[SkillGenerator] ${message}`, data || '');
    }
  }

  /**
   * Extract form data from the skills page
   */
  static async extractFormData() {
    this.debug('Extracting form data...');
    
    const skillName = document.getElementById('skillNameInput')?.value?.trim();
    const skillEffect = document.getElementById('skillEffectInput')?.value?.trim();
    const border = document.getElementById('borderSelect')?.value || 'gold';
    const imageInput = document.getElementById('imageInput');

    // Validate required fields
    if (!skillName) {
      throw new Error('Please enter a skill name.');
    }

    if (!skillEffect) {
      throw new Error('Please enter a skill effect.');
    }

    if (!imageInput?.files?.[0]) {
      throw new Error('Please upload an image.');
    }

    // Upload image to storage if ImageStorage is available
    let imageData = null;
    if (typeof ImageStorage !== 'undefined' && ImageStorage.uploadImage) {
      try {
        this.debug('📤 Uploading skill image to storage...');
        imageData = await ImageStorage.uploadImage(
          imageInput.files[0], 
          skillName, 
          'skill'
        );
        this.debug('✅ Skill image uploaded to storage:', imageData);
      } catch (uploadError) {
        this.debug('⚠️ Failed to upload to storage, falling back to base64:', uploadError);
        // Fallback to base64
        imageData = await this.readImageFile(imageInput.files[0]);
      }
    } else {
      // Fallback to base64 if ImageStorage not available
      this.debug('📤 ImageStorage not available, using base64...');
      imageData = await this.readImageFile(imageInput.files[0]);
    }

    const skillData = {
      skillName,
      skillEffect,
      border,
      imageData,
      timestamp: new Date().toISOString()
    };

    this.debug('Form data extracted:', skillData);
    return skillData;
  }

  /**
   * Read image file as data URL
   */
  static readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create a skill card element
   */
  static createSkill(options) {
    const {
      data,
      container,
      mode = 'generator',
      isPreview = false,
      includeControls = true,
      skipValidation = false
    } = options;

    this.debug('Creating skill card with options:', { mode, isPreview, includeControls, skipValidation });

    try {
      // Validate skill data unless skipped
      if (!skipValidation) {
        const validation = Validation.validateSkillData(data);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      } else {
        this.debug('Skipping skill validation');
      }

      const skillCard = this.buildSkillElement(data, mode, includeControls);

      // Add to container if specified
      if (container) {
        if (isPreview) {
          container.innerHTML = ''; // Clear preview container
        }
        container.appendChild(skillCard);
        this.debug('Skill card added to container');
      }

      return skillCard;
    } catch (error) {
      this.debug('Error creating skill card:', error);
      throw error;
    }
  }

  /**
   * Build the skill card HTML element
   */
  static buildSkillElement(skillData, mode, includeControls) {
    this.debug('Building skill element...');

    const borderColor = this.getBorderColor(skillData.border);
    
    // Create wrapper for skill card and controls
    const skillWrapper = document.createElement('div');
    skillWrapper.className = 'skill-card-wrapper';
    
    // Add controls above skill card if needed
    if (includeControls && mode === 'generator') {
      const skillControls = this.createSkillControls(skillData);
      skillWrapper.appendChild(skillControls);
    }
    
    const skillCard = document.createElement('div');
    skillCard.className = 'skill-card';

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'skill-image-container';
    imageContainer.style.border = `3px solid ${borderColor}`;

    const img = document.createElement('img');
    img.src = skillData.imageData;
    img.alt = skillData.skillName;
    imageContainer.appendChild(img);

    // Add icon overlay border
    const iconOverlayBorder = document.createElement('img');
    iconOverlayBorder.className = 'skill-icon-overlay-border';
    
    // Add specific class for diamond and legendary borders
    if (skillData.border === 'diamond' || skillData.border === 'legendary') {
      iconOverlayBorder.className += ' skill-icon-overlay-border-large';
    }
    
    iconOverlayBorder.src = `images/skill-frames/icon-overlays/Skill_Frame_${skillData.border.charAt(0).toUpperCase() + skillData.border.slice(1)}.png`;
    iconOverlayBorder.onerror = function() {
      this.style.display = 'none';
    };
    iconOverlayBorder.alt = '';
    
    // BULLETPROOF: Set explicit positioning styles from creation
    iconOverlayBorder.style.position = 'absolute';
    iconOverlayBorder.style.top = '50%';
    iconOverlayBorder.style.left = '50%';
    
    // Set size based on border type
    let overlaySize = '130px'; // Default size
    if (skillData.border === 'diamond' || skillData.border === 'legendary') {
      overlaySize = '140px'; // Larger size for diamond and legendary
    }
    
    console.log(`Setting overlay size for ${skillData.border} border: ${overlaySize}`);
    
    iconOverlayBorder.style.width = overlaySize;
    iconOverlayBorder.style.height = overlaySize;
    iconOverlayBorder.style.transform = 'translate(-50%, -50%)';
    iconOverlayBorder.style.objectFit = 'cover';
    iconOverlayBorder.style.pointerEvents = 'none';
    iconOverlayBorder.style.zIndex = '999';
    iconOverlayBorder.style.borderRadius = '50%';
    iconOverlayBorder.style.overflow = 'visible';
    
    imageContainer.appendChild(iconOverlayBorder);

    // Create skill-content-and-frame container
    const contentAndFrameContainer = document.createElement('div');
    contentAndFrameContainer.className = 'skill-content-and-frame';
    
    // Create content section
    const content = document.createElement('div');
    content.className = 'skill-content';
    content.style.border = 'none'; // Remove colored border
    
    // Frame will be applied via border-image to the content
    
    // Define border-image configurations for each frame type
    const frameConfigs = {
      legendary: { slice: '50 50 50 50 fill', width: '50px 50px 50px 50px', repeat: 'round' },
      gold: { slice: '60 60 60 60 fill', width: '180px 180px 180px 180px', repeat: 'round' }, // Using round to prevent stretching
      silver: { slice: '40 40 40 40 fill', width: '80px 80px 80px 80px', repeat: 'round' }, // Using round to prevent stretching
      bronze: { slice: '30 30 30 30 fill', width: '70px 70px 70px 70px', repeat: 'round' }, // Using round to prevent stretching
      diamond: { slice: '44 44 44 44 fill', width: '44px 44px 44px 44px', repeat: 'round' }
    };
    
    // Apply border-image to the content with consistent values
    content.style.borderImage = `url('images/skill-frames/borders/${skillData.border}_frame.png') 40 fill / 50px / 0 round`;
    content.style.borderImageSlice = '40 fill';
    content.style.borderImageWidth = '50px';
    content.style.borderImageOutset = '0';
    content.style.borderImageRepeat = 'round';
    
    // Add legendary class for special corner cutting
    if (skillData.border === 'legendary') {
      content.classList.add('legendary');
    }
    
    // Note: clip-path with images has limited browser support
    // For now, we'll just use border-image without clipping
    
    console.log('Border-image and mask applied - Rarity:', skillData.border, 'Slice: 40 fill', 'Width: 50px');

    // Header section
    const headerSection = document.createElement('div');
    headerSection.className = 'skill-header';
    headerSection.style.borderTop = 'none'; // Remove border, will show as fallback if frame fails
    headerSection.style.borderBottom = 'none'; // Remove bottom border
    
    const skillTitle = document.createElement('div');
    skillTitle.className = 'skill-title';
    skillTitle.textContent = skillData.skillName;
    headerSection.appendChild(skillTitle);

    // Add divider below header section
    const dividerContainer = document.createElement('div');
    dividerContainer.className = 'skill-divider-container';
    
    const dividerImage = document.createElement('img');
    dividerImage.className = 'skill-divider';
    dividerImage.src = `images/skill-frames/dividers/${skillData.border}_divider.png`;
    dividerImage.alt = '';
    dividerImage.onerror = function() {
      // Replace with colored line if image fails to load
      dividerContainer.innerHTML = `<div class="skill-divider-fallback" style="background-color: ${borderColor};"></div>`;
    };
    dividerContainer.appendChild(dividerImage);

    // Effect section
    const effectSection = document.createElement('div');
    effectSection.className = 'skill-effect';
    effectSection.style.borderTop = 'none'; // Remove top border
    effectSection.style.borderBottom = 'none'; // Remove border, will show as fallback if frame fails
    
    // Process the skill effect text with keywords
    if (typeof KeywordProcessor !== 'undefined') {
      effectSection.innerHTML = KeywordProcessor.processKeywordText(skillData.skillEffect);
      
      // Wrap every word in its own span for better control
      const textNodes = [];
      const walker = document.createTreeWalker(
        effectSection,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          textNodes.push(node);
        }
      }
      
      textNodes.forEach(textNode => {
        const words = textNode.textContent.split(/\s+/);
        const fragment = document.createDocumentFragment();
        
        words.forEach(word => {
          if (word.trim()) {
            const span = document.createElement('span');
            span.className = 'skill-effect-text';
            span.textContent = word;
            fragment.appendChild(span);
            // Add a space after each word except the last one
            if (word !== words[words.length - 1]) {
              fragment.appendChild(document.createTextNode(' '));
            }
          }
        });
        
        textNode.parentNode.replaceChild(fragment, textNode);
      });
    } else {
      console.warn('⚠️ KeywordProcessor not available, using plain text');
      effectSection.textContent = skillData.skillEffect;
    }

    content.appendChild(headerSection);
    content.appendChild(dividerContainer);
    content.appendChild(effectSection);

    // Add content to the content-and-frame container
    contentAndFrameContainer.appendChild(content);

    skillCard.appendChild(imageContainer);
    skillCard.appendChild(contentAndFrameContainer);
    
    // Add skill card to wrapper
    skillWrapper.appendChild(skillCard);

    // Apply bottom corner cuts after content is rendered
    this.applyBottomCornerCuts(content);

    this.debug('Skill element built successfully');
    return skillWrapper;
  }

  /**
   * Apply bottom corner cuts to skill content after rendering
   */
  static applyBottomCornerCuts(skillContentElement) {
    console.log('🎨 Starting applyBottomCornerCuts...', skillContentElement);
    
    // Wait for the next frame to ensure content is rendered
    requestAnimationFrame(() => {
      console.log('🎨 requestAnimationFrame callback executing...');
      
      // Get the actual rendered height
      const rect = skillContentElement.getBoundingClientRect();
      const height = rect.height;
      
      console.log('🎨 Element dimensions:', {
        width: rect.width,
        height: height,
        top: rect.top,
        left: rect.left
      });
      
      // Calculate the bottom cut positions
      const bottomCutY = height - 16; // 16px from bottom
      
      console.log('🎨 Calculated cut positions:', {
        bottomCutY: bottomCutY,
        height: height
      });
      
      // Apply the clip-path with calculated values
      const clipPathValue = `polygon(
        12px 0,           /* Top-left: cut 12px from left */
        288px 0,          /* Top-right: cut 12px from right */
        300px 16px,       /* Top-right: cut 16px from top */
        300px ${bottomCutY}px,    /* Bottom-right: cut 16px from bottom */
        288px ${height}px,        /* Bottom-right: cut 12px from right */
        12px ${height}px,         /* Bottom-left: cut 12px from left */
        0 ${bottomCutY}px,        /* Bottom-left: cut 16px from bottom */
        0 16px                    /* Top-left: cut 16px from top */
      )`;
      
      skillContentElement.style.clipPath = clipPathValue;
      
      console.log('🎨 Applied clip-path:', clipPathValue);
      console.log('🎨 Applied bottom corner cuts to skill content (height: ${height}px)');
    });
  }

  /**
   * Create skill controls (delete, export, etc.)
   */
  static createSkillControls(skillData) {
    const skillControls = document.createElement('div');
    skillControls.className = 'skill-controls';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'skill-edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit this skill';
    editBtn.onclick = function() {
      console.log('✏️ [DEBUG] Edit skill button clicked');
      if (window.editSkill) {
        window.editSkill(skillData);
      } else {
        console.error('❌ [DEBUG] editSkill function not found');
      }
    };
    
    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'skill-export-btn';
    exportBtn.innerHTML = '💾';
    exportBtn.title = 'Export this skill';
    exportBtn.onclick = function() {
      ExportImport.setupExportMenu(exportBtn, skillData, 'skill');
    };
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'skill-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete this skill';
    deleteBtn.onclick = function() {
      const skillWrapper = this.closest('.skill-card-wrapper');
      if (skillWrapper) {
        window.clearSkill(skillWrapper);
      }
    };

    // Removed deprecated database button - now handled by export menu
    
    skillControls.appendChild(editBtn);
    skillControls.appendChild(exportBtn);
    skillControls.appendChild(deleteBtn);
    
    return skillControls;
  }

  /**
   * Get border color for skill rarity
   */
  static getBorderColor(border) {
    switch(border) {
      case 'bronze': return 'rgb(205, 127, 50)';
      case 'silver': return 'silver';
      case 'gold': return 'gold';
      case 'diamond': return 'rgb(185, 242, 255)';
      case 'legendary': return 'red';
      default: return 'gold';
    }
  }

  /**
   * Get skill rarity name
   */
  static getRarityName(border) {
    switch(border) {
      case 'bronze': return 'Bronze';
      case 'silver': return 'Silver';
      case 'gold': return 'Gold';
      case 'diamond': return 'Diamond';
      case 'legendary': return 'Legendary';
      default: return 'Gold';
    }
  }

  /**
   * Generate skill statistics
   */
  static generateStatistics(skillsData) {
    if (!Array.isArray(skillsData) || skillsData.length === 0) {
      return {
        totalSkills: 0,
        averageEffectLength: 0,
        rarityDistribution: {},
        keywordUsage: {}
      };
    }

    const stats = {
      totalSkills: skillsData.length,
      averageEffectLength: 0,
      rarityDistribution: {},
      keywordUsage: {}
    };

    let totalEffectLength = 0;

    skillsData.forEach(skill => {
      // Track rarity distribution
      const rarity = skill.border || 'gold';
      stats.rarityDistribution[rarity] = (stats.rarityDistribution[rarity] || 0) + 1;

      // Track effect length
      if (skill.skillEffect) {
        totalEffectLength += skill.skillEffect.length;

        // Track keyword usage
        const keywords = KeywordProcessor.getKeywordList();
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = skill.skillEffect.match(regex);
          if (matches) {
            stats.keywordUsage[keyword] = (stats.keywordUsage[keyword] || 0) + matches.length;
          }
        });
      }
    });

    stats.averageEffectLength = Math.round(totalEffectLength / skillsData.length);

    this.debug('Generated skill statistics:', stats);
    return stats;
  }

  /**
   * Export single skill as PNG
   */
  static async exportSkillAsPNG(skillElement, filename) {
    try {
      // Use html2canvas if available, otherwise show message
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(skillElement, {
          backgroundColor: null,
          scale: 2, // Higher quality
          useCORS: true
        });

        // Create download link
        const link = document.createElement('a');
        link.download = filename || 'skill.png';
        link.href = canvas.toDataURL();
        link.click();

        Messages.showSuccess('Skill exported as PNG!');
      } else {
        Messages.showInfo('PNG export requires html2canvas library. Use "Export as Data" instead.');
      }
    } catch (error) {
      this.debug('Error exporting skill as PNG:', error);
      Messages.showError('Failed to export as PNG: ' + error.message);
    }
  }

  /**
   * Validate skill before creation
   */
  static validateSkillData(skillData) {
    const validation = Validation.validateSkillData(skillData);
    
    if (!validation.valid) {
      this.debug('Skill validation failed:', validation.error);
      throw new Error(validation.error);
    }

    this.debug('Skill validation passed');
    return true;
  }

  /**
   * Create skill from imported data
   */
  static createFromImport(skillData) {
    try {
      this.validateSkillData(skillData);
      
      const skillElement = this.createSkill({
        data: skillData,
        mode: 'generator',
        includeControls: true,
        container: document.getElementById('outputContainer')
      });

      this.debug('Skill created from import successfully');
      return skillElement;
    } catch (error) {
      this.debug('Error creating skill from import:', error);
      throw error;
    }
  }
}

// Make available globally
window.SkillGenerator = SkillGenerator;