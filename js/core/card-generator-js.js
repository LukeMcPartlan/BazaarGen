console.log('🔄 Starting to load card-generator-js.js file...');

/**
 * Unified Card Generator
 * Handles card creation from multiple data sources (form input, imported data, database items)
 */
class CardGenerator {
 
/**
 * Main card creation function
 * @param {Object} options - Configuration options
 * @param {Object} options.data - Pre-existing card data object
 * @param {boolean} options.formData - Extract data from form inputs
 * @param {boolean} options.isPreview - Whether this is a preview card
 * @param {HTMLElement} options.container - Container to append card to
 * @param {boolean} options.includeControls - Whether to include control buttons
 * @param {string} options.mode - 'generator' | 'browser' | 'preview'
 * @param {boolean} options.skipValidation - Skip validation (for galleries)
 * @returns {Promise<HTMLElement|null>} The created card element
 */
static async createCard(options = {}) {
  console.log('🎯 CardGenerator.createCard called with options:', options);
  
  const {
    data = null,
    formData = false,
    isPreview = false,
    container = null,
    includeControls = true,
    mode = 'generator',
    skipValidation = false
  } = options;

  try {
    console.log('📊 Starting card creation process...');
    
    // Determine data source and extract card data
    let cardData;
    if (data) {
      console.log('📋 Using provided data');
      cardData = this.normalizeCardData(data);
    } else if (formData) {
      console.log('📝 Extracting data from form...');
      cardData = await this.extractFormData(); // ← Now properly awaiting the Promise
      console.log('✅ Form data extracted:', cardData);
    } else {
      throw new Error('No data source provided');
    }

    // Check dependencies before validation
    if (typeof Validation === 'undefined') {
      console.error('❌ Validation class not available');
      throw new Error('Validation class not loaded');
    }

    // Skip validation if requested (for galleries)
    if (!skipValidation) {
      console.log('🔍 Validating card data...');
      // Validate card data
      const validation = Validation.validateCardData(cardData);
      if (!validation.valid) {
        console.error('❌ Validation failed:', validation.error);
        if (mode === 'generator' || mode === 'preview') {
          if (typeof Messages !== 'undefined') {
            Messages.showError(validation.error);
          } else {
            console.error('❌ Messages class not available, showing alert instead');
            alert('Validation Error: ' + validation.error);
          }
        }
        return null;
      }
      console.log('✅ Validation passed');
    } else {
      console.log('⏭️ Skipping validation (skipValidation: true)');
    }

    console.log('🏗️ Building card element...');
    // Create the card element
    const cardElement = this.buildCardElement(cardData, mode, includeControls);

    // Add to container if specified
    if (container) {
      console.log('📦 Adding card to container');
      if (isPreview) {
        container.innerHTML = '';
      }
      container.appendChild(cardElement);
    }

    // Store card data for export if in generator mode
    if (mode === 'generator' && !isPreview && window.cardsData) {
      console.log('💾 Storing card data for export');
      window.cardsData.push(cardData);
    }

    // Apply sizing and positioning after DOM insertion
    this.applyCardSizing(cardElement, cardData);

    console.log('✅ Card created successfully');
    return cardElement;

  } catch (error) {
    console.error('❌ Error creating card:', error);
    if (mode === 'generator') {
      if (typeof Messages !== 'undefined') {
        Messages.showError('Error creating card: ' + error.message);
      } else {
        console.error('❌ Messages class not available for error display');
        alert('Error creating card: ' + error.message);
      }
    }
    return null;
  }
}

