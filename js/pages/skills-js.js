/**
 * Enhanced Skills Page Controller with Gallery Integration
 * Handles specific functionality for the skills generation page with gallery support
 */
class SkillsPageController {
  
  static skillsData = [];
  static isInitialized = false;
  static debugMode = true;

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[SkillsPageController] ${message}`, data || '');
    }
  }

  /**
   * Initialize the skills page
   */
  static init() {
    if (this.isInitialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.debug('Initializing Skills Page Controller...');
      
      // Wait a moment for other scripts to load
      setTimeout(() => {
        this.setupSkillGeneration();
        this.setupFormEvents();
        this.setupSkillManagement();
        this.setupGlobalVariables();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        this.setupSkillFormEnhancements();
        this.setupGalleryIntegration(); // New gallery integration
        this.isInitialized = true;
        this.debug('Skills Page Controller initialized successfully');
      }, 100);
    });
  }

  /**
   * Setup skill generation functionality
   */
  static setupSkillGeneration() {
    this.debug('Setting up skill generation...');
    
    // Main create skill function
    window.createSkill = async (isPreview = false) => {
      try {
        this.debug(`Creating skill (preview: ${isPreview})...`);
        
        const skillData = await SkillGenerator.extractFormData();
        
        const skillElement = SkillGenerator.createSkill({
          data: skillData,
          isPreview: isPreview,
          container: isPreview ? document.getElementById('previewContainer') : document.getElementById('outputContainer'),
          includeControls: !isPreview,
          mode: isPreview ? 'preview' : 'generator'
        });

        if (skillElement && !isPreview) {
          this.skillsData.push(skillData);
          window.skillsData = this.skillsData; // Keep global reference
          
          // Handle skill creation - hide placeholder and update gallery
          if (SkillsGalleryManager) {
            SkillsGalleryManager.handleSkillCreated(skillElement);
          }
          
          // Dispatch custom event
          document.dispatchEvent(new CustomEvent('skillCreated', {
            detail: { skillData, skillElement }
          }));
          
          this.debug('Skill created and added to data array');
        }

        return skillElement;
      } catch (error) {
        this.debug('Error in createSkill:', error);
        console.error('Error in createSkill:', error);
        Messages.showError(error.message);
        return null;
      }
    };

    // Setup the main generate button
    const generateButton = document.querySelector('button[onclick="createSkill()"]');
    if (generateButton) {
      generateButton.onclick = () => window.createSkill(false);
      this.debug('Generate button setup complete');
    }
  }

  /**
   * Setup form event handlers
   */
  static setupFormEvents() {
    this.debug('Setting up form events...');
    
    // Live preview on form changes
    const inputs = document.querySelectorAll('#skillNameInput, #skillEffectInput, #borderSelect');
    inputs.forEach(element => {
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
      this.debug('Image input event listener added');
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
        const skillName = document.getElementById('skillNameInput')?.value?.trim();
        const skillEffect = document.getElementById('skillEffectInput')?.value?.trim();
        const imageInput = document.getElementById('imageInput');
        
        if (skillName && skillEffect && imageInput?.files?.[0]) {
          this.debug('Form has sufficient data, creating preview...');
          window.createSkill(true); // Create preview
        } else {
          // Clear preview if insufficient data
          const previewContainer = document.getElementById('previewContainer');
          if (previewContainer) {
            previewContainer.innerHTML = '';
          }
        }
      } catch (error) {
        // Silently fail for preview updates
        this.debug('Preview update skipped:', error.message);
      }
    }, 300);
  }

  /**
   * Setup skill management functions
   */
  static setupSkillManagement() {
    this.debug('Setting up skill management...');
    
    // Clear all skills
    window.clearOutput = () => {
      this.debug('Clearing all output...');
      
      const outputContainer = document.getElementById("outputContainer");
      const previewContainer = document.getElementById("previewContainer");
      const errorContainer = document.getElementById("errorContainer");
      
      if (outputContainer) outputContainer.innerHTML = '';
      if (previewContainer) previewContainer.innerHTML = '';
      if (errorContainer) errorContainer.innerHTML = '';
      
      // Clear form inputs
      const skillNameInput = document.getElementById("skillNameInput");
      const skillEffectInput = document.getElementById("skillEffectInput");
      const imageInput = document.getElementById("imageInput");
      const borderSelect = document.getElementById("borderSelect");
      
      if (skillNameInput) skillNameInput.value = '';
      if (skillEffectInput) skillEffectInput.value = '';
      if (imageInput) imageInput.value = '';
      if (borderSelect) borderSelect.value = 'gold';
      
      this.skillsData = [];
      window.skillsData = this.skillsData;
      
      // Exit gallery mode if active - this will clean up the management section too
      if (SkillsGalleryManager?.isGalleryMode) {
        SkillsGalleryManager.toggleGalleryMode();
      }
      
      // Show placeholder
      if (SkillsGalleryManager) {
        SkillsGalleryManager.showPlaceholder(outputContainer);
      }
      
      Messages.showSuccess('All skills cleared');
    };

    // Clear individual skill
    window.clearSkill = (skillElement) => {
      if (!skillElement) return;
      
      this.debug('Clearing individual skill...');
      
      const skillIndex = Array.from(skillElement.parentNode.children).indexOf(skillElement);
      if (skillIndex >= 0 && skillIndex < this.skillsData.length) {
        this.skillsData.splice(skillIndex, 1);
        window.skillsData = this.skillsData;
      }
      
      skillElement.remove();
      
      // Update gallery if in gallery mode
      if (SkillsGalleryManager?.isGalleryMode) {
        SkillsGalleryManager.updateSkillIndices();
        SkillsGalleryManager.updateSelectionCount();
      }
      
      // Show placeholder if no skills left
      const outputContainer = document.getElementById("outputContainer");
      if (SkillsGalleryManager) {
        SkillsGalleryManager.showPlaceholder(outputContainer);
      }
    };

    // Setup clear all button
    const clearAllButton = document.querySelector('button[onclick="clearOutput()"]');
    if (clearAllButton) {
      clearAllButton.onclick = () => {
        if (this.skillsData.length > 0) {
          if (typeof Messages !== 'undefined' && Messages.showConfirmation) {
            Messages.showConfirmation(
              'Are you sure you want to clear all skills? This action cannot be undone.',
              () => window.clearOutput(),
              () => {}
            );
          } else {
            // Fallback to native confirm
            if (confirm('Are you sure you want to clear all skills?')) {
              window.clearOutput();
            }
          }
        } else {
          Messages.showInfo('No skills to clear');
        }
      };
      this.debug('Clear all button setup complete');
    }
  }

  /**
   * Setup global variables for backward compatibility
   */
  static setupGlobalVariables() {
    this.debug('Setting up global variables...');
    
    // Make skillsData available globally for export functions
    window.skillsData = this.skillsData;

    // Setup export functions
    window.exportAllSkillsAsData = () => {
      this.debug('Exporting all skills as data...');
      if (typeof ExportImport !== 'undefined') {
        ExportImport.exportAllSkillsAsData(this.skillsData);
      } else {
        // Fallback export function
        this.fallbackExportAllSkills();
      }
    };

    window.importSkillData = (event) => {
      this.debug('Importing skill data...');
      if (typeof ExportImport !== 'undefined') {
        ExportImport.importData(event, 'skills');
      } else {
        // Fallback import function
        this.fallbackImportSkills(event);
      }
    };

    window.triggerImport = () => {
      this.debug('Triggering import...');
      const importInput = document.getElementById('importInput');
      if (importInput) {
        importInput.click();
      }
    };

    // Setup export menu function
    window.toggleExportMenu = (button, skillData) => {
      if (typeof ExportImport !== 'undefined') {
        ExportImport.setupExportMenu(button, skillData, 'skill');
      }
    };

    window.exportSingleSkillAsData = (skillData) => {
      if (typeof ExportImport !== 'undefined') {
        ExportImport.exportSingleSkillAsData(skillData);
      } else {
        this.fallbackExportSingleSkill(skillData);
      }
    };
  }

  /**
   * Setup gallery integration
   */
  static setupGalleryIntegration() {
    this.debug('Setting up gallery integration...');
    
    // Listen for skill creation events
    document.addEventListener('skillCreated', (event) => {
      // The handleSkillCreated method is now called directly in createSkill
      // This event listener can be used for other integrations if needed
      this.debug('Skill creation event received:', event.detail.skillData.skillName);
    });

    // Setup database save enhancement for collections
    this.enhanceDatabaseSaveForCollections();
    
    this.debug('Gallery integration setup complete');
  }

  /**
   * Enhance database save for collections
   */
  static enhanceDatabaseSaveForCollections() {
    // Override the default save function to include collection options
    const originalSaveSkill = window.Database?.saveSkill;
    
    if (originalSaveSkill) {
      window.Database.saveSkill = async (skillData) => {
        // Check if we're in gallery mode with selected skills
        if (SkillsGalleryManager?.isGalleryMode) {
          const selectedCount = document.querySelectorAll('.skill-checkbox:checked').length;
          
          if (selectedCount > 1) {
            // Ask if user wants to save as collection instead
            Messages.showConfirmation(
              `You have ${selectedCount} skills selected. Would you like to save them as a collection instead of just this one skill?`,
              () => {
                SkillsGalleryManager.saveSelectedAsCollection();
              },
              () => {
                // Save individual skill as normal
                originalSaveSkill.call(window.Database, skillData);
              }
            );
            return;
          }
        }
        
        // Save individual skill as normal
        return originalSaveSkill.call(window.Database, skillData);
      };
    }
  }

  /**
   * Fallback export function if ExportImport is not available
   */
  static fallbackExportAllSkills() {
    if (this.skillsData.length === 0) {
      Messages.showError('No skills to export!');
      return;
    }

    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "skills",
      count: this.skillsData.length,
      collection: {
        name: `Skill Collection ${new Date().toLocaleDateString()}`,
        description: `${this.skillsData.length} skills exported from BazaarGen`,
        created_by: GoogleAuth?.getUserDisplayName() || 'Unknown'
      },
      skills: this.skillsData
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bazaar-skills-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Messages.showSuccess(`Exported ${this.skillsData.length} skills successfully!`);
  }

  /**
   * Fallback import function if ExportImport is not available
   */
  static fallbackImportSkills(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.skills || !Array.isArray(importedData.skills)) {
          throw new Error('Invalid file format');
        }

        let importedCount = 0;
        importedData.skills.forEach(skillData => {
          try {
            this.addSkill(skillData);
            importedCount++;
          } catch (error) {
            console.error('Error importing skill:', error);
          }
        });

        if (importedCount > 0) {
          Messages.showSuccess(`Successfully imported ${importedCount} skills!`);
          
          // Mark as collection if it was a collection export
          if (importedData.collection && importedCount > 1) {
            SkillsGalleryManager?.markAsCollection?.(importedData.collection, importedCount);
          }
        } else {
          Messages.showError('No skills could be imported from this file.');
        }

      } catch (error) {
        Messages.showError('Error reading file: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
  }

  /**
   * Fallback export single skill function
   */
  static fallbackExportSingleSkill(skillData) {
    const dataToExport = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      type: "skills",
      count: 1,
      skills: [skillData]
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${skillData.skillName.replace(/\s+/g, '-')}-skill.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Messages.showSuccess('Skill exported successfully!');
  }

  /**
   * Add a skill from external source (like import or collection)
   */
  static addSkill(skillData) {
    this.debug('Adding skill from external source:', skillData.skillName);
    
    const skillElement = SkillGenerator.createSkill({
      data: skillData,
      container: document.getElementById('outputContainer'),
      mode: 'generator'
    });

    if (skillElement) {
      this.skillsData.push(skillData);
      window.skillsData = this.skillsData;
      
      // Handle skill creation - hide placeholder and update gallery
      if (SkillsGalleryManager) {
        SkillsGalleryManager.handleSkillCreated(skillElement);
      }
    }

    return skillElement;
  }

  /**
   * Setup keyboard shortcuts specific to skill generation
   */
  static setupKeyboardShortcuts() {
    this.debug('Setting up keyboard shortcuts...');
    
    document.addEventListener('keydown', (e) => {
      // Only trigger if not typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl+G to generate skill
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        const generateButton = document.querySelector('button[onclick="createSkill()"]');
        if (generateButton && !generateButton.disabled) {
          window.createSkill(false);
        }
      }

      // Ctrl+Shift+C to clear all skills
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (this.skillsData.length > 0) {
          if (confirm('Clear all skills?')) {
            window.clearOutput();
          }
        }
      }

      // Ctrl+E to export skills
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (this.skillsData.length > 0) {
          window.exportAllSkillsAsData();
        } else {
          Messages.showInfo('No skills to export');
        }
      }

      // Ctrl+Shift+G to toggle gallery mode
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        if (SkillsGalleryManager) {
          SkillsGalleryManager.toggleGalleryMode();
        }
      }
    });
  }

  /**
   * Setup auto-save functionality
   */
  static setupAutoSave() {
    this.debug('Setting up auto-save...');
    
    // Auto-save skills data to localStorage every 30 seconds
    setInterval(() => {
      if (this.skillsData.length > 0) {
        try {
          localStorage.setItem('bazaargen_skills_autosave', JSON.stringify({
            timestamp: new Date().toISOString(),
            skills: this.skillsData
          }));
          this.debug('Auto-saved skills data');
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 30000);

    // Restore auto-saved data on page load
    try {
      const autoSaveData = localStorage.getItem('bazaargen_skills_autosave');
      if (autoSaveData) {
        const parsed = JSON.parse(autoSaveData);
        const saveTime = new Date(parsed.timestamp);
        const now = new Date();
        
        // Only restore if save is less than 1 hour old
        if (now - saveTime < 60 * 60 * 1000 && parsed.skills.length > 0) {
          if (typeof Messages !== 'undefined' && Messages.showConfirmation) {
            Messages.showConfirmation(
              `Found auto-saved data from ${saveTime.toLocaleString()}. Restore ${parsed.skills.length} skills?`,
              () => {
                parsed.skills.forEach(skillData => this.addSkill(skillData));
                Messages.showSuccess(`Restored ${parsed.skills.length} skills from auto-save`);
              },
              () => {
                localStorage.removeItem('bazaargen_skills_autosave');
              }
            );
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore auto-save:', error);
    }
  }

  /**
   * Setup skill-specific form enhancements
   */
  static setupSkillFormEnhancements() {
    this.debug('Setting up form enhancements...');
    
    const skillEffectInput = document.getElementById('skillEffectInput');
    if (skillEffectInput) {
      const counterDiv = document.querySelector('.character-counter') || 
                        skillEffectInput.parentNode.querySelector('.character-counter');
      
      if (counterDiv) {
        const updateCounter = () => {
          const length = skillEffectInput.value.length;
          counterDiv.textContent = `${length} characters`;
          
          // Color coding for length
          if (length > 200) {
            counterDiv.style.color = '#f44336';
          } else if (length > 150) {
            counterDiv.style.color = '#ff9800';
          } else {
            counterDiv.style.color = '#666';
          }
        };

        skillEffectInput.addEventListener('input', updateCounter);
        updateCounter();
      }

      this.debug('Form enhancements setup complete');
    }
  }

  /**
   * Get all generated skills data
   */
  static getAllSkills() {
    return [...this.skillsData];
  }

  /**
   * Get current form data
   */
  static getCurrentFormData() {
    return {
      skillName: document.getElementById("skillNameInput")?.value || '',
      skillEffect: document.getElementById("skillEffectInput")?.value || '',
      border: document.getElementById("borderSelect")?.value || 'gold'
    };
  }

  /**
   * Set form data
   */
  static setFormData(data) {
    if (data.skillName) {
      const skillNameInput = document.getElementById("skillNameInput");
      if (skillNameInput) skillNameInput.value = data.skillName;
    }
    
    if (data.skillEffect) {
      const skillEffectInput = document.getElementById("skillEffectInput");
      if (skillEffectInput) skillEffectInput.value = data.skillEffect;
    }
    
    if (data.border) {
      const borderSelect = document.getElementById("borderSelect");
      if (borderSelect) borderSelect.value = data.border;
    }
  }

  /**
   * Reset the form
   */
  static resetForm() {
    window.clearOutput();
  }

  /**
   * Get skills statistics
   */
  static getStatistics() {
    const skillsByRarity = {};
    let totalEffectLength = 0;

    this.skillsData.forEach(skill => {
      // Count by rarity
      const rarity = skill.border || 'gold';
      skillsByRarity[rarity] = (skillsByRarity[rarity] || 0) + 1;

      // Track effect length
      if (skill.skillEffect) {
        totalEffectLength += skill.skillEffect.length;
      }
    });

    return {
      totalSkills: this.skillsData.length,
      averageEffectLength: this.skillsData.length > 0 ? Math.round(totalEffectLength / this.skillsData.length) : 0,
      skillsByRarity
    };
  }
}

// Auto-initialize
SkillsPageController.init();

// Make available globally
window.SkillsPageController = SkillsPageController;
