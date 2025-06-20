/**
 * Input Validation Utilities
 * Centralized validation for cards, skills, and form inputs
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
      return { valid: false, error: `${fieldName} must be a valid integer` };
    }

    if (num < 0) {
      return { valid: false, error: `${fieldName} cannot be negative` };
    }

    if (num > 9999) {
      return { valid: false, error: `${fieldName} cannot exceed 9999` };
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
      for (const type of scalingTypes) {
        const value = scalingValues[type];
        if (value && value.toString().trim()) {
          const validation = this.validateInteger(value.toString(), `${type} scaling`);
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
        error: `${fieldName} cannot exceed ${maxLength} characters (current: ${text.length})` 
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
              error: `Tag "${trimmed}" is too long (max ${maxTagLength} characters)` 
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
        return { valid: false, error: `Invalid ${type} data format` };
      }

      // Validate each item in the array
      for (let i = 0; i < data[expectedProperty].length; i++) {
        const item = data[expectedProperty][i];
        
        if