  /**
   * Extract card data from form inputs
   */
  static extractFormData() {
    console.log('📝 Extracting form data...');
    
    const imageInput = document.getElementById("imageInput");
    
    // Check for required image
    if (!imageInput?.files?.[0]) {
      console.error('❌ No image file found');
      throw new Error("Please upload an image first.");
    }
    console.log('🖼️ Image file found:', imageInput.files[0].name);

    // Get form values
    const itemName = document.getElementById("itemNameInput")?.value || '';
    const hero = document.getElementById("heroSelect")?.value || 'Neutral';
    const cooldown = document.getElementById("cooldownInput")?.value || '';
    const ammo = document.getElementById("ammoInput")?.value || '';
    const crit = document.getElementById("critInput")?.value || '';
    const multicast = document.getElementById("multicastInput")?.value || '';
    const itemSize = document.getElementById("itemSizeSelect")?.value || 'Medium';
    const border = document.getElementById("borderSelect")?.value || 'gold';
    
    // Handle custom hero image
    let customHeroImage = null;
    if (hero === 'Custom') {
      const customHeroInput = document.getElementById("customHeroInput");
      if (customHeroInput?.files?.[0]) {
        customHeroImage = new Promise(async (resolve) => {
          try {
            // Try to upload to storage first
            if (typeof ImageStorage !== 'undefined' && ImageStorage.uploadImage) {
              const imageUrl = await ImageStorage.uploadImage(
                customHeroInput.files[0], 
                itemName + '-hero', 
                'hero'
              );
              resolve(imageUrl);
            } else {
              // Fallback to base64
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(customHeroInput.files[0]);
            }
          } catch (error) {
            console.warn('⚠️ Failed to upload custom hero image, falling back to base64:', error);
            // Fallback to base64
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(customHeroInput.files[0]);
          }
        });
      }
    }

    console.log('📋 Basic form values extracted:', {
      itemName, hero, cooldown, ammo, crit, multicast, itemSize, border
    });

    // Get scaling values
    const scalingValues = {
      heal: document.getElementById("healScalingInput")?.value || '',
      regen: document.getElementById("regenScalingInput")?.value || '',
      shield: document.getElementById("shieldScalingInput")?.value || '',
      damage: document.getElementById("damageScalingInput")?.value || '',
      poison: document.getElementById("poisonScalingInput")?.value || '',
      burn: document.getElementById("burnScalingInput")?.value || ''
    };

    // Get dynamic inputs - on-use effects, tags, and passive effects
    const onUseInputs = document.querySelectorAll("#onUseInputs input");
    const tagInputs = document.querySelectorAll("#tagInputs input");
    const passiveInputs = document.querySelectorAll("#passiveInputs input");

    console.log('🏷️ Dynamic inputs found:');
    console.log('  - Tag inputs:', tagInputs.length, 'values:', Array.from(tagInputs).map(i => i.value));
    console.log('  - OnUse inputs:', onUseInputs.length, 'values:', Array.from(onUseInputs).map(i => i.value));
    console.log('  - Passive inputs:', passiveInputs.length, 'values:', Array.from(passiveInputs).map(i => i.value));

    return new Promise(async (resolve) => {
      console.log('📖 Processing image file...');
      
      // Upload image to storage if ImageStorage is available
      let imageData = null;
      if (typeof ImageStorage !== 'undefined' && ImageStorage.uploadImage) {
        try {
          console.log('📤 Uploading image to storage...');
          imageData = await ImageStorage.uploadImage(
            imageInput.files[0], 
            itemName, 
            'card'
          );
          console.log('✅ Image uploaded to storage:', imageData);
        } catch (uploadError) {
          console.warn('⚠️ Failed to upload to storage, falling back to base64:', uploadError);
          // Fallback to base64
          imageData = await this.readImageFile(imageInput.files[0]);
        }
      } else {
        // Fallback to base64 if ImageStorage not available
        console.log('📤 ImageStorage not available, using base64...');
        imageData = await this.readImageFile(imageInput.files[0]);
      }
      
      // Handle custom hero image if present
      let resolvedCustomHeroImage = null;
      if (customHeroImage) {
        resolvedCustomHeroImage = await customHeroImage;
      }
      
      const extractedData = {
        itemName: itemName,
        hero: hero,
        cooldown: cooldown,
        ammo: ammo,
        crit: crit,
        multicast: multicast,
        itemSize: itemSize,
        border: border,
        passiveEffects: Array.from(passiveInputs).map(input => input.value.trim()).filter(val => val), // Now array
        onUseEffects: Array.from(onUseInputs).map(input => input.value.trim()).filter(val => val),
        tags: Array.from(tagInputs).map(input => input.value.trim()).filter(val => val),
        scalingValues: scalingValues,
        imageData: imageData,
        customHeroImage: resolvedCustomHeroImage,
        timestamp: new Date().toISOString()
      };
      
      console.log('📦 Final extracted data:', extractedData);
      resolve(extractedData);
    });
  }

