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

    // Read image data
    const imageData = await this.readImageFile(imageInput.files[0]);

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
    const skillCard = document.createElement('div');
    skillCard.className = 'skill-card';

    // Add controls if needed
    if (includeControls && mode === 'generator') {
      const skillControls = this.createSkillControls(skillData);
      skillCard.appendChild(skillControls);
    }

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'skill-image-container';
    imageContainer.style.border = `3px solid ${borderColor}`;

    const img = document.createElement('img');
    img.src = skillData.imageData;
    img.alt = skillData.skillName;
    imageContainer.appendChild(img);

    // Add border overlay
    const imageBorderOverlay = document.createElement('img');
    imageBorderOverlay.className = 'skill-border-overlay';
    imageBorderOverlay.src = `images/${skillData.border}_skill_border.png`;
    imageBorderOverlay.onerror = function() {
      this.style.display = 'none';
    };
    imageBorderOverlay.alt = '';
    
    // BULLETPROOF: Set explicit positioning styles from creation
    imageBorderOverlay.style.position = 'absolute';
    imageBorderOverlay.style.top = '50%';
    imageBorderOverlay.style.left = '50%';
    imageBorderOverlay.style.width = '113px';
    imageBorderOverlay.style.height = '113px';
    imageBorderOverlay.style.transform = 'translate(-50%, -50%)';
    imageBorderOverlay.style.objectFit = 'cover';
    imageBorderOverlay.style.pointerEvents = 'none';
    imageBorderOverlay.style.zIndex = '999';
    imageBorderOverlay.style.borderRadius = '50%';
    imageBorderOverlay.style.overflow = 'visible';
    
    imageContainer.appendChild(imageBorderOverlay);

    // Create content section
    const content = document.createElement('div');
    content.className = 'skill-content';
    content.style.border = `3px solid ${borderColor}`;

    // Header section
    const headerSection = document.createElement('div');
    headerSection.className = 'skill-header';
    headerSection.style.borderTop = `2px solid ${borderColor}`;
    headerSection.style.borderBottom = `2px solid ${borderColor}`;
    
    const skillTitle = document.createElement('div');
    skillTitle.className = 'skill-title';
    skillTitle.textContent = skillData.skillName;
    headerSection.appendChild(skillTitle);

    // Effect section
    const effectSection = document.createElement('div');
    effectSection.className = 'skill-effect';
    effectSection.style.borderTop = `2px solid ${borderColor}`;
    effectSection.style.borderBottom = `2px solid ${borderColor}`;
    effectSection.innerHTML = KeywordProcessor.processKeywordText(skillData.skillEffect);

    content.appendChild(headerSection);
    content.appendChild(effectSection);

    skillCard.appendChild(imageContainer);
    skillCard.appendChild(content);

    this.debug('Skill element built successfully');
    return skillCard;
  }

  /**
   * Create skill controls (delete, export, etc.)
   */
  static createSkillControls(skillData) {
    const skillControls = document.createElement('div');
    skillControls.className = 'skill-controls';
    
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
      const skillCard = this.closest('.skill-card');
      if (skillCard) {
        window.clearSkill(skillCard);
      }
    };

    // Removed deprecated database button - now handled by export menu
    
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