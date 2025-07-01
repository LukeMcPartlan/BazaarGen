/**
 * Enhanced Browse Page Controller with Gallery Support
 * Handles browsing community-created items with collection/gallery functionality
 */
class BrowsePageController {
  
  static allItems = [];
  static displayedItems = [];
  static collections = new Map(); // Track collections for gallery functionality
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
        const testResult = await SupabaseClient.testConnection();
        if (testResult.success) {
          this.loadItems();
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
   * Load items from database with collection detection
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
      console.error('Error loading items:', error);
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

    const cardElement = await CardGenerator.createCard({
      data: cardData,
      mode: 'browser',
      includeControls: true
    });

    // GALLERY FEATURE ADDITIONS START HERE
    
    // Check if this is a saved gallery and add gallery button
    if (item.item_data?.isGallery && item.item_data?.galleryItems) {
      // This is a saved gallery - add gallery button to view it
      GalleryModal.addGalleryButton(
        cardElement,
        item.item_data.galleryItems,
        0
      );
      
      // Optional: Style the card differently to show it's a gallery
      const passiveSection = cardElement.querySelector('.passive-section');
      if (passiveSection) {
        passiveSection.style.background = 'linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(48, 63, 159, 0.1) 100%)';
        passiveSection.style.borderColor = 'rgb(63, 81, 181)';
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
      if (collection) {
        GalleryModal.addGalleryButton(
          cardElement, 
          collection.items.map(i => i.item_data), 
          item.collectionIndex
        );
      }
    }
    
    // GALLERY FEATURE ADDITIONS END HERE

    // Create comments section
    const commentsSection = await this.createCommentsSection(item.id);

    // Assemble the wrapper
    if (item.collectionId) {
      // Collection header already added above
    }
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
      GalleryModal.open(
        collection.items.map(item => item.item_data), 
        currentItem.collectionIndex,
        {
          name: collection.name,
          description: collection.description,
          itemCount: collection.items.length
        }
      );
    };

    header.appendChild(collectionInfo);
    header.appendChild(galleryBtn);

    return header;
  }

  // ... [Keep all the existing methods: updateStats, updateLoadMoreButton, showLoading, etc.] ...

  /**
   * Get current filter values
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
    this.loadItems();
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
          <button onclick="BrowsePageController.addComment('${itemId}')" 
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
      Messages.showError('Please enter a comment');
      return;
    }

    try {
      await SupabaseClient.addComment(itemId, commentText);
      
      // Clear input
      input.value = '';
      
      // Reload comments
      const container = document.getElementById(`comments-${itemId}`);
      await this.loadComments(itemId, container);
      
      Messages.showSuccess('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      Messages.showError('Failed to add comment');
    }
  }
}

// Auto-initialize
BrowsePageController.init();
