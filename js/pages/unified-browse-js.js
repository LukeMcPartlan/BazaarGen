/**
 * Unified Browse Page Controller - FIXED VERSION
 * Simplified controller for browsing items and skills without collection complexity
 */
class UnifiedBrowsePageController {
  static currentItemsController = null;
  static currentSkillsController = null;
  
  static allItems = [];
  static allSkills = [];
  static displayedItems = [];
  static displayedSkills = [];
  static currentPage = 0;
  static currentSkillPage = 0;
  static ITEMS_PER_LOAD = 12;
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

    // Add profile tab only if user is signed in
    if (GoogleAuth && GoogleAuth.isSignedIn()) {
      const profileTab = this.createTab('profile', '👤 Profile', false);
      tabContainer.appendChild(profileTab);
    }

    pageHeader.parentNode.insertBefore(tabContainer, pageHeader.nextSibling);
  }

  /**
   * Update tabs when authentication status changes
   */
  static updateTabsForAuthStatus() {
    const pageHeader = document.querySelector('.page-header');
    if (!pageHeader) return;

    // Remove existing tabs
    const existingTabs = document.querySelector('.browse-tabs');
    if (existingTabs) {
      existingTabs.remove();
    }

    // Recreate tabs with current auth status
    this.setupTabSystem();
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

    // *** CANCEL ANY ONGOING REQUESTS ***
    if (this.currentItemsController) {
      this.currentItemsController.abort();
      this.currentItemsController = null;
      this.isLoading = false;
    }
    
    if (this.currentSkillsController) {
      this.currentSkillsController.abort();
      this.currentSkillsController = null;
      this.isSkillsLoading = false;
    }

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
    } else if (tabId === 'profile') {
      // Redirect to profile page
      console.log('🔄 Redirecting to profile page...');
      window.location.href = 'profile.html';
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
   * Setup comprehensive controls for items tab
   */
  static setupItemsControls() {
    const controlsGrid = document.querySelector('.controls-grid');
    if (!controlsGrid) return;

    controlsGrid.innerHTML = `
      <!-- Sort Options -->
      <div class="control-group">
        <label class="control-label">Sort By</label>
        <select id="sortBy" class="control-select">
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="upvotes_desc">Most Upvoted</option>
          <option value="upvotes_asc">Least Upvoted</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="creator_asc">Creator A-Z</option>
          <option value="creator_desc">Creator Z-A</option>
        </select>
      </div>

      <!-- Hero Filter -->
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

      <!-- Item Size Filter -->
      <div class="control-group">
        <label class="control-label">Item Size</label>
        <select id="sizeFilter" class="control-select">
          <option value="">All Sizes</option>
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
        </select>
      </div>

      <!-- Border/Rarity Filter -->
      <div class="control-group">
        <label class="control-label">Border/Rarity</label>
        <select id="borderFilter" class="control-select">
          <option value="">All Borders</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="diamond">Diamond</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>

      <!-- Upvote Range -->
      <div class="control-group">
        <label class="control-label">Min Upvotes</label>
        <input type="number" id="minUpvotes" class="control-input" placeholder="0" min="0">
      </div>

      <div class="control-group">
        <label class="control-label">Max Upvotes</label>
        <input type="number" id="maxUpvotes" class="control-input" placeholder="∞" min="0">
      </div>

      <!-- Search Options -->
      <div class="control-group">
        <label class="control-label">Search Items</label>
        <input type="text" id="searchInput" class="control-input" placeholder="Search item names...">
      </div>

      <!-- Tag Filter -->
      <div class="control-group">
        <label class="control-label">Tags (comma separated)</label>
        <input type="text" id="tagFilter" class="control-input" placeholder="Weapon, Armor, etc.">
      </div>

      <!-- Keyword Filter -->
      <div class="control-group">
        <label class="control-label">Effect Keywords</label>
        <input type="text" id="keywordFilter" class="control-input" placeholder="damage, heal, slow, etc.">
      </div>

      <!-- Creator Filter -->
      <div class="control-group">
        <label class="control-label">Creator</label>
        <input type="text" id="creatorFilter" class="control-input" placeholder="Search by creator...">
      </div>

      <!-- Contest Filter -->
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

      <!-- Gallery Filter -->
      <div class="control-group">
        <label class="control-label">Item Type</label>
        <select id="itemTypeFilter" class="control-select">
          <option value="">All Types</option>
          <option value="single">Single Items</option>
          <option value="gallery">Galleries</option>
        </select>
      </div>

      <!-- Date Range -->
      <div class="control-group">
        <label class="control-label">Created After</label>
        <input type="date" id="dateFrom" class="control-input">
      </div>

      <div class="control-group">
        <label class="control-label">Created Before</label>
        <input type="date" id="dateTo" class="control-input">
      </div>

      <!-- Filter Actions -->
      <div class="filter-actions">
        <button id="applyFilters" class="filter-btn apply">
          🔍 Apply Filters
        </button>
        <button id="clearFilters" class="filter-btn clear">
          🗑️ Clear All
        </button>
      </div>
    `;

    // Show filters by default
    controlsGrid.style.display = 'none';
    
    this.setupEventListeners();
  }

  /**
   * Setup comprehensive controls for skills tab
   */
  static setupSkillsControls() {
    const controlsGrid = document.querySelector('.controls-grid');
    if (!controlsGrid) return;

    controlsGrid.innerHTML = `
      <!-- Sort Options -->
      <div class="control-group">
        <label class="control-label">Sort By</label>
        <select id="skillSortBy" class="control-select">
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="upvotes_desc">Most Upvoted</option>
          <option value="upvotes_asc">Least Upvoted</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="creator_asc">Creator A-Z</option>
          <option value="creator_desc">Creator Z-A</option>
          <option value="rarity_asc">Rarity (Low to High)</option>
          <option value="rarity_desc">Rarity (High to Low)</option>
        </select>
      </div>

      <!-- Rarity Filter -->
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

      <!-- Upvote Range -->
      <div class="control-group">
        <label class="control-label">Min Upvotes</label>
        <input type="number" id="skillMinUpvotes" class="control-input" placeholder="0" min="0">
      </div>

      <div class="control-group">
        <label class="control-label">Max Upvotes</label>
        <input type="number" id="skillMaxUpvotes" class="control-input" placeholder="∞" min="0">
      </div>

      <!-- Search Options -->
      <div class="control-group">
        <label class="control-label">Search Skills</label>
        <input type="text" id="skillSearchInput" class="control-input" placeholder="Search skill names...">
      </div>

      <!-- Effect Keywords -->
      <div class="control-group">
        <label class="control-label">Effect Keywords</label>
        <input type="text" id="skillKeywordFilter" class="control-input" placeholder="damage, heal, slow, etc.">
      </div>

      <!-- Creator Filter -->
      <div class="control-group">
        <label class="control-label">Creator</label>
        <input type="text" id="skillCreatorFilter" class="control-input" placeholder="Search by creator...">
      </div>

      <!-- Effect Length -->
      <div class="control-group">
        <label class="control-label">Effect Length</label>
        <select id="lengthFilter" class="control-select">
          <option value="">Any Length</option>
          <option value="short">Short (≤100 chars)</option>
          <option value="medium">Medium (100-200 chars)</option>
          <option value="long">Long (200+ chars)</option>
        </select>
      </div>

      <!-- Skill Type Filter -->
      <div class="control-group">
        <label class="control-label">Skill Type</label>
        <select id="skillTypeFilter" class="control-select">
          <option value="">All Types</option>
          <option value="attack">Attack Skills</option>
          <option value="defense">Defense Skills</option>
          <option value="utility">Utility Skills</option>
          <option value="healing">Healing Skills</option>
          <option value="buff">Buff Skills</option>
          <option value="debuff">Debuff Skills</option>
        </select>
      </div>

      <!-- Effect Categories -->
      <div class="control-group">
        <label class="control-label">Effect Categories</label>
        <select id="effectCategoryFilter" class="control-select">
          <option value="">All Categories</option>
          <option value="damage">Damage</option>
          <option value="heal">Healing</option>
          <option value="buff">Buffs</option>
          <option value="debuff">Debuffs</option>
          <option value="control">Control</option>
          <option value="utility">Utility</option>
        </select>
      </div>

      <!-- Date Range -->
      <div class="control-group">
        <label class="control-label">Created After</label>
        <input type="date" id="skillDateFrom" class="control-input">
      </div>

      <div class="control-group">
        <label class="control-label">Created Before</label>
        <input type="date" id="skillDateTo" class="control-input">
      </div>

      <!-- Filter Actions -->
      <div class="filter-actions">
        <button id="applySkillFilters" class="filter-btn apply">
          🔍 Apply Filters
        </button>
        <button id="clearSkillFilters" class="filter-btn clear">
          🗑️ Clear All
        </button>
      </div>
    `;

    // Show filters by default
    controlsGrid.style.display = 'none';
    
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
   * Setup comprehensive event listeners
   */
  static setupEventListeners() {
    // Load more button
    this.addEventListenerIfExists('loadMoreBtn', 'click', () => {
      if (this.activeTab === 'items') {
        this.loadMoreItems();
      } else if (this.activeTab === 'skills') {
        this.loadMoreSkills();
      }
    });

    // Item filter event listeners
    const itemFilterElements = [
      'sortBy', 'heroFilter', 'sizeFilter', 'borderFilter', 'minUpvotes', 'maxUpvotes',
      'searchInput', 'tagFilter', 'keywordFilter', 'creatorFilter', 'contestFilter',
      'itemTypeFilter', 'dateFrom', 'dateTo'
    ];

    itemFilterElements.forEach(elementId => {
      this.addEventListenerIfExists(elementId, 'change', () => this.handleFilterChange());
      this.addEventListenerIfExists(elementId, 'input', () => this.handleFilterChange());
    });

    // Skill filter event listeners
    const skillFilterElements = [
      'skillSortBy', 'rarityFilter', 'skillMinUpvotes', 'skillMaxUpvotes',
      'skillSearchInput', 'skillKeywordFilter', 'skillCreatorFilter', 'lengthFilter',
      'skillTypeFilter', 'effectCategoryFilter', 'skillDateFrom', 'skillDateTo'
    ];

    skillFilterElements.forEach(elementId => {
      this.addEventListenerIfExists(elementId, 'change', () => this.handleFilterChange());
      this.addEventListenerIfExists(elementId, 'input', () => this.handleFilterChange());
    });

    // Filter action buttons
    this.addEventListenerIfExists('applyFilters', 'click', () => this.handleFilterChange());
    this.addEventListenerIfExists('clearFilters', 'click', () => this.clearAllFilters());
    this.addEventListenerIfExists('toggleFiltersBtn', 'click', () => this.toggleFilters());
    
    this.addEventListenerIfExists('applySkillFilters', 'click', () => this.handleFilterChange());
    this.addEventListenerIfExists('clearSkillFilters', 'click', () => this.clearAllFilters());

    // Debounced search for better performance
    let searchTimeout;
    const debouncedSearch = (callback) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(callback, 300);
    };

    // Add debounced search for text inputs
    ['searchInput', 'tagFilter', 'keywordFilter', 'creatorFilter', 
     'skillSearchInput', 'skillKeywordFilter', 'skillCreatorFilter'].forEach(elementId => {
      this.addEventListenerIfExists(elementId, 'input', () => {
        debouncedSearch(() => this.handleFilterChange());
      });
    });

    // Authentication status monitoring
    if (window.GoogleAuth) {
      window.addEventListener('userSignedIn', () => {
        this.updateTabsForAuthStatus();
        this.updateMainNavigation();
      });

      window.addEventListener('userSignedOut', () => {
        this.updateTabsForAuthStatus();
        this.updateMainNavigation();
      });

      // Check auth status periodically
      const checkAuthStatus = () => {
        if (GoogleAuth.isSignedIn()) {
          this.updateTabsForAuthStatus();
          this.updateMainNavigation();
        }
      };

      // Check immediately and then every 5 seconds
      checkAuthStatus();
      setInterval(checkAuthStatus, 5000);
    }
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
          
          // Wait for user profile to be loaded from database
          if (GoogleAuth && GoogleAuth.isSignedIn()) {
            await this.waitForUserProfile();
            
            // Update tabs for current auth status
            this.updateTabsForAuthStatus();
            
            // Update main navigation
            this.updateMainNavigation();
            
            // Update user display in navigation bar
            if (GoogleAuth && GoogleAuth.updateUserDisplay) {
              console.log('👤 Updating user display in navigation...');
              GoogleAuth.updateUserDisplay();
            }
          } else {
            console.log('👤 User not signed in, skipping profile loading');
            // Still update main navigation to ensure profile tab is hidden
            this.updateMainNavigation();
          }
          
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
   * Load items with comprehensive filtering
   */
  static async loadItems() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);
    this.hideMessages();

    try {
      // Get all items from database
      const items = await SupabaseClient.getAllItems();
      this.allItems = items || [];

      // Apply comprehensive filtering
      const filters = this.getFilters();
      this.displayedItems = this.applyItemFilters(this.allItems, filters);

      // Reset pagination
      this.currentPage = 0;
      
      // Display first page
      await this.displayItemsPage(0);
      
      this.updateStats();
      this.updateLoadMoreButton();
      
    } catch (error) {
      console.error('Error loading items:', error);
      this.showError('Failed to load items. Please try again.');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Display a specific page of items
   */
  static async displayItemsPage(page) {
    const startIndex = page * this.ITEMS_PER_LOAD;
    const endIndex = startIndex + this.ITEMS_PER_LOAD;
    const pageItems = this.displayedItems.slice(startIndex, endIndex);

    if (page === 0) {
      this.itemsGrid.innerHTML = '';
    }

    for (const item of pageItems) {
      const card = await this.createItemCard(item);
      if (card) {
        this.itemsGrid.appendChild(card);
      }
    }
  }

  /**
   * Load skills with comprehensive filtering
   */
  static async loadSkills() {
    if (this.isSkillsLoading) return;
    
    this.isSkillsLoading = true;
    this.showLoading(true);
    this.hideMessages();

    try {
      // Get all skills from database
      const skills = await SupabaseClient.getAllSkills();
      this.allSkills = skills || [];

      // Apply comprehensive filtering
      const filters = this.getSkillFilters();
      this.displayedSkills = this.applySkillFilters(this.allSkills, filters);

      // Reset pagination
      this.currentSkillPage = 0;
      
      // Display first page
      await this.displaySkillsPage(0);
      
      this.updateStats();
      this.updateLoadMoreButton();
      
    } catch (error) {
      console.error('Error loading skills:', error);
      this.showError('Failed to load skills. Please try again.');
    } finally {
      this.isSkillsLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Display a specific page of skills
   */
  static async displaySkillsPage(page) {
    const startIndex = page * this.ITEMS_PER_LOAD;
    const endIndex = startIndex + this.ITEMS_PER_LOAD;
    const pageSkills = this.displayedSkills.slice(startIndex, endIndex);

    if (page === 0) {
      this.itemsGrid.innerHTML = '';
    }

    for (const skill of pageSkills) {
      const card = await this.createSkillCard(skill);
      if (card) {
        this.itemsGrid.appendChild(card);
      }
    }
  }

  /**
   * Load more items (pagination)
   */
  static async loadMoreItems() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.currentPage++;
    
    try {
      await this.displayItemsPage(this.currentPage);
      this.updateLoadMoreButton();
    } catch (error) {
      console.error('Error loading more items:', error);
      this.currentPage--; // Revert on error
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load more skills (pagination)
   */
  static async loadMoreSkills() {
    if (this.isSkillsLoading) return;
    
    this.isSkillsLoading = true;
    this.currentSkillPage++;
    
    try {
      await this.displaySkillsPage(this.currentSkillPage);
      this.updateLoadMoreButton();
    } catch (error) {
      console.error('Error loading more skills:', error);
      this.currentSkillPage--; // Revert on error
    } finally {
      this.isSkillsLoading = false;
    }
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

    const creatorAlias = item.user_alias || 'Unknown User';
    const createdDate = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create clickable user link
    const userLink = this.createUserLink(creatorAlias);
    
    creatorInfo.innerHTML = `
      <span>Created by </span>
      <span>${createdDate}</span>
    `;
    
    // Insert the clickable link
    const createdBySpan = creatorInfo.querySelector('span');
    createdBySpan.appendChild(userLink);

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
        includeControls: true,
        skipValidation: item.item_data?.isGallery // Skip validation for galleries
      });
    
      // *** ADD UPVOTE BUTTON ***
      const upvoteButton = await this.createItemUpvoteButton(item);
      const controlsSection = cardElement.querySelector('.card-controls');
      if (controlsSection) {
        controlsSection.appendChild(upvoteButton);
      }

      // *** ADD EXPORT BUTTON ***
      const exportButton = this.createItemExportButton(item);
      if (controlsSection) {
        controlsSection.appendChild(exportButton);
      }
    }  else {
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

      const creatorAlias = skill.user_alias || 'Unknown User';
      const createdDate = new Date(skill.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Create clickable user link
      const userLink = this.createUserLink(creatorAlias);
      
      creatorInfo.innerHTML = `
        <span>Created by </span>
        <span>${createdDate}</span>
      `;
      
      // Insert the clickable link
      const createdBySpan = creatorInfo.querySelector('span');
      createdBySpan.appendChild(userLink);

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
      includeControls: false,
      container: null,
      skipValidation: true // Skip validation for skills loaded from database
    });

    // *** ADD UPVOTE BUTTON ***
    const upvoteButton = await this.createSkillUpvoteButton(skill);
    
    // Create controls section if it doesn't exist
    let controlsSection = skillElement.querySelector('.skill-controls');
    if (!controlsSection) {
      controlsSection = document.createElement('div');
      controlsSection.className = 'skill-controls';
      controlsSection.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
        display: flex;
        gap: 5px;
      `;
      skillElement.style.position = 'relative';
      skillElement.appendChild(controlsSection);
    }
    controlsSection.appendChild(upvoteButton);

    // *** ADD EXPORT BUTTON ***
    const exportButton = this.createSkillExportButton(skill);
    controlsSection.appendChild(exportButton);

    console.log('✅ Skill card created with SkillGenerator');
  } catch (skillGenError) {
          console.warn('SkillGenerator failed, using fallback:', skillGenError);
          skillElement = this.createFallbackSkillCard(skillData);
        }
      } else {
        console.warn('SkillGenerator not available, using fallback');
        skillElement = this.createFallbackSkillCard(skillData);
      }
// Add this code right after creating skillElement and before creating commentsSection

// *** SKILL GALLERY FUNCTIONALITY - CORRECTED FOR YOUR DATA STRUCTURE ***
if (skill.skill_data?.skills && Array.isArray(skill.skill_data.skills) && skill.skill_data.skills.length > 1) {
  console.log('🎭 Adding gallery functionality for skill collection:', skill.id);
  console.log('Gallery skills count:', skill.skill_data.skills.length);
  console.log('Collection skills:', skill.skill_data.skills.map(s => s.skillName));
  
  // Add gallery button to view the full collection
  if (typeof GalleryModal !== 'undefined') {
    try {
      GalleryModal.addGalleryButton(
        skillElement,
        skill.skill_data.skills,
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
  galleryIndicator.textContent = `🎭 Collection (${skill.skill_data.skills.length} skills)`;
  
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
     const commentsSection = await this.createSkillCommentsSection(skill.id);

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
 * Create comments section for skills - REAL IMPLEMENTATION
 */
static async createSkillCommentsSection(skillId) {
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
    ">Show</button>
  `;

  const commentsList = document.createElement('div');
  commentsList.className = 'comments-list';
  commentsList.id = `comments-${skillId}`;
  commentsList.style.cssText = `
    max-height: 300px; 
    overflow-y: auto; 
    margin: 15px 0;
    background: rgba(37, 26, 12, 0.7);
    border: 2px solid rgba(218, 165, 32, 0.3);
    border-radius: 8px;
    padding: 10px;
    display: none;
  `;

  const commentForm = document.createElement('div');
  commentForm.className = 'comment-form';
  commentForm.style.display = 'none';
  
  if (window.GoogleAuth && GoogleAuth.isSignedIn()) {
    commentForm.innerHTML = `
      <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 2px solid rgb(218, 165, 32); padding-top: 15px;">
        <input type="text" 
               id="skill-comment-input-${skillId}" 
               placeholder="Add a comment..." 
               style="flex: 1; padding: 10px 15px; border: 2px solid rgb(218, 165, 32); border-radius: 6px; background-color: rgba(37, 26, 12, 0.8); color: rgb(251, 225, 183); font-size: 14px;">
        <button onclick="UnifiedBrowsePageController.addSkillComment('${skillId}')" 
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

  // Load skill comments using the new method
  await this.loadSkillComments(skillId, commentsList);

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
 * Load comments for a skill
 */
static async loadSkillComments(skillId, container) {
  try {
    const comments = await SupabaseClient.getSkillComments(skillId);
    
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
    console.error('Error loading skill comments:', error);
    container.innerHTML = '<div style="padding: 10px; color: #d32f2f;">Error loading comments</div>';
  }
}

/**
 * Add a comment to a skill
 */
static async addSkillComment(skillId) {
  const input = document.getElementById(`skill-comment-input-${skillId}`);
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
    await SupabaseClient.addSkillComment(skillId, commentText);
    
    input.value = '';
    
    const container = document.getElementById(`skill-comments-${skillId}`);
    await this.loadSkillComments(skillId, container);
    
    if (typeof Messages !== 'undefined') {
      Messages.showSuccess('Comment added!');
    }
  } catch (error) {
    console.error('Error adding skill comment:', error);
    if (typeof Messages !== 'undefined') {
      Messages.showError('Failed to add comment');
    } else {
      alert('Failed to add comment: ' + error.message);
    }
  }
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
      ">Show</button>
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
      display: none;
    `;

    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    commentForm.style.display = 'none';
    
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
      minUpvotes: parseInt(document.getElementById('skillMinUpvotes')?.value) || 0,
      maxUpvotes: parseInt(document.getElementById('skillMaxUpvotes')?.value) || null,
      search: document.getElementById('skillSearchInput')?.value?.trim() || '',
      keywords: document.getElementById('skillKeywordFilter')?.value?.trim() || '',
      creator: document.getElementById('skillCreatorFilter')?.value?.trim() || '',
      length: document.getElementById('lengthFilter')?.value || '',
      skillType: document.getElementById('skillTypeFilter')?.value || '',
      effectCategory: document.getElementById('effectCategoryFilter')?.value || '',
      dateFrom: document.getElementById('skillDateFrom')?.value || '',
      dateTo: document.getElementById('skillDateTo')?.value || ''
    };
  }

  /**
   * Get comprehensive item filter values
   */
  static getFilters() {
    return {
      sortBy: document.getElementById('sortBy')?.value || 'recent',
      hero: document.getElementById('heroFilter')?.value || '',
      size: document.getElementById('sizeFilter')?.value || '',
      border: document.getElementById('borderFilter')?.value || '',
      minUpvotes: parseInt(document.getElementById('minUpvotes')?.value) || 0,
      maxUpvotes: parseInt(document.getElementById('maxUpvotes')?.value) || null,
      search: document.getElementById('searchInput')?.value?.trim() || '',
      tags: document.getElementById('tagFilter')?.value?.trim() || '',
      keywords: document.getElementById('keywordFilter')?.value?.trim() || '',
      creator: document.getElementById('creatorFilter')?.value?.trim() || '',
      contest: document.getElementById('contestFilter')?.value || '',
      itemType: document.getElementById('itemTypeFilter')?.value || '',
      dateFrom: document.getElementById('dateFrom')?.value || '',
      dateTo: document.getElementById('dateTo')?.value || ''
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
   * Handle filter changes with comprehensive filtering
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

  /**
   * Clear all filters for current tab
   */
  static clearAllFilters() {
    if (this.activeTab === 'items') {
      // Clear item filters
      const itemFilters = [
        'sortBy', 'heroFilter', 'sizeFilter', 'borderFilter', 'minUpvotes', 'maxUpvotes',
        'searchInput', 'tagFilter', 'keywordFilter', 'creatorFilter', 'contestFilter',
        'itemTypeFilter', 'dateFrom', 'dateTo'
      ];
      
      itemFilters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
          if (element.type === 'number' || element.type === 'text') {
            element.value = '';
          } else if (element.tagName === 'SELECT') {
            element.selectedIndex = 0;
          }
        }
      });
    } else if (this.activeTab === 'skills') {
      // Clear skill filters
      const skillFilters = [
        'skillSortBy', 'rarityFilter', 'skillMinUpvotes', 'skillMaxUpvotes',
        'skillSearchInput', 'skillKeywordFilter', 'skillCreatorFilter', 'lengthFilter',
        'skillTypeFilter', 'effectCategoryFilter', 'skillDateFrom', 'skillDateTo'
      ];
      
      skillFilters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
          if (element.type === 'number' || element.type === 'text') {
            element.value = '';
          } else if (element.tagName === 'SELECT') {
            element.selectedIndex = 0;
          }
        }
      });
    }
    
    // Reload content with cleared filters
    this.handleFilterChange();
  }

  /**
   * Toggle filters visibility
   */
  static toggleFilters() {
    const controlsGrid = document.querySelector('.controls-grid');
    const toggleBtn = document.querySelector('#toggleFiltersBtn');
    
    if (controlsGrid && toggleBtn) {
      const isVisible = controlsGrid.style.display !== 'none';
      controlsGrid.style.display = isVisible ? 'none' : 'grid';
      toggleBtn.textContent = isVisible ? '⚙️ Show Filters' : '⚙️ Hide Filters';
    }
  }

  /**
   * Create upvote button for items
   */
  static async createItemUpvoteButton(item) {
    const upvoteBtn = document.createElement('button');
    upvoteBtn.className = 'card-upvote-btn';
    upvoteBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(46, 125, 50) 0%, rgb(27, 94, 32) 100%);
      color: white;
      border: 2px solid rgb(76, 175, 80);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    `;

    // Check if user has already voted
    let hasVoted = false;
    let upvoteCount = item.upvotes || 0;

    if (GoogleAuth && GoogleAuth.isSignedIn()) {
      try {
        hasVoted = await SupabaseClient.hasUserVoted(item.id);
      } catch (error) {
        console.warn('Error checking vote status:', error);
      }
    }

    // Set button appearance based on vote status
    if (hasVoted) {
      upvoteBtn.innerHTML = '❤️';
      upvoteBtn.style.background = 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%)';
      upvoteBtn.style.borderColor = 'rgb(244, 67, 54)';
      upvoteBtn.disabled = true;
      upvoteBtn.title = 'You have already upvoted this item';
    } else {
      upvoteBtn.innerHTML = '👍';
      upvoteBtn.title = `Upvote this item (${upvoteCount} votes)`;
    }

    // Add vote count display
    if (upvoteCount > 0) {
      const countDisplay = document.createElement('span');
      countDisplay.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: rgb(218, 165, 32);
        color: rgb(37, 26, 12);
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgb(37, 26, 12);
      `;
      countDisplay.textContent = upvoteCount;
      upvoteBtn.appendChild(countDisplay);
    }

    // Add click handler
    upvoteBtn.onclick = async (e) => {
      e.stopPropagation();
      await this.handleItemUpvote(item.id, upvoteBtn);
    };

    return upvoteBtn;
  }

  /**
   * Create working upvote button for skills (copied from browse page)
   */
  static async createSkillUpvoteButton(skill) {
    const upvoteBtn = document.createElement('button');
    upvoteBtn.className = 'skill-upvote-btn';
    upvoteBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(46, 125, 50) 0%, rgb(27, 94, 32) 100%);
      color: white;
      border: 2px solid rgb(76, 175, 80);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    `;

    // Check if user has already voted
    let hasVoted = false;
    let upvoteCount = skill.upvotes || 0;

    if (GoogleAuth && GoogleAuth.isSignedIn()) {
      try {
        hasVoted = await SupabaseClient.hasUserVoted(skill.id);
      } catch (error) {
        console.warn('Error checking vote status:', error);
      }
    }

    // Set button appearance based on vote status
    if (hasVoted) {
      upvoteBtn.innerHTML = '⚡';
      upvoteBtn.style.background = 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%)';
      upvoteBtn.style.borderColor = 'rgb(244, 67, 54)';
      upvoteBtn.disabled = true;
      upvoteBtn.title = 'You have already upvoted this skill';
    } else {
      upvoteBtn.innerHTML = '👍';
      upvoteBtn.title = `Upvote this skill (${upvoteCount} votes)`;
    }

    // Add vote count display
    if (upvoteCount > 0) {
      const countDisplay = document.createElement('span');
      countDisplay.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: rgb(218, 165, 32);
        color: rgb(37, 26, 12);
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgb(37, 26, 12);
      `;
      countDisplay.textContent = upvoteCount;
      upvoteBtn.appendChild(countDisplay);
    }

    // Add click handler
    upvoteBtn.onclick = async (e) => {
      e.stopPropagation();
      await this.handleSkillUpvote(skill.id, upvoteBtn);
    };

    return upvoteBtn;
  }

  /**
   * Handle item upvote
   */
  static async handleItemUpvote(itemId, button) {
    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('Please sign in to vote');
      } else {
        alert('Please sign in to vote');
      }
      return;
    }

    // Show loading state
    const originalHTML = button.innerHTML;
    button.innerHTML = '⏳';
    button.disabled = true;

    try {
      const result = await SupabaseClient.voteItem(itemId, 'upvote');
      
      if (result.success) {
        // Update button to voted state
        button.innerHTML = '❤️';
        button.style.background = 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%)';
        button.style.borderColor = 'rgb(244, 67, 54)';
        button.title = 'You have upvoted this item';

        // Add/update vote count display
        let countDisplay = button.querySelector('span');
        if (!countDisplay) {
          countDisplay = document.createElement('span');
          countDisplay.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: rgb(218, 165, 32);
            color: rgb(37, 26, 12);
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgb(37, 26, 12);
          `;
          button.appendChild(countDisplay);
        }
        countDisplay.textContent = result.newCount;

        if (typeof Messages !== 'undefined') {
          Messages.showSuccess('Item upvoted!');
        }
      }
    } catch (error) {
      console.error('Error upvoting item:', error);
      
      // Reset button
      button.innerHTML = originalHTML;
      button.disabled = false;

      if (typeof Messages !== 'undefined') {
        Messages.showError(error.message || 'Failed to upvote item');
      } else {
        alert(error.message || 'Failed to upvote item');
      }
    }
  }

  /**
   * Handle skill upvote
   */
  static async handleSkillUpvote(skillId, button) {
    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('Please sign in to vote');
      } else {
        alert('Please sign in to vote');
      }
      return;
    }

    // Show loading state
    const originalHTML = button.innerHTML;
    button.innerHTML = '⏳';
    button.disabled = true;

    try {
      const result = await SupabaseClient.voteSkill(skillId, 'upvote');
      
      if (result.success) {
        // Update button to voted state
        button.innerHTML = '⚡';
        button.style.background = 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%)';
        button.style.borderColor = 'rgb(244, 67, 54)';
        button.title = 'You have upvoted this skill';

        // Add/update vote count display
        let countDisplay = button.querySelector('span');
        if (!countDisplay) {
          countDisplay = document.createElement('span');
          countDisplay.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: rgb(218, 165, 32);
            color: rgb(37, 26, 12);
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgb(37, 26, 12);
          `;
          button.appendChild(countDisplay);
        }
        countDisplay.textContent = result.newCount;

        if (typeof Messages !== 'undefined') {
          Messages.showSuccess('Skill upvoted!');
        }
      }
    } catch (error) {
      console.error('Error upvoting skill:', error);
      
      // Reset button
      button.innerHTML = originalHTML;
      button.disabled = false;

      if (typeof Messages !== 'undefined') {
        Messages.showError(error.message || 'Failed to upvote skill');
      } else {
        alert(error.message || 'Failed to upvote skill');
      }
    }
  }

  /**
   * Wait for user profile to be loaded from database
   */
  static async waitForUserProfile() {
    // Early return if user is not signed in
    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      console.log('👤 User not signed in, skipping profile loading');
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      if (SupabaseClient && SupabaseClient.isReady()) {
        try {
          const userEmail = GoogleAuth.getUserEmail();
          if (!userEmail) {
            console.log('⚠️ No user email available, skipping profile loading');
            return;
          }
          
          console.log(`🗄️ Fetching user profile from database for: ${userEmail}`);
          
          const profile = await SupabaseClient.getUserProfile(userEmail);
          if (profile && profile.alias) {
            // Update GoogleAuth userProfile with the database data
            GoogleAuth.userProfile = profile;
            console.log(`✅ User profile loaded from database: ${profile.alias}`);
            return;
          } else {
            console.log('⚠️ No profile found in database, using existing profile');
            break;
          }
        } catch (error) {
          console.log(`❌ Error fetching profile from database: ${error.message}`);
        }
      }
      
      console.log(`⏳ Waiting for database and user profile (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    // Check if we have a valid profile from GoogleAuth
    const userProfile = GoogleAuth.getUserProfile();
    if (userProfile && userProfile.alias && userProfile.alias !== 'User') {
      console.log(`✅ Using existing user profile: ${userProfile.alias}`);
    } else {
      console.log('⚠️ User profile not loaded after maximum attempts, proceeding anyway');
    }
  }

  /**
   * Update main navigation menu to show/hide profile tab
   */
  static updateMainNavigation() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    const isSignedIn = GoogleAuth && GoogleAuth.isSignedIn();
    const existingProfileTab = navMenu.querySelector('[data-page="profile"]');

    if (isSignedIn && !existingProfileTab) {
      // Add profile tab
      const profileTab = document.createElement('li');
      profileTab.className = 'nav-item';
      profileTab.innerHTML = '<a href="profile.html" class="nav-link" data-page="profile">Profile</a>';
      navMenu.appendChild(profileTab);
      console.log('👤 Profile tab added to main navigation');
    } else if (!isSignedIn && existingProfileTab) {
      // Remove profile tab
      existingProfileTab.remove();
      console.log('👤 Profile tab removed from main navigation');
    }
  }

  /**
   * Create export button for browse page items (without "Save to Profile" option)
   */
  static createItemExportButton(item) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'card-export-btn';
    exportBtn.innerHTML = '💾';
    exportBtn.title = 'Export this item';
    exportBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(33, 150, 243) 0%, rgb(30, 136, 229) 100%);
      color: white;
      border: 2px solid rgb(21, 101, 192);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    `;

    exportBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleBrowseExportMenu(exportBtn, item);
    };

    return exportBtn;
  }

  /**
   * Create export button for browse page skills (without "Save to Profile" option)
   */
  static createSkillExportButton(skill) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'skill-export-btn';
    exportBtn.innerHTML = '💾';
    exportBtn.title = 'Export this skill';
    exportBtn.style.cssText = `
      background: linear-gradient(135deg, rgb(33, 150, 243) 0%, rgb(30, 136, 229) 100%);
      color: white;
      border: 2px solid rgb(21, 101, 192);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    `;

    exportBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleBrowseExportMenu(exportBtn, skill);
    };

    return exportBtn;
  }

  /**
   * Toggle export menu for browse page (without "Save to Profile" option)
   */
  static toggleBrowseExportMenu(button, itemData) {
    console.log('💾 [DEBUG] toggleBrowseExportMenu called', {button, itemData});
    
    // Close all other export menus
    document.querySelectorAll('.export-menu').forEach(menu => {
      if (menu.parentElement !== button.parentElement) {
        menu.classList.remove('show');
        menu.style.display = 'none';
      }
    });

    let menu = button.parentElement.querySelector('.export-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'export-menu';
      menu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: linear-gradient(135deg,rgb(87, 72, 38) 0%,rgb(131, 103, 47) 100%);
        border: 1px solid black;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        min-width: 120px;
        display: block;
      `;
      
      const dataOption = document.createElement('div');
      dataOption.className = 'export-option';
      dataOption.textContent = 'Export as Data';
      dataOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        color: white;
        transition: background 0.3s ease;
      `;
      dataOption.onmouseenter = () => {
        dataOption.style.background = 'rgba(255, 255, 255, 0.1)';
      };
      dataOption.onmouseleave = () => {
        dataOption.style.background = 'transparent';
      };
      dataOption.onclick = () => {
        if (itemData.skill_data) {
          // This is a skill
          if (typeof ExportImport !== 'undefined') {
            ExportImport.exportSingleSkillAsData(itemData.skill_data);
          }
        } else if (itemData.item_data) {
          // This is an item
          if (typeof ExportImport !== 'undefined') {
            ExportImport.exportSingleCardAsData(itemData.item_data);
          }
        } else {
          console.error('❌ No skill_data or item_data found in itemData:', itemData);
        }
        menu.style.display = 'none';
      };
      
      const pngOption = document.createElement('div');
      pngOption.className = 'export-option';
      pngOption.textContent = 'Save as PNG';
      pngOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        color: white;
        transition: background 0.3s ease;
      `;
      pngOption.onmouseenter = () => {
        pngOption.style.background = 'rgba(255, 255, 255, 0.1)';
      };
      pngOption.onmouseleave = () => {
        pngOption.style.background = 'transparent';
      };
      pngOption.onclick = () => {
        const element = button.closest('.card, .skill-card');
        if (itemData.skill_data) {
          // This is a skill
          if (typeof ExportImport !== 'undefined') {
            ExportImport.exportSkillAsPNG(element);
          }
        } else if (itemData.item_data) {
          // This is an item
          if (typeof ExportImport !== 'undefined') {
            ExportImport.exportCardAsPNG(element);
          }
        } else {
          console.error('❌ No skill_data or item_data found in itemData:', itemData);
        }
        menu.style.display = 'none';
      };
      
      menu.appendChild(dataOption);
      menu.appendChild(pngOption);
      button.parentElement.appendChild(menu);
      console.log('💾 [DEBUG] Browse export menu created');
    }

    menu.style.display = 'block';
  }

  /**
   * Apply comprehensive filtering to items
   */
  static applyItemFilters(items, filters) {
    if (!items || !Array.isArray(items)) return [];
    
    let filteredItems = [...items];

    // Hero filter
    if (filters.hero) {
      filteredItems = filteredItems.filter(item => 
        item.item_data?.hero === filters.hero
      );
    }

    // Size filter
    if (filters.size) {
      filteredItems = filteredItems.filter(item => 
        item.item_data?.itemSize === filters.size
      );
    }

    // Border/Rarity filter
    if (filters.border) {
      filteredItems = filteredItems.filter(item => 
        item.item_data?.border === filters.border
      );
    }

    // Upvote range filter
    if (filters.minUpvotes > 0) {
      filteredItems = filteredItems.filter(item => 
        (item.upvotes || 0) >= filters.minUpvotes
      );
    }

    if (filters.maxUpvotes && filters.maxUpvotes > 0) {
      filteredItems = filteredItems.filter(item => 
        (item.upvotes || 0) <= filters.maxUpvotes
      );
    }

    // Search filter (item name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.item_data?.itemName?.toLowerCase().includes(searchLower)
      );
    }

    // Tags filter
    if (filters.tags) {
      const tagList = filters.tags.split(',').map(tag => tag.trim().toLowerCase());
      filteredItems = filteredItems.filter(item => {
        const itemTags = item.item_data?.tags || [];
        return tagList.some(tag => 
          itemTags.some(itemTag => itemTag.toLowerCase().includes(tag))
        );
      });
    }

    // Keywords filter (effects)
    if (filters.keywords) {
      const keywordList = filters.keywords.split(',').map(keyword => keyword.trim().toLowerCase());
      filteredItems = filteredItems.filter(item => {
        const onUseEffects = item.item_data?.onUseEffects || [];
        const passiveEffects = item.item_data?.passiveEffects || [];
        const allEffects = [...onUseEffects, ...passiveEffects].join(' ').toLowerCase();
        
        return keywordList.some(keyword => allEffects.includes(keyword));
      });
    }

    // Creator filter
    if (filters.creator) {
      const creatorLower = filters.creator.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.user_alias?.toLowerCase().includes(creatorLower)
      );
    }

    // Contest filter
    if (filters.contest !== '') {
      filteredItems = filteredItems.filter(item => 
        item.contest === parseInt(filters.contest)
      );
    }

    // Item type filter (single vs gallery)
    if (filters.itemType) {
      if (filters.itemType === 'single') {
        filteredItems = filteredItems.filter(item => !item.item_data?.isGallery);
      } else if (filters.itemType === 'gallery') {
        filteredItems = filteredItems.filter(item => item.item_data?.isGallery);
      }
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredItems = filteredItems.filter(item => 
        new Date(item.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredItems = filteredItems.filter(item => 
        new Date(item.created_at) <= toDate
      );
    }

    // Sort items
    filteredItems = this.sortItems(filteredItems, filters.sortBy);

    return filteredItems;
  }

  /**
   * Apply comprehensive filtering to skills
   */
  static applySkillFilters(skills, filters) {
    if (!skills || !Array.isArray(skills)) return [];
    
    let filteredSkills = [...skills];

    // Rarity filter
    if (filters.rarity) {
      filteredSkills = filteredSkills.filter(skill => 
        skill.skill_data?.rarity === filters.rarity
      );
    }

    // Upvote range filter
    if (filters.minUpvotes > 0) {
      filteredSkills = filteredSkills.filter(skill => 
        (skill.upvotes || 0) >= filters.minUpvotes
      );
    }

    if (filters.maxUpvotes && filters.maxUpvotes > 0) {
      filteredSkills = filteredSkills.filter(skill => 
        (skill.upvotes || 0) <= filters.maxUpvotes
      );
    }

    // Search filter (skill name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSkills = filteredSkills.filter(skill => 
        skill.skill_data?.skillName?.toLowerCase().includes(searchLower)
      );
    }

    // Keywords filter (effects)
    if (filters.keywords) {
      const keywordList = filters.keywords.split(',').map(keyword => keyword.trim().toLowerCase());
      filteredSkills = filteredSkills.filter(skill => {
        const effects = skill.skill_data?.effects || [];
        const allEffects = effects.join(' ').toLowerCase();
        
        return keywordList.some(keyword => allEffects.includes(keyword));
      });
    }

    // Creator filter
    if (filters.creator) {
      const creatorLower = filters.creator.toLowerCase();
      filteredSkills = filteredSkills.filter(skill => 
        skill.user_alias?.toLowerCase().includes(creatorLower)
      );
    }

    // Effect length filter
    if (filters.length) {
      filteredSkills = filteredSkills.filter(skill => {
        const effects = skill.skill_data?.effects || [];
        const totalLength = effects.join(' ').length;
        
        switch (filters.length) {
          case 'short': return totalLength <= 100;
          case 'medium': return totalLength > 100 && totalLength <= 200;
          case 'long': return totalLength > 200;
          default: return true;
        }
      });
    }

    // Skill type filter (based on effects)
    if (filters.skillType) {
      filteredSkills = filteredSkills.filter(skill => {
        const effects = skill.skill_data?.effects || [];
        const effectsText = effects.join(' ').toLowerCase();
        
        switch (filters.skillType) {
          case 'attack': return effectsText.includes('damage') || effectsText.includes('attack');
          case 'defense': return effectsText.includes('shield') || effectsText.includes('armor') || effectsText.includes('block');
          case 'utility': return effectsText.includes('utility') || effectsText.includes('special');
          case 'healing': return effectsText.includes('heal') || effectsText.includes('restore');
          case 'buff': return effectsText.includes('gain') || effectsText.includes('increase') || effectsText.includes('boost');
          case 'debuff': return effectsText.includes('reduce') || effectsText.includes('decrease') || effectsText.includes('weaken');
          default: return true;
        }
      });
    }

    // Effect category filter
    if (filters.effectCategory) {
      filteredSkills = filteredSkills.filter(skill => {
        const effects = skill.skill_data?.effects || [];
        const effectsText = effects.join(' ').toLowerCase();
        
        switch (filters.effectCategory) {
          case 'damage': return effectsText.includes('damage');
          case 'heal': return effectsText.includes('heal') || effectsText.includes('restore');
          case 'buff': return effectsText.includes('gain') || effectsText.includes('increase');
          case 'debuff': return effectsText.includes('reduce') || effectsText.includes('decrease');
          case 'control': return effectsText.includes('stun') || effectsText.includes('freeze') || effectsText.includes('slow');
          case 'utility': return effectsText.includes('utility') || effectsText.includes('special');
          default: return true;
        }
      });
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredSkills = filteredSkills.filter(skill => 
        new Date(skill.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredSkills = filteredSkills.filter(skill => 
        new Date(skill.created_at) <= toDate
      );
    }

    // Sort skills
    filteredSkills = this.sortSkills(filteredSkills, filters.sortBy);

    return filteredSkills;
  }

  /**
   * Sort items based on sort criteria
   */
  static sortItems(items, sortBy) {
    const sortedItems = [...items];
    
    switch (sortBy) {
      case 'recent':
        return sortedItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sortedItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'upvotes_desc':
        return sortedItems.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      case 'upvotes_asc':
        return sortedItems.sort((a, b) => (a.upvotes || 0) - (b.upvotes || 0));
      case 'name_asc':
        return sortedItems.sort((a, b) => (a.item_data?.itemName || '').localeCompare(b.item_data?.itemName || ''));
      case 'name_desc':
        return sortedItems.sort((a, b) => (b.item_data?.itemName || '').localeCompare(a.item_data?.itemName || ''));
      case 'creator_asc':
        return sortedItems.sort((a, b) => (a.user_alias || '').localeCompare(b.user_alias || ''));
      case 'creator_desc':
        return sortedItems.sort((a, b) => (b.user_alias || '').localeCompare(a.user_alias || ''));
      default:
        return sortedItems;
    }
  }

  /**
   * Sort skills based on sort criteria
   */
  static sortSkills(skills, sortBy) {
    const sortedSkills = [...skills];
    
    switch (sortBy) {
      case 'recent':
        return sortedSkills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sortedSkills.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'upvotes_desc':
        return sortedSkills.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      case 'upvotes_asc':
        return sortedSkills.sort((a, b) => (a.upvotes || 0) - (b.upvotes || 0));
      case 'name_asc':
        return sortedSkills.sort((a, b) => (a.skill_data?.skillName || '').localeCompare(b.skill_data?.skillName || ''));
      case 'name_desc':
        return sortedSkills.sort((a, b) => (b.skill_data?.skillName || '').localeCompare(a.skill_data?.skillName || ''));
      case 'creator_asc':
        return sortedSkills.sort((a, b) => (a.user_alias || '').localeCompare(b.user_alias || ''));
      case 'creator_desc':
        return sortedSkills.sort((a, b) => (b.user_alias || '').localeCompare(a.user_alias || ''));
      case 'rarity_asc':
        return sortedSkills.sort((a, b) => this.getRarityValue(a.skill_data?.rarity) - this.getRarityValue(b.skill_data?.rarity));
      case 'rarity_desc':
        return sortedSkills.sort((a, b) => this.getRarityValue(b.skill_data?.rarity) - this.getRarityValue(a.skill_data?.rarity));
      default:
        return sortedSkills;
    }
  }

  /**
   * Get numeric value for rarity sorting
   */
  static getRarityValue(rarity) {
    const rarityValues = {
      'bronze': 1,
      'silver': 2,
      'gold': 3,
      'diamond': 4,
      'legendary': 5
    };
    return rarityValues[rarity] || 0;
  }

  /**
   * Create a clickable user link
   */
  static createUserLink(userAlias, displayText = null) {
    const link = document.createElement('a');
    link.href = `profile.html?user=${encodeURIComponent(userAlias)}`;
    link.textContent = displayText || userAlias;
    link.style.cssText = `
      color: rgb(218, 165, 32);
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
      transition: color 0.3s ease;
    `;
    
    link.addEventListener('mouseenter', () => {
      link.style.color = 'rgb(251, 225, 183)';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.color = 'rgb(218, 165, 32)';
    });
    
    return link;
  }

  /**
   * Make all user aliases clickable on the page
   */
  static makeUserAliasesClickable() {
    // Find all elements that contain user aliases
    const elements = document.querySelectorAll('.creator-info, .user-alias, [data-user-alias]');
    
    elements.forEach(element => {
      const text = element.textContent;
      const userAliasMatch = text.match(/Created by ([^,\n]+)/);
      
      if (userAliasMatch) {
        const userAlias = userAliasMatch[1].trim();
        const beforeText = text.substring(0, text.indexOf('Created by'));
        const afterText = text.substring(text.indexOf('Created by') + 'Created by '.length + userAlias.length);
        
        element.innerHTML = '';
        if (beforeText) element.appendChild(document.createTextNode(beforeText));
        element.appendChild(document.createTextNode('Created by '));
        element.appendChild(this.createUserLink(userAlias));
        if (afterText) element.appendChild(document.createTextNode(afterText));
      }
    });
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