  /**
   * Read image file as data URL (fallback method)
   */
  static readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Normalize card data from different sources (import, database, etc.)
   */
  static normalizeCardData(data) {
    console.log('🔄 Normalizing card data:', data);
    
    // Handle database format
    if (data.item_data) {
      const itemData = data.item_data;
      const normalized = {
        itemName: itemData.name || itemData.itemName || 'Unnamed Item',
        hero: itemData.hero || 'Neutral',
        cooldown: itemData.cooldown || '',
        ammo: itemData.ammo || '',
        crit: itemData.crit || '',
        multicast: itemData.multicast || '',
        itemSize: itemData.item_size || itemData.itemSize || 'Medium',
        border: itemData.rarity || itemData.border || 'gold',
        passiveEffects: itemData.passive_effects || itemData.passiveEffects || itemData.passive_effect ? [itemData.passive_effect] : [], // Handle both formats
        onUseEffects: itemData.on_use_effects || itemData.onUseEffects || [],
        tags: itemData.tags || [],
        scalingValues: itemData.scaling_values || itemData.scalingValues || {},
        imageData: itemData.image_data || itemData.imageData || '',
        customHeroImage: itemData.custom_hero_image || itemData.customHeroImage || null,
        timestamp: data.created_at || new Date().toISOString(),
        databaseId: data.id,
        createdBy: data.users?.alias || data.user_alias
      };

      // Preserve gallery-specific fields
      if (itemData.isGallery) {
        normalized.isGallery = true;
        normalized.galleryItems = itemData.galleryItems || [];
        normalized.galleryInfo = itemData.galleryInfo || {};
        console.log('🖼️ Preserved gallery data:', {
          isGallery: normalized.isGallery,
          galleryItemsCount: normalized.galleryItems.length,
          galleryInfo: normalized.galleryInfo
        });
      }

      return normalized;
    }

    // Already in correct format (import or generator format)
    // Handle backward compatibility for old single passiveEffect
    let passiveEffects = data.passiveEffects || [];
    if (data.passiveEffect && !passiveEffects.length) {
      passiveEffects = [data.passiveEffect];
    }

    const normalized = {
      itemName: data.itemName || '',
      hero: data.hero || 'Neutral',
      cooldown: data.cooldown || '',
      ammo: data.ammo || '',
      crit: data.crit || '',
      multicast: data.multicast || '',
      itemSize: data.itemSize || 'Medium',
      border: data.border || 'gold',
      passiveEffects: passiveEffects, // Now always an array
      onUseEffects: data.onUseEffects || [],
      tags: data.tags || [],
      scalingValues: data.scalingValues || {},
      imageData: data.imageData || '',
      timestamp: data.timestamp || new Date().toISOString(),
      databaseId: data.databaseId,
      createdBy: data.createdBy
    };

    // Preserve gallery-specific fields
    if (data.isGallery) {
      normalized.isGallery = true;
      normalized.galleryItems = data.galleryItems || [];
      normalized.galleryInfo = data.galleryInfo || {};
      console.log('🖼️ Preserved gallery data:', {
        isGallery: normalized.isGallery,
        galleryItemsCount: normalized.galleryItems.length,
        galleryInfo: normalized.galleryInfo
      });
    }

    return normalized;
  }

