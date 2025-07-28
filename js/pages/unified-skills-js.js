/**
 * Unified Skills Page Controller
 * Handles individual skill creation and manual collection management
 */
class UnifiedSkillsPageController {
  
  static skillsData = [];
  static isInitialized = false;
  static debugMode = true;

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[UnifiedSkillsPageController] ${message}`, data || '');
    }
  }

  /**
   * Initialize the skills page
   */
  static init() {
    if (this.isInitialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.debug('Initializing Unified Skills Page Controller...');
      
      setTimeout(() => {
        this.setupSkillGeneration();
        this.setupFormEvents();
        this.setupSkillManagement();
        this.setupGlobalVariables();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        this.setupSkillFormEnhancements();
        this.setupCollectionManagement(); // New collection features
        this.isInitialized = true;
        this.debug('Unified Skills Page Controller initialized successfully');
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
          window.skillsData = this.skillsData;
          
          // Update UI and show collection options if multiple skills exist
          this.handleSkillCreated(skillElement);
          
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
   * Handle skill creation - update UI and show collection options
   */
  static handleSkillCreated(skillElement) {
    // Hide placeholder if it exists
    const placeholder = document.querySelector('.cards-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Update collection management visibility
    this.updateCollectionManagement();

    // Add skill selection checkbox if multiple skills exist
    if (this.skillsData.length > 1) {
      this.addSkillSelectionCheckbox(skillElement, this.skillsData.length - 1);
    }
  }

  /**
   * Setup collection management features
   */
  static setupCollectionManagement() {
    this.debug('Setting up collection management...');

    // Add collection management section to management actions
    const managementSection = document.querySelector('.management-section');
    if (!managementSection) return;

    // Create collection controls container
    const collectionControls = document.createElement('div');
    collectionControls.className = 'collection-controls';
    collectionControls.id = 'collectionControls';
    collectionControls.style.cssText = `
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(106, 13, 173, 0.05) 100%);
      border: 2px solid rgba(138, 43, 226, 0.3);
      border-radius: 8px;
      display: none;
    `;

    collectionControls.innerHTML = `
      <h4 style="color: rgb(138, 43, 226); margin: 0 0 15px 0; font-size: 16px;">📦 Collection Management</h4>
      
      <div style="margin-bottom: 15px;">
        <button onclick="UnifiedSkillsPageController.toggleSelectionMode()" class="form-button secondary" id="selectionModeBtn">
          ✅ Enable Selection Mode
        </button>
        <span style="margin-left: 10px; color: rgb(201, 175, 133); font-size: 14px;" id="selectionStatus">
          Select multiple skills to create a collection
        </span>
      </div>

      <div id="collectionActions" style="display: none;">
        <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
          <input type="text" id="collectionNameInput" placeholder="Collection Name" 
                 style="flex: 1; min-width: 200px; padding: 10px; border: 2px solid rgb(138, 43, 226); border-radius: 6px; background: rgba(37, 26, 12, 0.8); color: rgb(251, 225, 183);">
          <input type="text" id="collectionDescInput" placeholder="Description (optional)" 
                 style="flex: 2; min-width: 300px; padding: 10px; border: 2px solid rgb(138, 43, 226); border-radius: 6px; background: rgba(37, 26, 12, 0.8); color: rgb(251, 225, 183);">
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="UnifiedSkillsPageController.saveSelectedAsCollection()" class="form-button" style="background: linear-gradient(135deg, rgb(138, 43, 226) 0%, rgb(106, 13, 173) 100%);">
            💾 Save as Collection
          </button>
          <button onclick="UnifiedSkillsPageController.saveSelectedIndividually()" class="form-button secondary">
            ⚡ Save Selected Individually
          </button>
          <button onclick="UnifiedSkillsPageController.clearSelection()" class="form-button secondary">
            🗑️ Clear Selection
          </button>
        </div>
      </div>
    `;

    // Insert after management actions
    const managementActions = document.querySelector('.management-actions');
    if (managementActions) {
      managementActions.parentNode.insertBefore(collectionControls, managementActions.nextSibling);
    }
  }

  /**
   * Update collection management visibility
   */
  static updateCollectionManagement() {
    const collectionControls = document.getElementById('collectionControls');
    const selectionStatus = document.getElementById('selectionStatus');
    
    if (this.skillsData.length >= 2) {
      if (collectionControls) collectionControls.style.display = 'block';
      if (selectionStatus) {
        selectionStatus.textContent = `${this.skillsData.length} skills available - create collections or save individually`;
      }
    } else {
      if (collectionControls) collectionControls.style.display = 'none';
    }
  }

  /**
   * Add selection checkbox to skill element
   */
  static addSkillSelectionCheckbox(skillElement, skillIndex) {
    // Check if checkbox already exists
    if (skillElement.querySelector('.skill-selection-checkbox')) return;

    const checkbox = document.createElement('div');
    checkbox.className = 'skill-selection-checkbox';
    checkbox.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 100;
      display: none;
    `;

    checkbox.innerHTML = `
      <input type="checkbox" id="skill-${skillIndex}" class="skill-checkbox" 
             style="width: 20px; height: 20px; cursor: pointer;">
      <label for="skill-${skillIndex}" style="margin-left: 5px; color: rgb(251, 225, 183); cursor: pointer; font-weight: bold;">
        Select
      </label>
    `;

    // Make skill element relatively positioned for checkbox positioning
    skillElement.style.position = 'relative';
    skillElement.appendChild(checkbox);

    // Add change event listener
    const checkboxInput = checkbox.querySelector('input[type="checkbox"]');
    checkboxInput.addEventListener('change', () => {
      this.updateSelectionStatus();
    });
  }

  /**
   * Toggle selection mode
   */
  static toggleSelectionMode() {
    const checkboxes = document.querySelectorAll('.skill-selection-checkbox');
    const button = document.getElementById('selectionModeBtn');
    const actions = document.getElementById('collectionActions');
    
    const isVisible = checkboxes.length > 0 && checkboxes[0].style.display !== 'none';
    
    if (isVisible) {
      // Hide selection mode
      checkboxes.forEach(cb => cb.style.display = 'none');
      if (button) button.textContent = '✅ Enable Selection Mode';
      if (actions) actions.style.display = 'none';
      this.clearSelection();
    } else {
      // Show selection mode
      checkboxes.forEach(cb => cb.style.display = 'block');
      if (button) button.textContent = '❌ Disable Selection Mode';
      if (actions) actions.style.display = 'block';
    }
  }

  /**
   * Update selection status
   */
  static updateSelectionStatus() {
    const selectedCheckboxes = document.querySelectorAll('.skill-checkbox:checked');
    const selectionStatus = document.getElementById('selectionStatus');
    
    if (selectionStatus) {
      if (selectedCheckboxes.length === 0) {
        selectionStatus.textContent = 'No skills selected';
        selectionStatus.style.color = 'rgb(201, 175, 133)';
      } else {
        selectionStatus.textContent = `${selectedCheckboxes.length} skill${selectedCheckboxes.length !== 1 ? 's' : ''} selected`;
        selectionStatus.style.color = 'rgb(138, 43, 226)';
      }
    }
  }

  /**
   * Save selected skills as a collection
   */
  static async saveSelectedAsCollection() {
    const selectedCheckboxes = document.querySelectorAll('.skill-checkbox:checked');
    const collectionName = document.getElementById('collectionNameInput')?.value?.trim();
    const collectionDesc = document.getElementById('collectionDescInput')?.value?.trim();

    if (selectedCheckboxes.length === 0) {
      Messages.showError('Please select at least one skill for the collection');
      return;
    }

    if (!collectionName) {
      Messages.showError('Please enter a collection name');
      return;
    }

    try {
      // Get selected skills data
      const selectedSkills = [];
      selectedCheckboxes.forEach(checkbox => {
        const skillIndex = parseInt(checkbox.id.split('-')[1]);
        if (skillIndex >= 0 && skillIndex < this.skillsData.length) {
          selectedSkills.push(this.skillsData[skillIndex]);
        }
      });

      // Create collection data structure
      const collectionData = {
        skillName: collectionName,
        skillEffect: collectionDesc || `Collection of ${selectedSkills.length} skills`,
        border: 'gold', // Default border for collections
        skills: selectedSkills, // Array of individual skills
        isCollection: true,
        skillCount: selectedSkills.length
      };

      // Save collection to database
      await SupabaseClient.saveSkill(collectionData);
      
      Messages.showSuccess(`Collection "${collectionName}" saved with ${selectedSkills.length} skills!`);
      
      // Clear selection and inputs
      this.clearSelection();
      document.getElementById('collectionNameInput').value = '';
      document.getElementById('collectionDescInput').value = '';
      
    } catch (error) {
      console.error('Error saving collection:', error);
      Messages.showError('Failed to save collection: ' + error.message);
    }
  }

  /**
   * Save selected skills individually
   */
  static async saveSelectedIndividually() {
    const selectedCheckboxes = document.querySelectorAll('.skill-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
      Messages.showError('Please select at least one skill to save');
      return;
    }

    try {
      let savedCount = 0;
      
      for (const checkbox of selectedCheckboxes) {
        const skillIndex = parseInt(checkbox.id.split('-')[1]);
        if (skillIndex >= 0 && skillIndex < this.skillsData.length) {
          const skillData = {
            ...this.skillsData[skillIndex],
            isCollection: false
          };
          
          await SupabaseClient.saveSkill(skillData);
          savedCount++;
        }
      }
      
      Messages.showSuccess(`Saved ${savedCount} individual skill${savedCount !== 1 ? 's' : ''}!`);
      this.clearSelection();
      
    } catch (error) {
      console.error('Error saving individual skills:', error);
      Messages.showError('Failed to save skills: ' + error.message);
    }
  }

  /**
   * Clear selection
   */
  static clearSelection() {
    const checkboxes = document.querySelectorAll('.skill-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    this.updateSelectionStatus();
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
    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => {
      try {
        const skillName = document.getElementById('skillNameInput')?.value?.trim();
        const skillEffect = document.getElementById('skillEffectInput')?.value?.trim();
        const imageInput = document.getElementById('imageInput');
        
        if (skillName && skillEffect && imageInput?.files?.[0]) {
          this.debug('Form has sufficient data, creating preview...');
          window.createSkill(true);
        } else {
          const previewContainer = document.getElementById('previewContainer');
          if (previewContainer) {
            previewContainer.innerHTML = '';
          }
        }
      } catch (error) {
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
      
      // Hide collection controls and show placeholder
      this.updateCollectionManagement();
      this.showPlaceholder(outputContainer);
      
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
      
      // Update collection management
      this.updateCollectionManagement();
      
      // Show placeholder if no skills left
      const outputContainer = document.getElementById("outputContainer");
      this.showPlaceholder(outputContainer);
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
   * Show placeholder in container
   */
  static showPlaceholder(container) {
    if (!container) return;
    
    if (container.children.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'cards-placeholder';
      placeholder.innerHTML = `
        <p>⚡ Your saved skills will appear here after you create them!</p>
        <p style="margin-top: 10px; font-size: 0.9em;">Each skill will have export and delete options.</p>
      `;
      container.appendChild(placeholder);
    }
  }

  /**
   * Setup global variables for backward compatibility
   */
  static setupGlobalVariables() {
    this.debug('Setting up global variables...');
    
    window.skillsData = this.skillsData;

    // Export functions
    window.exportAllSkillsAsData = () => {
      this.debug('Exporting all skills as data...');
      if (typeof ExportImport !== 'undefined') {
        ExportImport.exportAllSkillsAsData(this.skillsData);
      } else {
        this.fallbackExportAllSkills();
      }
    };

    window.importSkillData = (event) => {
      this.debug('Importing skill data...');
      if (typeof ExportImport !== 'undefined') {
        ExportImport.importData(event, 'skills');
      } else {
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

    // Edit skill function
    window.editSkill = (skillData) => {
      this.debug('✏️ Global editSkill called');
      this.editSkill(skillData);
    };
  }

  /**
   * Fallback export all skills
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
   * Fallback import skills
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
        } else {
          Messages.showError('No skills could be imported from this file.');
        }

      } catch (error) {
        Messages.showError('Error reading file: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  }

  /**
   * Fallback export single skill
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
   * Add a skill from external source
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
      
      this.handleSkillCreated(skillElement);
    }

    return skillElement;
  }

  /**
   * Setup keyboard shortcuts
   */
  static setupKeyboardShortcuts() {
    this.debug('Setting up keyboard shortcuts...');
    
    document.addEventListener('keydown', (e) => {
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

      // Ctrl+S to toggle selection mode
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (this.skillsData.length >= 2) {
          this.toggleSelectionMode();
        }
      }
    });
  }

  /**
   * Setup auto-save functionality
   */
  static setupAutoSave() {
    this.debug('Setting up auto-save...');
    
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
      const rarity = skill.border || 'gold';
      skillsByRarity[rarity] = (skillsByRarity[rarity] || 0) + 1;

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

  /**
   * Edit skill - fill form with skill data
   */
  static editSkill(skillData) {
    console.log('✏️ Editing skill:', skillData.skillName);
    
    try {
      // Fill in basic skill info
      if (skillData.skillName) {
        document.getElementById('skillNameInput').value = skillData.skillName;
      }
      
      if (skillData.skillEffect) {
        document.getElementById('skillEffectInput').value = skillData.skillEffect;
      }
      
      if (skillData.border) {
        document.getElementById('borderSelect').value = skillData.border;
      }

      // Handle image if present
      if (skillData.imageData) {
        // Create a file from the data URL
        const base64Data = skillData.imageData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], 'skill-image.png', { type: 'image/png' });
        
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
        Messages.showSuccess(`Skill "${skillData.skillName}" loaded for editing`);
      } else {
        alert(`Skill "${skillData.skillName}" loaded for editing`);
      }

      // Scroll to top of form
      document.querySelector('.form-column').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error editing skill:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load skill for editing: ' + error.message);
      } else {
        alert('Failed to load skill for editing: ' + error.message);
      }
    }
  }
}

// Auto-initialize
UnifiedSkillsPageController.init();

// Make available globally
window.SkillsPageController = UnifiedSkillsPageController;
window.UnifiedSkillsPageController = UnifiedSkillsPageController;
