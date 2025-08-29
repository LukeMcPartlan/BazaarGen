/**
 * Keyword Text Processor
 * Handles keyword shortcuts and styling for both cards and skills
 */
class KeywordProcessor {
  
  // Define keyword colors and styling rules
  static keywordRules = {
    'slow': { color: 'rgb(203, 159, 110)' },
    'haste': { color: 'rgb(0, 235, 195)' },
    'charge': { color: 'rgb(0, 235, 195)' },
    'cooldown': { color: 'rgb(0, 235, 195)' },
    'heal': { color: 'rgb(143, 234, 49)' },
    'regen': { color: 'rgb(143, 234, 49)' },
    'poison': { color: 'rgb(13, 190, 79)' },
    'burn': { color: 'rgb(253, 146, 63)' },
    'crit': { color: 'rgb(244, 82, 60)' },
    'damage': { color: 'rgb(244, 82, 60)' },
    'freeze': { color: 'rgb(63, 200, 247)' },
    'lifesteal': { color: 'rgb(181, 56, 115)' },
    'value': { color: 'rgb(244, 208, 33)' },
    'destroy': { color: 'rgb(198, 44, 66)' },
    'transform': { color: 'rgb(90, 230, 233)' },
    'shield': { color: 'rgb(245, 208, 33)' },
    'maxhealth': { color: 'rgb(143, 234, 49)' }
  };

  /**
   * Process keyword text with shortcuts and styling
   * @param {string} text - The text to process
   * @returns {string} Processed HTML text with icons and styling
   */
  static processKeywordText(text) {
    if (!text || typeof text !== 'string') return text || '';
    
    let processedText = text;
    
    // Process LONGER patterns FIRST to avoid conflicts
    processedText = processedText.replace(/\/cd/g, '[COOLDOWN_ICON]');  // Process /cd before /c
    processedText = processedText.replace(/\/cr/g, '[CRIT_ICON]');      // Process /cr before /c
    processedText = processedText.replace(/\/he/g, '[HEAL_ICON]');      // Process /he before /h
    processedText = processedText.replace(/\/sh/g, '[SHIELD_ICON]');    // Process /sh before /s
    processedText = processedText.replace(/\/mh/g, '[MAXHEALTH_ICON]'); // Process /mh before /h
    processedText = processedText.replace(/\/de/g, '[DESTROY_ICON]');   // Process /de before /d
    
    // Then process single-letter patterns
    processedText = processedText.replace(/\/s/g, '[SLOW_ICON]');
    processedText = processedText.replace(/\/h/g, '[HASTE_ICON]');
    processedText = processedText.replace(/\/r/g, '[REGEN_ICON]');
    processedText = processedText.replace(/\/p/g, '[POISON_ICON]');
    processedText = processedText.replace(/\/b/g, '[BURN_ICON]');
    processedText = processedText.replace(/\/c/g, '[CHARGE_ICON]');
    processedText = processedText.replace(/\/d/g, '[DAMAGE_ICON]');
    processedText = processedText.replace(/\/f/g, '[FREEZE_ICON]');
    processedText = processedText.replace(/\/l/g, '[LIFESTEAL_ICON]');
    processedText = processedText.replace(/\/v/g, '[VALUE_ICON]');
    processedText = processedText.replace(/\/t/g, '[TRANSFORM_ICON]');
    
    // Create a regex pattern that matches all keywords (case insensitive)
    const keywords = Object.keys(this.keywordRules);
    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    
    // Replace each keyword with styled span
    processedText = processedText.replace(pattern, (match) => {
      const lowerMatch = match.toLowerCase();
      const rule = this.keywordRules[lowerMatch];
      if (rule) {
        return `<span style="color: ${rule.color}; font-weight: bold;" class="key-text" data-keyword="${lowerMatch}">${match}</span>`;
      }
      return match;
    });
    
    // Process number patterns with slashes (1/2/3/4 format) AFTER keyword processing
    processedText = this.processNumberPatterns(processedText);
    
    // Finally, replace all placeholders with actual images
    processedText = this.replaceIconPlaceholders(processedText);
    
    // Note: Removed text wrapping to prevent breaking HTML structure
    // The keyword processing already handles the important styling
    
    // Add line breaks between different keywords for better wrapping
    // This will help the skill effects wrap properly within their container
    // Note: Removed for passive effects to maintain proper spacing
    // processedText = processedText.replace(/(<\/span>)(<img)/g, '$1<br>$2');
    // processedText = processedText.replace(/(<\/span>)(<span)/g, '$1<br>$2');
    
    return processedText;
  }