  /**
   * Build the complete card element
   */
  static buildCardElement(cardData, mode = 'generator', includeControls = true) {
    console.log('🏗️ Building card element for mode:', mode);
    
    const borderColor = this.getBorderColor(cardData.border);
    const card = document.createElement("div");
    card.className = "card";

    // Add controls if requested
    if (includeControls) {
      const controls = this.createCardControls(cardData, mode);
      card.appendChild(controls);
    }

    // Create image container
    const imageContainer = this.createImageContainer(cardData, borderColor);
    
    // Create tags container
    const tagsContainer = this.createTagsContainer(cardData);

    // Create content container
    const content = this.createContentContainer(cardData, borderColor);

    // Create wrapper and visual content container
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "card-wrapper";
    cardWrapper.appendChild(tagsContainer);
    cardWrapper.appendChild(content);

    const visualContent = document.createElement("div");
    visualContent.className = "card-visual-content";
    visualContent.appendChild(imageContainer);
    visualContent.appendChild(cardWrapper);
    
    card.appendChild(visualContent);

    console.log('✅ Card element built successfully');
    return card;
  }






  
  /**
   * Create card control buttons based on mode
   */
  static createCardControls(cardData, mode) {
    const cardControls = document.createElement("div");
    cardControls.className = "card-controls";

    if (mode === 'generator') {
      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className = "card-edit-btn";
      editBtn.innerHTML = "✏️";
      editBtn.title = "Edit this card";
      editBtn.onclick = function() {
        console.log('✏️ [DEBUG] Edit button clicked');
        if (window.editCard) {
          window.editCard(cardData);
        } else {
          console.error('❌ [DEBUG] editCard function not found');
        }
      };

      // Export button
      const exportBtn = document.createElement("button");
      exportBtn.className = "card-export-btn";
      exportBtn.innerHTML = "💾";
      exportBtn.title = "Export this card";
      exportBtn.onclick = function() {
        console.log('💾 [DEBUG] Export button clicked');
        if (window.toggleExportMenu) {
          window.toggleExportMenu(exportBtn, cardData);
        } else{
          console.error('❌ [DEBUG] toggleExportMenu not found');
        }
      };

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "card-delete-btn";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Delete this card";
      deleteBtn.onclick = function() {
        if (window.clearCard) {
          window.clearCard(deleteBtn.closest('.card'));
        }
      };

      cardControls.appendChild(editBtn);
      cardControls.appendChild(exportBtn);
      cardControls.appendChild(deleteBtn);

    } else if (mode === 'browser') {
      // Upvote button removed - now handled by individual page controllers
      // This prevents duplicate/non-working upvote buttons
    }

    return cardControls;
  }

  /**
   * Create image container with frame and scaling values
   */
  static createImageContainer(cardData, borderColor) {
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";
    imageContainer.style.border = `3px solid ${borderColor}`;

    // Create image clipping wrapper
    const imageClipWrapper = document.createElement("div");
    imageClipWrapper.className = "image-clip-wrapper";

    // For galleries, use the first gallery item's image if no imageData is set
    let imageData = cardData.imageData;
    console.log('🖼️ CardGenerator - Image data check:', {
      hasImageData: !!cardData.imageData,
      isGallery: cardData.isGallery,
      hasGalleryItems: !!(cardData.galleryItems && cardData.galleryItems.length > 0),
      galleryItemsCount: cardData.galleryItems ? cardData.galleryItems.length : 0,
      firstGalleryItemImage: cardData.galleryItems && cardData.galleryItems[0] ? !!cardData.galleryItems[0].imageData : false,
      imageDataLength: cardData.imageData ? cardData.imageData.length : 0,
      firstGalleryItemImageLength: cardData.galleryItems && cardData.galleryItems[0] && cardData.galleryItems[0].imageData ? cardData.galleryItems[0].imageData.length : 0
    });
    
    if (!imageData && cardData.isGallery && cardData.galleryItems && cardData.galleryItems.length > 0) {
      imageData = cardData.galleryItems[0].imageData;
      console.log('🖼️ Using first gallery item image for gallery display:', !!imageData, 'Length:', imageData ? imageData.length : 0);
    }

    if (imageData) {
      const img = document.createElement("img");
      img.className = "uploaded-image";
      img.src = imageData;
      img.onerror = function() {
        console.log('❌ Image failed to load:', imageData);
        imageClipWrapper.style.background = '#333';
        imageClipWrapper.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Image not available</div>';
      };
      img.onload = function() {
        console.log('✅ Image loaded successfully');
      };
      imageClipWrapper.appendChild(img);
    } else {
      console.log('❌ No image data available for card');
      imageClipWrapper.style.background = '#333';
      imageClipWrapper.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">No image</div>';
    }

    imageContainer.appendChild(imageClipWrapper);

    // Add frame overlay
    const frame = this.createFrameElement(cardData.border, cardData.itemSize);
    imageContainer.appendChild(frame);

    // Add scaling values if any exist
    const scalingContainer = this.createScalingValuesContainer(cardData.scalingValues);
    if (scalingContainer.children.length > 0) {
      imageContainer.appendChild(scalingContainer);
    }

    return imageContainer;
  }

