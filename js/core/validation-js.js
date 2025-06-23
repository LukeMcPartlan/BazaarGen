/**
 * Input Validation Utilities v5
 * Centralized validation for cards, skills, and form inputs
 * COMPLETE AND TESTED VERSION
 */
class Validation {
  
  /**
   * Validate card data before creation
   * @param {Object} cardData - Card data object to validate
   * @returns {Object} Validation result with valid boolean and error message
   */
  static validateCardData(cardData) {
    try {
      // Check required fields
      if (!cardData.itemName || !cardData.itemName.trim()) {
        return { valid: false, error: "Item name is required" };
      }

      if (!cardData.imageData) {
        return { valid: false, error: "Image is required" };
      }

      // Validate cooldown format
      if (cardData.cooldown && cardData.cooldown.trim()) {
        const cooldownValidation = this.validateCooldown(cardData.cooldown);
        if (!cooldownValidation.valid) {
          return cooldownValidation;
        }
        cardData.cooldown = cooldownValidation.value;
      }

      // Validate ammo
      if (cardData.ammo && cardData.ammo.trim()) {
        const ammoValidation = this.validateInteger(cardData.ammo, 'Ammo');
        if (!ammoValidation.valid) {
          return ammoValidation;
        }
        cardData.ammo = ammoValidation.value;
      }

      // Validate crit
      if (cardData.crit && cardData.crit.trim()) {
        const critValidation = this.validateInteger(cardData.crit, 'Crit');
        if (!critValidation.valid) {
          return critValidation;
        }
        cardData.crit = critValidation.value;
      }

      // Validate multicast
      if (cardData.multicast && cardData.multicast.trim()) {
        const multicastValidation = this.validateInteger(cardData.multicast, 'Multicast');
        if (!multicastValidation.valid) {
          return multicastValidation;
        }
        cardData.multicast = multicastValidation.value;
      }

      // Validate scaling values
      if (cardData.scalingValues) {
        const scalingValidation = this.validateScalingValues(cardData.scalingValues);
        if (!scalingValidation.valid) {
          return scalingValidation;
        }
        cardData.scalingValues = scalingValidation.values;
      }

      // Check cooldown and on-use effects dependency
      const hasOnUseEffects = cardData.onUseEffects && cardData.onUseEffects.length > 0;
      const hasCooldown = cardData.cooldown && cardData.cooldown.trim();

      if (hasOnUseEffects && !hasCooldown) {
        return { valid: false, error: "On Use effects require a cooldown value" };
      }

      // Validate enum values
      const validHeroes = ['Neutral', 'Mak', 'Vanessa', 'Pyg', 'Dooly', 'Stelle', 'Jules', 'Vampire'];
      if (!validHeroes.includes(cardData.hero)) {
        return { valid: false, error: "Invalid hero selection" };
      }

      const validSizes = ['Small', 'Medium', 'Large'];
      if (!validSizes.includes(cardData.itemSize)) {
        return { valid: false, error: "Invalid item size" };
      }

      const validBorders = ['bronze', 'silver', 'gold', 'diamond', 'legendary'];
      if (!validBorders.includes(cardData.border)) {
        return { valid: false, error: "Invalid border quality" };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: "Validation error: " + error.message };
    }
  }

  /**
   * Validate skill data before creation
   * @param {Object} skillData - Skill data object to validate
   * @returns {Object} Validation result with valid boolean and error message
   */
  static validateSkillData(skillData) {
    try {
      // Check required fields
      if (!skillData.skillName || !skillData.skillName.trim()) {
        return { valid: false, error: "Skill name is required" };
      }

      if (!skillData.skillEffect || !skillData.skillEffect.trim()) {
        return { valid: false, error: "Skill effect is required" };
      }

      if (!skillData.imageData) {
        return { valid: false, error: "Image is required" };
      }

      // Validate border quality
      const validBorders = ['bronze', 'silver', 'gold', 'diamond', 'legendary'];
      if (!validBorders.includes(skillData.border)) {
        return { valid: false, error: "Invalid border quality" };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: "Validation error: " + error.message };
    }
  }

