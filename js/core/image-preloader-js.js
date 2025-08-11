/**
 * Image Preloader System
 * Preloads all necessary images off-screen and provides them on-demand
 * to improve form load times and user experience
 */
class ImagePreloader {
  static preloadedImages = new Map();
  static preloadedElements = new Map();
  static isInitialized = false;
  static preloadContainer = null;

  /**
   * Initialize the preloader system
   */
  static init() {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing Image Preloader...');
    
    // Show loading indicator
    this.showLoadingIndicator();
    
    // Create off-screen container for preloaded images
    this.createPreloadContainer();
    
    // Preload all necessary images
    this.preloadAllImages().then(() => {
      this.hideLoadingIndicator();
      console.log('✅ Image Preloader initialized');
    }).catch(error => {
      console.error('❌ Error preloading images:', error);
      this.hideLoadingIndicator();
    });
    
    this.isInitialized = true;
  }

  /**
   * Create off-screen container for preloaded images
   */
  static createPreloadContainer() {
    this.preloadContainer = document.createElement('div');
    this.preloadContainer.id = 'image-preload-container';
    this.preloadContainer.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      z-index: -9999;
      pointer-events: none;
    `;
    document.body.appendChild(this.preloadContainer);
  }

  /**
   * Preload all necessary images
   */
  static preloadAllImages() {
    console.log('📦 Preloading all images...');
    
    const promises = [];
    
    // Preload frame images
    promises.push(...this.preloadFrameImages());
    
    // Preload character images
    promises.push(...this.preloadCharacterImages());
    
    // Preload keyword images
    promises.push(...this.preloadKeywordImages());
    
    // Preload gem images
    promises.push(...this.preloadGemImages());
    
    // Preload cooldown images
    promises.push(...this.preloadCooldownImages());
    
    return Promise.all(promises).then(() => {
      console.log('✅ All images preloaded');
    });
  }

  /**
   * Preload frame images for all rarities and sizes
   */
  static preloadFrameImages() {
    const rarities = ['bronze', 'silver', 'gold', 'diamond', 'legendary'];
    const sizes = ['s', 'm', 'l'];
    const promises = [];
    
    // Preload skill-content frames (legacy)
    rarities.forEach(rarity => {
      sizes.forEach(size => {
        const key = `skill-frame-${rarity}-${size}`;
        const src = `images/skill-content/skill-borders/${rarity}/${rarity}_${size}_frame.png`;
        promises.push(this.preloadImage(key, src));
      });
    });
    
    // Preload skill-frames borders (new system)
    rarities.forEach(rarity => {
      const key = `border-frame-${rarity}`;
      const src = `images/skill-frames/borders/${rarity}_frame.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    // Preload icon overlays
    rarities.forEach(rarity => {
      const key = `icon-overlay-${rarity}`;
      const src = `images/skill-frames/icon-overlays/Skill_Frame_${rarity.charAt(0).toUpperCase() + rarity.slice(1)}.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    // Preload dividers
    rarities.forEach(rarity => {
      const key = `divider-${rarity}`;
      const src = `images/skill-frames/dividers/${rarity}_divider.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    return promises;
  }

  /**
   * Preload character images
   */
  static preloadCharacterImages() {
    const characters = [
      'neutral', 'mak', 'vanessa', 'pyg', 'dooly', 'stelle', 'jules', 'vampire'
    ];
    const promises = [];
    
    characters.forEach(character => {
      const key = `character-${character}`;
      const src = `images/characters/${character}.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    // Also preload default image
    promises.push(this.preloadImage('character-default', 'images/characters/default.png'));
    
    return promises;
  }

  /**
   * Preload keyword images
   */
  static preloadKeywordImages() {
    const keywords = [
      'slow', 'haste', 'heal', 'regen', 'poison', 'burn', 'charge', 'cooldown',
      'crit', 'damage', 'destroy', 'freeze', 'lifesteal', 'value', 'transform',
      'sheild', 'maxhealth'
    ];
    const promises = [];
    
    keywords.forEach(keyword => {
      const key = `keyword-${keyword}`;
      const src = `images/keywords/keytext/${keyword}.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    return promises;
  }

  /**
   * Preload gem images
   */
  static preloadGemImages() {
    const gems = ['Blank', 'Burn_TD', 'Damage_TD', 'Heal_TD', 'Poison_TD', 'Shield_TD'];
    const promises = [];
    
    gems.forEach(gem => {
      const key = `gem-${gem}`;
      const src = `images/CardGems/CardGem_${gem}.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    return promises;
  }

  /**
   * Preload cooldown images
   */
  static preloadCooldownImages() {
    const rarities = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary'];
    const promises = [];
    
    rarities.forEach(rarity => {
      const key = `cooldown-${rarity}`;
      const src = `images/skill-content/cooldown/${rarity}_Cooldown.png`;
      promises.push(this.preloadImage(key, src));
    });
    
    return promises;
  }

  /**
   * Preload a single image
   */
  static preloadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.set(key, src);
        console.log(`✅ Preloaded: ${key}`);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`⚠️ Failed to preload: ${key} (${src})`);
        reject(new Error(`Failed to load ${src}`));
      };
      
      img.src = src;
    });
  }

  /**
   * Get a preloaded image element
   */
  static getPreloadedImage(key) {
    const src = this.preloadedImages.get(key);
    if (!src) {
      console.warn(`⚠️ Preloaded image not found: ${key}`);
      return null;
    }
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = key;
    return img;
  }

  /**
   * Get a preloaded image source URL
   */
  static getPreloadedImageSrc(key) {
    return this.preloadedImages.get(key);
  }

  /**
   * Create a preloaded element and move it to target
   */
  static createAndMoveElement(key, targetElement, className = '', attributes = {}) {
    const src = this.getPreloadedImageSrc(key);
    if (!src) {
      console.warn(`⚠️ Cannot create element for missing preloaded image: ${key}`);
      return null;
    }
    
    const element = document.createElement('img');
    element.src = src;
    element.alt = key;
    
    if (className) {
      element.className = className;
    }
    
    // Apply additional attributes
    Object.entries(attributes).forEach(([attr, value]) => {
      element.setAttribute(attr, value);
    });
    
    // Move to target
    if (targetElement) {
      targetElement.appendChild(element);
    }
    
    return element;
  }

  /**
   * Get frame image source for card borders
   */
  static getFrameSrc(rarity, size = 'm') {
    const key = `border-frame-${rarity}`;
    return this.getPreloadedImageSrc(key);
  }

  /**
   * Get character image source
   */
  static getCharacterSrc(character) {
    const key = `character-${character.toLowerCase()}`;
    return this.getPreloadedImageSrc(key) || this.getPreloadedImageSrc('character-default');
  }

  /**
   * Get keyword image source
   */
  static getKeywordSrc(keyword) {
    const key = `keyword-${keyword.toLowerCase()}`;
    return this.getPreloadedImageSrc(key);
  }

  /**
   * Get gem image source
   */
  static getGemSrc(gemType) {
    const key = `gem-${gemType}`;
    return this.getPreloadedImageSrc(key);
  }

  /**
   * Get cooldown image source
   */
  static getCooldownSrc(rarity) {
    const key = `cooldown-${rarity}`;
    return this.getPreloadedImageSrc(key);
  }

  /**
   * Check if all images are loaded
   */
  static isFullyLoaded() {
    return this.preloadedImages.size > 0;
  }

  /**
   * Get loading progress
   */
  static getLoadingProgress() {
    // This could be enhanced to track actual loading progress
    return this.isFullyLoaded() ? 100 : 0;
  }

  /**
   * Show loading indicator
   */
  static showLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  /**
   * Hide loading indicator
   */
  static hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Clean up preloaded images (for memory management)
   */
  static cleanup() {
    this.preloadedImages.clear();
    this.preloadedElements.clear();
    
    if (this.preloadContainer) {
      this.preloadContainer.remove();
      this.preloadContainer = null;
    }
    
    this.isInitialized = false;
  }
}

// Initialize preloader when module loads
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ImagePreloader.init();
    
    // Add global function to check preloader status
    window.checkImagePreloaderStatus = () => {
      console.log('📊 Image Preloader Status:');
      console.log('- Initialized:', ImagePreloader.isInitialized);
      console.log('- Fully Loaded:', ImagePreloader.isFullyLoaded());
      console.log('- Preloaded Images Count:', ImagePreloader.preloadedImages.size);
      console.log('- Loading Progress:', ImagePreloader.getLoadingProgress() + '%');
    };
  });
}