  /**
   * Create tags container
   */
  static createTagsContainer(cardData) {
    console.log('🏷️ Creating tags container with tags:', cardData.tags);
    
    const tagsContainer = document.createElement("div");
    tagsContainer.className = "tags-container";

    // Only add item size tag if this is not a gallery preview
    if (!cardData.isGallery) {
      const itemSizeTag = document.createElement("span");
      itemSizeTag.className = "item-tag";
      itemSizeTag.textContent = cardData.itemSize;
      tagsContainer.appendChild(itemSizeTag);
    }

    // Add additional tags
    cardData.tags.forEach(tagText => {
      if (tagText && tagText.trim()) {
        console.log('🏷️ Adding tag:', tagText);
        const tag = document.createElement("span");
        tag.className = "item-tag";
        tag.textContent = tagText.trim();
        tagsContainer.appendChild(tag);
      }
    });

    console.log('✅ Tags container created with', tagsContainer.children.length, 'tags');
    return tagsContainer;
  }

  /**
   * Create main content container
   */
  static createContentContainer(cardData, borderColor) {
    const content = document.createElement("div");
    content.className = "card-content";
    content.style.border = `3px solid ${borderColor}`;

    // Top section with title and hero
    const topSection = this.createTopSection(cardData, borderColor);
    content.appendChild(topSection);

    // On use effects section
    const onUseSection = this.createOnUseSection(cardData, borderColor);
    if (onUseSection) {
      content.appendChild(onUseSection);
    }

    // Passive effects section - now checks for array and length
    if (cardData.passiveEffects && cardData.passiveEffects.length > 0) {
      const passiveSection = this.createPassiveSection(cardData, borderColor);
      content.appendChild(passiveSection);
    }

    // Cooldown (only if there are on use effects)
    if (cardData.cooldown && cardData.cooldown.trim() && onUseSection) {
      const cooldownDiv = this.createCooldownSection(cardData, borderColor);
      content.appendChild(cooldownDiv);
    }

    // Ammo
    if (cardData.ammo && cardData.ammo.trim() && onUseSection) {
      const ammoDiv = this.createAmmoSection(cardData, borderColor);
      content.appendChild(ammoDiv);
    }

    return content;
  }

  /**
   * Create top section with title and hero
   */
  static createTopSection(cardData, borderColor) {
    const topSection = document.createElement("div");
    topSection.className = "text-section hero-header";
    topSection.style.borderTop = `2px solid ${borderColor}`;
    topSection.style.borderBottom = `2px solid ${borderColor}`;

    const itemTitle = document.createElement("div");
    itemTitle.className = "item-title";
    itemTitle.textContent = cardData.itemName;

    const heroImg = document.createElement("img");
    
    // Handle custom hero image
    if (cardData.hero === 'Custom' && cardData.customHeroImage) {
      heroImg.src = cardData.customHeroImage;
    } else {
      heroImg.src = `images/${cardData.hero.toLowerCase()}.png`;
    }
    
    heroImg.alt = cardData.hero;
    heroImg.onerror = function() {
      this.style.display = 'none';
    };

    topSection.appendChild(itemTitle);
    topSection.appendChild(heroImg);
    return topSection;
  }

