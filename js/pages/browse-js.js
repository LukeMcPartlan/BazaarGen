/**
 * Comprehensive Browse Manager
 * Handles browsing both items and skills with advanced filtering and collections
 */
class BrowseManager {
  static currentTab = 'items'; // 'items' or 'skills'
  static currentContent = 'individual'; // 'individual' or 'collections'
  static allItems = [];
  static allSkills = [];
  static allItemCollections = [];
  static allSkillCollections = [];
  static displayedItems = [];
  static collections = new Map();
  static isLoading = false;
  static isInitialized = false;
  static searchTimeouts = {};
  static activeFilters = {
    items: {
      search: '',
      hero: '',
      rarity: '',
      sort: 'recent',
      keywords: [],
      tags: []
    },
    skills: {
      search: '',
      rarity: '',
      sort: 'recent',
      effectLength: '',
      keywords: []
    }
  };

  /**
   * Initialize the browse manager
   */
  static init() {
    if (this.isInitialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.setupDOMElements();
      this.setupEventListeners();
      this.initializeKeywordFilters();
      this.initializeSupabase();
      this.isInitialized = true;
    });
  }

  /**
   * Setup DOM element references
   */
  static setupDOMElements() {
    // Tab elements
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // Content elements
    this.itemsContent = document.getElementById('items-content');
    this.skillsContent = document.getElementById('skills-content');
    this.itemsLoading = document.getElementById('items-loading');
    this.skillsLoading = document.getElementById('skills-loading');
    this.itemsNoResults = document.getElementById('items-no-results');
    this.skillsNoResults = document.getElementById('skills-no-results');
    
    // Filter elements - Items
    this.itemsSearch = document.getElementById('items-search');
    this.itemsHeroFilter = document.getElementById('items-hero-filter');
    this.itemsRarityFilter = document.getElementById('items-rarity-filter');
    this.itemsSort = document.getElementById('items-sort');
    this.itemsResultsCount = document.getElementById('items-results-count');
    this.itemsKeywordToggles = document.getElementById('items-keyword-toggles');
    this.itemsTagToggles = document.getElementById('items-tag-toggles');
    
    // Filter elements - Skills
    this.skillsSearch = document.getElementById('skills-search');
    this.skillsRarityFilter = document.getElementById('skills-rarity-filter');
    this.skillsSort = document.getElementById('skills-sort');
    this.skillsEffectLength = document.getElementById('skills-effect-length');
    this.skillsResultsCount = document.getElementById('skills-results-count');
    this.skillsKeywordToggles = document.getElementById('skills-keyword-toggles');
  }

  /**
   * Setup event listeners
   */
  static setupEventListeners() {
    // Content navigation buttons
    document.querySelectorAll('.content-nav-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const content = e.target.dataset.content;
        this.switchContent(this.currentTab, content);
      });
    });
  }

  /**
   * Initialize keyword filter buttons
   */
  static initializeKeywordFilters() {
    const keywords = [
      { key: 'slow', icon: 'images/KeyText/slow.png', text: 'slow' },
      { key: 'haste', icon: 'images/KeyText/haste.png', text: 'haste' },
      { key: 'heal', icon: 'images/KeyText/heal.png', text: 'heal' },
      { key: 'regen', icon: 'images/KeyText/regen.png', text: 'regen' },
      { key: 'poison', icon: 'images/KeyText/poison.png', text: 'poison' },
      { key: 'burn', icon: 'images/KeyText/burn.png', text: 'burn' },
      { key: 'charge', icon: 'images/KeyText/charge.png', text: 'charge' },
      { key: 'cooldown', icon: 'images/KeyText/cooldown.png', text: 'cooldown' },
      { key: 'crit', icon: 'images/KeyText/crit.png', text: 'crit' },
      { key: 'damage', icon: 'images/KeyText/damage.png', text: 'damage' },
      { key: 'destroy', icon: 'images/KeyText/destroy.png', text: 'destroy' },
      { key: 'freeze', icon: 'images/KeyText/freeze.png', text: 'freeze' },
      { key: 'lifesteal', icon: 'images/KeyText/lifesteal.png', text: 'lifesteal' },
      { key: 'value', icon: 'images/KeyText/value.png', text: 'value' },
      { key: 'transform', icon: 'images/KeyText/transform.png', text: 'transform' },
      { key: 'shield', icon: 'images/KeyText/sheild.png', text: 'shield' },
      { key: 'maxhealth', icon: 'images/KeyText/maxhealth.png', text: 'maxhealth' }
    ];

    // Create keyword buttons for items
    if (this.itemsKeywordToggles) {
      this.itemsKeywordToggles.innerHTML = keywords.map(keyword => `
        <button class="keyword-toggle" data-keyword="${keyword.key}" onclick="BrowseManager.toggleKeyword('items', '${keyword.key}')">
          <img src="${keyword.icon}" alt="${keyword.text}" class="keyword-icon" onerror="this.style.display='none'">
          ${keyword.text}
        </button>
      `).join('');
    }

    // Create keyword buttons for skills
    if (this.skillsKeywordToggles) {
      this.skillsKeywordToggles.innerHTML = keywords.map(keyword => `
        <button class="keyword-toggle" data-keyword="${keyword.key}" onclick="BrowseManager.toggleKeyword('skills', '${keyword.key}')">
          <img src="${keyword.icon}" alt="${keyword.text}" class="keyword-icon" onerror="this.style.display='none'">
          ${keyword.text}
        </button>
      `).join('');
    }
  }

  /**
   * Initialize Supabase connection
   */
  static async initializeSupabase() {
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = 500;

    const attemptInitialization = async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        this.showError('Failed to load required libraries after multiple attempts. Please refresh the page.');
        return;
      }

      if (typeof SupabaseClient !== 'undefined' && SupabaseClient.isReady()) {
        const testResult = await SupabaseClient.testConnection();
        if (testResult.success) {
          // Load initial content (items by default)
          this.loadContent('items');
        } else {
          this.showError(`Database connection failed: ${testResult.error}`);
        }
      } else {
        setTimeout(attemptInitialization, checkInterval);
      }
    };

    attemptInitialization();
  }

  /**
   * Switch between main tabs (items/skills)
   */
  static switchTab(tab) {
    console.log('🔄 Switching to tab:', tab);
    
    this.currentTab = tab;
    this.currentContent = 'individual'; // Reset to individual when switching tabs

    // Update tab buttons
    this.tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });

    // Update tab content
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    // Update content navigation buttons
    const activeTabContent = document.getElementById(`${tab}-tab`);
    if (activeTabContent) {
      const contentNavButtons = activeTabContent.querySelectorAll('.content-nav-button');
      contentNavButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.content === 'individual');
      });
    }

    // Load content for the new tab
    this.loadContent(tab);
  }

  /**
   * Switch between content types (individual/collections)
   */
  static switchContent(tab, content) {
    console.log('🔄 Switching content:', tab, content);
    
    this.currentContent = content;

    // Update content navigation buttons
    const activeTabContent = document.getElementById(`${tab}-tab`);
    if (activeTabContent) {
      const contentNavButtons = activeTabContent.querySelectorAll('.content-nav-button');
      contentNavButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.content === content);
      });
    }

    // Load the appropriate content
    if (content === 'collections') {
      this.loadCollections(tab);
    } else {
      this.loadContent(tab);
    }
  }

  /**
   * Load content (items or skills)
   */
  static async loadContent(type) {
    if (this.isLoading) return;
    
    console.log('📥 Loading content:', type);
    this.isLoading = true;
    this.showLoading(type, true);
    this.hideMessages(type);

    try {
      if (type === 'items') {
        await this.loadItems();
      } else if (type === 'skills') {
        await this.loadSkills();
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      this.showError(`Failed to load ${type}: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.showLoading(type, false);
    }
  }

  /**
   * Load items from database
   */
  static async loadItems() {
    try {
      const filters = this.getFilters('items');
      const options = this.buildQueryOptions(filters, 'items');
      
      const data = await SupabaseClient.loadItems(options);
      this.allItems = data || [];
      
      // Detect and organize collections
      this.detectCollections(this.allItems, 'items');
      
      // Apply client-side filters
      const filteredItems = this.applyClientFilters(this.allItems, 'items');
      
      // Clear and populate the grid
      if (this.itemsContent) {
        this.itemsContent.innerHTML = '';
        
        for (const item of filteredItems) {
          try {
            const itemCard = await this.createItemCard(item);
            if (itemCard) {
              this.itemsContent.appendChild(itemCard);
            }
          } catch (error) {
            console.error(`Failed to create card for item ${item.id}:`, error);
          }
        }
      }
      
      this.updateResultsCount('items', filteredItems.length, this.allItems.length);
      this.updateNoResults('items', filteredItems.length === 0);
      
    } catch (error) {
      console.error('Error loading items:', error);
      throw error;
    }
  }

  /**
   * Load skills from database
   */
  static async loadSkills() {
    try {
      // Use getUserSkills for now, can be extended to public skills later
      const data = await SupabaseClient.getUserSkills();
      this.allSkills = data || [];
      
      // Apply client-side filters
      const filteredSkills = this.applyClientFilters(this.allSkills, 'skills');
      
      // Clear and populate the grid
      if (this.skillsContent) {
        this.skillsContent.innerHTML = '';
        
        for (const skill of filteredSkills) {
          try {
            const skillCard = await this.createSkillCard(skill);
            if (skillCard) {
              this.skillsContent.appendChild(skillCard);
            }
          } catch (error) {
            console.error(`Failed to create card for skill ${skill.id}:`, error);
          }
        }
      }
      
      this.updateResultsCount('skills', filteredSkills.length, this.allSkills.length);
      this.updateNoResults('skills', filteredSkills.length === 0);
      
    } catch (error) {
      console.error('Error loading skills:', error);
      throw error;
    }
  }

  /**
   * Load collections (items or skills)
   */
  static async loadCollections(type) {
    console.log('📦 Loading collections:', type);
    
    this.showLoading(type, true);
    
    try {
      let collections = [];
      
      if (type === 'items') {
        // Load item collections - this would need to be implemented in SupabaseClient
        // For now, use detected collections from regular items
        collections = Array.from(this.collections.values()).filter(c => c.type !== 'skills');
      } else if (type === 'skills') {
        // Load skill collections
        collections = await SupabaseClient.getUserSkillCollections();
      }

      const contentElement = type === 'items' ? this.itemsContent : this.skillsContent;
      if (contentElement) {
        contentElement.innerHTML = '';
        
        for (const collection of collections) {
          const collectionCard = this.createCollectionCard(collection, type);
          if (collectionCard) {
            contentElement.appendChild(collectionCard);
          }
        }
      }
      
      this.updateResultsCount(type, collections.length, collections.length);
      this.updateNoResults(type, collections.length === 0);
      
    } catch (error) {
      console.error(`Error loading ${type} collections:`, error);
      this.showError(`Failed to load ${type} collections: ${error.message}`);
    } finally {
      this.showLoading(type, false);
    }
  }

  /**
   * Create item card with enhanced features
   */
  static async createItemCard(item) {
    if (!item.item_data) {
      console.warn(`Item ${item.id} has no item_data`);
      return null;
    }

    try {
      // Create wrapper
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'card-wrapper';
      cardWrapper.style.marginBottom = '30px';

      // Collection header if applicable
      if (item.collectionId) {
        const collectionInfo = this.collections.get(item.collectionId);
        const collectionHeader = this.createCollectionHeader(collectionInfo, item);
        cardWrapper.appendChild(collectionHeader);
      }

      // Creator info
      const creatorInfo = this.createCreatorInfo(item);
      cardWrapper.appendChild(creatorInfo);

      // Create the card
      const cardData = item.item_data;
      cardData.created_at = item.created_at;
      cardData.creator_alias = item.user_alias;
      cardData.database_id = item.id;

      const cardElement = await CardGenerator.createCard({
        data: cardData,
        mode: 'browser',
        includeControls: true
      });

      // Add gallery functionality if applicable
      if (item.collectionId) {
        const collection = this.collections.get(item.collectionId);
        if (collection) {
          GalleryModal.addGalleryButton(
            cardElement, 
            collection.items.map(i => i.item_data), 
            item.collectionIndex
          );
        }
      }

      cardWrapper.appendChild(cardElement);

      // Comments section
      const commentsSection = await this.createCommentsSection(item.id);
      cardWrapper.appendChild(commentsSection);

      return cardWrapper;
    } catch (error) {
      console.error('Error creating item card:', error);
      return null;
    }
  }

  /**
   * Create skill card
   */
  static async createSkillCard(skill) {
    if (!skill.skill_data) {
      console.warn(`Skill ${skill.id} has no skill_data`);
      return null;
    }

    try {
      // Create wrapper
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'skill-card-wrapper';
      cardWrapper.style.marginBottom = '30px';

      // Creator info
      const creatorInfo = this.createCreatorInfo(skill);
      cardWrapper.appendChild(creatorInfo);

      // Create the skill card
      const skillData = skill.skill_data;
      skillData.created_at = skill.created_at;
      skillData.creator_alias = skill.user_alias;
      skillData.database_id = skill.id;

      const skillElement = SkillGenerator.createSkill({
        data: skillData,
        mode: 'browser',
        includeControls: true
      });

      cardWrapper.appendChild(skillElement);

      // Comments section
      const commentsSection = await this.createCommentsSection(skill.id);
      cardWrapper.appendChild(commentsSection);

      return cardWrapper;
    } catch (error) {
      console.error('Error creating skill card:', error);
      return null;
    }
  }

  /**
   * Create collection card
   */
  static createCollectionCard(collection, type) {
    const card = document.createElement('div');
    card.className = 'browse-collection browse-item';
    
    const isSkillCollection = type === 'skills' || collection.skills_data;
    const itemCount = isSkillCollection ? collection.skill_count : collection.items?.length || 0;
    const items = isSkillCollection ? collection.skills_data : collection.items;

    card.innerHTML = `
      <div class="browse-item-header">
        <h3 class="browse-item-title">${collection.name}</h3>
        <span class="collection-count">${itemCount} ${type}</span>
      </div>
      <div class="browse-item-meta">
        <span class="browse-item-creator">By: ${collection.user_alias || collection.createdBy || 'Unknown'}</span>
        <span>${new Date(collection.created_at).toLocaleDateString()}</span>
      </div>
      <div class="browse-item-description">${collection.description}</div>
      <div class="collection-preview-grid">
        ${this.createCollectionPreview(items, type)}
      </div>
      <div class="browse-item-actions">
        <button class="primary-action" onclick="BrowseManager.loadCollection('${collection.id}', '${type}')">
          🖼️ View Collection
        </button>
        <button onclick="BrowseManager.downloadCollection('${collection.id}', '${type}')">
          💾 Download
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Create collection preview
   */
  static createCollectionPreview(items, type) {
    if (!items || !Array.isArray(items)) return '';
    
    return items.slice(0, 3).map(item => {
      const icon = type === 'skills' ? '⚡' : '🃏';
      const name = type === 'skills' ? 
        (item.skillName || item.skill_name || 'Skill') : 
        (item.itemName || item.name || 'Item');
      
      return `
        <div class="collection-preview-item" title="${name}">
          ${icon}
        </div>
      `;
    }).join('');
  }

  /**
   * Detect collections from items
   */
  static detectCollections(items, type) {
    console.log(`🔍 Detecting ${type} collections from`, items.length, 'items...');
    
    this.collections.clear();
    
    const timeGroups = new Map();
    const TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    
    items.forEach((item, index) => {
      const createdTime = new Date(item.created_at).getTime();
      const userEmail = item.user_email;
      const groupKey = `${userEmail}_${Math.floor(createdTime / TIME_THRESHOLD)}`;
      
      if (!timeGroups.has(groupKey)) {
        timeGroups.set(groupKey, []);
      }
      
      timeGroups.get(groupKey).push({
        ...item,
        originalIndex: index
      });
    });
    
    let collectionId = 0;
    timeGroups.forEach((groupItems, groupKey) => {
      if (groupItems.length > 1) {
        const collection = {
          id: `collection_${collectionId++}`,
          name: `${groupItems[0].user_alias || 'Unknown'}'s ${type} Collection`,
          description: `${groupItems.length} ${type} uploaded together`,
          items: groupItems,
          createdBy: groupItems[0].user_alias || 'Unknown',
          created_at: groupItems[0].created_at,
          user_email: groupItems[0].user_email,
          type: type
        };
        
        this.collections.set(collection.id, collection);
        
        groupItems.forEach((item, itemIndex) => {
          item.collectionId = collection.id;
          item.collectionIndex = itemIndex;
          item.collectionTotal = groupItems.length;
        });
        
        console.log(`📦 Detected ${type} collection: "${collection.name}" with ${groupItems.length} items`);
      }
    });
    
    console.log(`✅ Found ${this.collections.size} ${type} collections`);
  }

  /**
   * Apply client-side filters
   */
  static applyClientFilters(items, type) {
    const filters = this.activeFilters[type];
    
    let filtered = [...items];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        const data = type === 'items' ? item.item_data : item.skill_data;
        const name = type === 'items' ? 
          (data.itemName || data.name || '') : 
          (data.skillName || data.name || '');
        const description = type === 'items' ? 
          (data.passiveEffects?.join(' ') || data.onUseEffects?.join(' ') || '') :
          (data.skillEffect || '');
        
        return name.toLowerCase().includes(searchTerm) ||
               description.toLowerCase().includes(searchTerm);
      });
    }

    // Rarity filter
    if (filters.rarity) {
      filtered = filtered.filter(item => {
        const data = type === 'items' ? item.item_data : item.skill_data;
        return data.border === filters.rarity;
      });
    }

    // Hero filter (items only)
    if (type === 'items' && filters.hero) {
      filtered = filtered.filter(item => {
        return item.item_data.hero === filters.hero;
      });
    }

    // Effect length filter (skills only)
    if (type === 'skills' && filters.effectLength) {
      filtered = filtered.filter(item => {
        const effectLength = item.skill_data.skillEffect?.length || 0;
        switch (filters.effectLength) {
          case 'short': return effectLength < 50;
          case 'medium': return effectLength >= 50 && effectLength <= 150;
          case 'long': return effectLength > 150;
          default: return true;
        }
      });
    }

    // Keyword filters
    if (filters.keywords.length > 0) {
      filtered = filtered.filter(item => {
        const data = type === 'items' ? item.item_data : item.skill_data;
        const text = type === 'items' ? 
          (data.passiveEffects?.join(' ') + ' ' + data.onUseEffects?.join(' ') || '') :
          (data.skillEffect || '');
        
        return filters.keywords.every(keyword => 
          text.toLowerCase().includes(keyword.toLowerCase())
        );
      });
    }

    // Tag filters (items only)
    if (type === 'items' && filters.tags.length > 0) {
      filtered = filtered.filter(item => {
        const data = item.item_data;
        const itemSize = data.itemSize || data.item_size || '';
        const tags = data.tags || [];
        
        return filters.tags.some(tag => 
          itemSize === tag || tags.includes(tag)
        );
      });
    }

    // Sort
    switch (filters.sort) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'name':
        filtered.sort((a, b) => {
          const aData = type === 'items' ? a.item_data : a.skill_data;
          const bData = type === 'items' ? b.item_data : b.skill_data;
          const aName = type === 'items' ? 
            (aData.itemName || aData.name || '') :
            (aData.skillName || aData.name || '');
          const bName = type === 'items' ? 
            (bData.itemName || bData.name || '') :
            (bData.skillName || bData.name || '');
          return aName.localeCompare(bName);
        });
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return filtered;
  }

  /**
   * Get current filter values
   */
  static getFilters(type) {
    if (type === 'items') {
      return {
        search: this.itemsSearch?.value?.trim() || '',
        hero: this.itemsHeroFilter?.value || '',
        rarity: this.itemsRarityFilter?.value || '',
        sort: this.itemsSort?.value || 'recent'
      };
    } else {
      return {
        search: this.skillsSearch?.value?.trim() || '',
        rarity: this.skillsRarityFilter?.value || '',
        sort: this.skillsSort?.value || 'recent',
        effectLength: this.skillsEffectLength?.value || ''
      };
    }
  }

  /**
   * Build query options for database
   */
  static buildQueryOptions(filters, type) {
    const options = {
      sortBy: filters.sort
    };

    if (type === 'items' && filters.hero) {
      options.hero = filters.hero;
    }

    if (filters.search) {
      options.search = filters.search;
    }

    return options;
  }

  /**
   * Apply filters
   */
  static applyFilters(type) {
    console.log('🔍 Applying filters for:', type);
    
    // Update active filters
    this.activeFilters[type] = this.getFilters(type);
    
    // Reload content with filters
    if (this.currentContent === 'collections') {
      this.loadCollections(type);
    } else {
      this.loadContent(type);
    }
  }

  /**
   * Clear filters
   */
  static clearFilters(type) {
    console.log('🧹 Clearing filters for:', type);
    
    if (type === 'items') {
      if (this.itemsSearch) this.itemsSearch.value = '';
      if (this.itemsHeroFilter) this.itemsHeroFilter.value = '';
      if (this.itemsRarityFilter) this.itemsRarityFilter.value = '';
      if (this.itemsSort) this.itemsSort.value = 'recent';
      
      // Clear keyword and tag toggles
      this.itemsKeywordToggles?.querySelectorAll('.keyword-toggle.active').forEach(btn => {
        btn.classList.remove('active');
      });
      this.itemsTagToggles?.querySelectorAll('.tag-toggle.active').forEach(btn => {
        btn.classList.remove('active');
      });
      
      this.activeFilters.items = {
        search: '', hero: '', rarity: '', sort: 'recent', keywords: [], tags: []
      };
    } else {
      if (this.skillsSearch) this.skillsSearch.value = '';
      if (this.skillsRarityFilter) this.skillsRarityFilter.value = '';
      if (this.skillsSort) this.skillsSort.value = 'recent';
      if (this.skillsEffectLength) this.skillsEffectLength.value = '';
      
      // Clear keyword toggles
      this.skillsKeywordToggles?.querySelectorAll('.keyword-toggle.active').forEach(btn => {
        btn.classList.remove('active');
      });
      
      this.activeFilters.skills = {
        search: '', rarity: '', sort: 'recent', effectLength: '', keywords: []
      };
    }
    
    this.applyFilters(type);
  }

  /**
   * Toggle keyword filter
   */
  static toggleKeyword(type, keyword) {
    const button = document.querySelector(`#${type}-keyword-toggles .keyword-toggle[data-keyword="${keyword}"]`);
    if (!button) return;
    
    button.classList.toggle('active');
    
    const isActive = button.classList.contains('active');
    const keywords = this.activeFilters[type].keywords;
    
    if (isActive && !keywords.includes(keyword)) {
      keywords.push(keyword);
    } else if (!isActive && keywords.includes(keyword)) {
      const index = keywords.indexOf(keyword);
      keywords.splice(index, 1);
    }
    
    this.applyFilters(type);
  }

  /**
   * Toggle tag filter (items only)
   */
  static toggleTag(type, tag) {
    if (type !== 'items') return;
    
    const button = document.querySelector(`#${type}-tag-toggles .tag-toggle[data-tag="${tag}"]`);
    if (!button) return;
    
    button.classList.toggle('active');
    
    const isActive = button.classList.contains('active');
    const tags = this.activeFilters[type].tags;
    
    if (isActive && !tags.includes(tag)) {
      tags.push(tag);
    } else if (!isActive && tags.includes(tag)) {
      const index = tags.indexOf(tag);
      tags.splice(index, 1);
    }
    
    this.applyFilters(type);
  }

  /**
   * Debounced filter for search inputs
   */
  static debounceFilter(type) {
    clearTimeout(this.searchTimeouts[type]);
    this.searchTimeouts[type] = setTimeout(() => {
      this.applyFilters(type);
    }, 500);
  }

  /**
   * Create creator info section
   */
  static createCreatorInfo(item) {
    const creatorInfo = document.createElement('div');
    creatorInfo.className = 'creator-info';
    creatorInfo.style.cssText = `
      padding: 12px 20px;
      background: linear-gradient(135deg, rgba(74, 60, 46, 0.9) 0%, rgba(37, 26, 12, 0.8) 100%);
      border: 2px solid rgb(218, 165, 32);
      border-radius: 12px 12px 0 0;
      font-size: 14px;
      color: rgb(251, 225, 183);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      min-width: 450px;
    `;

    const creatorAlias = item.user_alias || 'Unknown Creator';
    const createdDate = new Date(item.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    creatorInfo.innerHTML = `
      <span style="font-weight: 600; color: rgb(251, 225, 183);">
        <span style="color: rgb(218, 165, 32);">Created by:</span> ${creatorAlias}
      </span>
      <span style="color: rgb(201, 175, 133); font-size: 12px;">${createdDate}</span>
    `;

    return creatorInfo;
  }

  /**
   * Create collection header
   */
  static createCollectionHeader(collection, currentItem) {
    const header = document.createElement('div');
    header.className = 'collection-header';
    header.style.cssText = `
      background: linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(48, 63, 159) 100%);
      color: white;
      padding: 10px 20px;
      border-radius: 8px 8px 0 0;
      margin-bottom: -2px;
      border: 2px solid rgb(63, 81, 181);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      min-width: 450px;
    `;

    header.innerHTML = `
      <div>
        <div style="font-weight: bold; margin-bottom: 2px;">
          📦 ${collection.name}
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
          Item ${currentItem.collectionIndex + 1} of ${currentItem.collectionTotal}
        </div>
      </div>
      <button style="
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
      " onclick="BrowseManager.viewCollection('${collection.id}')">
        🖼️ View Collection
      </button>
    `;

    return header;
  }

  /**
   * Create comments section
   */
  static async createCommentsSection(itemId) {
    const commentsContainer = document.createElement('div');
    commentsContainer.className = 'comments-section';
    commentsContainer.style.cssText = `
      background: linear-gradient(135deg, rgba(101, 84, 63, 0.95) 0%, rgba(89, 72, 51, 0.9) 100%);
      border: 2px solid rgb(218, 165, 32);
      border-radius: 0 0 12px 12px;
      padding: 20px;
      margin-top: -2px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      min-width: 450px;
    `;

    // Comments header
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    header.innerHTML = `
      <h4 style="margin: 0; color: rgb(251, 225, 183); font-size: 18px;">Comments</h4>
      <button class="toggle-comments-btn" style="
        background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%);
        border: 2px solid rgb(37, 26, 12);
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        color: rgb(37, 26, 12);
        font-weight: bold;
      ">Show/Hide</button>
    `;

    // Comments list
    const commentsList = document.createElement('div');
    commentsList.className = 'comments-list';
    commentsList.id = `comments-${itemId}`;
    commentsList.style.cssText = `
      max-height: 300px; 
      overflow-y: auto; 
      margin: 15px 0;
      background: rgba(37, 26, 12, 0.7);
      border: 2px solid rgba(218, 165, 32, 0.3);
      border-radius: 8px;
      padding: 10px;
    `;

    // Comment form
    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    
    if (typeof GoogleAuth !== 'undefined' && GoogleAuth.isSignedIn()) {
      commentForm.innerHTML = `
        <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 2px solid rgb(218, 165, 32); padding-top: 15px;">
          <input type="text" 
                 id="comment-input-${itemId}" 
                 placeholder="Add a comment..." 
                 style="flex: 1; padding: 10px 15px; border: 2px solid rgb(218, 165, 32); border-radius: 6px; background-color: rgba(37, 26, 12, 0.8); color: rgb(251, 225, 183); font-size: 14px;">
          <button onclick="BrowseManager.addComment('${itemId}')" 
                  style="padding: 10px 20px; background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%); color: rgb(37, 26, 12); border: 2px solid rgb(37, 26, 12); border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
            Post
          </button>
        </div>
      `;
    } else {
      commentForm.innerHTML = `
        <div style="text-align: center; padding: 20px; color: rgb(251, 225, 183); font-style: italic; background: linear-gradient(135deg, rgba(74, 60, 46, 0.5) 0%, rgba(89, 72, 51, 0.4) 100%); border-radius: 8px; border: 2px dashed rgba(218, 165, 32, 0.5); border-top: 2px solid rgb(218, 165, 32); margin-top: 15px;">
          Sign in to comment
        </div>
      `;
    }

    // Load comments
    await this.loadComments(itemId, commentsList);

    // Toggle functionality
    const toggleBtn = header.querySelector('.toggle-comments-btn');
    toggleBtn.addEventListener('click', () => {
      const isHidden = commentsList.style.display === 'none';
      commentsList.style.display = isHidden ? 'block' : 'none';
      commentForm.style.display = isHidden ? 'block' : 'none';
    });

    commentsContainer.appendChild(header);
    commentsContainer.appendChild(commentsList);
    commentsContainer.appendChild(commentForm);

    return commentsContainer;
  }

  /**
   * Load comments for an item
   */
  static async loadComments(itemId, container) {
    try {
      const comments = await SupabaseClient.getComments(itemId);
      
      if (comments.length === 0) {
        container.innerHTML = '<div style="padding: 30px; text-align: center; color: rgb(201, 175, 133); font-style: italic;">No comments yet</div>';
        return;
      }

      container.innerHTML = comments.map(comment => `
        <div style="padding: 12px; border-bottom: 1px solid rgba(218, 165, 32, 0.3); background: linear-gradient(135deg, rgba(74, 60, 46, 0.7) 0%, rgba(89, 72, 51, 0.6) 100%); margin-bottom: 8px; border-radius: 6px; border: 1px solid rgba(218, 165, 32, 0.2);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong style="color: rgb(251, 225, 183); font-size: 14px;">${comment.user_alias}</strong>
            <span style="color: rgb(218, 165, 32); font-size: 12px;">
              ${new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <div style="color: rgb(251, 225, 183); font-size: 14px; line-height: 1.5;">${comment.content}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading comments:', error);
      container.innerHTML = '<div style="padding: 10px; color: #d32f2f;">Error loading comments</div>';
    }
  }

  /**
   * Add a comment
   */
  static async addComment(itemId) {
    const input = document.getElementById(`comment-input-${itemId}`);
    const commentText = input.value.trim();
    
    if (!commentText) {
      Messages.showError('Please enter a comment');
      return;
    }

    try {
      await SupabaseClient.addComment(itemId, commentText);
      
      input.value = '';
      
      const container = document.getElementById(`comments-${itemId}`);
      await this.loadComments(itemId, container);
      
      Messages.showSuccess('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      Messages.showError('Failed to add comment');
    }
  }

  /**
   * View collection in gallery
   */
  static viewCollection(collectionId) {
    const collection = this.collections.get(collectionId);
    if (!collection) return;
    
    const items = collection.items.map(item => 
      collection.type === 'skills' ? item.skill_data : item.item_data
    );
    
    GalleryModal.open(items, 0, {
      name: collection.name,
      description: collection.description,
      itemCount: collection.items.length
    });
  }

  /**
   * Load collection (for skill collections from database)
   */
  static async loadCollection(collectionId, type) {
    try {
      if (type === 'skills') {
        const collection = await SupabaseClient.getSkillCollection(collectionId);
        if (collection && collection.skills) {
          // Open gallery with skills
          GalleryModal.open(collection.skills, 0, {
            name: collection.name,
            description: collection.description,
            itemCount: collection.skills.length
          });
        }
      }
      // Add item collections support here when needed
    } catch (error) {
      console.error('Error loading collection:', error);
      Messages.showError('Failed to load collection');
    }
  }

  /**
   * Download collection
   */
  static downloadCollection(collectionId, type) {
    // Implementation for downloading collections
    Messages.showInfo('Download feature coming soon!');
  }

  /**
   * Update results count
   */
  static updateResultsCount(type, shown, total) {
    const countElement = type === 'items' ? this.itemsResultsCount : this.skillsResultsCount;
    if (countElement) {
      countElement.textContent = `Showing ${shown} of ${total} ${type}`;
    }
  }

  /**
   * Update no results display
   */
  static updateNoResults(type, show) {
    const noResultsElement = type === 'items' ? this.itemsNoResults : this.skillsNoResults;
    if (noResultsElement) {
      noResultsElement.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Show loading state
   */
  static showLoading(type, show) {
    const loadingElement = type === 'items' ? this.itemsLoading : this.skillsLoading;
    if (loadingElement) {
      loadingElement.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Show error message
   */
  static showError(message) {
    if (typeof Messages !== 'undefined') {
      Messages.showError(message);
    } else {
      console.error('Browse Error:', message);
    }
  }

  /**
   * Hide messages
   */
  static hideMessages(type) {
    this.updateNoResults(type, false);
  }
}

// Auto-initialize
BrowseManager.init();

// Make available globally
window.BrowseManager = BrowseManager;