  /**
   * Validate and format cooldown value
   * @param {string} cooldownValue - Raw cooldown input
   * @returns {Object} Validation result with formatted value
   */
  static validateCooldown(cooldownValue) {
    if (!cooldownValue || !cooldownValue.trim()) {
      return { valid: true, value: '' };
    }

    const num = parseFloat(cooldownValue.trim());
    if (isNaN(num)) {
      return { valid: false, error: 'Cooldown must be a valid number' };
    }

    if (num < 0) {
      return { valid: false, error: 'Cooldown cannot be negative' };
    }

    if (num > 999) {
      return { valid: false, error: 'Cooldown cannot exceed 999 seconds' };
    }

    // Format: if it's a whole number, add .0; otherwise, remove trailing zeros but keep at least one decimal
    let formatted;
    if (num % 1 === 0) {
      formatted = num.toFixed(1);
    } else {
      formatted = num.toString();
      if (formatted.includes('.')) {
        formatted = formatted.replace(/0+$/, '');
        if (formatted.endsWith('.')) {
          formatted += '0';
        }
      }
    }

    return { valid: true, value: formatted };
  }

  /**
   * Validate integer values (ammo, crit, multicast)
   * @param {string} value - Raw input value
   * @param {string} fieldName - Name of the field for error messages
   * @returns {Object} Validation result with formatted value
   */
  static validateInteger(value, fieldName) {
    if (!value || !value.trim()) {
      return { valid: true, value: '' };
    }

    const num = parseInt(value.trim());
    if (isNaN(num) || !Number.isInteger(parseFloat(value.trim()))) {
      return { valid: false, error: fieldName + " must be a valid integer" };
    }

    if (num < 0) {
      return { valid: false, error: fieldName + " cannot be negative" };
    }

    if (num > 9999) {
      return { valid: false, error: fieldName + " cannot exceed 9999" };
    }

    return { valid: true, value: num.toString() };
  }

  /**
   * Validate scaling values object
   * @param {Object} scalingValues - Object with scaling value properties
   * @returns {Object} Validation result with cleaned values
   */
  static validateScalingValues(scalingValues) {
    const validatedValues = {};
    const scalingTypes = ['heal', 'regen', 'shield', 'damage', 'poison', 'burn'];

    try {
      for (let i = 0; i < scalingTypes.length; i++) {
        const type = scalingTypes[i];
        const value = scalingValues[type];
        
        if (value && value.toString().trim()) {
          const validation = this.validateInteger(value.toString(), type + " scaling");
          if (!validation.valid) {
            return validation;
          }
          validatedValues[type] = validation.value;
        } else {
          validatedValues[type] = '';
        }
      }

      return { valid: true, values: validatedValues };
    } catch (error) {
      return { valid: false, error: "Error validating scaling values: " + error.message };
    }
  }

  /**
   * Validate text length
   * @param {string} text - Text to validate
   * @param {number} maxLength - Maximum allowed length
   * @param {string} fieldName - Name of the field for error messages
   * @returns {Object} Validation result
   */
  static validateTextLength(text, maxLength, fieldName) {
    if (!text) {
      return { valid: true };
    }

    if (text.length > maxLength) {
      return { 
        valid: false, 
        error: fieldName + " cannot exceed " + maxLength + " characters (current: " + text.length + ")"
      };
    }

    return { valid: true };
  }

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {Object} Validation result
   */
  static validateImageFile(file) {
    if (!file) {
      return { valid: false, error: "No image file provided" };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: "Invalid image type. Please use JPG, PNG, GIF, or WebP" 
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: "Image file too large. Maximum size is 10MB" 
      };
    }