  /**
   * Create on-use effects section
   */
  static createOnUseSection(cardData, borderColor) {
    console.log('⚡ Creating on-use section with effects:', cardData.onUseEffects);
    
    const effectsContainer = document.createElement("div");
    let hasEffects = false;

    // Add on use effects
    cardData.onUseEffects.forEach(effect => {
      if (effect && effect.trim()) {
        console.log('⚡ Adding on-use effect:', effect);
        const effectLine = document.createElement("div");
        effectLine.className = "on-use-line";

        const icon = document.createElement("img");
        icon.src = "images/use-arrow.png";
        icon.alt = "-";
        icon.onerror = function() { this.style.display = 'none'; };

        const text = document.createElement("span");
        if (typeof KeywordProcessor !== 'undefined') {
          text.innerHTML = KeywordProcessor.processKeywordText(effect);
        } else {
          console.warn('⚠️ KeywordProcessor not available, using plain text');
          text.textContent = effect;
        }

        effectLine.appendChild(icon);
        effectLine.appendChild(text);
        effectsContainer.appendChild(effectLine);
        hasEffects = true;
      }
    });

    // Add multicast if > 1
    if (cardData.multicast && parseInt(cardData.multicast) > 1) {
      const effectLine = document.createElement("div");
      effectLine.className = "on-use-line";

      const icon = document.createElement("img");
      icon.src = "images/use-arrow.png";
      icon.alt = "-";
      icon.onerror = function() { this.style.display = 'none'; };

      const text = document.createElement("span");
      text.innerHTML = "Multicast: " + cardData.multicast;

      effectLine.appendChild(icon);
      effectLine.appendChild(text);
      effectsContainer.appendChild(effectLine);
      hasEffects = true;
    }

    // Add crit if present
    if (cardData.crit && cardData.crit.trim()) {
      const critLineHR = document.createElement("hr");
      critLineHR.className = "crit-line-hr";
      effectsContainer.appendChild(critLineHR);

      const text = document.createElement("span");
      if (typeof KeywordProcessor !== 'undefined') {
        text.innerHTML = "Crit Chance: " + KeywordProcessor.processKeywordText("/cr") + cardData.crit + "%";
      } else {
        text.innerHTML = "Crit Chance: " + cardData.crit + "%";
      }
      const effectLine = document.createElement("div");
      effectLine.className = "crit-line";

      effectLine.appendChild(text);
      effectsContainer.appendChild(effectLine);
      hasEffects = true;
    }

    if (!hasEffects) {
      console.log('⚡ No on-use effects found, returning null');
      return null;
    }

    const onUseSection = document.createElement("div");
    onUseSection.className = "text-section on-use-section";
    onUseSection.style.borderTop = `2px solid ${borderColor}`;
    onUseSection.style.borderBottom = `2px solid ${borderColor}`;
    onUseSection.appendChild(effectsContainer);
    
    console.log('✅ On-use section created successfully');
    return onUseSection;
  }

  /**
   * Create passive effects section - now handles multiple effects
   */
  static createPassiveSection(cardData, borderColor) {
    console.log('🛡️ Creating passive section with effects:', cardData.passiveEffects);
    
    const passiveSection = document.createElement("div");
    passiveSection.className = "text-section passive-section";
    passiveSection.style.borderTop = `2px solid ${borderColor}`;
    passiveSection.style.borderBottom = `2px solid ${borderColor}`;
    
    // Create container for all passive effects
    const passiveContainer = document.createElement("div");
    passiveContainer.className = "passive-effects-container";
    
    // Add each passive effect on its own line
    cardData.passiveEffects.forEach((effect, index) => {
      if (effect && effect.trim()) {
        console.log('🛡️ Adding passive effect:', effect);
        
        const effectLine = document.createElement("div");
        effectLine.className = "passive-effect-line";
        
        // Add some spacing between multiple effects
        if (index > 0) {
          effectLine.style.marginTop = "8px";
        }
        
        if (typeof KeywordProcessor !== 'undefined') {
          effectLine.innerHTML = KeywordProcessor.processKeywordText(effect.trim());
        } else {
          console.warn('⚠️ KeywordProcessor not available, using plain text');
          effectLine.textContent = effect.trim();
        }
        
        passiveContainer.appendChild(effectLine);
      }
    });
    
    passiveSection.appendChild(passiveContainer);
    console.log('✅ Passive section created with', cardData.passiveEffects.length, 'effects');
    return passiveSection;
  }

