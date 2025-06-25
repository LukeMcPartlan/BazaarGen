/**
 * Browse Page Controller
 * Handles browsing community-created items and skills
 */
class BrowsePageController {
  
  static allItems = [];
  static displayedItems = [];
  static currentPage = 0;
  static ITEMS_PER_LOAD = 5;
  static isLoading = false;
  static isInitialized = false;

  /**
   * Initialize the browse page
   */
  static init() {
    if (this.isInitialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.setupDOMElements();
      this.setupEventListeners();
      this.initializeSupabase();
      this.isInitialized = true;
    });
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

    // Filter elements
    this.sortBy = document.getElementById('sortBy');
    this.heroFilter = document.getElementById('heroFilter');
    this.searchInput = document.getElementById('searchInput');
    this.contestFilter = document.getElementById('contestFilter');
  }

  /**
   * Setup event listeners
   */
  static setupEventListeners() {
    if (this.sortBy) this.sortBy.addEventListener('change', () => this.handleFilterChange());
    if (this.heroFilter) this.heroFilter.addEventListener('change', () => this.handleFilterChange());
    if (this.contestFilter) this.contestFilter.addEventListener('change', () => this.handleFilterChange());
    
    // Debounced search
    if (this.searchInput) {
      let searchTimeout;
      this.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.handleFilterChange(), 500);
      });
    }

    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreItems());
    }

    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
        if (!this.isLoading && this.displayedItems.length < this.allItems.length) {
          this.loadMoreItems();
        }
      }
    });
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

      if (SupabaseClient.isReady()) {
        // Test connection before proceeding
        const testResult = await SupabaseClient.testConnection();
        if (testResult.success) {
          this.loadItems();
        } else {
          this.showError(`Database connection failed: ${testResult.error}`);
        }
      } else {
        // Retry initialization
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
      const filters = this.getFilters();
      const options = this.buildQueryOptions(filters);
      
      const data = await SupabaseClient.loadItems(options);
      
      this.allItems = data || [];
      this.displayedItems = [];
      this.currentPage = 0;
      
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
      console.error('Error loading items:', error);
      this.showError('Failed to load items: ' + error.message);
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Get current filter values
   * @returns {Object} Filter values
   */
  static getFilters() {
    return {
      sortBy: this.sortBy?.value || 'recent',
      hero: this.heroFilter?.value || '',
      search: this.searchInput?.value?.trim() || '',
      contest: this.contestFilter?.value || ''
    };
  }

  /**
   * Build query options from filters
   * @param {Object} filters - Filter values
   * @returns {Object} Query options
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
   * Load more items for display
   */
static async loadMoreItems() {
  if (this.isLoading || this.displayedItems.length >= this.allItems.length) {
    return;
  }

  const startIndex = this.displayedItems.length;
  const endIndex = Math.min(startIndex + this.ITEMS_PER_LOAD, this.allItems.length);
  const newItems = this.allItems.slice(startIndex, endIndex);

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
 * Create item card element
 * @param {Object} item - Item data from database
 * @returns {HTMLElement|null} Created card element
 */
static createItemCard(item) {
  if (!item.item_data) {
    console.warn(`Item ${item.id} has no item_data`);
    return null;
  }

  try {
    // The item_data from the database should already be in the correct format
    const cardData = item.item_data;
    
    // Add any additional metadata
    cardData.created_at = item.created_at;
    cardData.creator_alias = item.users?.alias || 'Unknown';
    cardData.database_id = item.id;

    const cardElement = CardGenerator.createCard({
      data: cardData,
      mode: 'browser',
      includeControls: true
    });

    return cardElement;
  } catch (error) {
    console.error('Error creating item card:', error);
    return null;
  }
}

  /**
   * Handle filter changes
   */
  static handleFilterChange() {
    if (this.itemsGrid) {
      this.itemsGrid.innerHTML = '';
    }
    this.loadItems();
  }

  /**
   * Update statistics display
   */
  static updateStats() {
    if (this.totalItemsSpan) {
      this.totalItemsSpan.textContent = this.allItems.length;
    }
    if (this.showingItemsSpan) {
      this.showingItemsSpan.textContent = this.displayedItems.length;
    }
  }

  /**
   * Update load more button visibility
   */
  static updateLoadMoreButton() {
    if (this.displayedItems.length >= this.allItems.length) {
      if (this.loadMoreBtn) this.loadMoreBtn.style.display = 'none';
      if (this.endMessage) this.endMessage.style.display = this.displayedItems.length > 0 ? 'block' : 'none';
    } else {
      if (this.loadMoreBtn) this.loadMoreBtn.style.display = this.displayedItems.length > 0 ? 'block' : 'none';
      if (this.endMessage) this.endMessage.style.display = 'none';
    }

    if (this.allItems.length === 0) {
      if (this.noResults) this.noResults.style.display = 'block';
    } else {
      if (this.noResults) this.noResults.style.display = 'none';
    }
  }

  /**
   * Show loading state
   * @param {boolean} show - Whether to show loading
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
   * @param {string} message - Error message
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
   * View item details
   * @param {Object} item - Item data
   */
  static viewItemDetails(item) {
    const itemData = item.item_data || {};
    const createdDate = new Date(item.created_at).toLocaleDateString();
    const createdBy = item.users?.alias || 'Unknown';
    
    let details = `Item: ${itemData.name || 'Unnamed'}\n`;
    details += `Created by: ${createdBy}\n`;
    details += `Hero: ${itemData.hero || 'Unknown'}\n`;
    details += `Size: ${itemData.item_size || 'Unknown'}\n`;
    details += `Rarity: ${itemData.rarity || 'Unknown'}\n`;
    details += `Created: ${createdDate}\n`;
    details += `Contest: ${item.contest_number > 0 ? `Contest ${item.contest_number}` : 'General'}\n`;
    
    if (itemData.cooldown) details += `Cooldown: ${itemData.cooldown}s\n`;
    if (itemData.ammo) details += `Ammo: ${itemData.ammo}\n`;
    if (itemData.crit) details += `Crit: ${itemData.crit}%\n`;
    if (itemData.multicast && parseInt(itemData.multicast) > 1) details += `Multicast: ${itemData.multicast}\n`;
    
    if (itemData.passive_effect) {
      details += `\nPassive Effect:\n${itemData.passive_effect}\n`;
    }
    
    if (itemData.on_use_effects?.length) {
      details += `\nOn Use Effects:\n${itemData.on_use_effects.map(effect => `• ${effect}`).join('\n')}\n`;
    }
    
    if (itemData.tags?.length) {
      details += `\nTags: ${itemData.tags.join(', ')}\n`;
    }
    
    if (itemData.scaling_values) {
      const scalings = Object.entries(itemData.scaling_values)
        .filter(([key, value]) => value && value.toString().trim())
        .map(([key, value]) => `${key}: ${value}`);
      if (scalings.length > 0) {
        details += `\nScaling Values:\n${scalings.join(', ')}\n`;
      }
    }

    // Show in a better modal instead of alert
    this.showItemModal(details.trim(), itemData);
  }

  /**
   * Show item in a modal
   * @param {string} details - Item details text
   * @param {Object} itemData - Item data for potential actions
   */
  static showItemModal(details, itemData) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: white; padding: 30px; border-radius: 8px; 
        max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
      ">
        <h3>Item Details</h3>
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 20px 0;">${details}</pre>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                  style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
      </div>
    `;

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    document.body.appendChild(modal);
  }

  /**
   * Upvote an item (placeholder)
   * @param {string} itemId - Item ID
   */
  static upvoteItem(itemId) {
    Messages.showInfo('Upvote feature coming soon! Please sign in to vote on items.');
  }

  /**
   * Setup search functionality
   */
  static setupSearch() {
    if (this.searchInput) {
      // Add search suggestions
      this.searchInput.addEventListener('focus', () => {
        this.showSearchSuggestions();
      });

      // Clear search
      const clearButton = document.createElement('button');
      clearButton.innerHTML = '×';
      clearButton.style.cssText = `
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        border: none; background: none; cursor: pointer; color: #999;
      `;
      clearButton.onclick = () => {
        this.searchInput.value = '';
        this.handleFilterChange();
      };

      if (this.searchInput.parentNode) {
        this.searchInput.parentNode.style.position = 'relative';
        this.searchInput.parentNode.appendChild(clearButton);
      }
    }
  }

  /**
   * Show search suggestions
   */
  static showSearchSuggestions() {
    // Get popular item names for suggestions
    const itemNames = this.allItems
      .map(item => item.item_data?.name)
      .filter(name => name)
      .slice(0, 10);

    if (itemNames.length === 0) return;

    // Create suggestions dropdown
    const suggestions = document.createElement('div');
    suggestions.style.cssText = `
      position: absolute; top: 100%; left: 0; right: 0; 
      background: white; border: 1px solid #ddd; border-top: none;
      max-height: 200px; overflow-y: auto; z-index: 1000;
    `;

    itemNames.forEach(name => {
      const suggestion = document.createElement('div');
      suggestion.textContent = name;
      suggestion.style.cssText = `
        padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;
      `;
      suggestion.onmouseenter = () => suggestion.style.background = '#f5f5f5';
      suggestion.onmouseleave = () => suggestion.style.background = 'white';
      suggestion.onclick = () => {
        this.searchInput.value = name;
        this.handleFilterChange();
        suggestions.remove();
      };
      suggestions.appendChild(suggestion);
    });

    // Remove existing suggestions
    const existing = this.searchInput.parentNode.querySelector('.search-suggestions');
    if (existing) existing.remove();

    suggestions.className = 'search-suggestions';
    this.searchInput.parentNode.appendChild(suggestions);

    // Remove suggestions when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function removeSuggestions(e) {
        if (!suggestions.contains(e.target) && e.target !== this.searchInput) {
          suggestions.remove();
          document.removeEventListener('click', removeSuggestions);
        }
      }.bind(this), 100);
    }, 100);
  }

  /**
   * Setup keyboard shortcuts for browse page
   */
  static setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // F5 or Ctrl+R to refresh items
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        this.loadItems();
      }

      // Escape to clear search
      if (e.key === 'Escape' && this.searchInput && this.searchInput === document.activeElement) {
        this.searchInput.value = '';
        this.handleFilterChange();
        this.searchInput.blur();
      }

      // Arrow keys for filter navigation
      if (e.ctrlKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            this.cycleSortFilter(-1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.cycleSortFilter(1);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.cycleHeroFilter(-1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.cycleHeroFilter(1);
            break;
        }
      }
    });
  }

  /**
   * Cycle through sort options
   * @param {number} direction - 1 for next, -1 for previous
   */
  static cycleSortFilter(direction) {
    if (!this.sortBy) return;
    
    const options = Array.from(this.sortBy.options);
    const currentIndex = this.sortBy.selectedIndex;
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = options.length - 1;
    if (newIndex >= options.length) newIndex = 0;
    
    this.sortBy.selectedIndex = newIndex;
    this.handleFilterChange();
  }

  /**
   * Cycle through hero options
   * @param {number} direction - 1 for next, -1 for previous
   */
  static cycleHeroFilter(direction) {
    if (!this.heroFilter) return;
    
    const options = Array.from(this.heroFilter.options);
    const currentIndex = this.heroFilter.selectedIndex;
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = options.length - 1;
    if (newIndex >= options.length) newIndex = 0;
    
    this.heroFilter.selectedIndex = newIndex;
    this.handleFilterChange();
  }

  /**
   * Setup filter persistence
   */
  static setupFilterPersistence() {
    // Save filters to localStorage
    const saveFilters = () => {
      const filters = this.getFilters();
      try {
        localStorage.setItem('bazaargen_browse_filters', JSON.stringify(filters));
      } catch (error) {
        console.warn('Failed to save filters:', error);
      }
    };

    // Restore filters from localStorage
    const restoreFilters = () => {
      try {
        const saved = localStorage.getItem('bazaargen_browse_filters');
        if (saved) {
          const filters = JSON.parse(saved);
          
          if (this.sortBy && filters.sortBy) this.sortBy.value = filters.sortBy;
          if (this.heroFilter && filters.hero) this.heroFilter.value = filters.hero;
          if (this.searchInput && filters.search) this.searchInput.value = filters.search;
          if (this.contestFilter && filters.contest) this.contestFilter.value = filters.contest;
        }
      } catch (error) {
        console.warn('Failed to restore filters:', error);
      }
    };

    // Save filters when they change
    [this.sortBy, this.heroFilter, this.searchInput, this.contestFilter].forEach(element => {
      if (element) {
        element.addEventListener('change', saveFilters);
        element.addEventListener('input', saveFilters);
      }
    });

    // Restore filters on page load
    restoreFilters();
  }

  /**
   * Show browse statistics
   */
  static async showBrowseStatistics() {
    try {
      const stats = await Database.getStatistics();
      
      const statsModal = document.createElement('div');
      statsModal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
      `;

      statsModal.innerHTML = `
        <div style="
          background: white; padding: 30px; border-radius: 8px; 
          max-width: 400px; width: 90%;
        ">
          <h3>Community Statistics</h3>
          <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div style="text-align: center;">
              <div style="font-size: 2em; font-weight: bold; color: #4caf50;">${stats.items || 0}</div>
              <div>Total Items</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 2em; font-weight: bold; color: #2196f3;">${stats.skills || 0}</div>
              <div>Total Skills</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 2em; font-weight: bold; color: #ff9800;">${stats.users || 0}</div>
              <div>Total Users</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 2em; font-weight: bold; color: #9c27b0;">${this.allItems.length}</div>
              <div>Shown Items</div>
            </div>
          </div>
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                  style="width: 100%; padding: 10px; border: none; background: #4caf50; color: white; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
      `;

      document.body.appendChild(statsModal);

      // Close on overlay click
      statsModal.onclick = (e) => {
        if (e.target === statsModal) {
          statsModal.remove();
        }
      };

    } catch (error) {
      Messages.showError('Failed to load statistics: ' + error.message);
    }
  }

  /**
   * Setup periodic refresh
   */
  static setupPeriodicRefresh() {
    // Refresh items every 5 minutes if page is visible
    setInterval(() => {
      if (!document.hidden && this.allItems.length > 0) {
        console.log('Performing periodic refresh...');
        this.loadItems();
      }
    }, 5 * 60 * 1000);

    // Refresh when page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.allItems.length > 0) {
        // Small delay to avoid rapid refreshes
        setTimeout(() => this.loadItems(), 1000);
      }
    });
  }

  /**
   * Setup debug panel functionality
   */
  static setupDebugPanel() {
    window.toggleDebugPanel = () => {
      const debugPanel = document.getElementById('debugPanel');
      if (debugPanel) {
        debugPanel.classList.toggle('show');
      }
    };

    // Add debug information
    const updateDebugInfo = () => {
      const debugContent = document.getElementById('debugContent');
      if (debugContent) {
        debugContent.innerHTML = `
          <div><strong>Items Loaded:</strong> ${this.allItems.length}</div>
          <div><strong>Items Displayed:</strong> ${this.displayedItems.length}</div>
          <div><strong>Current Filters:</strong> ${JSON.stringify(this.getFilters())}</div>
          <div><strong>Loading State:</strong> ${this.isLoading}</div>
          <div><strong>Supabase Ready:</strong> ${SupabaseClient.isReady()}</div>
          <div><strong>Last Update:</strong> ${new Date().toLocaleTimeString()}</div>
        `;
      }
    };

    // Update debug info every 5 seconds
    setInterval(updateDebugInfo, 5000);
    updateDebugInfo();
  }
}

// Setup global functions for HTML handlers
window.viewItemDetails = (item) => {
  BrowsePageController.viewItemDetails(item);
};

window.upvoteItem = (itemId) => {
  BrowsePageController.upvoteItem(itemId);
};

// Auto-initialize
BrowsePageController.init();

// Setup additional features
document.addEventListener('DOMContentLoaded', () => {
  BrowsePageController.setupSearch();
  BrowsePageController.setupKeyboardShortcuts();
  BrowsePageController.setupFilterPersistence();
  BrowsePageController.setupPeriodicRefresh();
  BrowsePageController.setupDebugPanel();
});