    return { valid: true };
  }

  /**
   * Validate array of tags
   * @param {Array} tags - Array of tag strings
   * @returns {Object} Validation result with cleaned tags
   */
  static validateTags(tags) {
    if (!Array.isArray(tags)) {
      return { valid: false, error: "Tags must be an array" };
    }

    const validatedTags = [];
    const maxTagLength = 20;
    const maxTags = 10;

    for (let i = 0; i < tags.length && i < maxTags; i++) {
      const tag = tags[i];
      if (tag && typeof tag === 'string') {
        const trimmed = tag.trim();
        if (trimmed.length > 0) {
          if (trimmed.length > maxTagLength) {
            return { 
              valid: false, 
              error: "Tag \"" + trimmed + "\" is too long (max " + maxTagLength + " characters)"
            };
          }
          validatedTags.push(trimmed);
        }
      }
    }

    return { valid: true, tags: validatedTags };
  }

  /**
   * Validate export/import data structure
   * @param {Object} data - Data object to validate
   * @param {string} type - 'cards' or 'skills'
   * @returns {Object} Validation result
   */
  static validateImportData(data, type) {
    try {
      if (!data || typeof data !== 'object') {
        return { valid: false, error: "Invalid data format" };
      }

      if (!data.version) {
        return { valid: false, error: "Missing version information" };
      }

      const expectedProperty = type === 'cards' ? 'cards' : 'skills';
      if (!data[expectedProperty] || !Array.isArray(data[expectedProperty])) {
        return { valid: false, error: "Invalid " + type + " data format" };
      }

      // Validate each item in the array
      for (let i = 0; i < data[expectedProperty].length; i++) {
        const item = data[expectedProperty][i];
        
        if (type === 'cards') {
          const validation = this.validateCardData(item);
          if (!validation.valid) {
            return { 
              valid: false, 
              error: "Invalid card at index " + i + ": " + validation.error
            };
          }
        } else if (type === 'skills') {
          const validation = this.validateSkillData(item);
          if (!validation.valid) {
            return { 
              valid: false, 
              error: "Invalid skill at index " + i + ": " + validation.error
            };
          }
        }
      }

      return { valid: true, count: data[expectedProperty].length };

    } catch (error) {
      return { 
        valid: false, 
        error: "Error validating import data: " + error.message 
      };
    }
  }

  /**
   * Sanitize text input to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {Object} Validation result
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Invalid email format" };
    }

    return { valid: true };
  }

  /**
   * Validate alias/username format
   * @param {string} alias - Alias to validate
   * @returns {Object} Validation result
   */
  static validateAlias(alias) {
    if (!alias || typeof alias !== 'string') {
      return { valid: false, error: "Alias is required" };
    }

    const trimmed = alias.trim();

    if (trimmed.length < 2) {
      return { valid: false, error: "Alias must be at least 2 characters" };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: "Alias must be less than 20 characters" };
    }

    // Check for emojis using simple regex
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(trimmed)) {
      return { valid: false, error: "Emojis are not allowed in aliases" };
    }

    // Check for inappropriate characters
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { valid: false, error: "Alias can only contain letters, numbers, underscores, and hyphens" };
    }

    return { valid: true, alias: trimmed };
  }

  /**
   * Validate form data before submission
   * @param {HTMLFormElement} form - Form element to validate
   * @returns {Object} Validation result with field-specific errors
   */
  static validateForm(form) {
    const errors = {};
    const formData = new FormData(form);

    // Get all required fields
    const requiredFields = form.querySelectorAll('[required]');
    
    for (let i = 0; i < requiredFields.length; i++) {
      const field = requiredFields[i];
      const value = formData.get(field.name);
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field.name] = field.name + " is required";
      }
    }

    // Validate specific field types
    const emailFields = form.querySelectorAll('input[type="email"]');
    for (let i = 0; i < emailFields.length; i++) {
      const field = emailFields[i];
      const value = formData.get(field.name);
      if (value) {
        const emailValidation = this.validateEmail(value);
        if (!emailValidation.valid) {
          errors[field.name] = emailValidation.error;
        }
      }
    }

    const numberFields = form.querySelectorAll('input[type="number"]');
    for (let i = 0; i < numberFields.length; i++) {
      const field = numberFields[i];
      const value = formData.get(field.name);
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors[field.name] = 'Must be a valid number';
        } else if (field.min && num < parseFloat(field.min)) {
          errors[field.name] = 'Must be at least ' + field.min;
        } else if (field.max && num > parseFloat(field.max)) {
          errors[field.name] = 'Must be no more than ' + field.max;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Real-time validation for input fields
   * @param {HTMLInputElement} field - Input field to validate
   * @returns {Object} Validation result
   */
  static validateField(field) {
    if (!field) {
      return { valid: true };
    }

    const value = field.value;
    const fieldType = field.type;
    const fieldName = field.name || field.id || 'Field';

    // Required field check
    if (field.required && (!value || !value.trim())) {
      return { valid: false, error: fieldName + " is required" };
    }

    // Type-specific validation
    if (fieldType === 'email') {
      return value ? this.validateEmail(value) : { valid: true };
    }
    
    if (fieldType === 'number') {
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Must be a valid number' };
        }
        if (field.min && num < parseFloat(field.min)) {
          return { valid: false, error: 'Must be at least ' + field.min };
        }
        if (field.max && num > parseFloat(field.max)) {
          return { valid: false, error: 'Must be no more than ' + field.max };
        }
      }
    }
    
    if (fieldType === 'text' || fieldType === 'textarea') {
      // FIX: Only check maxLength if it's actually set and > 0
      if (field.maxLength && field.maxLength > 0 && value.length > field.maxLength) {
        return { 
          valid: false, 
          error: 'Cannot exceed ' + field.maxLength + ' characters'
        };
      }
    }

    return { valid: true };
  }
}

// Debug logging to confirm the class loaded
console.log('✅ Validation.js v5 loaded successfully - All methods available');

// Make sure the class is available globally
if (typeof window !== 'undefined') {
  window.Validation = Validation;
}
