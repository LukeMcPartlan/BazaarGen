/**
 * Skills Gallery Manager
 * Extends gallery functionality specifically for skills
 */
class SkillsGalleryManager {
  static isGalleryMode = false;
  static debugMode = true;

  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[SkillsGalleryManager] ${message}`, data || '');
    }
  }

  /**
   * Toggle gallery mode for skills
   */
  static toggleGalleryMode() {
    this.isGalleryMode = !this.isGalleryMode;
    this.debug('Gallery mode toggled:', this.isGalleryMode ? 'ON' : 'OFF');

    const outputContainer = document.getElementById('outputContainer');
    const galleryButton = document.querySelector('.gallery-toggle-btn');
    
    if (this.isGalleryMode) {
      this.enterGalleryMode(outputContainer, galleryButton);
    } else {
      this.exitGalleryMode(outputContainer, galleryButton);
    }
  }

  /**
   * Enter gallery mode
   */
  static enterGalleryMode(container, button) {
    this.debug('Entering gallery mode...');
    
    // Update button
    if (button) {
      button.textContent = '⚡ Exit Gallery';
      button.classList.add('active');
    }

    // Add gallery controls
    this.addGalleryControls(container);

    // Transform existing skills to gallery items
    this.transformSkillsToGallery(container);

    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
      pageTitle.textContent = 'Skills Gallery';
    }
  }

  /**
   * Exit gallery mode
   */
  static exitGalleryMode(container, button) {
    this.debug('Exiting gallery mode...');
    
    // Update button
    if (button) {
      button.textContent = '🖼️ Gallery View';
      button.classList.remove('active');
    }

    // Remove gallery controls
    const galleryControls = container.querySelector('.gallery-controls');
    if (galleryControls) {
      galleryControls.remove();
    }

    // Restore normal skill view
    this.restoreNormalView(container);

    // Show placeholder if no skills
    this.showPlaceholder(container);

    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
      pageTitle.textContent = 'Skill Generator';
    }
  }

  /**
   * Add gallery controls
   */
  static addGalleryControls(container) {
    const existingControls = container.querySelector('.gallery-controls');
    if (existingControls) {
      existingControls.remove();
    }

    // Hide the placeholder when entering gallery mode
    this.hidePlaceholder(container);

    // Create sticky gallery controls
    const galleryControls = document.createElement('div');
    galleryControls.className = 'gallery-controls sticky-gallery-controls';
    galleryControls.innerHTML = `
      <div class="gallery-header">
        <h3>Skills Gallery</h3>
        <div class="gallery-actions">
          <button class="form-button secondary" onclick="SkillsGalleryManager.selectAllSkills()">
            🔘 Select All
          </button>
          <button class="form-button secondary" onclick="SkillsGalleryManager.deselectAllSkills()">
            ⭕ Deselect All
          </button>
          <button class="form-button export" onclick="SkillsGalleryManager.saveSelectedAsCollection()">
            📦 Save as Collection
          </button>
          <button class="form-button secondary" onclick="SkillsGalleryManager.deleteSelected()">
            🗑️ Delete Selected
          </button>
        </div>
      </div>
      <div class="collection-creator">
        <input type="text" id="collection-name" placeholder="Collection name (optional)" 
               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
        <textarea id="collection-description" placeholder="Collection description (optional)" 
                  style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px; resize: vertical;" 
                  rows="2"></textarea>
      </div>
      <div class="gallery-stats">
        <span class="selected-count">0 skills selected</span>
      </div>
    `;

    // Insert at the beginning of the container
    container.insertBefore(galleryControls, container.firstChild);
  }

  /**
   * Hide placeholder when skills are present
   */
  static hidePlaceholder(container) {
    const placeholder = container.querySelector('.cards-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  /**
   * Show placeholder when no skills are present
   */
  static showPlaceholder(container) {
    const placeholder = container.querySelector('.cards-placeholder');
    const skills = container.querySelectorAll('.skill-card');
    
    if (placeholder) {
      placeholder.style.display = skills.length === 0 ? 'block' : 'none';
    }
  }

  /**
   * Transform skills to gallery items
   */
  static transformSkillsToGallery(container) {
    const skills = container.querySelectorAll('.skill-card');
    
    skills.forEach((skill, index) => {
      // Add selection checkbox
      if (!skill.querySelector('.gallery-selector')) {
        const selector = document.createElement('div');
        selector.className = 'gallery-selector';
        selector.innerHTML = `
          <input type="checkbox" class="skill-checkbox" data-skill-index="${index}" 
                 onchange="SkillsGalleryManager.updateSelectionCount()">
          <label class="checkbox-label">Select</label>
        `;
        skill.appendChild(selector);
      }

      // Add gallery item class
      skill.classList.add('gallery-item');
    });

    this.updateSelectionCount();
  }

  /**
   * Restore normal view
   */
  static restoreNormalView(container) {
    const skills = container.querySelectorAll('.skill-card');
    
    skills.forEach(skill => {
      // Remove gallery elements
      const selector = skill.querySelector('.gallery-selector');
      if (selector) {
        selector.remove();
      }

      // Remove gallery classes
      skill.classList.remove('gallery-item');
    });
  }

  /**
   * Select all skills
   */
  static selectAllSkills() {
    const checkboxes = document.querySelectorAll('.skill-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    this.updateSelectionCount();
  }

  /**
   * Deselect all skills
   */
  static deselectAllSkills() {
    const checkboxes = document.querySelectorAll('.skill-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    this.updateSelectionCount();
  }

  /**
   * Update selection count
   */
  static updateSelectionCount() {
    const checkboxes = document.querySelectorAll('.skill-checkbox');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    const countDisplay = document.querySelector('.selected-count');
    if (countDisplay) {
      countDisplay.textContent = `${selectedCount} skill${selectedCount !== 1 ? 's' : ''} selected`;
    }
  }

  /**
   * Save selected skills as collection
   */
  static async saveSelectedAsCollection() {
    try {
      const selectedSkills = this.getSelectedSkills();
      
      if (selectedSkills.length === 0) {
        Messages.showError('Please select at least one skill to save as a collection.');
        return;
      }

      // Check if user is signed in
      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        Messages.showError('Please sign in to save collections to the database.');
        return;
      }

      const collectionName = document.getElementById('collection-name')?.value.trim() || 
                           `Skill Collection ${new Date().toLocaleDateString()}`;
      const collectionDescription = document.getElementById('collection-description')?.value.trim() || 
                                   `Collection of ${selectedSkills.length} skills`;

      this.debug('Saving skill collection:', { collectionName, skillCount: selectedSkills.length });

      // Show progress
      const hideLoading = Messages.showLoading(`Saving collection "${collectionName}"...`);

      // Create collection data
      const collectionData = {
        name: collectionName,
        description: collectionDescription,
        type: 'skills',
        skill_count: selectedSkills.length,
        skills: selectedSkills,
        created_by: GoogleAuth.getUserDisplayName() || GoogleAuth.getUserEmail(),
        created_at: new Date().toISOString()
      };

      // Save to database using SupabaseClient
      const result = await SupabaseClient.saveSkillCollection(collectionData);
      
      hideLoading();

      if (result.success) {
        Messages.showSuccess(`Collection "${collectionName}" saved successfully with ${selectedSkills.length} skills!`);
        
        // Clear collection form
        document.getElementById('collection-name').value = '';
        document.getElementById('collection-description').value = '';
        
        // Deselect all
        this.deselectAllSkills();
      } else {
        throw new Error(result.error || 'Failed to save collection');
      }

    } catch (error) {
      this.debug('Error saving collection:', error);
      Messages.showError('Failed to save collection: ' + error.message);
    }
  }

  /**
   * Get selected skills data
   */
  static getSelectedSkills() {
    const checkboxes = document.querySelectorAll('.skill-checkbox:checked');
    const selectedSkills = [];

    checkboxes.forEach(checkbox => {
      const skillIndex = parseInt(checkbox.dataset.skillIndex);
      const skillsData = window.skillsData || SkillsPageController?.skillsData || [];
      
      if (skillsData[skillIndex]) {
        selectedSkills.push(skillsData[skillIndex]);
      }
    });

    return selectedSkills;
  }

  /**
   * Delete selected skills
   */
  static deleteSelected() {
    const selectedCount = document.querySelectorAll('.skill-checkbox:checked').length;
    
    if (selectedCount === 0) {
      Messages.showError('Please select skills to delete.');
      return;
    }

    Messages.showConfirmation(
      `Are you sure you want to delete ${selectedCount} selected skill${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`,
      () => {
        const checkboxes = document.querySelectorAll('.skill-checkbox:checked');
        const skillsToRemove = [];

        // Collect skills to remove (in reverse order to maintain indices)
        checkboxes.forEach(checkbox => {
          const skillIndex = parseInt(checkbox.dataset.skillIndex);
          skillsToRemove.unshift(skillIndex); // Add to beginning for reverse order
        });

        // Remove from DOM and data array
        skillsToRemove.forEach(index => {
          const skillElements = document.querySelectorAll('.skill-card');
          if (skillElements[index]) {
            skillElements[index].remove();
          }

          // Remove from data array
          if (window.skillsData && window.skillsData[index]) {
            window.skillsData.splice(index, 1);
          }
          if (SkillsPageController?.skillsData?.[index]) {
            SkillsPageController.skillsData.splice(index, 1);
          }
        });

        // Update indices for remaining skills
        this.updateSkillIndices();
        
        // Check if we should show placeholder
        const container = document.getElementById('outputContainer');
        this.showPlaceholder(container);
        
        Messages.showSuccess(`Deleted ${selectedCount} skill${selectedCount !== 1 ? 's' : ''} successfully.`);
        this.updateSelectionCount();
      },
      () => {
        // Cancel - do nothing
      }
    );
  }

  /**
   * Update skill indices after deletion
   */
  static updateSkillIndices() {
    const checkboxes = document.querySelectorAll('.skill-checkbox');
    checkboxes.forEach((checkbox, index) => {
      checkbox.dataset.skillIndex = index;
    });
  }

  /**
   * Handle skill creation - hide placeholder and update gallery if needed
   */
  static handleSkillCreated(skillElement) {
    const container = document.getElementById('outputContainer');
    if (container) {
      this.hidePlaceholder(container);
    }
    
    // If in gallery mode, update the skill
    if (this.isGalleryMode && skillElement) {
      const skillIndex = (window.skillsData?.length || 0) - 1;
      
      // Add selection checkbox
      if (!skillElement.querySelector('.gallery-selector')) {
        const selector = document.createElement('div');
        selector.className = 'gallery-selector';
        selector.innerHTML = `
          <input type="checkbox" class="skill-checkbox" data-skill-index="${skillIndex}" 
                 onchange="SkillsGalleryManager.updateSelectionCount()">
          <label class="checkbox-label">Select</label>
        `;
        skillElement.appendChild(selector);
      }
      
      // Add gallery item class
      skillElement.classList.add('gallery-item');
      
      // Update selection count
      this.updateSelectionCount();
    }
  }

  /**
   * Load user's skill collections
   */
  static async loadUserCollections() {
    try {
      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        Messages.showError('Please sign in to view your collections.');
        return [];
      }

      this.debug('Loading user skill collections...');
      const hideLoading = Messages.showLoading('Loading your skill collections...');

      const collections = await SupabaseClient.getUserSkillCollections();
      
      hideLoading();
      this.debug('Loaded collections:', collections.length);
      
      return collections;
    } catch (error) {
      this.debug('Error loading collections:', error);
      Messages.showError('Failed to load collections: ' + error.message);
      return [];
    }
  }

  /**
   * Show collections browser
   */
  static async showCollectionsBrowser() {
    const collections = await this.loadUserCollections();
    
    if (collections.length === 0) {
      Messages.showInfo('You have no saved skill collections yet. Create some skills and save them as a collection!');
      return;
    }

    // Create and show collections modal
    this.createCollectionsBrowserModal(collections);
  }

  /**
   * Create collections browser modal
   */
  static createCollectionsBrowserModal(collections) {
    // Remove existing modal if present
    const existingModal = document.getElementById('collections-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'collections-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;

    const collectionsHtml = collections.map(collection => `
      <div class="collection-item" style="
        border: 2px solid rgb(251, 225, 183);
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
        background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%);
        color: rgb(251, 225, 183);
      ">
        <h4 style="margin: 0 0 5px 0;">${collection.name}</h4>
        <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">${collection.description}</p>
        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 10px;">
          ${collection.skill_count} skills • Created ${new Date(collection.created_at).toLocaleDateString()}
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="SkillsGalleryManager.loadCollection(${collection.id})" 
                  style="padding: 6px 12px; background: rgb(218, 165, 32); color: rgb(37, 26, 12); border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Load Collection
          </button>
          <button onclick="SkillsGalleryManager.deleteCollection(${collection.id})" 
                  style="padding: 6px 12px; background: rgb(198, 44, 66); color: white; border: none; border-radius: 4px; cursor: pointer;">
            Delete
          </button>
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%);
        border: 2px solid rgb(251, 225, 183);
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        color: rgb(251, 225, 183);
      ">
        <h2 style="margin: 0 0 20px 0; text-align: center;">⚡ Your Skill Collections ⚡</h2>
        <div class="collections-list">
          ${collectionsHtml}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="document.getElementById('collections-modal').remove()" 
                  style="padding: 10px 20px; background: rgb(89, 72, 51); color: rgb(251, 225, 183); border: 2px solid rgb(251, 225, 183); border-radius: 6px; cursor: pointer;">
            Close
          </button>
        </div>
      </div>
    `;

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    document.body.appendChild(modal);
  }

  /**
   * Load a specific collection
   */
  static async loadCollection(collectionId) {
    try {
      this.debug('Loading collection:', collectionId);
      const hideLoading = Messages.showLoading('Loading collection...');

      const collection = await SupabaseClient.getSkillCollection(collectionId);
      
      hideLoading();

      if (!collection || !collection.skills) {
        throw new Error('Collection not found or invalid');
      }

      // Close modal
      const modal = document.getElementById('collections-modal');
      if (modal) {
        modal.remove();
      }

      // Clear existing skills
      if (window.clearOutput) {
        window.clearOutput();
      }

      // Load skills from collection
      collection.skills.forEach(skillData => {
        if (window.SkillsPageController) {
          SkillsPageController.addSkill(skillData);
        } else if (window.SkillGenerator) {
          SkillGenerator.createFromImport(skillData);
        }
      });

      Messages.showSuccess(`Loaded collection "${collection.name}" with ${collection.skills.length} skills!`);

    } catch (error) {
      this.debug('Error loading collection:', error);
      Messages.showError('Failed to load collection: ' + error.message);
    }
  }

  /**
   * Delete a collection
   */
  static async deleteCollection(collectionId) {
    try {
      const confirmed = confirm('Are you sure you want to delete this collection? This action cannot be undone.');
      if (!confirmed) return;

      this.debug('Deleting collection:', collectionId);
      const hideLoading = Messages.showLoading('Deleting collection...');

      const result = await SupabaseClient.deleteSkillCollection(collectionId);
      
      hideLoading();

      if (result.success) {
        Messages.showSuccess('Collection deleted successfully!');
        
        // Refresh the collections browser
        const modal = document.getElementById('collections-modal');
        if (modal) {
          modal.remove();
          this.showCollectionsBrowser();
        }
      } else {
        throw new Error(result.error || 'Failed to delete collection');
      }

    } catch (error) {
      this.debug('Error deleting collection:', error);
      Messages.showError('Failed to delete collection: ' + error.message);
    }
  }
}

// Make available globally
window.SkillsGalleryManager = SkillsGalleryManager;
