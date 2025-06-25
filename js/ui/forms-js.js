/**
 * Form Utilities and Event Handlers
 * Handles form interactions, dynamic inputs, and form validation UI
 */
class Forms {
  
  static isInitialized = false;
  
  /**
   * Initialize form functionality
   */
  static init() {
    if (this.isInitialized) return;
    
    document.addEventListener('DOMContentLoaded', () => {
      this.setupFormEventListeners();
      this.setupDynamicInputs();
      this.setupLiveValidation();
      this.setupFormPersistence();
      this.setupKeyboardShortcuts();
      this.setupAccessibility();
      this.setupAutoSave();
      this.setupDefaultImage(); // Add default image setup
      this.setupDefaultValues(); // Add default form values
      
      // Ensure any existing dynamic inputs are properly initialized
      setTimeout(() => {
        this.reinitializeDynamicInputs();
      }, 100);
      
      this.isInitialized = true;
    });
  }

  /**
   * Setup default form values
   */
  static setupDefaultValues() {
    // Set default item name
    const itemNameInput = document.getElementById('itemNameInput');
    if (itemNameInput && !itemNameInput.value) {
      itemNameInput.value = 'Item Name';
    }

    // Set default cooldown
    const cooldownInput = document.getElementById('cooldownInput');
    if (cooldownInput && !cooldownInput.value) {
      cooldownInput.value = '6';
    }

    // Set default skill name if on skills page
    const skillNameInput = document.getElementById('skillNameInput');
    if (skillNameInput && !skillNameInput.value) {
      skillNameInput.value = 'Skill Name';
    }
  }

  /**
   * Setup default image loading
   */
  static setupDefaultImage() {
    const imageInput = document.getElementById('imageInput');
    if (!imageInput) return;

    const defaultImagePath = imageInput.getAttribute('data-default-image');
    if (!defaultImagePath) return;

    // Load default image on page load
    this.loadDefaultImage(defaultImagePath, imageInput);
  }

  /**
   * Load default image and set it as the current image
   * @param {string} imagePath - Path to default image
   * @param {HTMLElement} imageInput - Image input element
   */
  static loadDefaultImage(imagePath, imageInput) {
    fetch(imagePath)
      .then(response => response.blob())
      .then(blob => {
        // Create a File object from the blob
        const file = new File([blob], 'default.png', { type: blob.type });
        
        // Create a new FileList with our default file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;

        // Show preview
        this.showImagePreview(file, imageInput);
        
        // Trigger preview update
        this.handleInputChange(imageInput);
      })
      .catch(error => {
        console.warn('Could not load default image:', error);
      });
  }