  /**
   * Create cooldown section
   */
  static createCooldownSection(cardData, borderColor) {
    const cooldownDiv = document.createElement("div");
    cooldownDiv.className = "cooldown-section";
    cooldownDiv.innerHTML = `<span>${cardData.cooldown}</span><span class="sec-text">sec</span>`;
    
    // Add cooldown border overlay
    const cooldownBorder = this.createCooldownBorderElement(cardData.border);
    cooldownDiv.appendChild(cooldownBorder);
    
    return cooldownDiv;
  }

  /**
   * Create ammo section
   */
  static createAmmoSection(cardData, borderColor) {
    const ammoDiv = document.createElement("div");
    ammoDiv.className = "ammo-section";
    ammoDiv.style.border = `3px solid ${borderColor}`;
    
    const ammoImg = document.createElement("img");
    ammoImg.src = "images/ammo.png";
    ammoImg.alt = "Ammo";
    ammoImg.onerror = function() { this.style.display = 'none'; };
    ammoDiv.appendChild(ammoImg);
    
    const ammoText = document.createElement("span");
    ammoText.textContent = cardData.ammo;
    ammoDiv.appendChild(ammoText);
    
    return ammoDiv;
  }

  /**
   * Apply card sizing and positioning
   */
 static applyCardSizing(cardElement, cardData) {
  const doPositioning = (attempt = 0) => {
    const imageContainer = cardElement.querySelector('.image-container');
    const content = cardElement.querySelector('.card-content');
    const onUseSection = cardElement.querySelector('.on-use-section');

    if (imageContainer) {
      let widthRatio = 1.0;
      if (cardData.itemSize === "Small") {
        widthRatio = 0.5;
      } else if (cardData.itemSize === "Large") {
        widthRatio = 1.5;
      }

      const containerWidth = 150 * widthRatio;
      imageContainer.style.width = containerWidth + "px";

      const img = imageContainer.querySelector('.uploaded-image');
      if (img) {
        img.style.height = "100%";
        img.style.width = "auto";
        img.style.objectFit = "cover";
        img.style.objectPosition = "center";
      }
    }

    // Position cooldown and ammo relative to on-use section
    if (onUseSection && content) {
      // Check if elements have proper dimensions
      const onUseHeight = onUseSection.offsetHeight;
      const contentHeight = content.offsetHeight;
      
      if (onUseHeight > 0 && contentHeight > 0) {
        // Elements are properly laid out, do positioning
        this.positionElementsRelativeToOnUse(content, onUseSection);
        console.log('✅ Successfully positioned cooldown/ammo sections');
      } else if (attempt < 5) {
        // Retry with exponential backoff
        const delay = 100 * Math.pow(2, attempt);
        console.log(`🔄 Retrying positioning (attempt ${attempt + 1}/5) in ${delay}ms`);
        setTimeout(() => doPositioning(attempt + 1), delay);
      } else {
        console.warn('⚠️ Failed to position cooldown/ammo sections after 5 attempts');
      }
    }
  };

  // Start positioning after initial delay
  setTimeout(doPositioning, 100);
}

  /**
   * Position cooldown and ammo elements relative to on-use section
   */
  static positionElementsRelativeToOnUse(content, onUseSection) {
    // Force layout recalculation
    content.offsetHeight;
    onUseSection.offsetHeight;
    
    const onUseRelativeTop = onUseSection.offsetTop;
    const onUseHeight = onUseSection.offsetHeight;
    const onUseCenterY = onUseRelativeTop + (onUseHeight / 2);
    
    const cooldownSection = content.querySelector('.cooldown-section');
    const ammoSection = content.querySelector('.ammo-section');
    
    if (cooldownSection && onUseHeight > 0) {
      // Position cooldown section at the center of the on-use section
      const cooldownHeight = 50; // Height of cooldown section
      const cooldownTop = onUseCenterY - (cooldownHeight / 2);
      cooldownSection.style.top = `${cooldownTop}px`;
      cooldownSection.style.transform = 'none'; // Remove default transform
      console.log('🎯 Positioned cooldown section at:', cooldownTop, 'px (on-use center:', onUseCenterY, 'px)');
    }
    
    if (ammoSection) {
      const ammoHeight = ammoSection.offsetHeight;
      ammoSection.style.top = `${onUseCenterY - (ammoHeight / 2)}px`;
    }
  }

