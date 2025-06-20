/**
 * Unified Skill Generator
 * Handles skill creation from multiple data sources (form input, imported data, database items)
 */
class SkillGenerator {
  /**
   * Main skill creation function
   * @param {Object} options - Configuration options
   * @param {Object} options.data - Pre-existing skill data object
   * @param {boolean} options.formData - Extract data from form inputs
   * @param {boolean} options.isPreview - Whether this is a preview skill
   * @param {HTMLElement} options.container - Container to append skill to
   * @param {boolean} options.includeControls - Whether to include control buttons
   * @param {string} options.mode - 'generator' | 'browser' | 'preview'
   * @returns {HTMLElement|null} The created skill element
   */
  static createSkill(options = {}) {
    const {
      data = null,
      formData = false,
      isPreview = false,
      container = null,
      includeControls = true,
      mode = 'generator'
    } = options;

    try {
      // Determine data source and extract skill data
      let skillData;
      if (data) {
        skillData = this.normalizeSkillData(data);
      } else if (formData) {
        skillData = this.extractFormData();
      } else {
        throw new Error('No data source provided');
      }

      // Validate skill data
      const validation = Validation.validateSkillData(skillData);
      if (!validation.valid) {
        if (mode === 'generator') {
          Messages.showError(validation.error);
        }
        return null;
      }

      // Create the skill element
      const skillElement = this.buildSkillElement(skillData, mode, includeControls);

      // Add to container if specified
      if (container) {
        if (isPreview) {
          container.innerHTML = '';
        }
        container.appendChild(skillElement);
      }

      // Store skill data for export if in generator mode
      if (mode === 'generator' && !isPreview && window.skillsData) {
        window.skillsData.push(skillData);
      }

      return skillElement;

    } catch (error) {
      console.error('Error creating skill:', error);
      if (mode === 'generator') {
        Messages.showError('Error creating skill: ' + error.message);
      }
      return null;
    }
  }

