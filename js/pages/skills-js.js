/**
 * Skills Page Controller
 * Handles specific functionality for the skills generation page
 */
class SkillsPageController {
  
  static skillsData = [];
  static isInitialized = false;

  /**
   * Initialize the skills page
   */
  static init() {
    if (this.isInitialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.setupSkillGeneration();
      this.setupFormEvents();
      this.setupSkillManagement();
      this.setupGlobalVariables();
      this.isInitialized = true;
    });
  }

  /**
   * Setup skill generation functionality
   */
  static setupSkillGeneration() {
    // Main create skill function
    window.createSkill = async (isPreview = false) => {
      try {
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
          
          // Dispatch custom event
          document.dispatchEvent(new CustomEvent('skillCreated', {
            detail: { skillData, skillElement }
          }));
        }

        return skillElement;
      } catch (error) {
        console.error('Error in createSkill:', error);
        Messages.showError(error.message);
        return null;
      }
    };

    // Setup the main generate button
    const generateButton = document.querySelector('button[onclick="createSkill()"]');
    if (generateButton) {
      generateButton.onclick = () => window.createSkill(false);
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
        const skillName = document.getElementById('skillNameInput')?.value;
        const skillEffect = document.getElementById('skillEffectInput')?.value;
        const imageInput = document.getElementById('imageInput');
        
        if (skillName && skillEffect && imageInput?.files?.[0]) {
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
        console.log('Preview update skipped:', error.message);
      }
    }, 300);
  }

  /**
   * Setup skill management functions
   */
  static setupSkillManagement() {
    // Clear all skills
    window.clearOutput = () => {
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
      Messages.showSuccess('All skills cleared');
    };

    // Clear individual skill
    window.clearSkill = (skillElement) => {
      if (!skillElement) return;
      
      const skillIndex = Array.from(skillElement.parentNode.children).indexOf(skillElement);
      if (skillIndex >= 0 && skillIndex < this.skillsData.length) {
        this.skillsData.splice(skillIndex, 1);
      }
      
      skillElement.remove();
    };

    // Setup clear all button
    const clearAllButton = document.querySelector('button[onclick="clearOutput()"]');
    if (clearAllButton) {
      clearAllButton.onclick = () => {
        if (this.skillsData.length > 0) {
          Messages.showConfirmation(
            'Are you sure you want to clear all skills? This action cannot be undone.',
            () => window.clearOutput(),
            () => {}
          );
        } else {
          Messages.showInfo('No skills to clear');
        }
      };
    }
  }

  /**
   * Setup global variables for backward compatibility
   */
  static setupGlobalVariables() {
    // Make skillsData available globally for export functions
    window.skillsData = this.skillsData;

    // Setup export functions
    window.exportAllSkillsAsData = () => {
      ExportImport.exportAllSkillsAsData(this.skillsData);
    };

    window.importSkillData = (event) => {
      ExportImport.importData(event, 'skills');
    };

    window.triggerImport = () => {
      ExportImport.triggerFileInput('.json', window.importSkillData);
    };

    // Setup export menu function
    window.toggleExportMenu = (button, skillData) => {
      ExportImport.setupExportMenu(button, skillData, 'skill');
    };

    window.exportSingleSkillAsData = (skillData) => {
      ExportImport.exportSingleSkillAsData(skillData);
    };
  }

  /**
   * Get current form data
   * @returns {Object} Current form data
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
   * @param {Object} data - Form data to set
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
   * Get all generated skills data
   * @returns {Array} Array of skill data objects
   */
  static getAllSkills() {
    return [...this.skillsData];
  }

  /**
   * Add a skill from external source (like import)
   * @param {Object} skillData - Skill data to add
   */
  static addSkill(skillData) {
    const skillElement = SkillGenerator.createSkill({
      data: skillData,
      container: document.getElementById('outputContainer'),
      mode: 'generator'
    });

    if (skillElement) {
      this.skillsData.push(skillData);
      window.skillsData = this.skillsData;
    }

    return skillElement;
  }

  /**
   * Show skill generation statistics
   */
  static showStatistics() {
    const stats = this.getStatistics();
    
    const statsHtml = `
      <div class="generation-stats">
        <h3>Skill Generation Statistics</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">${stats.totalSkills}</div>
            <div class="stat-label">Total Skills</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.averageLength}</div>
            <div class="stat-label">Avg Effect Length</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.keywordCount}</div>
            <div class="stat-label">Keywords Used</div>
          </div>
        </div>
        <div class="stats-breakdown">
          <h4>Skills by Rarity:</h4>
          ${Object.entries(stats.skillsByRarity)
            .map(([rarity, count]) => `<div>${rarity}: ${count}</div>`)
            .join('')}
        </div>
        <div class="stats-breakdown">
          <h4>Most Used Keywords:</h4>
          ${Object.entries(stats.keywordUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([keyword, count]) => `<div>${keyword}: ${count}</div>`)
            .join('')}
        </div>
      </div>
    `;

    console.log('Skill Statistics:', stats);
    return statsHtml;
  }

  /**
   * Get generation statistics
   * @returns {Object} Statistics object
   */
  static getStatistics() {
    const skillsByRarity = {};
    const keywordUsage = {};
    let totalLength = 0;

    this.skillsData.forEach(skill => {
      // Count by rarity
      const rarity = skill.border || 'gold';
      skillsByRarity[rarity] = (skillsByRarity[rarity] || 0) + 1;

      // Count effect length
      if (skill.skillEffect) {
        totalLength += skill.skillEffect.length;
        
        // Count keyword usage
        const keywords = Object.keys(KeywordProcessor.keywordRules);
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = skill.skillEffect.match(regex);
          if (matches) {
            keywordUsage[keyword] = (keywordUsage[keyword] || 0) + matches.length;
          }
        });
      }
    });

    return {
      totalSkills: this.skillsData.length,
      averageLength: this.skillsData.length > 0 ? Math.round(totalLength / this.skillsData.length) : 0,
      keywordCount: Object.keys(keywordUsage).length,
      skillsByRarity,
      keywordUsage
    };
  }

  /**
   * Setup keyboard shortcuts specific to skill generation
   */
  static setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
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
          Messages.showConfirmation(
            'Clear all skills?',
            () => window.clearOutput(),
            () => {}
          );
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

      // Ctrl+K to insert keyword shortcuts help
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.showKeywordHelp();
      }
    });
  }

  /**
   * Show keyword shortcuts help
   */
  static showKeywordHelp() {
    const shortcuts = KeywordProcessor.getShortcuts();
    const helpHtml = `
      <div class="keyword-help-modal">
        <h3>Keyword Shortcuts</h3>
        <p>Type these shortcuts in the skill effect box:</p>
        <div class="shortcut-grid">
          ${shortcuts.map(shortcut => `
            <div class="shortcut-item">
              <span class="shortcut-key">${shortcut.key}</span>
              <img src="images/KeyText/${shortcut.icon}" alt="${shortcut.keyword}" class="keyword-preview">
              <span style="color: ${shortcut.color}; font-weight: bold;">${shortcut.keyword}</span>
            </div>
          `).join('')}
        </div>
        <button onclick="this.closest('.keyword-help-modal').remove()">Close</button>
      </div>
    `;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 10000; 
      display: flex; align-items: center; justify-content: center;
    `;
    overlay.innerHTML = helpHtml;
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    };

    document.body.appendChild(overlay);
  }

  /**
   * Setup auto-save functionality
   */
  static setupAutoSave() {
    // Auto-save skills data to localStorage every 30 seconds
    setInterval(() => {
      if (this.skillsData.length > 0) {
        try {
          localStorage.setItem('bazaargen_skills_autosave', JSON.stringify({
            timestamp: new Date().toISOString(),
            skills: this.skillsData
          }));
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
        if (now - saveTime < 60 * 60 * 1000) {
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
    } catch (error) {
      console.warn('Failed to restore auto-save:', error);
    }
  }

  /**
   * Setup skill-specific form enhancements
   */
  static setupSkillFormEnhancements() {
    const skillEffectInput = document.getElementById('skillEffectInput');
    if (skillEffectInput) {
      // Add character counter
      const counterDiv = document.createElement('div');
      counterDiv.className = 'character-counter';
      counterDiv.style.cssText = 'font-size: 12px; color: #666; margin-top: 5px;';
      skillEffectInput.parentNode.appendChild(counterDiv);

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

      // Add keyword insertion helper
      const keywordButton = document.createElement('button');
      keywordButton.type = 'button';
      keywordButton.textContent = 'Insert Keyword';
      keywordButton.className = 'form-button secondary';
      keywordButton.style.marginTop = '5px';
      keywordButton.onclick = () => this.showKeywordInserter(skillEffectInput);
      
      skillEffectInput.parentNode.appendChild(keywordButton);
    }
  }

  /**
   * Show keyword inserter modal
   * @param {HTMLTextAreaElement} targetInput - Input to insert keyword into
   */
  static showKeywordInserter(targetInput) {
    const shortcuts = KeywordProcessor.getShortcuts();
    
    const modalHtml = `
      <div class="keyword-inserter-modal" style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; max-height: 80vh; overflow-y: auto;">
        <h3>Insert Keyword</h3>
        <p>Click a keyword to insert it at cursor position:</p>
        <div class="keyword-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin: 20px 0;">
          ${shortcuts.map(shortcut => `
            <button class="keyword-insert-btn" data-shortcut="${shortcut.key}" style="
              display: flex; align-items: center; gap: 5px; padding: 8px; 
              border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;
              font-size: 12px;
            ">
              <img src="images/KeyText/${shortcut.icon}" alt="${shortcut.keyword}" style="width: 16px; height: 16px;">
              <span style="color: ${shortcut.color}; font-weight: bold;">${shortcut.keyword}</span>
            </button>
          `).join('')}
        </div>
        <button onclick="this.closest('.modal-overlay').remove()" style="margin-top: 10px;">Close</button>
      </div>
    `;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 10000; 
      display: flex; align-items: center; justify-content: center;
    `;
    overlay.innerHTML = modalHtml;

    // Handle keyword insertion
    overlay.querySelectorAll('.keyword-insert-btn').forEach(btn => {
      btn.onclick = () => {
        const shortcut = btn.getAttribute('data-shortcut');
        const cursorPos = targetInput.selectionStart;
        const textBefore = targetInput.value.substring(0, cursorPos);
        const textAfter = targetInput.value.substring(cursorPos);
        
        targetInput.value = textBefore + shortcut + ' ' + textAfter;
        targetInput.focus();
        targetInput.setSelectionRange(cursorPos + shortcut.length + 1, cursorPos + shortcut.length + 1);
        
        // Trigger input event for live preview
        targetInput.dispatchEvent(new Event('input'));
        
        overlay.remove();
      };
    });

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    };

    document.body.appendChild(overlay);
  }
}

// Auto-initialize
SkillsPageController.init();

// Setup additional features
document.addEventListener('DOMContentLoaded', () => {
  SkillsPageController.setupKeyboardShortcuts();
  SkillsPageController.setupAutoSave();
  SkillsPageController.setupSkillFormEnhancements();
});
  