  // Helper methods
  static getBorderColor(value) {
    switch(value?.toLowerCase()) {
      case 'bronze': return 'rgb(205, 127, 50)';
      case 'silver': return 'silver';
      case 'gold': return 'gold';
      case 'diamond': return 'rgb(185, 242, 255)';
      case 'legendary': return 'rgb(124, 46, 44)';
      default: return 'gold';
    }
  }

  static createFrameElement(quality, size) {
    const sizeMap = { 'Small': 's', 'Medium': 'm', 'Large': 'l' };
    const frameSize = sizeMap[size] || 'm';
    const frameQuality = quality?.toLowerCase() || 'gold';
    
    const frameDiv = document.createElement("div");
    frameDiv.className = "card-frame";
    
    const frameImg = document.createElement("img");
    frameImg.src = `images/frames/${frameQuality}_${frameSize}_frame.png`;
    frameImg.alt = `${quality} ${size} frame`;
    frameImg.onerror = function() {
      frameDiv.style.display = 'none';
    };
    
    frameDiv.appendChild(frameImg);
    return frameDiv;
  }

  static createCooldownBorderElement(quality) {
    const qualityMap = {
      'bronze': 'Bronze', 'silver': 'silver', 'gold': 'gold',
      'diamond': 'diamond', 'legendary': 'Legendary'
    };
    
    const mappedQuality = qualityMap[quality?.toLowerCase()] || 'gold';
    const borderDiv = document.createElement("div");
    borderDiv.className = "cooldown-border";
    borderDiv.style.cssText = `
      position: absolute; top: 50%; left: 50%; width: 130%; height: 130%;
      transform: translate(calc(-50% + 2px), -50%); pointer-events: none; z-index: 0;
      background-image: url('images/cooldown/${mappedQuality}_cooldown.png');
      background-size: 100% 100%; background-repeat: no-repeat; background-position: center;
    `;
    
    return borderDiv;
  }

  static createScalingValuesContainer(scalingData) {
    const container = document.createElement("div");
    container.className = "scaling-values-container";
    
    const scalingTypes = ['heal', 'regen', 'shield', 'damage', 'poison', 'burn'];
    
    scalingTypes.forEach(type => {
      const value = scalingData[type];
      if (value && value.toString().trim()) {
        const scalingElement = document.createElement("div");
        scalingElement.className = `scaling-value ${type}`;
        scalingElement.textContent = value.toString().trim();
        container.appendChild(scalingElement);
      }
    });
    
    return container;
  }
}

console.log('✅ CardGenerator class defined successfully');

// Make CardGenerator available globally
try {
  window.CardGenerator = CardGenerator;
  console.log('✅ CardGenerator added to window object successfully');
  console.log('🔍 Testing CardGenerator availability:', typeof window.CardGenerator);
} catch (error) {
  console.error('❌ Error adding CardGenerator to window:', error);
}

console.log('🎉 card-generator-js.js file loaded completely!');

// Final dependency check
console.log('📊 Dependency check:');
console.log('  - Validation:', typeof Validation !== 'undefined' ? '✅ Available' : '❌ Missing');
console.log('  - Messages:', typeof Messages !== 'undefined' ? '✅ Available' : '❌ Missing');
console.log('  - KeywordProcessor:', typeof KeywordProcessor !== 'undefined' ? '✅ Available' : '❌ Missing');

// Clear card function
window.clearCard = (cardElement) => {
  if (!cardElement) return;

  // Remove from DOM
  cardElement.remove();

  // Remove from cardsData array if present
  if (window.cardsData && cardElement.cardIndex !== undefined) {
    window.cardsData.splice(cardElement.cardIndex, 1);
  }

  // Update cardIndex for all remaining cards in DOM and data array
  const cardElements = document.querySelectorAll('.card');
  cardElements.forEach((el, idx) => {
    el.cardIndex = idx;
    if (window.cardsData && window.cardsData[idx]) {
      // Optionally, you can also update a property in the data object if needed
      window.cardsData[idx].cardIndex = idx;
    }
  });

  // Optionally show a message
  if (typeof Messages !== 'undefined') {
    Messages.showSuccess('Card deleted');
  }
};