  /**
   * Extract skill data from form inputs
   */
  static extractFormData() {
    const imageInput = document.getElementById("imageInput");
    
    // Check for required image
    if (!imageInput?.files?.[0]) {
      throw new Error("Please upload an image.");
    }

    // Get form values
    const skillName = document.getElementById("skillNameInput")?.value || '';
    const skillEffect = document.getElementById("skillEffectInput")?.value || '';
    const border = document.getElementById("borderSelect")?.value || 'gold';

    if (!skillName.trim()) {
      throw new Error("Please enter a skill name.");
    }

    if (!skillEffect.trim()) {
      throw new Error("Please enter a skill effect.");
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        resolve({
          skillName: skillName.trim(),
          skillEffect: skillEffect.trim(),
          border: border,
          imageData: e.target.result,
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(imageInput.files[0]);
    });
  }

  /**
   * Normalize skill data from different sources (import, database, etc.)
   */
  static normalizeSkillData(data) {
    // Handle database format
    if (data.skill_data) {
      const skillData = data.skill_data;
      return {
        skillName: skillData.name || 'Unnamed Skill',
        skillEffect: skillData.effect || '',
        border: skillData.rarity || 'gold',
        imageData: skillData.image_data || '',
        timestamp: data.created_at || new Date().toISOString(),
        databaseId: data.id,
        createdBy: data.users?.alias
      };
    }

    // Already in correct format (import or generator format)
    return {
      skillName: data.skillName || '',
      skillEffect: data.skillEffect || '',
      border: data.border || 'gold',
      imageData: data.imageData || '',
      timestamp: data.timestamp || new Date().toISOString(),
      databaseId: data.databaseId,
      createdBy: data.createdBy
    };
  }

  /**
   * Build the complete skill element
   */
  static buildSkillElement(skillData, mode = 'generator', includeControls = true) {
    const borderColor = this.getBorderColor(skillData.border);
    const skillCard = document.createElement("div");
    skillCard.className = "skill-card";

    // Add controls if requested
    if (includeControls) {
      const controls = this.createSkillControls(skillData, mode);
      skillCard.appendChild(controls);
    }

    // Create image container
    const imageContainer = this.createImageContainer(skillData, borderColor);
    skillCard.appendChild(imageContainer);

    // Create content container
    const content = this.createContentContainer(skillData, borderColor);
    skillCard.appendChild(content);

    return skillCard;
  }

  /**
   * Create skill control buttons based on mode
   */
  static createSkillControls(skillData, mode) {
    const skillControls = document.createElement("div");
    skillControls.className = "skill-controls";

    if (mode === 'generator') {
      // Export button
      const exportBtn = document.createElement("button");
      exportBtn.className = "skill-export-btn";
      exportBtn.innerHTML = "💾";
      exportBtn.title = "Export this skill";
      exportBtn.onclick = function() {
        if (window.toggleExportMenu) {
          window.toggleExportMenu(exportBtn, skillData);
        }
      };

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "skill-delete-btn";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Delete this skill";
      deleteBtn.onclick = function() {
        if (window.clearSkill) {
          window.clearSkill(deleteBtn.closest('.skill-card'));
        }
      };

      skillControls.appendChild(exportBtn);
      skillControls.appendChild(deleteBtn);

    } else if (mode === 'browser') {
      // View details button
      const viewBtn = document.createElement("button");
      viewBtn.className = "skill-view-btn";
      viewBtn.innerHTML = "👁️";
      viewBtn.title = "View skill details";
      viewBtn.onclick = function() {
        if (window.viewSkillDetails) {
          window.viewSkillDetails(skillData);
        }
      };

      // Upvote button
      const upvoteBtn = document.createElement("button");
      upvoteBtn.className = "skill-upvote-btn";
      upvoteBtn.innerHTML = "👍";
      upvoteBtn.title = "Upvote this skill";
      upvoteBtn.onclick = function() {
        if (window.upvoteSkill) {
          window.upvoteSkill(skillData.databaseId);
        }
      };

      skillControls.appendChild(viewBtn);
      skillControls.appendChild(upvoteBtn);
    }

    return skillControls;
  }

  /**
   * Create image container with border overlay
   */
  static createImageContainer(skillData, borderColor) {
    const imageContainer = document.createElement("div");
    imageContainer.className = "skill-image-container";
    imageContainer.style.border = `3px solid ${borderColor}`;

    if (skillData.imageData) {
      const img = document.createElement("img");
      img.src = skillData.imageData;
      img.onerror = function() {
        imageContainer.style.background = '#333';
        imageContainer.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Image not available</div>';
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.style.background = '#333';
      imageContainer.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">No image</div>';
    }

    // Create border overlay
    const imageBorderOverlay = document.createElement("img");
    imageBorderOverlay.className = "skill-border-overlay";
    imageBorderOverlay.src = `images/${skillData.border}_skill_border.png`;
    imageBorderOverlay.onerror = function() {
      this.style.display = 'none';
    };
    imageBorderOverlay.alt = "";
    imageContainer.appendChild(imageBorderOverlay);

    return imageContainer;
  }

  /**
   * Create content container with header and effect sections
   */
  static createContentContainer(skillData, borderColor) {
    const content = document.createElement("div");
    content.className = "skill-content";
    content.style.border = `3px solid ${borderColor}`;

    // Header section with skill name
    const headerSection = document.createElement("div");
    headerSection.className = "skill-header";
    headerSection.style.borderTop = `2px solid ${borderColor}`;
    headerSection.style.borderBottom = `2px solid ${borderColor}`;
    
    const skillTitle = document.createElement("div");
    skillTitle.className = "skill-title";
    skillTitle.textContent = skillData.skillName;
    headerSection.appendChild(skillTitle);

    // Effect section
    const effectSection = document.createElement("div");
    effectSection.className = "skill-effect";
    effectSection.style.borderTop = `2px solid ${borderColor}`;
    effectSection.style.borderBottom = `2px solid ${borderColor}`;
    effectSection.innerHTML = KeywordProcessor.processKeywordText(skillData.skillEffect);

    content.appendChild(headerSection);
    content.appendChild(effectSection);

    return content;
  }

  // Helper methods
  static getBorderColor(value) {
    switch(value?.toLowerCase()) {
      case 'bronze': return 'rgb(205, 127, 50)';
      case 'silver': return 'silver';
      case 'gold': return 'gold';
      case 'diamond': return 'rgb(185, 242, 255)';
      case 'legendary': return 'red';
      default: return 'gold';
    }
  }
}