  /**
   * Enhanced setup for form event listeners that includes dynamic input monitoring
   */
  static setupFormEventListeners() {
    // Setup event listeners for existing form inputs
    document.querySelectorAll('input, select, textarea').forEach(element => {
      const eventType = element.tagName.toLowerCase() === 'select' ? 'change' : 'input';
      
      element.addEventListener(eventType, () => {
        this.handleInputChange(element);
      });

      // Setup validation on blur
      element.addEventListener('blur', () => {
        this.validateField(element);
      });
    });

    // File input special handling
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        this.handleImageUpload(e);
      });
    }
    
    // Set up a MutationObserver to watch for dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node contains input elements
            const inputs = node.querySelectorAll ? node.querySelectorAll('input') : [];
            if (inputs.length > 0 || node.tagName === 'INPUT') {
              // Reinitialize dynamic inputs after a short delay
              setTimeout(() => {
                this.reinitializeDynamicInputs();
              }, 50);
            }
          }
        });
      });
    });
    
    // Observe changes in the tag, onUse, and passive containers
    const tagContainer = document.getElementById('tagInputs');
    const onUseContainer = document.getElementById('onUseInputs');
    const passiveContainer = document.getElementById('passiveInputs');
    
    if (tagContainer) {
      observer.observe(tagContainer, { childList: true, subtree: true });
    }
    
    if (onUseContainer) {
      observer.observe(onUseContainer, { childList: true, subtree: true });
    }
    
    if (passiveContainer) {
      observer.observe(passiveContainer, { childList: true, subtree: true });
    }
  }

  /**
   * Handle input changes for live preview
   * @param {HTMLElement} element - Changed input element
   */
  static handleInputChange(element) {
    // Debounce rapid changes
    clearTimeout(element.changeTimeout);
    element.changeTimeout = setTimeout(() => {
      
      // Determine if we're on cards or skills page
      if (window.location.pathname.includes('skills') || document.getElementById('skillNameInput')) {
        this.updateSkillPreview();
      } else if (document.getElementById('itemNameInput')) {
        this.updateCardPreview();
      }
      
    }, 300); // 300ms debounce
  }

  /**
   * Update card preview
   */
  static updateCardPreview() {
  try {
    console.log('🔄 updateCardPreview called');
    
    const previewContainer = document.getElementById('previewContainer');
    if (!previewContainer) {
      console.log('❌ No preview container found');
      return;
    }

    // Check if we have enough data for a preview
    const itemName = document.getElementById('itemNameInput')?.value;
    const imageInput = document.getElementById('imageInput');
    
    // Debug: Log current dynamic input values
    const tagInputs = document.querySelectorAll('#tagInputs input');
    const onUseInputs = document.querySelectorAll('#onUseInputs input');
    const passiveInputs = document.querySelectorAll('#passiveInputs input');
    console.log('🏷️ Tag inputs found:', tagInputs.length, 'values:', Array.from(tagInputs).map(i => i.value));
    console.log('⚡ OnUse inputs found:', onUseInputs.length, 'values:', Array.from(onUseInputs).map(i => i.value));
    console.log('🛡️ Passive inputs found:', passiveInputs.length, 'values:', Array.from(passiveInputs).map(i => i.value));
    
    if (!itemName || !imageInput?.files?.[0]) {
      console.log('❌ Missing requirements - itemName:', !!itemName, 'image:', !!imageInput?.files?.[0]);
      previewContainer.innerHTML = '';
      return;
    }

    console.log('✅ Creating preview card...');
    
    // Create preview card
    if (window.CardGenerator) {
      CardGenerator.createCard({
        formData: true,
        isPreview: true,
        container: previewContainer,
        includeControls: false,
        mode: 'preview'
      }).then(cardElement => {
        console.log('✅ Preview created successfully:', !!cardElement);
      }).catch(error => {
        console.error('❌ Preview creation failed:', error);
        // Show the error to help debug
        if (window.Messages) {
          Messages.showError('Preview Error: ' + error.message);
        }
      });
    } else {
      console.log('❌ CardGenerator not available');
    }
  } catch (error) {
    console.error('❌ updateCardPreview failed:', error);
  }
}
  /**
   * Update skill preview
   */
  static updateSkillPreview() {
    try {
      const previewContainer = document.getElementById('previewContainer');
      if (!previewContainer) return;

      // Check if we have enough data for a preview
      const skillName = document.getElementById('skillNameInput')?.value;
      const skillEffect = document.getElementById('skillEffectInput')?.value;
      const imageInput = document.getElementById('imageInput');
      
      if (!skillName || !skillEffect || !imageInput?.files?.[0]) {
        previewContainer.innerHTML = '';
        return;
      }

      // Create preview skill
      if (window.SkillGenerator) {
        SkillGenerator.createSkill({
          formData: true,
          isPreview: true,
          container: previewContainer,
          includeControls: false,
          mode: 'preview'
        }).then(skillElement => {
          // Preview created successfully
        }).catch(error => {
          console.log('Preview update skipped:', error.message);
        });
      }
    } catch (error) {
      console.log('Preview update failed:', error.message);
    }
  }

  /**
   * Handle image upload with validation and preview
   * @param {Event} event - File input change event
   */
  static handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate image file
    const validation = Validation.validateImageFile(file);
    if (!validation.valid) {
      Messages.showError(validation.error);
      event.target.value = ''; // Clear invalid file
      return;
    }

    // Show image preview in form
    this.showImagePreview(file, event.target);
    
    // Trigger preview update
    this.handleInputChange(event.target);
  }

  /**
   * Show image preview next to file input
   * @param {File} file - Selected image file
   * @param {HTMLElement} input - File input element
   */
  static showImagePreview(file, input) {
    // Remove existing preview
    const existingPreview = input.parentNode.querySelector('.image-preview');
    if (existingPreview) {
      existingPreview.remove();
    }

    // Create new preview
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.createElement('div');
      preview.className = 'image-preview';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 4px; margin-top: 8px;">
        <div style="font-size: 12px; color: #666; margin-top: 4px;">${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
      `;
      input.parentNode.appendChild(preview);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Setup dynamic input addition/removal
   */
  static setupDynamicInputs() {
    // Tags input management
    this.setupTagInputs();
    
    // On-use effects input management
    this.setupOnUseInputs();
    
    // Passive effects input management
    this.setupPassiveInputs();
  }

  /**
   * Setup tag input management
   */
  static setupTagInputs() {
    // Add tag input button
    const addTagBtn = document.querySelector('button[onclick="addTagInput()"]');
    if (addTagBtn) {
      addTagBtn.onclick = () => this.addTagInput();
    }
  }

  /**
   * Setup on-use effects input management
   */
  static setupOnUseInputs() {
    // Add on-use effect input button
    const addOnUseBtn = document.querySelector('button[onclick="addOnUseInput()"]');
    if (addOnUseBtn) {
      addOnUseBtn.onclick = () => this.addOnUseInput();
    }
    
    // Add initial on-use effect input with default text if container is empty
    const onUseContainer = document.getElementById('onUseInputs');
    if (onUseContainer && onUseContainer.children.length === 0) {
      this.addOnUseInputWithDefault();
    }
  }

  /**
   * Setup passive effects input management
   */
static setupPassiveInputs() {
  // Add passive effect input button
  const addPassiveBtn = document.querySelector('button[onclick="addPassiveInput()"]');
  if (addPassiveBtn) {
    addPassiveBtn.onclick = () => this.addPassiveInput();
  }
  
  // Add initial passive effect input with default text if container is empty
  const passiveContainer = document.getElementById('passiveInputs');
  if (passiveContainer && passiveContainer.children.length === 0) {
    this.addPassiveInputWithDefault();
  }
}
  /**
   * Add a new tag input field
   */
  static addTagInput() {
    const container = document.getElementById("tagInputs");
    if (!container) return;
    
    const inputGroup = document.createElement("div");
    inputGroup.className = "tag-input-group";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter tag text";
    input.className = "form-input";
    
    // Add event listeners for preview updates
    input.addEventListener('input', (e) => {
      this.handleInputChange(e.target);
    });
    
    input.addEventListener('blur', (e) => {
      this.validateField(e.target);
    });
    
    // Add change event as well to be sure
    input.addEventListener('change', (e) => {
      this.handleInputChange(e.target);
    });
    
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "form-button remove";
    removeButton.onclick = () => {
      container.removeChild(inputGroup);
      // Trigger preview update after removal
      this.handleInputChange(input);
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeButton);
    container.appendChild(inputGroup);

    // Focus on new input
    input.focus();
    
    // Immediately trigger a preview update to ensure the new input is recognized
    setTimeout(() => {
      this.handleInputChange(input);
    }, 100);
  }

  /**
   * Add a new on-use effect input field
   */
  static addOnUseInput() {
    const container = document.getElementById("onUseInputs");
    if (!container) return;
    
    const inputGroup = document.createElement("div");
    inputGroup.className = "on-use-input-group";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter on use effect description";
    input.className = "form-input";
    
    // Add event listeners for preview updates
    input.addEventListener('input', (e) => {
      this.handleInputChange(e.target);
    });
    
    input.addEventListener('blur', (e) => {
      this.validateField(e.target);
    });
    
    // Add change event as well to be sure
    input.addEventListener('change', (e) => {
      this.handleInputChange(e.target);
    });
    
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "form-button remove";
    removeButton.onclick = () => {
      container.removeChild(inputGroup);
      // Trigger preview update after removal
      this.handleInputChange(input);
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeButton);
    container.appendChild(inputGroup);

    // Focus on new input
    input.focus();
    
    // Immediately trigger a preview update to ensure the new input is recognized
    setTimeout(() => {
      this.handleInputChange(input);
    }, 100);
  }

  /**
   * Add a new on-use effect input field with default text
   */
  static addOnUseInputWithDefault() {
    const container = document.getElementById("onUseInputs");
    if (!container) return;
    
    const inputGroup = document.createElement("div");
    inputGroup.className = "on-use-input-group";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter on use effect description";
    input.className = "form-input";
    input.value = "Deal 50 /d to the enemy"; // Default text
    
    // Add event listeners for preview updates
    input.addEventListener('input', (e) => {
      this.handleInputChange(e.target);
    });
    
    input.addEventListener('blur', (e) => {
      this.validateField(e.target);
    });
    
    // Add change event as well to be sure
    input.addEventListener('change', (e) => {
      this.handleInputChange(e.target);
    });
    
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "form-button remove";
    removeButton.onclick = () => {
      container.removeChild(inputGroup);
      // Trigger preview update after removal
      this.handleInputChange(input);
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeButton);
    container.appendChild(inputGroup);
    
    // Immediately trigger a preview update to ensure the new input is recognized
    setTimeout(() => {
      this.handleInputChange(input);
    }, 100);
  }

  /**
   * Add a new passive effect input field
   */
  static addPassiveInput() {
    const container = document.getElementById("passiveInputs");
    if (!container) return;
    
    const inputGroup = document.createElement("div");
    inputGroup.className = "passive-input-group";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter passive effect description";
    input.className = "form-input";
    
    // Add event listeners for preview updates
    input.addEventListener('input', (e) => {
      this.handleInputChange(e.target);
    });
    
    input.addEventListener('blur', (e) => {
      this.validateField(e.target);
    });
    
    // Add change event as well to be sure
    input.addEventListener('change', (e) => {
      this.handleInputChange(e.target);
    });
    
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "form-button remove";
    removeButton.onclick = () => {
      container.removeChild(inputGroup);
      // Trigger preview update after removal
      this.handleInputChange(input);
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeButton);
    container.appendChild(inputGroup);

    // Focus on new input
    input.focus();
    
    // Immediately trigger a preview update to ensure the new input is recognized
    setTimeout(() => {
      this.handleInputChange(input);
    }, 100);
  }

  /**
   * Add a new passive effect input field with default text
   */
  static addPassiveInputWithDefault() {
    const container = document.getElementById("passiveInputs");
    if (!container) return;
    
    const inputGroup = document.createElement("div");
    inputGroup.className = "passive-input-group";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter passive effect description";
    input.className = "form-input";
    input.value = "When you use an item, gain 1 /h for 3 seconds"; // Default text
    
    // Add event listeners for preview updates
    input.addEventListener('input', (e) => {
      this.handleInputChange(e.target);
    });
    
    input.addEventListener('blur', (e) => {
      this.validateField(e.target);
    });
    
    // Add change event as well to be sure
    input.addEventListener('change', (e) => {
      this.handleInputChange(e.target);
    });
    
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "form-button remove";
    removeButton.onclick = () => {
      container.removeChild(inputGroup);
      // Trigger preview update after removal
      this.handleInputChange(input);
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeButton);
    container.appendChild(inputGroup);
    
    // Immediately trigger a preview update to ensure the new input is recognized
    setTimeout(() => {
      this.handleInputChange(input);
    }, 100);
  }

  // ... rest of the existing methods remain exactly the same ...

  /**
   * Reinitialize event listeners for all dynamic inputs
   * Call this if dynamic inputs aren't responding to changes
   */
  static reinitializeDynamicInputs() {
    // Reinitialize tag inputs
    document.querySelectorAll('#tagInputs input').forEach(input => {
      // Remove existing listeners to avoid duplicates
      const oldHandler = input._handleInputChange;
      if (oldHandler) {
        input.removeEventListener('input', oldHandler);
        input.removeEventListener('change', oldHandler);
      }
      
      const oldBlurHandler = input._validateField;
      if (oldBlurHandler) {
        input.removeEventListener('blur', oldBlurHandler);
      }
      
      // Create new handlers and store references
      const newInputHandler = (e) => this.handleInputChange(e.target);
      const newBlurHandler = (e) => this.validateField(e.target);
      
      input._handleInputChange = newInputHandler;
      input._validateField = newBlurHandler;
      
      // Add fresh listeners
      input.addEventListener('input', newInputHandler);
      input.addEventListener('change', newInputHandler);
      input.addEventListener('blur', newBlurHandler);
    });
    
    // Reinitialize on-use inputs
    document.querySelectorAll('#onUseInputs input').forEach(input => {
      // Remove existing listeners to avoid duplicates
      const oldHandler = input._handleInputChange;
      if (oldHandler) {
        input.removeEventListener('input', oldHandler);
        input.removeEventListener('change', oldHandler);
      }
      
      const oldBlurHandler = input._validateField;
      if (oldBlurHandler) {
        input.removeEventListener('blur', oldBlurHandler);
      }
      
      // Create new handlers and store references
      const newInputHandler = (e) => this.handleInputChange(e.target);
      const newBlurHandler = (e) => this.validateField(e.target);
      
      input._handleInputChange = newInputHandler;
      input._validateField = newBlurHandler;
      
      // Add fresh listeners
      input.addEventListener('input', newInputHandler);
      input.addEventListener('change', newInputHandler);
      input.addEventListener('blur', newBlurHandler);
    });
    
    // Reinitialize passive inputs
    document.querySelectorAll('#passiveInputs input').forEach(input => {
      // Remove existing listeners to avoid duplicates
      const oldHandler = input._handleInputChange;
      if (oldHandler) {
        input.removeEventListener('input', oldHandler);
        input.removeEventListener('change', oldHandler);
      }
      
      const oldBlurHandler = input._validateField;
      if (oldBlurHandler) {
        input.removeEventListener('blur', oldBlurHandler);
      }
      
      // Create new handlers and store references
      const newInputHandler = (e) => this.handleInputChange(e.target);
      const newBlurHandler = (e) => this.validateField(e.target);
      
      input._handleInputChange = newInputHandler;
      input._validateField = newBlurHandler;
      
      // Add fresh listeners
      input.addEventListener('input', newInputHandler);
      input.addEventListener('change', newInputHandler);
      input.addEventListener('blur', newBlurHandler);
    });
    
    console.log('Dynamic input event listeners reinitialized');
  }

  /**
   * Setup live validation for form fields
   */
  static setupLiveValidation() {
    document.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => {
        this.validateField(field);
      });

      // Clear validation on focus
      field.addEventListener('focus', () => {
        this.clearFieldValidation(field);
      });
    });
  }

  /**
   * Validate a single form field and show feedback
   * @param {HTMLElement} field - Form field to validate
   */
  static validateField(field) {
    if (!window.Validation) return;

    const validation = Validation.validateField(field);
    
    this.clearFieldValidation(field);
    
    if (!validation.valid) {
      this.showFieldError(field, validation.error);
    }
  }

  /**
   * Show validation error for a field
   * @param {HTMLElement} field - Form field with error
   * @param {string} error - Error message
   */
  static showFieldError(field, error) {
    field.classList.add('error');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = error;
    
    // Insert after the field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }

  /**
   * Clear validation styling and messages for a field
   * @param {HTMLElement} field - Form field to clear
   */
  static clearFieldValidation(field) {
    field.classList.remove('error', 'success');
    
    // Remove existing error messages
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Setup form data persistence (save form state)
   */
  static setupFormPersistence() {
    // Save form data on input
    document.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('input', () => {
        this.saveFormState();
      });
    });

    // Restore form data on page load
    this.restoreFormState();

    // Clear saved state when form is submitted successfully
    document.addEventListener('cardCreated', () => {
      this.clearSavedFormState();
    });
  }

  /**
   * Save current form state to localStorage
   */
  static saveFormState() {
    const formData = {};
    
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (field.type === 'file') return; // Skip file inputs
      
      const key = field.id || field.name;
      if (key) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          formData[key] = field.checked;
        } else {
          formData[key] = field.value;
        }
      }
    });

    try {
      const page = window.location.pathname.includes('skills') ? 'skills' : 'cards';
      localStorage.setItem(`bazaargen_form_${page}`, JSON.stringify(formData));
    } catch (error) {
      console.warn('Could not save form state:', error);
    }
  }

  /**
   * Restore form state from localStorage
   */
  static restoreFormState() {
    try {
      const page = window.location.pathname.includes('skills') ? 'skills' : 'cards';
      const savedData = localStorage.getItem(`bazaargen_form_${page}`);
      
      if (!savedData) return;
      
      const formData = JSON.parse(savedData);
      
      Object.entries(formData).forEach(([key, value]) => {
        const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (field) {
          if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = value;
          } else {
            field.value = value;
          }
        }
      });
    } catch (error) {
      console.warn('Could not restore form state:', error);
    }
  }

  /**
   * Clear saved form state
   */
  static clearSavedFormState() {
    try {
      const page = window.location.pathname.includes('skills') ? 'skills' : 'cards';
      localStorage.removeItem(`bazaargen_form_${page}`);
    } catch (error) {
      console.warn('Could not clear saved form state:', error);
    }
  }

  /**
   * Reset form to default values
   */
  static resetForm() {
    // Clear all form inputs
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (field.type === 'file') {
        field.value = '';
      } else if (field.type === 'checkbox' || field.type === 'radio') {
        field.checked = field.defaultChecked;
      } else {
        field.value = field.defaultValue || '';
      }
      
      this.clearFieldValidation(field);
    });

    // Clear dynamic inputs
    this.clearDynamicInputs();
    
    // Clear image previews
    document.querySelectorAll('.image-preview').forEach(preview => {
      preview.remove();
    });

    // Clear saved state
    this.clearSavedFormState();

    // Clear preview
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
      previewContainer.innerHTML = '';
    }

    // Add default effects after reset
    setTimeout(() => {
      this.setupDefaultImage();
      this.setupDefaultValues();
      // Add default fields if containers are empty
      const passiveContainer = document.getElementById('passiveInputs');
      if (passiveContainer && passiveContainer.children.length === 0) {
        this.addPassiveInputWithDefault();
      }
      const onUseContainer = document.getElementById('onUseInputs');
      if (onUseContainer && onUseContainer.children.length === 0) {
        this.addOnUseInputWithDefault();
      }
    }, 100);
  }

  /**
   * Clear dynamic input containers
   */
  static clearDynamicInputs() {
    const tagInputs = document.getElementById('tagInputs');
    if (tagInputs) {
      tagInputs.innerHTML = '';
    }

    const onUseInputs = document.getElementById('onUseInputs');
    if (onUseInputs) {
      onUseInputs.innerHTML = '';
    }

    const passiveInputs = document.getElementById('passiveInputs');
    if (passiveInputs) {
      passiveInputs.innerHTML = '';
    }
  }

  /**
   * Show form submission feedback
   * @param {boolean} success - Whether submission was successful
   * @param {string} message - Feedback message
   */
  static showSubmissionFeedback(success, message) {
    const submitButton = document.querySelector('.form-button:not(.secondary)');
    if (!submitButton) return;

    const originalText = submitButton.textContent;
    const originalDisabled = submitButton.disabled;

    if (success) {
      submitButton.textContent = '✓ Success!';
      submitButton.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
      submitButton.disabled = true;

      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.style.background = '';
        submitButton.disabled = originalDisabled;
      }, 2000);
    } else {
      submitButton.textContent = '✗ Error';
      submitButton.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
      submitButton.disabled = true;

      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.style.background = '';
        submitButton.disabled = originalDisabled;
      }, 2000);
    }
  }

  /**
   * Setup keyboard shortcuts for forms
   */
  static setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Enter to submit form
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const submitButton = document.querySelector('.form-button:not(.secondary)');
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      }

      // Ctrl+R to reset form
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (confirm('Are you sure you want to reset the form? This will clear all your input.')) {
          this.resetForm();
        }
      }

      // Escape to clear current field
      if (e.key === 'Escape' && e.target.tagName === 'INPUT') {
        e.target.value = '';
        this.handleInputChange(e.target);
      }
    });
  }

  /**
   * Setup form accessibility features
   */
  static setupAccessibility() {
    // Add ARIA labels and descriptions
    document.querySelectorAll('input, textarea, select').forEach(field => {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label && !field.getAttribute('aria-label')) {
        field.setAttribute('aria-label', label.textContent.trim());
      }

      // Add required indicator for screen readers
      if (field.required) {
        field.setAttribute('aria-required', 'true');
      }
    });

    // Announce validation errors to screen readers
    const originalShowFieldError = this.showFieldError;
    this.showFieldError = function(field, error) {
      originalShowFieldError.call(this, field, error);
      
      // Set aria-invalid and aria-describedby
      field.setAttribute('aria-invalid', 'true');
      const errorElement = field.parentNode.querySelector('.field-error');
      if (errorElement) {
        const errorId = `error-${field.id || Math.random().toString(36).substr(2, 9)}`;
        errorElement.id = errorId;
        field.setAttribute('aria-describedby', errorId);
      }
    };

    const originalClearFieldValidation = this.clearFieldValidation;
    this.clearFieldValidation = function(field) {
      originalClearFieldValidation.call(this, field);
      
      // Clear aria attributes
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    };
  }

  /**
   * Setup form auto-save functionality
   */
  static setupAutoSave() {
    let autoSaveInterval;

    const startAutoSave = () => {
      autoSaveInterval = setInterval(() => {
        this.saveFormState();
      }, 30000); // Auto-save every 30 seconds
    };

    const stopAutoSave = () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };

    // Start auto-save when user starts typing
    document.addEventListener('input', startAutoSave, { once: true });

    // Stop auto-save when page is unloaded
    window.addEventListener('beforeunload', stopAutoSave);
  }

  /**
   * Get form data as object
   * @returns {Object} Form data object
   */
  static getFormData() {
    const formData = {};
    
    document.querySelectorAll('input, textarea, select').forEach(field => {
      const key = field.id || field.name;
      if (key) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          formData[key] = field.checked;
        } else if (field.type === 'file') {
          formData[key] = field.files;
        } else {
          formData[key] = field.value;
        }
      }
    });

    // Get dynamic inputs
    const tagInputs = document.querySelectorAll('#tagInputs input');
    formData.tags = Array.from(tagInputs).map(input => input.value.trim()).filter(val => val);

    const onUseInputs = document.querySelectorAll('#onUseInputs input');
    formData.onUseEffects = Array.from(onUseInputs).map(input => input.value.trim()).filter(val => val);

    const passiveInputs = document.querySelectorAll('#passiveInputs input');
    formData.passiveEffects = Array.from(passiveInputs).map(input => input.value.trim()).filter(val => val);

    return formData;
  }

  /**
   * Set form data from object
   * @param {Object} data - Form data object
   */
  static setFormData(data) {
    Object.entries(data).forEach(([key, value]) => {
      const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          field.checked = value;
        } else if (field.type !== 'file') {
          field.value = value;
        }
      }
    });

    // Set dynamic inputs
    if (data.tags && Array.isArray(data.tags)) {
      this.clearDynamicInputs();
      data.tags.forEach(() => this.addTagInput());
      const tagInputs = document.querySelectorAll('#tagInputs input');
      data.tags.forEach((tag, index) => {
        if (tagInputs[index]) {
          tagInputs[index].value = tag;
        }
      });
    }

    if (data.onUseEffects && Array.isArray(data.onUseEffects)) {
      data.onUseEffects.forEach(() => this.addOnUseInput());
      const onUseInputs = document.querySelectorAll('#onUseInputs input');
      data.onUseEffects.forEach((effect, index) => {
        if (onUseInputs[index]) {
          onUseInputs[index].value = effect;
        }
      });
    }

    if (data.passiveEffects && Array.isArray(data.passiveEffects)) {
      data.passiveEffects.forEach(() => this.addPassiveInput());
      const passiveInputs = document.querySelectorAll('#passiveInputs input');
      data.passiveEffects.forEach((effect, index) => {
        if (passiveInputs[index]) {
          passiveInputs[index].value = effect;
        }
      });
    }
  }
}

// Auto-initialize forms
Forms.init();
