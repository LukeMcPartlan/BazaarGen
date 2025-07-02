/**
 * Enhanced Browse Page Controller with Skills Tab Support
 * Complete implementation for browsing both community items and skills
 * Save as: js/pages/enhanced-browse-js.js
 */
class EnhancedBrowsePageController {
  
  static allItems = [];
  static allSkills = [];
  static displayedItems = [];
  static displayedSkills = [];
  static collections = new Map();
  static skillCollections = new Map();
  static currentPage = 0;
  static currentSkillPage = 0;
  static ITEMS_PER_LOAD = 5;
  static isLoading = false;
  static isSkillsLoading = false;
  static isInitialized = false;
  static activeTab = 'items'; // 'items' or 'skills'

  /**
   * Initialize the enhanced browse page
   */
  static init() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Enhanced Browse Page Controller...');

    document.addEventListener('DOMContentLoaded', () => {
      this.setupTabSystem();
      this.setupDOMElements();
      this.setupEventListeners();
      this.initializeSupabase();
      this.isInitialized = true;
      console.log('✅ Enhanced Browse Page Controller initialized');
    });
  }

  /**
   * Setup tab system for items and skills
   */
  static setupTabSystem() {
    const pageHeader = document.querySelector('.page-header');
    if (!pageHeader) return;

    // Update page title and subtitle
    const pageTitle = pageHeader.querySelector('.page-title');
    const pageSubtitle = pageHeader.querySelector('.page-subtitle');
    
    if (pageTitle) pageTitle.textContent = 'Community Browser';
    if (pageSubtitle) pageSubtitle.textContent = 'Discover amazing items and skills from the BazaarGen community';

    // Create tab navigation
    const tabContainer = document.createElement('div');
    tabContainer.className = 'browse-tabs';
    tabContainer.style.cssText = `
      display: flex;
      justify-content: center;
      margin: 20px 0;
      gap: 10px;
    `;

    const itemsTab = this.createTab('items', '🃏 Items', true);
    const skillsTab = this.createTab('skills', '⚡ Skills', false);

    tabContainer.appendChild(itemsTab);
    tabContainer.appendChild(skillsTab);

    // Insert after page header
    pageHeader.parentNode.insertBefore(tabContainer, pageHeader.nextSibling);
  }

  /**
   * Create a tab button
   */
  static createTab(tabId, label, isActive) {
    const tab = document.createElement('button');
    tab.className = `browse-tab ${isActive ? 'active' : ''}`;
    tab.dataset.tab = tabId;
    tab.innerHTML = label;
    tab.style.cssText = `
      padding: 12px 24px;
      border: 2px solid rgb(218, 165, 32);
      background: ${isActive ? 'linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%)' : 'transparent'};
      color: ${isActive ? 'rgb(37, 26, 12)' : 'rgb(218, 165, 32)'};
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 16px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    tab.addEventListener('click', () => this.switchTab(tabId));
    
    tab.addEventListener('mouseenter', () => {
      if (!tab.classList.contains('active')) {
        tab.style.background = 'rgba(218, 165, 32, 0.1)';
      }
    });

    tab.addEventListener('mouseleave', () => {
      if (!tab.classList.contains('active')) {
        tab.style.background = 'transparent';
      }
    });

    return tab;
  }

  /**
   * Switch between tabs
   */
  static switchTab(tabId) {
    this.activeTab = tabId;
    console.log('🔄 Switching to tab:', tabId);

    // Update tab appearance
    document.querySelectorAll('.browse-tab').forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.style.background = isActive ? 
        'linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%)' : 
        'transparent';
      tab.style.color = isActive ? 'rgb(37, 26, 12)' : 'rgb(218, 165, 32)';
    });

    // Update controls panel for the active tab
    this.updateControlsForTab(tabId);

    // Clear and reload content
    if (this.itemsGrid) {
      this.itemsGrid.innerHTML = '';
    }

    if (tabId === 'items') {
      this.loadItems();
    } else if (tabId === 'skills') {
      this.loadSkills();
    }
  }

  /**
   * Update controls panel based on active tab
   */
  static updateControlsForTab(tabId) {
    if (tabId === 'items') {
      this.setupItemsControls();
    } else if (tabId === 'skills') {
      this.setupSkillsControls();
    }
  }

  /**
   * Setup controls for items tab
   */
  static setupItemsControls() {
    const controlsGrid = document.querySelector('.controls-grid');
    if (!controlsGrid) return;

    controlsGrid.innerHTML = `
      <div class="control-group">
        <label class="control-label">Sort By</label>
        <select id="sortBy" class="control-select">
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div class="control-group">
        <label class="control-label">Hero Filter</label>
        <select id="heroFilter" class="control-select">
          <option value="">All Heroes</option>
          <option value="Neutral">Neutral</option>
          <option value="Mak">Mak</option>
          <option value="Vanessa">Vanessa</option>
          <option value="Pyg">Pyg</option>
          <option value="Dooly">Dooly</option>
          <option value="Stelle">Stelle</option>
          <option value="Jules">Jules</option>
          <option value="Vampire">Vampire</option>
        </select>
      </div>

      <div class="control-group">
        <label class="control-label">Search Items</label>
        <input type="text" id="searchInput" class="control-input" placeholder="Search item names...">
      </div>

      <div class="control-group">
        <label class="control-label">Contest Filter</label>
        <select id="contestFilter" class="control-select">
          <option value="">All Items</option>
          <option value="0">General Items</option>
          <option value="1">Contest 1</option>
          <option value="2">Contest 2</option>
          <option value="3">Contest 3</option>
        </select>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup controls for skills tab
   */
  static setupSkillsControls() {
    const controlsGrid = document.querySelector('.controls-grid');
    if (!controlsGrid) return;

    controlsGrid.innerHTML = `
      <div class="control-group">
        <label class="control-label">Sort By</label>
        <select id="skillSortBy" class="control-select">
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
      </div>

      <div class="control-group">
        <label class="control-label">Rarity Filter</label>
        <select id="rarityFilter" class="control-select">
          <option value="">All Rarities</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="diamond">Diamond</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>

      <div class="control-group">
        <label class="control-label">Search Skills</label>
        <input type="text" id="skillSearchInput" class="control-input" placeholder="Search skill names...">
      </div>

      <div class="control-group">
        <label class="control-label">Effect Keywords</label>
        <input type="text" id="keywordFilter" class="control-input" placeholder="damage, heal, slow, etc.">
      </div>

      <div class="control-group">
        <label class="control-label">Creator Filter</label>
        <input type="text" id="creatorFilter" class="control-input" placeholder="Search by creator...">
      </div>

      <div class="control-group">
        <label class="control-label">Effect Length</label>
        <select id="lengthFilter" class="control-select">
          <option value="">Any Length</option>
          <option value="short">Short (< 100 chars)</option>
          <option value="medium">Medium (100-200 chars)</option>
          <option value="long">Long (> 200 chars)</option>
        </select>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup DOM element references
   */
  static setupDOMElements() {
    this.itemsGrid = document.getElementById('itemsGrid');
    this.loadMoreBtn = document.getElementById('loadMoreBtn');
    this.loadingMessage = document.getElementById('loadingMessage');
    this.errorMessage = document.getElementById('errorMessage');
    this.noResults = document.getElementById('noResults');
    this.totalItemsSpan = document.getElementById('totalItems');
    this.showingItemsSpan = document.getElementById('showingItems');
    this.loadingText = document.getElementById('loadingText');
    this.endMessage = document.getElementById('endMessage');
  }

  /**
   * Setup event listeners
   */
  static setupEventListeners() {
    // Remove existing listeners to prevent duplicates
    const existingElements = [
      'sortBy', 'heroFilter', 'searchInput', 'contestFilter',
      'skillSortBy', 'rarityFilter', 'skillSearchInput', 'keywordFilter', 
      'creatorFilter', 'lengthFilter'
    ];

    existingElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        // Clone to remove all event listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
      }
    });

    // Add new listeners
    this.addEventListenerIfExists('sortBy', 'change', () => this.handleFilterChange());
    this.addEventListenerIfExists('heroFilter', 'change', () => this.handleFilterChange());
    this.addEventListenerIfExists('contestFilter', 'change', () => this.handleFilterChange());
    this.addEventListenerIfExists('skillSortBy', 'change', () => this.handleFilterChange());
    this.addEventListenerIfExists('rarityFilter', 'change', () => this.handleFilterChange());
    this.addEventListenerIfExists('creatorFilter', 'input', () => this.handleFilterChange());
    this.addEventListenerIfExists('lengthFilter', 'change', () => this.handleFilterChange());

    // Debounced search inputs
    let searchTimeout, skillSearchTimeout, keywordTimeout;
    
    this.addEventListenerIfExists('searchInput', 'input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.handleFilterChange(), 500);
    });

    this.addEventListenerIfExists('skillSearchInput', 'input', () => {
      clearTimeout(skillSearchTimeout);
      skillSearchTimeout = setTimeout(() => this.handleFilterChange(), 500);
    });

    this.addEventListenerIfExists('keywordFilter', 'input', () => {
      clearTimeout(keywordTimeout);
      keywordTimeout = setTimeout(() => this.handleFilterChange(), 500);
    });

    // Load more button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreContent());
    }

    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
        if (this.activeTab === 'items' && !this.isLoading && this.displayedItems.length < this.allItems.length) {
          this.loadMoreItems();
        } else if (this.activeTab === 'skills' && !this.isSkillsLoading && this.displayedSkills.length < this.allSkills.length) {
          this.loadMoreSkills();
        }
      }
    });
  }

  /**
   * Helper to add event listener if element exists
   */
  static addEventListenerIfExists(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  /**
   * Initialize Supabase connection with retries
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

      if (SupabaseClient && SupabaseClient.isReady()) {
        const testResult = await SupabaseClient.testConnection();
        if (testResult.success) {
          console.log('✅ Database connected, loading initial content...');
          // Load initial content based on active tab
          if (this.activeTab === 'items') {
            this.loadItems();
          } else {
            this.loadSkills();
          }
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
   * Load skills from database with enhanced filtering
   */
  static async loadSkills() {
    if (this.isSkillsLoading) return;
    
    this.isSkillsLoading = true;
    this.showLoading(true);
    this.hideMessages();

    try {
      console.log('📚 Loading skills...');
      const filters = this.getSkillFilters();
      console.log('🔍 Skill filters:', filters);
      
      const skills = await SupabaseClient.loadSkills(filters);
      
      this.allSkills = skills || [];
      this.displayedSkills = [];
      this.currentSkillPage = 0;
      
      console.log(`📊 Loaded ${this.allSkills.length} skills`);
      
      // Detect and organize skill collections
      this.detectSkillCollections(this.allSkills);
      
      // Clear the grid before adding new items
      if (this.itemsGrid) {
        this.itemsGrid.innerHTML = '';
      }
      
      this.updateStats();
      this.isSkillsLoading = false;
      this.showLoading(false);
      
      // Force load initial skills
      this.loadMoreSkills();

    } catch (error) {
      console.error('❌ Error loading skills:', error);
      this.showError('Failed to load skills: ' + error.message);
      this.isSkillsLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Detect skill collections based on timing and metadata
   */
  static detectSkillCollections(skills) {
    console.log('🔍 Detecting skill collections from', skills.length, 'skills...');
    
    this.skillCollections.clear();
    
    // Group skills by creation time (within 2 minutes = likely same upload)
    const timeGroups = new Map();
    const TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds
    
    skills.forEach((skill, index) => {
      const createdTime = new Date(skill.created_at).getTime();
      const userEmail = skill.user_email;
      const groupKey = `${userEmail}_${Math.floor(createdTime / TIME_THRESHOLD)}`;
      
      if (!timeGroups.has(groupKey)) {
        timeGroups.set(groupKey, []);
      }
      
      timeGroups.get(groupKey).push({
        ...skill,
        originalIndex: index
      });
    });
    
    // Convert time groups to collections (only groups with 2+ skills)
    let collectionId = 0;
    timeGroups.forEach((groupSkills, groupKey) => {
      if (groupSkills.length > 1) {
        const collection = {
          id: `skill_collection_${collectionId++}`,
          name: `${groupSkills[0].user_alias || 'Unknown'}'s Skill Collection`,
          description: `${groupSkills.length} skills uploaded together`,
          skills: groupSkills,
          createdBy: groupSkills[0].user_alias || 'Unknown',
          createdAt: groupSkills[0].created_at,
          userEmail: groupSkills[0].user_email
        };
        
        this.skillCollections.set(collection.id, collection);
        
        // Mark each skill with its collection info
        groupSkills.forEach((skill, skillIndex) => {
          skill.collectionId = collection.id;
          skill.collectionIndex = skillIndex;
          skill.collectionTotal = groupSkills.length;
        });
        
        console.log(`📦 Detected skill collection: "${collection.name}" with ${groupSkills.length} skills`);
      }
    });
    
    console.log(`✅ Found ${this.skillCollections.size} skill collections`);
  }

  /**
   * Load more skills for display
   */
  static async loadMoreSkills() {
    if (this.isSkillsLoading || this.displayedSkills.length >= this.allSkills.length) {
      return;
    }

    const startIndex = this.displayedSkills.length;
    const endIndex = Math.min(startIndex + this.ITEMS_PER_LOAD, this.allSkills.length);
    const newSkills = this.allSkills.slice(startIndex, endIndex);

    console.log(`🔄 Loading skills ${startIndex + 1}-${endIndex} of ${this.allSkills.length}`);

    for (const skill of newSkills) {
      try {
        const skillCard = await this.createSkillCard(skill);
        if (skillCard && this.itemsGrid) {
          this.itemsGrid.appendChild(skillCard);
          this.displayedSkills.push(skill);
        }
      } catch (error) {
        console.error(`Failed to create skill card for skill ${skill.id}:`, error);
      }
    }

    this.updateStats();
    this.updateLoadMoreButton();
    
    // Force a check if we need to load more immediately
    if (this.displayedSkills.length < 20 && this.displayedSkills.length < this.allSkills.length) {
      setTimeout(() => this.loadMoreSkills(), 100);
    }
  }

  /**
   * Create skill card element using SkillGenerator
   */
  static async createSkillCard(skill) {
    if (!skill.skill_data) {
      console.warn(`Skill ${skill.id} has no skill_data`);
      return null;
    }

    try {
      // Create a wrapper div for the entire skill card section
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'skill-card-wrapper';
      cardWrapper.style.cssText = 'margin-bottom: 30px;';

      // Add collection indicator if skill is part of a collection
      if (skill.collectionId) {
        const collectionInfo = this.skillCollections.get(skill.collectionId);
        const collectionHeader = this.createSkillCollectionHeader(collectionInfo, skill);
        cardWrapper.appendChild(collectionHeader);
      }

      // Create creator info section
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

      const creatorAlias = skill.user_alias || 'Unknown Creator';
      const createdDate = new Date(skill.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Add skill stats to creator info
      const skillEffect = skill.skill_data.skillEffect || '';
      const rarityColor = this.getRarityColor(skill.skill_data.border || 'gold');

      creatorInfo.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="font-weight: 600; color: rgb(251, 225, 183);">
            <span style="color: rgb(218, 165, 32);">Created by:</span> ${creatorAlias}
          </span>
          <div style="display: flex; gap: 15px; font-size: 12px; color: rgb(201, 175, 133);">
            <span>📅 ${createdDate}</span>
            <span style="color: ${rarityColor};">💎 ${(skill.skill_data.border || 'gold').toUpperCase()}</span>
            <span>📝 ${skillEffect.length} chars</span>
          </div>
        </div>
      `;

      // Create the skill using SkillGenerator
      const skillData = {
        ...skill.skill_data,
        created_at: skill.created_at,
        creator_alias: creatorAlias,
        database_id: skill.id
      };

      let skillElement;
      if (typeof SkillGenerator !== 'undefined' && SkillGenerator.createSkill) {
        skillElement = await SkillGenerator.createSkill({
          data: skillData,
          mode: 'browser',
          includeControls: true,
          container: null // We'll append manually
        });
      } else {
        // Fallback if SkillGenerator is not available
        skillElement = this.createFallbackSkillCard(skillData);
      }

      // Add gallery functionality if part of collection
      if (skill.collectionId && typeof GalleryModal !== 'undefined') {
        const collection = this.skillCollections.get(skill.collectionId);
        if (collection) {
          GalleryModal.addGalleryButton(
            skillElement, 
            collection.skills.map(s => s.skill_data), 
            skill.collectionIndex
          );
        }
      }

      // Create comments section for skills (placeholder)
      const commentsSection = this.createSkillCommentsSection(skill.id);

      // Assemble the wrapper
      cardWrapper.appendChild(creatorInfo);
      cardWrapper.appendChild(skillElement);
      cardWrapper.appendChild(commentsSection);

      return cardWrapper;
    } catch (error) {
      console.error('Error creating skill card:', error);
      return null;
    }
  }

  /**
   * Create fallback skill card if SkillGenerator is not available
   */
  static createFallbackSkillCard(skillData) {
    const fallbackCard = document.createElement('div');
    fallbackCard.style.cssText = `
      background: linear-gradient(135deg, rgba(74, 60, 46, 0.9) 0%, rgba(37, 26, 12, 0.8) 100%);
      border: 2px solid rgb(218, 165, 32);
      border-radius: 8px;
      padding: 20px;
      color: rgb(251, 225, 183);
      min-width: 450px;
    `;

    fallbackCard.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="color: rgb(218, 165, 32); margin: 0 0 10px 0;">⚡ ${skillData.skillName || 'Unnamed Skill'}</h3>
        <div style="color: ${this.getRarityColor(skillData.border || 'gold')}; font-weight: bold; margin-bottom: 10px;">
          ${(skillData.border || 'gold').toUpperCase()} RARITY
        </div>
      </div>
      <div style="background: rgba(37, 26, 12, 0.7); padding: 15px; border-radius: 6px; border: 1px solid rgba(218, 165, 32, 0.3);">
        <div style="font-size: 14px; line-height: 1.5;">
          ${skillData.skillEffect || 'No effect description available.'}
        </div>
      </div>
      <div style="text-align: center; margin-top: 15px; font-size: 12px; color: rgb(201, 175, 133);">
        ⚠️ SkillGenerator not loaded - showing basic card
      </div>
    `;

    return fallbackCard;
  }

  /**
   * Create collection header for skills that are part of collections
   */
  static createSkillCollectionHeader(collection, currentSkill) {
    const header = document.createElement('div');
    header.className = 'skill-collection-header';
    header.style.cssText = `
      background: linear-gradient(135deg, rgb(138, 43, 226) 0%, rgb(106, 13, 173) 100%);
      color: white;
      padding: 10px 20px;
      border-radius: 8px 8px 0 0;
      margin-bottom: -2px;
      border: 2px solid rgb(138, 43, 226);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      min-width: 450px;
    `;

    const collectionInfo = document.createElement('div');
    collectionInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 2px;">
        ⚡ ${collection.name}
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        Skill ${currentSkill.collectionIndex + 1} of ${currentSkill.collectionTotal}
      </div>
    `;

    const galleryBtn = document.createElement('button');
    galleryBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s ease;
    `;
    galleryBtn.innerHTML = `🖼️ View Collection`;
    galleryBtn.title = `View all ${currentSkill.collectionTotal} skills in gallery`;

    galleryBtn.onmouseenter = () => {
      galleryBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    };

    galleryBtn.onmouseleave = () => {
      galleryBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    };

    galleryBtn.onclick = () => {
      if (typeof GalleryModal !== 'undefined') {
        GalleryModal.open(
          collection.skills.map(skill => skill.skill_data), 
          currentSkill.collectionIndex,
          {
            name: collection.name,
            description: collection.description,
            itemCount: collection.skills.length
          }
        );
      } else {
        alert(`Collection: ${collection.name}\n${collection.skills.length} skills\n\nGallery feature requires GalleryModal to be loaded.`);
      }
    };

    header.appendChild(collectionInfo);
    header.appendChild(galleryBtn);

    return header;
  }

  /**
   * Get rarity color for display
   */
  static getRarityColor(rarity) {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      diamond: '#B9F2FF',
      legendary: '#FF6B35'
    };
    return colors[rarity] || colors.gold;
  }

  /**
   * Create comments section for skills (placeholder)
   */
  static createSkillCommentsSection(skillId) {
    const commentsContainer = document.createElement('div');
    commentsContainer.className = 'skill-comments-section';
    commentsContainer.style.cssText = `
      background: linear-gradient(135deg, rgba(101, 84, 63, 0.95) 0%, rgba(89, 72, 51, 0.9) 100%);
      border: 2px solid rgb(218, 165, 32);
      border-radius: 0 0 12px 12px;
      padding: 20px;
      margin-top: -2px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      min-width: 450px;
      transition: width 0.3s ease;
    `;

    // Comments header
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    header.innerHTML = `
      <h4 style="margin: 0; color: rgb(251, 225, 183); font-size: 18px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">⚡ Skill Comments</h4>
      <button class="toggle-comments-btn" style="
        background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%) !important;
        border: 2px solid rgb(37, 26, 12) !important;
        padding: 6px 14px !important;
        border-radius: 6px !important;
        cursor: pointer;
        font-size: 12px !important;
        color: rgb(37, 26, 12) !important;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      ">Show/Hide</button>
    `;

    // Comments list placeholder
    const commentsList = document.createElement('div');
    commentsList.className = 'skill-comments-list';
    commentsList.innerHTML = `
      <div style="padding: 30px !important; text-align: center !important; color: rgb(201, 175, 133) !important; font-style: italic !important; background: rgba(37, 26, 12, 0.3) !important; border: 2px dashed rgba(218, 165, 32, 0.3) !important; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important;">
        💬 Skill comments feature coming soon!
      </div>
    `;

    // Comment form placeholder
    const commentForm = document.createElement('div');
    commentForm.innerHTML = `
      <div style="text-align: center !important; padding: 20px !important; color: rgb(251, 225, 183) !important; font-style: italic !important; background: linear-gradient(135deg, rgba(74, 60, 46, 0.5) 0%, rgba(89, 72, 51, 0.4) 100%) !important; border-radius: 8px !important; border: 2px dashed rgba(218, 165, 32, 0.5) !important; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important; border-top: 2px solid rgb(218, 165, 32); margin-top: 15px;">
        💬 Skill comments feature coming soon
      </div>
    `;

    // Toggle functionality
    const toggleBtn = header.querySelector('.toggle-comments-btn');
    toggleBtn.addEventListener('click', () => {
      const isHidden = commentsList.style.display === 'none';
      commentsList.style.display = isHidden ? 'block' : 'none';
      commentForm.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    commentsContainer.appendChild(header);
    commentsContainer.appendChild(commentsList);
    commentsContainer.appendChild(commentForm);

    return commentsContainer;
  }

  /**
   * Load more content based on active tab
   */
  static loadMoreContent() {
    if (this.activeTab === 'items') {
      this.loadMoreItems();
    } else if (this.activeTab === 'skills') {
      this.loadMoreSkills();
    }
  }

  /**
   * Get skill filter values
   */
  static getSkillFilters() {
    return {
      sortBy: document.getElementById('skillSortBy')?.value || 'recent',
      rarity: document.getElementById('rarityFilter')?.value || '',
      search: document.getElementById('skillSearchInput')?.value?.trim() || '',
      keywords: document.getElementById('keywordFilter')?.value?.trim() || '',
      creator: document.getElementById('creatorFilter')?.value?.trim() || '',
      length: document.getElementById('lengthFilter')?.value || ''
    };
  }

  /**
   * Get item filter values (existing functionality)
   */
  static getFilters() {
    return {
      sortBy: document.getElementById('sortBy')?.value || 'recent',
      hero: document.getElementById('heroFilter')?.value || '',
      search: document.getElementById('searchInput')?.value?.trim() || '',
      contest: document.getElementById('contestFilter')?.value || ''
    };
  }

  /**
   * Update statistics display
   */
  static updateStats() {
    if (this.activeTab === 'items') {
      if (this.totalItemsSpan) {
        this.totalItemsSpan.textContent = this.allItems.length;
      }
      if (this.showingItemsSpan) {
        this.showingItemsSpan.textContent = this.displayedItems.length;
      }
    } else if (this.activeTab === 'skills') {
      if (this.totalItemsSpan) {
        this.totalItemsSpan.textContent = this.allSkills.length;
      }
      if (this.showingItemsSpan) {
        this.showingItemsSpan.textContent = this.displayedSkills.length;
      }
    }
  }

  /**
   * Update load more button visibility
   */
  static updateLoadMoreButton() {
    const totalCount = this.activeTab === 'items' ? this.allItems.length : this.allSkills.length;
    const displayedCount = this.activeTab === 'items' ? this.displayedItems.length : this.displayedSkills.length;

    if (displayedCount >= totalCount) {
      if (this.loadMoreBtn) this.loadMoreBtn.style.display = 'none';
      if (this.endMessage) this.endMessage.style.display = displayedCount > 0 ? 'block' : 'none';
    } else {
      if (this.loadMoreBtn) this.loadMoreBtn.style.display = displayedCount > 0 ? 'block' : 'none';
      if (this.endMessage) this.endMessage.style.display = 'none';
    }

    if (totalCount === 0) {
      if (this.noResults) this.noResults.style.display = 'block';
    } else {
      if (this.noResults) this.noResults.style.display = 'none';
    }
  }

  /**
   * Show loading state
   */
  static showLoading(show) {
    if (this.loadingMessage) {
      this.loadingMessage.style.display = show ? 'block' : 'none';
    }
    if (this.loadingText) {
      this.loadingText.style.display = show ? 'inline' : 'none';
    }
  }

  /**
   * Show error message
   */
  static showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    }
  }

  /**
   * Hide messages
   */
  static hideMessages() {
    if (this.errorMessage) this.errorMessage.style.display = 'none';
    if (this.noResults) this.noResults.style.display = 'none';
  }

  /**
   * Handle filter changes
   */
  static handleFilterChange() {
    if (this.itemsGrid) {
      this.itemsGrid.innerHTML = '';
    }
    
    if (this.activeTab === 'items') {
      this.loadItems();
    } else if (this.activeTab === 'skills') {
      this.loadSkills();
    }
  }

  // ITEMS FUNCTIONALITY (All existing methods preserved)

  /**
   * Load items from database
   */
  static async loadItems() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);
    this.hideMessages();

    try {
      console.log('🃏 Loading items...');
      const filters = this.getFilters();
      const options = this.buildQueryOptions(filters);
      
      const data = await SupabaseClient.loadItems(options);
      
      this.allItems = data || [];
      this.displayedItems = [];
      this.currentPage = 0;
      
      console.log(`📊 Loaded ${this.allItems.length} items`);
      
      // Detect and organize collections
      this.detectCollections(this.allItems);
      
      // Clear the grid before adding new items
      if (this.itemsGrid) {
        this.itemsGrid.innerHTML = '';
      }
      
      this.updateStats();
      this.isLoading = false;
      this.showLoading(false);
      
      // Force load initial items
      this.loadMoreItems();

    } catch (error) {
      console.error('❌ Error loading items:', error);
      this.showError('Failed to load items: ' + error.message);
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Detect collections based on timing and metadata
   */
  static detectCollections(items) {
    console.log('🔍 Detecting collections from', items.length, 'items...');
    
    this.collections.clear();
    
    // Group items by creation time (within 2 minutes = likely same upload)
    const timeGroups = new Map();
    const TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds
    
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
    
    // Convert time groups to collections (only groups with 2+ items)
    let collectionId = 0;
    timeGroups.forEach((groupItems, groupKey) => {
      if (groupItems.length > 1) {
        const collection = {
          id: `collection_${collectionId++}`,
          name: `${groupItems[0].user_alias || 'Unknown'}'s Collection`,
          description: `${groupItems.length} items uploaded together`,
          items: groupItems,
          createdBy: groupItems[0].user_alias || 'Unknown',
          createdAt: groupItems[0].created_at,
          userEmail: groupItems[0].user_email
        };
        
        this.collections.set(collection.id, collection);
        
        // Mark each item with its collection info
        groupItems.forEach((item, itemIndex) => {
          item.collectionId = collection.id;
          item.collectionIndex = itemIndex;
          item.collectionTotal = groupItems.length;
        });
        
        console.log(`📦 Detected collection: "${collection.name}" with ${groupItems.length} items`);
      }
    });
    
    console.log(`✅ Found ${this.collections.size} collections`);
  }

  /**
   * Load more items for display with collection awareness
   */
  static async loadMoreItems() {
    if (this.isLoading || this.displayedItems.length >= this.allItems.length) {
      return;
    }

    const startIndex = this.displayedItems.length;
    const endIndex = Math.min(startIndex + this.ITEMS_PER_LOAD, this.allItems.length);
    const newItems = this.allItems.slice(startIndex, endIndex);

    console.log(`🔄 Loading items ${startIndex + 1}-${endIndex} of ${this.allItems.length}`);

    for (const item of newItems) {
      try {
        const itemCard = await this.createItemCard(item);
        if (itemCard && this.itemsGrid) {
          this.itemsGrid.appendChild(itemCard);
          this.displayedItems.push(item);
        }
      } catch (error) {
        console.error(`Failed to create card for item ${item.id}:`, error);
      }
    }

    this.updateStats();
    this.updateLoadMoreButton();
    
    // Force a check if we need to load more immediately
    if (this.displayedItems.length < 20 && this.displayedItems.length < this.allItems.length) {
      setTimeout(() => this.loadMoreItems(), 100);
    }
  }

  /**
   * Create item card element with gallery support
   */
  static async createItemCard(item) {
    if (!item.item_data) {
      console.warn(`Item ${item.id} has no item_data`);
      return null;
    }

    try {
      // Create a wrapper div for the entire card section
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'card-wrapper';
      cardWrapper.style.cssText = 'margin-bottom: 30px;';

      // Add collection indicator if item is part of a collection
      if (item.collectionId) {
        const collectionInfo = this.collections.get(item.collectionId);
        const collectionHeader = this.createCollectionHeader(collectionInfo, item);
        cardWrapper.appendChild(collectionHeader);
      }

      // Create creator info section
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

      // Create the card
      const cardData = item.item_data;
      cardData.created_at = item.created_at;
      cardData.creator_alias = creatorAlias;
      cardData.database_id = item.id;

      let cardElement;
      if (typeof CardGenerator !== 'undefined' && CardGenerator.createCard) {
        cardElement = await CardGenerator.createCard({
          data: cardData,
          mode: 'browser',
          includeControls: true
        });
      } else {
        // Fallback if CardGenerator is not available
        cardElement = this.createFallbackItemCard(cardData);
      }

      // Gallery functionality additions
      if (item.item_data?.isGallery && item.item_data?.galleryItems) {
        // This is a saved gallery - add gallery button to view it
        if (typeof GalleryModal !== 'undefined') {
          GalleryModal.addGalleryButton(
            cardElement,
            item.item_data.galleryItems,
            0
          );
        }
        
        // Add gallery indicator to the creator info
        const galleryIndicator = document.createElement('span');
        galleryIndicator.style.cssText = `
          background: rgb(63, 81, 181);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 10px;
        `;
        galleryIndicator.textContent = `📦 Gallery (${item.item_data.galleryItems.length} items)`;
        creatorInfo.firstElementChild.appendChild(galleryIndicator);
      }
      
      // Also check if item is part of a time-based collection
      else if (item.collectionId) {
        const collection = this.collections.get(item.collectionId);
        if (collection && typeof GalleryModal !== 'undefined') {
          GalleryModal.addGalleryButton(
            cardElement, 
            collection.items.map(i => i.item_data), 
            item.collectionIndex
          );
        }
      }

      // Create comments section
      const commentsSection = await this.createCommentsSection(item.id);

      // Assemble the wrapper
      cardWrapper.appendChild(creatorInfo);
      cardWrapper.appendChild(cardElement);
      cardWrapper.appendChild(commentsSection);

      return cardWrapper;
    } catch (error) {
      console.error('Error creating item card:', error);
      return null;
    }
  }

  /**
   * Create fallback item card if CardGenerator is not available
   */
  static createFallbackItemCard(cardData) {
    const fallbackCard = document.createElement('div');
    fallbackCard.style.cssText = `
      background: linear-gradient(135deg, rgba(74, 60, 46, 0.9) 0%, rgba(37, 26, 12, 0.8) 100%);
      border: 2px solid rgb(218, 165, 32);
      border-radius: 8px;
      padding: 20px;
      color: rgb(251, 225, 183);
      min-width: 450px;
    `;

    fallbackCard.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="color: rgb(218, 165, 32); margin: 0 0 10px 0;">🃏 ${cardData.itemName || 'Unnamed Item'}</h3>
        <div style="color: rgb(201, 175, 133); font-size: 14px;">${cardData.hero || 'Neutral'} Item</div>
      </div>
      <div style="background: rgba(37, 26, 12, 0.7); padding: 15px; border-radius: 6px; border: 1px solid rgba(218, 165, 32, 0.3);">
        <div style="font-size: 14px; line-height: 1.5;">
          ${cardData.passiveEffect || 'No description available.'}
        </div>
      </div>
      <div style="text-align: center; margin-top: 15px; font-size: 12px; color: rgb(201, 175, 133);">
        ⚠️ CardGenerator not loaded - showing basic card
      </div>
    `;

    return fallbackCard;
  }

  /**
   * Create collection header for items that are part of collections
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

    const collectionInfo = document.createElement('div');
    collectionInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 2px;">
        📦 ${collection.name}
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        Item ${currentItem.collectionIndex + 1} of ${currentItem.collectionTotal}
      </div>
    `;

    const galleryBtn = document.createElement('button');
    galleryBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s ease;
    `;
    galleryBtn.innerHTML = `🖼️ View Collection`;
    galleryBtn.title = `View all ${currentItem.collectionTotal} items in gallery`;

    galleryBtn.onmouseenter = () => {
      galleryBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    };

    galleryBtn.onmouseleave = () => {
      galleryBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    };

    galleryBtn.onclick = () => {
      if (typeof GalleryModal !== 'undefined') {
        GalleryModal.open(
          collection.items.map(item => item.item_data), 
          currentItem.collectionIndex,
          {
            name: collection.name,
            description: collection.description,
            itemCount: collection.items.length
          }
        );
      } else {
        alert(`Collection: ${collection.name}\n${collection.items.length} items\n\nGallery feature requires GalleryModal to be loaded.`);
      }
    };

    header.appendChild(collectionInfo);
    header.appendChild(galleryBtn);

    return header;
  }

  /**
   * Build query options from filters
   */
  static buildQueryOptions(filters) {
    const options = {
      sortBy: filters.sortBy
    };

    if (filters.hero) {
      options.hero = filters.hero;
    }

    if (filters.contest !== '') {
      options.contest = filters.contest;
    }

    if (filters.search) {
      options.search = filters.search;
    }

    return options;
  }

  /**
   * Create comments section for an item
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
      transition: width 0.3s ease;
    `;

    // Comments header
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    header.innerHTML = `
      <h4 style="margin: 0; color: rgb(251, 225, 183); font-size: 18px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">Comments</h4>
      <button class="toggle-comments-btn" style="
        background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%) !important;
        border: 2px solid rgb(37, 26, 12) !important;
        padding: 6px 14px !important;
        border-radius: 6px !important;
        cursor: pointer;
        font-size: 12px !important;
        color: rgb(37, 26, 12) !important;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
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
      background: rgba(37, 26, 12, 0.7) !important;
      border: 2px solid rgba(218, 165, 32, 0.3);
      border-radius: 8px;
      padding: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgb(218, 165, 32) rgba(37, 26, 12, 0.5);
    `;

    // Add comment form
    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    
    if (window.GoogleAuth && GoogleAuth.isSignedIn()) {
      commentForm.innerHTML = `
        <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 2px solid rgb(218, 165, 32); padding-top: 15px;">
          <input type="text" 
                 id="comment-input-${itemId}" 
                 placeholder="Add a comment..." 
                 style="flex: 1; padding: 10px 15px !important; border: 2px solid rgb(218, 165, 32) !important; border-radius: 6px !important; background-color: rgba(37, 26, 12, 0.8) !important; color: rgb(251, 225, 183) !important; font-size: 14px !important; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);">
          <button onclick="EnhancedBrowsePageController.addComment('${itemId}')" 
                  style="padding: 10px 20px !important; background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%) !important; color: rgb(37, 26, 12) !important; border: 2px solid rgb(37, 26, 12) !important; border-radius: 6px !important; cursor: pointer; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.3s ease; font-size: 14px !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);">
            Post
          </button>
        </div>
      `;
    } else {
      commentForm.innerHTML = `
        <div style="text-align: center !important; padding: 20px !important; color: rgb(251, 225, 183) !important; font-style: italic !important; background: linear-gradient(135deg, rgba(74, 60, 46, 0.5) 0%, rgba(89, 72, 51, 0.4) 100%) !important; border-radius: 8px !important; border: 2px dashed rgba(218, 165, 32, 0.5) !important; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important; border-top: 2px solid rgb(218, 165, 32); margin-top: 15px;">
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
      toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
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
        container.innerHTML = '<div style="padding: 30px !important; text-align: center !important; color: rgb(201, 175, 133) !important; font-style: italic !important; background: rgba(37, 26, 12, 0.3) !important; border: 2px dashed rgba(218, 165, 32, 0.3) !important; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important;">No comments yet</div>';
        return;
      }

      container.innerHTML = comments.map(comment => `
        <div style="padding: 12px !important; border-bottom: 1px solid rgba(218, 165, 32, 0.3) !important; background: linear-gradient(135deg, rgba(74, 60, 46, 0.7) 0%, rgba(89, 72, 51, 0.6) 100%) !important; margin-bottom: 8px !important; border-radius: 6px !important; transition: background 0.3s ease !important; border: 1px solid rgba(218, 165, 32, 0.2) !important;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong style="color: rgb(251, 225, 183) !important; font-size: 14px !important; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important;">${comment.user_alias}</strong>
            <span style="color: rgb(218, 165, 32) !important; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important; font-size: 12px;">
              ${new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <div style="color: rgb(251, 225, 183) !important; font-size: 14px !important; line-height: 1.5 !important; margin-top: 5px !important;">${comment.content}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading comments:', error);
      container.innerHTML = '<div style="padding: 10px; color: #d32f2f;">Error loading comments</div>';
    }
  }

  /**
   * Add a comment to an item
   */
  static async addComment(itemId) {
    const input = document.getElementById(`comment-input-${itemId}`);
    const commentText = input.value.trim();
    
    if (!commentText) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('Please enter a comment');
      } else {
        alert('Please enter a comment');
      }
      return;
    }

    try {
      await SupabaseClient.addComment(itemId, commentText);
      
      // Clear input
      input.value = '';
      
      // Reload comments
      const container = document.getElementById(`comments-${itemId}`);
      await this.loadComments(itemId, container);
      
      if (typeof Messages !== 'undefined') {
        Messages.showSuccess('Comment added!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to add comment');
      } else {
        alert('Failed to add comment: ' + error.message);
      }
    }
  }
}

// Auto-initialize and replace the original BrowsePageController
console.log('🚀 Enhanced Browse Page Controller loading...');
EnhancedBrowsePageController.init();

// Make available globally
window.BrowsePageController = EnhancedBrowsePageController;
window.EnhancedBrowsePageController = EnhancedBrowsePageController;

console.log('✅ Enhanced Browse Page Controller loaded successfully');