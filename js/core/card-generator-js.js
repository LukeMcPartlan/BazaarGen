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
 * @returns {Promise<HTMLElement|null>} The created card element
 */
static async createCard(options = {}) {
  const {
    data = null,
    formData = false,
    isPreview = false,
    container = null,
    includeControls = true,
    mode = 'generator'
  } = options;

  try {
    // Determine data source and extract card data
    let cardData;
    if (data) {
      cardData = this.normalizeCardData(data);
    } else if (formData) {
      cardData = await this.extractFormData(); // ← Now properly awaiting the Promise
    } else {
      throw new Error('No data source provided');
    }

    // Validate card data
    const validation = Validation.validateCardData(cardData);
    if (!validation.valid) {
      if (mode === 'generator') {
        Messages.showError(validation.error);
      }
      return null;
    }

    // Create the card element
    const cardElement = this.buildCardElement(cardData, mode, includeControls);

    // Add to container if specified
    if (container) {
      if (isPreview) {
        container.innerHTML = '';
      }
      container.appendChild(cardElement);
    }

    // Store card data for export if in generator mode
    if (mode === 'generator' && !isPreview && window.cardsData) {
      window.cardsData.push(cardData);
    }

    // Apply sizing and positioning after DOM insertion
    this.applyCardSizing(cardElement, cardData);

    return cardElement;

  } catch (error) {
    console.error('Error creating card:', error);
    if (mode === 'generator') {
      Messages.showError('Error creating card: ' + error.message);
    }
    return null;
  }
}
  /**
   * Extract card data from form inputs
   */
  static extractFormData() {
    const imageInput = document.getElementById("imageInput");
    
    // Check for required image
    if (!imageInput?.files?.[0]) {
      throw new Error("Please upload an image first.");
    }

    // Get form values
    const itemName = document.getElementById("itemNameInput")?.value || '';
    const hero = document.getElementById("heroSelect")?.value || 'Neutral';
    const cooldown = document.getElementById("cooldownInput")?.value || '';
    const ammo = document.getElementById("ammoInput")?.value || '';
    const crit = document.getElementById("critInput")?.value || '';
    const multicast = document.getElementById("multicastInput")?.value || '';
    const itemSize = document.getElementById("itemSizeSelect")?.value || 'Medium';
    const border = document.getElementById("borderSelect")?.value || 'gold';
    const passiveInput = document.getElementById("passiveInput")?.value || '';

    // Get scaling values
    const scalingValues = {
      heal: document.getElementById("healScalingInput")?.value || '',
      regen: document.getElementById("regenScalingInput")?.value || '',
      shield: document.getElementById("shieldScalingInput")?.value || '',
      damage: document.getElementById("damageScalingInput")?.value || '',
      poison: document.getElementById("poisonScalingInput")?.value || '',
      burn: document.getElementById("burnScalingInput")?.value || ''
    };

    // Get on-use effects and tags
    const onUseInputs = document.querySelectorAll("#onUseInputs input");
    const tagInputs = document.querySelectorAll("#tagInputs input");

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        resolve({
          itemName: itemName,
          hero: hero,
          cooldown: cooldown,
          ammo: ammo,
          crit: crit,
          multicast: multicast,
          itemSize: itemSize,
          border: border,
          passiveEffect: passiveInput,
          onUseEffects: Array.from(onUseInputs).map(input => input.value.trim()).filter(val => val),
          tags: Array.from(tagInputs).map(input => input.value.trim()).filter(val => val),
          scalingValues: scalingValues,
          imageData: e.target.result,
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(imageInput.files[0]);
    });
  }

  /**
   * Normalize card data from different sources (import, database, etc.)
   */
  static normalizeCardData(data) {
    // Handle database format
    if (data.item_data) {
      const itemData = data.item_data;
      return {
        itemName: itemData.name || 'Unnamed Item',
        hero: itemData.hero || 'Neutral',
        cooldown: itemData.cooldown || '',
        ammo: itemData.ammo || '',
        crit: itemData.crit || '',
        multicast: itemData.multicast || '',
        itemSize: itemData.item_size || 'Medium',
        border: itemData.rarity || 'gold',
        passiveEffect: itemData.passive_effect || '',
        onUseEffects: itemData.on_use_effects || [],
        tags: itemData.tags || [],
        scalingValues: itemData.scaling_values || {},
        imageData: itemData.image_data || '',
        timestamp: data.created_at || new Date().toISOString(),
        databaseId: data.id,
        createdBy: data.users?.alias
      };
    }

    // Already in correct format (import or generator format)
    return {
      itemName: data.itemName || '',
      hero: data.hero || 'Neutral',
      cooldown: data.cooldown || '',
      ammo: data.ammo || '',
      crit: data.crit || '',
      multicast: data.multicast || '',
      itemSize: data.itemSize || 'Medium',
      border: data.border || 'gold',
      passiveEffect: data.passiveEffect || '',
      onUseEffects: data.onUseEffects || [],
      tags: data.tags || [],
      scalingValues: data.scalingValues || {},
      imageData: data.imageData || '',
      timestamp: data.timestamp || new Date().toISOString(),
      databaseId: data.databaseId,
      createdBy: data.createdBy
    };
  }

  /**
   * Build the complete card element
   */
  static buildCardElement(cardData, mode = 'generator', includeControls = true) {
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

    return card;
  }

  /**
   * Create card control buttons based on mode
   */
  static createCardControls(cardData, mode) {
    const cardControls = document.createElement("div");
    cardControls.className = "card-controls";

    if (mode === 'generator') {
      // Export button
      const exportBtn = document.createElement("button");
      exportBtn.className = "card-export-btn";
      exportBtn.innerHTML = "💾";
      exportBtn.title = "Export this card";
      exportBtn.onclick = function() {
        if (window.toggleExportMenu) {
          window.toggleExportMenu(exportBtn, cardData);
        }
      };

      // Save to database button
      const saveBtn = document.createElement("button");
      saveBtn.className = "card-save-btn";
      saveBtn.innerHTML = "🗃️";
      saveBtn.title = "Save to database";
      saveBtn.onclick = function() {
        if (window.Database && window.Database.saveCard) {
          window.Database.saveCard(cardData);
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

      cardControls.appendChild(exportBtn);
      cardControls.appendChild(saveBtn);
      cardControls.appendChild(deleteBtn);

    } else if (mode === 'browser') {
      // View details button
      const viewBtn = document.createElement("button");
      viewBtn.className = "card-view-btn";
      viewBtn.innerHTML = "👁️";
      viewBtn.title = "View item details";
      viewBtn.onclick = function() {
        if (window.viewItemDetails) {
          window.viewItemDetails(cardData);
        }
      };

      // Upvote button
      const upvoteBtn = document.createElement("button");
      upvoteBtn.className = "card-upvote-btn";
      upvoteBtn.innerHTML = "👍";
      upvoteBtn.title = "Upvote this item";
      upvoteBtn.onclick = function() {
        if (window.upvoteItem) {
          window.upvoteItem(cardData.databaseId);
        }
      };

      cardControls.appendChild(viewBtn);
      cardControls.appendChild(upvoteBtn);
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

    if (cardData.imageData) {
      const img = document.createElement("img");
      img.className = "uploaded-image";
      img.src = cardData.imageData;
      img.onerror = function() {
        imageClipWrapper.style.background = '#333';
        imageClipWrapper.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Image not available</div>';
      };
      imageClipWrapper.appendChild(img);
    } else {
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
    const tagsContainer = document.createElement("div");
    tagsContainer.className = "tags-container";

    // Always add item size as first tag
    const itemSizeTag = document.createElement("span");
    itemSizeTag.className = "item-tag";
    itemSizeTag.textContent = cardData.itemSize;
    tagsContainer.appendChild(itemSizeTag);

    // Add additional tags
    cardData.tags.forEach(tagText => {
      if (tagText && tagText.trim()) {
        const tag = document.createElement("span");
        tag.className = "item-tag";
        tag.textContent = tagText.trim();
        tagsContainer.appendChild(tag);
      }
    });

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

    // Passive effects section
    if (cardData.passiveEffect && cardData.passiveEffect.trim()) {
      const passiveSection = this.createPassiveSection(cardData, borderColor);
      content.appendChild(passiveSection);
    }

    // Cooldown (only if there are on use effects)
    if (cardData.cooldown && cardData.cooldown.trim() && onUseSection) {
      const cooldownDiv = this.createCooldownSection(cardData, borderColor);
      content.appendChild(cooldownDiv);
    }

    // Ammo
    if (cardData.ammo && cardData.ammo.trim()) {
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
    heroImg.src = `images/${cardData.hero.toLowerCase()}.png`;
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
    const effectsContainer = document.createElement("div");
    let hasEffects = false;

    // Add on use effects
    cardData.onUseEffects.forEach(effect => {
      if (effect && effect.trim()) {
        const effectLine = document.createElement("div");
        effectLine.className = "on-use-line";

        const icon = document.createElement("img");
        icon.src = "images/use-arrow.png";
        icon.alt = "-";
        icon.onerror = function() { this.style.display = 'none'; };

        const text = document.createElement("span");
        text.innerHTML = KeywordProcessor.processKeywordText(effect);

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
      text.innerHTML = "Crit Chance: " + KeywordProcessor.processKeywordText("/cr") + cardData.crit + "%";
      const effectLine = document.createElement("div");
      effectLine.className = "crit-line";

      effectLine.appendChild(text);
      effectsContainer.appendChild(effectLine);
      hasEffects = true;
    }

    if (!hasEffects) {
      return null;
    }

    const onUseSection = document.createElement("div");
    onUseSection.className = "text-section on-use-section";
    onUseSection.style.borderTop = `2px solid ${borderColor}`;
    onUseSection.style.borderBottom = `2px solid ${borderColor}`;
    onUseSection.appendChild(effectsContainer);
    return onUseSection;
  }

  /**
   * Create passive effects section
   */
  static createPassiveSection(cardData, borderColor) {
    const passiveSection = document.createElement("div");
    passiveSection.className = "text-section";
    passiveSection.style.borderTop = `2px solid ${borderColor}`;
    passiveSection.style.borderBottom = `2px solid ${borderColor}`;
    passiveSection.innerHTML = KeywordProcessor.processKeywordText(cardData.passiveEffect);
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
    setTimeout(() => {
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
        this.positionElementsRelativeToOnUse(content, onUseSection);
      }
    }, 0);
  }

  /**
   * Position cooldown and ammo elements relative to on-use section
   */
  static positionElementsRelativeToOnUse(content, onUseSection) {
    content.offsetHeight;
    onUseSection.offsetHeight;
    
    const onUseRelativeTop = onUseSection.offsetTop;
    const onUseHeight = onUseSection.offsetHeight;
    const onUseCenterY = onUseRelativeTop + (onUseHeight / 2);
    
    const cooldownSection = content.querySelector('.cooldown-section');
    const ammoSection = content.querySelector('.ammo-section');
    
    if (cooldownSection) {
      cooldownSection.style.top = `${onUseCenterY - 25}px`;
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

 window.CardGenerator = CardGenerator;
}
