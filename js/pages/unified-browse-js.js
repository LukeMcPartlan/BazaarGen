/**
 * Unified Browse Page Controller - FIXED VERSION
 * Simplified controller for browsing items and skills without collection complexity
 */
class UnifiedBrowsePageController {
  
  static allItems = [];
  static allSkills = [];
  static displayedItems = [];
  static displayedSkills = [];
  static currentPage = 0;
  static currentSkillPage = 0;
  static ITEMS_PER_LOAD = 5;
  static isLoading = false;
  static isSkillsLoading = false;
  static isInitialized = false;
  static activeTab = 'items';

  /**
   * Initialize the browse page
   */
  static init() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Unified Browse Page Controller...');

    // Prevent multiple controllers from conflicting
    if (window.BrowsePageController && window.BrowsePageController !== this) {
      console.warn('⚠️ Replacing existing browse controller...');
    }
    if (window.EnhancedBrowsePageController) {
      console.warn('⚠️ Enhanced browse controller detected - will be overridden');
      window.EnhancedBrowsePageController = null;
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.setupTabSystem();
      this.setupDOMElements();
      this.setupEventListeners();
      this.initializeSupabase();
      this.isInitialized = true;
      console.log('✅ Unified Browse Page Controller initialized');
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

    // Remove existing tabs if any
    const existingTabs = document.querySelector('.browse-tabs');
    if (existingTabs) {
      existingTabs.remove();
    }

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
        <input type="text" id="skillSearchInput" class="control-input" placeholder="Search skills...">
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
          <option value="short">Short (≤100 chars)</option>
          <option value="medium">Medium (100-200 chars)</option>
          <option value="long">Long (200+ chars)</option>
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

      if (SupabaseClient && SupabaseClient.isReady()) {
        const testResult = await SupabaseClient.testConnection();
        if (testResult.success) {
          console.log('✅ Database connected, loading initial content...');
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
      
      if (this.itemsGrid) {
        this.itemsGrid.innerHTML = '';
      }
      
      this.updateStats();
      this.isLoading = false;
      this.showLoading(false);
      
      this.loadMoreItems();

    } catch (error) {
      console.error('❌ Error loading items:', error);
      this.showError('Failed to load items: ' + error.message);
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Load skills from database - FIXED VERSION
   */
  static async loadSkills() {
    if (this.isSkillsLoading) return;
    
    this.isSkillsLoading = true;
    this.showLoading(true);
    this.hideMessages();

    try {
      console.log('⚡ Loading skills...');
      const filters = this.getSkillFilters();
      console.log('🔍 Skill filters:', filters);
      
      // Use the unified SupabaseClient.loadSkills method
      const skills = await SupabaseClient.loadSkills(filters);
      
      this.allSkills = skills || [];
      this.displayedSkills = [];
      this.currentSkillPage = 0;
      
      console.log(`📊 Loaded ${this.allSkills.length} skills`);
      
      if (this.itemsGrid) {
        this.itemsGrid.innerHTML = '';
      }
      
      this.updateStats();
      this.isSkillsLoading = false;
      this.showLoading(false);
      
      this.loadMoreSkills();

    } catch (error) {
      console.error('❌ Error loading skills:', error);
      this.showError('Failed to load skills: ' + error.message);
      this.isSkillsLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Load more items for display
   */
  static async loadMoreItems() {
    if (this.isLoading || this.displayedItems.length >= this.allItems.length) {
      this.updateLoadMoreButton();
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
  }

  /**
   * Load more skills for display - FIXED VERSION
   */
  static async loadMoreSkills() {
    if (this.isSkillsLoading || this.displayedSkills.length >= this.allSkills.length) {
      this.updateLoadMoreButton();
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
  }

  /**
 * Complete createItemCard method with gallery functionality
 * Replace the existing createItemCard method in UnifiedBrowsePageController with this one
 */
static async createItemCard(item) {
  if (!item.item_data) {
    console.warn(`Item ${item.id} has no item_data`);
    return null;
  }

  try {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-wrapper';
    cardWrapper.style.cssText = 'margin-bottom: 30px;';

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
      cardElement = this.createFallbackItemCard(cardData);
    }

    // *** GALLERY FUNCTIONALITY - ADDED FROM PROFILE CONTROLLER ***
    if (item.item_data?.isGallery && item.item_data?.galleryItems) {
      console.log('🖼️ Adding gallery functionality for item:', item.id);
      console.log('Gallery items count:', item.item_data.galleryItems.length);
      
      // Add gallery button to view it
      if (typeof GalleryModal !== 'undefined') {
        try {
          GalleryModal.addGalleryButton(
            cardElement,
            item.item_data.galleryItems,
            0
          );
          console.log('✅ Gallery button added successfully');
        } catch (galleryError) {
          console.error('❌ Error adding gallery button:', galleryError);
        }
      } else {
        console.log('❌ GalleryModal not available');
      }
      
      // Style the card differently to show it's a gallery
      const passiveSection = cardElement.querySelector('.passive-section');
      if (passiveSection) {
        passiveSection.style.background = 'linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(48, 63, 159, 0.1) 100%)';
        passiveSection.style.borderColor = 'rgb(63, 81, 181)';
        console.log('✅ Gallery styling applied to passive section');
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
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      `;
      galleryIndicator.textContent = `📦 Gallery (${item.item_data.galleryItems.length} items)`;
      
      // Add the gallery indicator to the creator info
      const creatorSpan = creatorInfo.querySelector('span');
      if (creatorSpan) {
        creatorSpan.appendChild(galleryIndicator);
        console.log('✅ Gallery indicator added to creator info');
      }
      
      // Also add gallery styling to the main card wrapper for extra distinction
      cardWrapper.style.border = '2px solid rgb(63, 81, 181)';
      cardWrapper.style.boxShadow = '0 4px 15px rgba(63, 81, 181, 0.3)';
      cardWrapper.style.borderRadius = '12px';
      cardWrapper.style.overflow = 'hidden';
      
      console.log('✅ Gallery card styling completed');
    }

    // Create comments section
    const commentsSection = await this.createCommentsSection(item.id);

    // Assemble the card wrapper
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
   * Create skill card element - SIMPLIFIED VERSION (no collections)
   */
  static async createSkillCard(skill) {
    if (!skill.skill_data) {
      console.warn(`Skill ${skill.id} has no skill_data`);
      return null;
    }

    try {
      console.log('Creating skill card for:', skill.skill_data.skillName);
      
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'skill-card-wrapper';
      cardWrapper.style.cssText = 'margin-bottom: 30px;';

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
        try {
          skillElement = await SkillGenerator.createSkill({
            data: skillData,
            mode: 'browser',
            includeControls: false, // Disable controls in browser mode
            container: null
          });
          console.log('✅ Skill card created with SkillGenerator');
        } catch (skillGenError) {
          console.warn('SkillGenerator failed, using fallback:', skillGenError);
          skillElement = this.createFallbackSkillCard(skillData);
        }
      } else {
        console.warn('SkillGenerator not available, using fallback');
        skillElement = this.createFallbackSkillCard(skillData);
      }
      // *** SKILL GALLERY FUNCTIONALITY - ADDED FOR SKILL GALLERIES ***
if (skill.skill_data?.isGallery && skill.skill_data?.galleryItems) {
  console.log('🎭 Adding gallery functionality for skill:', skill.id);
  console.log('Gallery skills count:', skill.skill_data.galleryItems.length);
  
  // Add gallery button to view the full collection
  if (typeof GalleryModal !== 'undefined') {
    try {
      GalleryModal.addGalleryButton(
        skillElement,
        skill.skill_data.galleryItems,
        0
      );
      console.log('✅ Gallery button added to skill successfully');
    } catch (galleryError) {
      console.error('❌ Error adding gallery button to skill:', galleryError);
    }
  } else {
    console.log('❌ GalleryModal not available for skill');
  }
  
  // Style the skill card differently to show it's a gallery
  const skillHeader = skillElement.querySelector('.skill-header');
  if (skillHeader) {
    skillHeader.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.3) 0%, rgba(106, 13, 173, 0.2) 100%)';
    skillHeader.style.borderColor = 'rgb(138, 43, 226)';
    console.log('✅ Gallery styling applied to skill header');
  }
  
  // Also style the effect section for galleries
  const skillEffect = skillElement.querySelector('.skill-effect');
  if (skillEffect) {
    skillEffect.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(106, 13, 173, 0.1) 100%)';
    skillEffect.style.borderColor = 'rgb(138, 43, 226)';
    console.log('✅ Gallery styling applied to skill effect');
  }
  
  // Add gallery indicator to the creator info
  const galleryIndicator = document.createElement('span');
  galleryIndicator.style.cssText = `
    background: rgb(138, 43, 226);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-left: 10px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `;
  galleryIndicator.textContent = `🎭 Gallery (${skill.skill_data.galleryItems.length} skills)`;
  
  // Add the gallery indicator to the creator info
  const creatorSpan = creatorInfo.querySelector('span');
  if (creatorSpan) {
    creatorSpan.appendChild(galleryIndicator);
    console.log('✅ Gallery indicator added to creator info');
  }
  
  // Also add gallery styling to the main card wrapper for extra distinction
  cardWrapper.style.border = '2px solid rgb(138, 43, 226)';
  cardWrapper.style.boxShadow = '0 4px 15px rgba(138, 43, 226, 0.3)';
  cardWrapper.style.borderRadius = '12px';
  cardWrapper.style.overflow = 'hidden';
  
  console.log('✅ Skill gallery card styling completed');
}

      // Create comments section
      const commentsSection = this.createSkillCommentsSection(skill.id);

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
   * Create fallback item card
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
   * Create fallback skill card - IMPROVED VERSION
   */
  static createFallbackSkillCard(skillData) {
    const fallbackCard = document.createElement('div');
    fallbackCard.className = 'skill-card-fallback';
    fallbackCard.style.cssText = `
      background: linear-gradient(135deg, rgba(74, 60, 46, 0.9) 0%, rgba(37, 26, 12, 0.8) 100%);
      border: 2px solid ${this.getRarityColor(skillData.border || 'gold')};
      border-radius: 12px;
      padding: 0;
      color: rgb(251, 225, 183);
      min-width: 450px;
      max-width: 500px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    `;

    // Create header section
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      background: linear-gradient(135deg, ${this.getRarityColor(skillData.border || 'gold')} 0%, rgba(0, 0, 0, 0.2) 100%);
      padding: 15px 20px;
      text-align: center;
      border-bottom: 2px solid ${this.getRarityColor(skillData.border || 'gold')};
    `;
    
    headerSection.innerHTML = `
      <h3 style="color: white; margin: 0 0 8px 0; font-size: 18px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);">
        ⚡ ${skillData.skillName || 'Unnamed Skill'}
      </h3>
      <div style="color: rgba(255, 255, 255, 0.9); font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ${(skillData.border || 'gold')} RARITY
      </div>
    `;

    // Create effect section
    const effectSection = document.createElement('div');
    effectSection.style.cssText = `
      padding: 20px;
      background: rgba(37, 26, 12, 0.8);
    `;

    // Process keywords if KeywordProcessor is available
    let processedEffect = skillData.skillEffect || 'No effect description available.';
    if (typeof KeywordProcessor !== 'undefined' && KeywordProcessor.processKeywordText) {
      try {
        processedEffect = KeywordProcessor.processKeywordText(processedEffect);
      } catch (error) {
        console.warn('KeywordProcessor failed:', error);
      }
    }

    effectSection.innerHTML = `
      <div style="font-size: 14px; line-height: 1.6; color: rgb(251, 225, 183);">
        ${processedEffect}
      </div>
    `;

    // Create footer section
    const footerSection = document.createElement('div');
    footerSection.style.cssText = `
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.3);
      text-align: center;
      font-size: 12px;
      color: rgb(201, 175, 133);
      font-style: italic;
      border-top: 1px solid rgba(218, 165, 32, 0.3);
    `;
    footerSection.textContent = '⚠️ SkillGenerator not loaded - showing enhanced fallback';

    fallbackCard.appendChild(headerSection);
    fallbackCard.appendChild(effectSection);
    fallbackCard.appendChild(footerSection);

    return fallbackCard;
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
   * Create comments section for skills
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
    `;

    commentsContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0; color: rgb(251, 225, 183); font-size: 18px;">⚡ Skill Comments</h4>
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
      </div>
      <div style="padding: 30px; text-align: center; color: rgb(201, 175, 133); font-style: italic;">
        💬 Skill comments feature coming soon!
      </div>
    `;

    return commentsContainer;
  }

  /**
   * Create comments section for items
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

    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    
    if (window.GoogleAuth && GoogleAuth.isSignedIn()) {
      commentForm.innerHTML = `
        <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 2px solid rgb(218, 165, 32); padding-top: 15px;">
          <input type="text" 
                 id="comment-input-${itemId}" 
                 placeholder="Add a comment..." 
                 style="flex: 1; padding: 10px 15px; border: 2px solid rgb(218, 165, 32); border-radius: 6px; background-color: rgba(37, 26, 12, 0.8); color: rgb(251, 225, 183); font-size: 14px;">
          <button onclick="UnifiedBrowsePageController.addComment('${itemId}')" 
                  style="padding: 10px 20px; background: linear-gradient(135deg, rgb(218, 165, 32) 0%, rgb(184, 134, 11) 100%); color: rgb(37, 26, 12); border: 2px solid rgb(37, 26, 12); border-radius: 6px; cursor: pointer; font-weight: bold;">
            Post
          </button>
        </div>
      `;
    } else {
      commentForm.innerHTML = `
        <div style="text-align: center; padding: 20px; color: rgb(251, 225, 183); font-style: italic;">
          Sign in to comment
        </div>
      `;
    }

    await this.loadComments(itemId, commentsList);

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
        container.innerHTML = '<div style="padding: 30px; text-align: center; color: rgb(201, 175, 133); font-style: italic;">No comments yet</div>';
        return;
      }

      container.innerHTML = comments.map(comment => `
        <div style="padding: 12px; border-bottom: 1px solid rgba(218, 165, 32, 0.3); background: linear-gradient(135deg, rgba(74, 60, 46, 0.7) 0%, rgba(89, 72, 51, 0.6) 100%); margin-bottom: 8px; border-radius: 6px;">
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
      
      input.value = '';
      
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
   * Get item filter values
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
   * Build query options from filters
   */
  static buildQueryOptions(filters) {
    const options = {
      sortBy: filters.sortBy
    };

    if (filters.hero) options.hero = filters.hero;
    if (filters.contest !== '') options.contest = filters.contest;
    if (filters.search) options.search = filters.search;

    return options;
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
    let totalCount, displayedCount;
    
    if (this.activeTab === 'items') {
      totalCount = this.allItems.length;
      displayedCount = this.displayedItems.length;
    } else {
      totalCount = this.allSkills.length;
      displayedCount = this.displayedSkills.length;
    }

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
}

// PREVENT CONFLICTS - Force override any existing controllers
if (window.EnhancedBrowsePageController) {
  console.warn('🔄 Overriding EnhancedBrowsePageController with UnifiedBrowsePageController');
  window.EnhancedBrowsePageController = null;
}

// Auto-initialize and replace the original controller
console.log('🚀 Unified Browse Page Controller (FIXED) loading...');
UnifiedBrowsePageController.init();

// Make available globally
window.BrowsePageController = UnifiedBrowsePageController;
window.UnifiedBrowsePageController = UnifiedBrowsePageController;

console.log('✅ Unified Browse Page Controller (FIXED) loaded successfully');