  /**
   * Process number patterns with slashes and apply color coding based on position
   * @param {string} text - The text to process
   * @returns {string} Text with colored numbers
   */
  static processNumberPatterns(text) {
    // Match patterns like 1/2/3/4, 2/3/4, 3/4, etc.
    const numberPattern = /(\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?/g;
    
    return text.replace(numberPattern, (match, num1, num2, num3, num4) => {
      let result = '';
      
      // Count how many numbers we have in this sequence
      const numbers = [num1, num2, num3, num4].filter(num => num !== undefined);
      const totalNumbers = numbers.length;
      
      // Color based on position: last = diamond, second-to-last = gold, third-to-last = silver, fourth-to-last = bronze
      if (totalNumbers >= 1) {
        // First number (fourth-to-last if 4 numbers, third-to-last if 3 numbers, etc.)
        if (totalNumbers >= 4) {
          result += `<span class="text-bronze">${num1}</span>`;
        } else if (totalNumbers === 3) {
          result += `<span class="text-silver">${num1}</span>`;
        } else if (totalNumbers === 2) {
          result += `<span class="text-gold">${num1}</span>`;
        } else {
          result += `<span class="text-diamond">${num1}</span>`;
        }
      }
      
      result += '/';
      
      if (totalNumbers >= 2) {
        // Second number
        if (totalNumbers >= 4) {
          result += `<span class="text-silver">${num2}</span>`;
        } else if (totalNumbers === 3) {
          result += `<span class="text-gold">${num2}</span>`;
        } else {
          result += `<span class="text-diamond">${num2}</span>`;
        }
      }
      
      if (totalNumbers >= 3) {
        result += '/';
        // Third number
        if (totalNumbers >= 4) {
          result += `<span class="text-gold">${num3}</span>`;
        } else {
          result += `<span class="text-diamond">${num3}</span>`;
        }
      }
      
      if (totalNumbers >= 4) {
        result += '/';
        // Fourth number (last = diamond)
        result += `<span class="text-diamond">${num4}</span>`;
      }
      
      return result;
    });
  }

  /**
   * Replace icon placeholders with actual image elements
   * @param {string} text - Text with icon placeholders
   * @returns {string} Text with HTML img elements
   */
  static replaceIconPlaceholders(text) {
    const iconReplacements = {
          '[SLOW_ICON]': '<img src="images/keywords/keytext/slow.png" alt="slow" class="keyword-icon">',
    '[HASTE_ICON]': '<img src="images/keywords/keytext/haste.png" alt="haste" class="keyword-icon">',
    '[HEAL_ICON]': '<img src="images/keywords/keytext/heal.png" alt="heal" class="keyword-icon">',
    '[REGEN_ICON]': '<img src="images/keywords/keytext/regen.png" alt="regen" class="keyword-icon">',
    '[POISON_ICON]': '<img src="images/keywords/keytext/poison.png" alt="poison" class="keyword-icon">',
    '[BURN_ICON]': '<img src="images/keywords/keytext/burn.png" alt="burn" class="keyword-icon">',
    '[CHARGE_ICON]': '<img src="images/keywords/keytext/charge.png" alt="charge" class="keyword-icon">',
    '[COOLDOWN_ICON]': '<img src="images/keywords/keytext/cooldown.png" alt="cooldown" class="keyword-icon">',
    '[CRIT_ICON]': '<img src="images/keywords/keytext/crit.png" alt="crit" class="keyword-icon">',
    '[DAMAGE_ICON]': '<img src="images/keywords/keytext/damage.png" alt="damage" class="keyword-icon">',
    '[DESTROY_ICON]': '<img src="images/keywords/keytext/destroy.png" alt="destroy" class="keyword-icon">',
    '[FREEZE_ICON]': '<img src="images/keywords/keytext/freeze.png" alt="freeze" class="keyword-icon">',
    '[LIFESTEAL_ICON]': '<img src="images/keywords/keytext/lifesteal.png" alt="lifesteal" class="keyword-icon">',
    '[VALUE_ICON]': '<img src="images/keywords/keytext/value.png" alt="value" class="keyword-icon">',
    '[TRANSFORM_ICON]': '<img src="images/keywords/keytext/transform.png" alt="transform" class="keyword-icon">',
            '[SHIELD_ICON]': '<img src="images/keywords/keytext/shield.png" alt="shield" class="keyword-icon">',
    '[MAXHEALTH_ICON]': '<img src="images/keywords/keytext/maxhealth.png" alt="maxhealth" class="keyword-icon">'
    };

    let processedText = text;
    Object.entries(iconReplacements).forEach(([placeholder, replacement]) => {
      processedText = processedText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });

    return processedText;
  }

  /**
   * Get all available keyword shortcuts for help display
   * @returns {Array} Array of shortcut objects with key, icon, and keyword
   */
  static getShortcuts() {
    return [
      { key: '/s', icon: 'slow.png', keyword: 'slow', color: 'rgb(203, 159, 110)' },
      { key: '/h', icon: 'haste.png', keyword: 'haste', color: 'rgb(0, 235, 195)' },
      { key: '/he', icon: 'heal.png', keyword: 'heal', color: 'rgb(143, 234, 49)' },
      { key: '/r', icon: 'regen.png', keyword: 'regen', color: 'rgb(143, 234, 49)' },
      { key: '/p', icon: 'poison.png', keyword: 'poison', color: 'rgb(13, 190, 79)' },
      { key: '/b', icon: 'burn.png', keyword: 'burn', color: 'rgb(253, 146, 63)' },
      { key: '/c', icon: 'charge.png', keyword: 'charge', color: 'rgb(0, 235, 195)' },
      { key: '/cd', icon: 'cooldown.png', keyword: 'cooldown', color: 'rgb(0, 235, 195)' },
      { key: '/cr', icon: 'crit.png', keyword: 'crit', color: 'rgb(244, 82, 60)' },
      { key: '/d', icon: 'damage.png', keyword: 'damage', color: 'rgb(244, 82, 60)' },
      { key: '/de', icon: 'destroy.png', keyword: 'destroy', color: 'rgb(198, 44, 66)' },
      { key: '/f', icon: 'freeze.png', keyword: 'freeze', color: 'rgb(63, 200, 247)' },
      { key: '/l', icon: 'lifesteal.png', keyword: 'lifesteal', color: 'rgb(181, 56, 115)' },
      { key: '/v', icon: 'value.png', keyword: 'value', color: 'rgb(244, 208, 33)' },
      { key: '/t', icon: 'transform.png', keyword: 'transform', color: 'rgb(90, 230, 233)' },
              { key: '/sh', icon: 'shield.png', keyword: 'shield', color: 'rgb(245, 208, 33)' },
      { key: '/mh', icon: 'maxhealth.png', keyword: 'maxhealth', color: 'rgb(143, 234, 49)' }
    ];
  }

  /**
   * Generate HTML for keyboard shortcuts help display
   * @returns {string} HTML string for shortcuts grid
   */
  static generateShortcutsHTML() {
    const shortcuts = this.getShortcuts();
    return shortcuts.map(shortcut => `
      <div class="shortcut-item">
        <span class="shortcut-key">${shortcut.key}</span> 
        <img src="images/keywords/keytext/${shortcut.icon}" alt="${shortcut.keyword}" class="keyword-preview"> 
        <span style="color: ${shortcut.color}; font-weight: bold;" class="key-text">${shortcut.keyword}</span>
      </div>
    `).join('');
  }

  /**
   * Strip all keyword processing from text (for plain text export)
   * @param {string} text - Processed text with HTML
   * @returns {string} Plain text without HTML or shortcuts
   */
  static stripKeywords(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Remove HTML tags
    let plainText = text.replace(/<[^>]*>/g, '');
    
    // Remove shortcut patterns
    plainText = plainText.replace(/\/cd|\/cr|\/he|\/sh|\/mh|\/de|\/s|\/h|\/r|\/p|\/b|\/c|\/d|\/f|\/l|\/v|\/t/g, '');
    
    return plainText;
  }

  /**
   * Validate that keyword shortcuts are properly formatted
   * @param {string} text - Text to validate
   * @returns {Object} Validation result with valid boolean and warnings array
   */
  static validateKeywords(text) {
    if (!text || typeof text !== 'string') {
      return { valid: true, warnings: [] };
    }

    const warnings = [];
    const shortcuts = ['/cd', '/cr', '/he', '/sh', '/mh', '/de', '/s', '/h', '/r', '/p', '/b', '/c', '/d', '/f', '/l', '/v', '/t'];
    
    // Check for potential typos in shortcuts
    const shortcutPattern = /\/[a-z]{1,2}/g;
    const matches = text.match(shortcutPattern) || [];
    
    matches.forEach(match => {
      if (!shortcuts.includes(match)) {
        warnings.push(`Unknown shortcut "${match}" - did you mean one of: ${shortcuts.join(', ')}`);
      }
    });

    return {
      valid: true, // We don't fail on unknown shortcuts, just warn
      warnings: warnings
    };
  }
}