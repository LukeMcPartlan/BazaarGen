/**
 * Profile Controller - Enhanced Implementation with Comprehensive Debugging
 * Handles user profile page functionality with proper image loading and detailed logging
 * Now supports viewing other users' profiles via URL parameters
 */
class ProfileController {
  static userItems = [];
  static userSkills = [];
  static userGalleries = [];
  static currentTab = 'cards';
  static debugMode = true; // Enable comprehensive debugging
  static targetUserAlias = null; // The user whose profile we're viewing
  static isOwnProfile = true; // Whether we're viewing our own profile

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[ProfileController] ${message}`, data || '');
    }
  }

  /**
   * Get target user from URL parameters
   */
  static getTargetUserFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      this.targetUserAlias = decodeURIComponent(userParam);
      this.isOwnProfile = false;
      this.debug('👤 Viewing profile for user:', this.targetUserAlias);
    } else {
      this.isOwnProfile = true;
      this.debug('👤 Viewing own profile');
    }
    
    return this.targetUserAlias;
  }

  /**
   * Initialize the profile page
   */
  static async init() {
    this.debug('🚀 Initializing ProfileController...');
    this.debug('Debug mode enabled:', this.debugMode);
    
    try {
      // Get target user from URL
      this.getTargetUserFromURL();
      
      if (!this.isOwnProfile) {
        // Validate that the target user exists
        this.debug(`🔍 Validating target user: ${this.targetUserAlias}`);
        const userExists = await SupabaseClient.userExistsByAlias(this.targetUserAlias);
        if (!userExists) {
          this.debug('❌ Target user does not exist');
          alert(`User "${this.targetUserAlias}" not found.`);
          window.location.href = 'browse.html';
          return;
        }
        this.debug('✅ Target user validated');
      }

      if (this.isOwnProfile) {
        // For own profile, require authentication
        this.debug('⏳ Waiting for GoogleAuth to be ready...');
        await this.waitForGoogleAuth();
        
        this.debug('🔐 Checking authentication status...');
        const isSignedIn = await this.checkAuthenticationWithRetry();
        if (!isSignedIn) {
          this.debug('❌ User not signed in, redirecting to index.html');
          window.location.href = 'index.html';
          return;
        }
        this.debug('✅ User is signed in');
      } else {
        // For other users' profiles, don't require authentication
        this.debug('👤 Viewing other user profile, authentication not required');
      }

      // Wait for database to be ready
      this.debug('🗄️ Waiting for database connection...');
      await this.waitForDatabase();
      this.debug('✅ Database is ready');

      if (this.isOwnProfile) {
        // Wait for user profile to be loaded (only for own profile)
        this.debug('👤 Waiting for user profile...');
        await this.waitForUserProfile();
        this.debug('✅ User profile loaded');
      }

      // Display user info
      this.debug('👤 Displaying user information...');
      this.displayUserInfo();
      this.updatePageTitle();

      if (this.isOwnProfile) {
        // Update user display in navigation bar (only for own profile)
        this.debug('👤 Updating user display in navigation...');
        await this.updateNavigationDisplay();
      }

      // Load user's content
      this.debug('📥 Loading user content...');
      await this.loadAllContent();

      if (this.isOwnProfile) {
        // Retry logic for displaying user alias (only for own profile)
        this.debug('👤 Starting alias display retry logic...');
        this.retryDisplayUserAlias();
      }

      // Close export menus when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-export-btn, .skill-export-btn, .export-menu')) {
          document.querySelectorAll('.export-menu').forEach(menu => {
            menu.style.display = 'none';
          });
        }
      });

      this.debug('🎉 ProfileController initialization complete');

    } catch (error) {
      this.debug('❌ Initialization failed:', error);
      console.error('ProfileController initialization error:', error);
      
      // If it's an authentication error and viewing own profile, redirect
      if (this.isOwnProfile && (error.message.includes('not signed in') || error.message.includes('authentication'))) {
        window.location.href = 'index.html';
      }
    }
  }

  /**
   * Wait for GoogleAuth to be fully initialized
   */
  static async waitForGoogleAuth() {
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      if (GoogleAuth && GoogleAuth.isInitialized) {
        this.debug('✅ GoogleAuth is ready');
        return;
      }
      
      this.debug(`⏳ Waiting for GoogleAuth (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 250));
      attempts++;
    }
    
    throw new Error('GoogleAuth failed to initialize');
  }

  /**
   * Check authentication status with retry logic
   */
  static async checkAuthenticationWithRetry() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      if (GoogleAuth && GoogleAuth.isSignedIn()) {
        this.debug('✅ Authentication confirmed');
        return true;
      }
      
      this.debug(`⏳ Checking authentication (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    this.debug('❌ Authentication check failed after maximum attempts');
    return false;
  }

  /**
   * Wait for database to be ready
   */
  static async waitForDatabase() {
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      if (SupabaseClient && SupabaseClient.isReady()) {
        this.debug('✅ Database is ready');
        return;
      }
      
      this.debug(`⏳ Waiting for database (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 250));
      attempts++;
    }
    
    throw new Error('Database not available');
  }

  /**
   * Update navigation display with proper retry logic
   */
  static async updateNavigationDisplay() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        if (GoogleAuth && GoogleAuth.updateUserDisplay) {
          GoogleAuth.updateUserDisplay();
          this.debug('✅ Navigation display updated');
          return;
        }
      } catch (error) {
        this.debug(`❌ Error updating navigation display (attempt ${attempts + 1}):`, error);
      }
      
      this.debug(`⏳ Retrying navigation update (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    this.debug('❌ Failed to update navigation display after maximum attempts');
  }

  /**
   * Wait for user profile to be loaded
   */
  static async waitForUserProfile() {
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts to wait longer
    
    while (attempts < maxAttempts) {
      // First, wait for database to be ready
      if (SupabaseClient && SupabaseClient.isReady()) {
        this.debug(`✅ Database ready on attempt ${attempts + 1}`);
        
        // Now try to get the user profile from the database
        try {
          const userEmail = GoogleAuth.getUserEmail();
          this.debug(`🗄️ Fetching user profile from database for: ${userEmail}`);
          
          const profile = await SupabaseClient.getUserProfile(userEmail);
          if (profile && profile.alias) {
            // Update GoogleAuth userProfile with the database data
            GoogleAuth.userProfile = profile;
            this.debug(`✅ User profile loaded from database: ${profile.alias}`);
            return;
          } else {
            this.debug('⚠️ No profile found in database, using existing profile');
            break;
          }
        } catch (error) {
          this.debug(`❌ Error fetching profile from database: ${error.message}`);
        }
      }
      
      this.debug(`⏳ Waiting for database and user profile (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    // Check if we have a valid profile from GoogleAuth
    const userProfile = GoogleAuth.getUserProfile();
    if (userProfile && userProfile.alias && userProfile.alias !== 'User') {
      this.debug(`✅ Using existing user profile: ${userProfile.alias}`);
    } else {
      this.debug('⚠️ User profile not loaded after maximum attempts, proceeding anyway');
    }
  }

  /**
   * Update page title based on user being viewed
   */
  static updatePageTitle() {
    if (this.isOwnProfile) {
      document.title = 'My Profile - Bazaar Generator';
    } else {
      document.title = `${this.targetUserAlias}'s Profile - Bazaar Generator`;
    }
  }

  /**
   * Display user information in the profile header
   */
  static displayUserInfo() {
    const profileHeader = document.querySelector('.profile-header h1');
    const profileSubtitle = document.querySelector('.profile-header p');
    
    if (this.isOwnProfile) {
      // Display own profile information
      if (profileHeader) {
        profileHeader.textContent = 'My Profile';
      }
      if (profileSubtitle) {
        profileSubtitle.textContent = 'Manage your items, skills, and collections';
      }
    } else {
      // Display other user's profile information
      if (profileHeader) {
        profileHeader.textContent = `${this.targetUserAlias}'s Profile`;
      }
      if (profileSubtitle) {
        profileSubtitle.textContent = `View ${this.targetUserAlias}'s items, skills, and collections`;
      }
    }
    
    this.debug('✅ User info displayed for:', this.isOwnProfile ? 'own profile' : `user: ${this.targetUserAlias}`);
  }

  /**
   * Load all user content (items, skills, galleries)
   */
  static async loadAllContent() {
    this.debug('📥 Starting to load all content...');
    
    try {
      // Load user's items
      this.debug('📦 Loading user items...');
      await this.loadUserCards();
      
      // Load user's skills
      this.debug('⚡ Loading user skills...');
      await this.loadUserSkills();
      
      // Update statistics
      this.debug('📊 Updating statistics...');
      this.updateStatistics();
      
      this.debug('✅ All content loaded successfully');
      
    } catch (error) {
      this.debug('❌ Error loading content:', error);
      console.error('Error loading user content:', error);
    }
  }

  /**
   * Load user's cards and galleries
   */
  static async loadUserCards() {
    this.debug('🎴 Loading user cards...');
    
    try {
      let items;
      
      if (this.isOwnProfile) {
        // Load current user's items
        this.debug('👤 Loading own items...');
        items = await SupabaseClient.getUserItems();
      } else {
        // Load target user's items by alias
        this.debug(`👤 Loading items for user: ${this.targetUserAlias}`);
        items = await SupabaseClient.getUserItemsByAlias(this.targetUserAlias);
      }
      
      this.userItems = items || [];
      this.debug(`📦 Loaded ${this.userItems.length} items`);
      
      // Clear existing items grid
      const itemsGrid = document.querySelector('.items-grid');
      if (itemsGrid) {
        itemsGrid.innerHTML = '';
      }
      
      // Create cards for each item
      this.debug('🎴 Creating item cards...');
      for (let i = 0; i < this.userItems.length; i++) {
        const item = this.userItems[i];
        this.debug(`🎴 Creating item ${i + 1}/${this.userItems.length} - ID: ${item.id}, Name: "${item.itemName}", Type: ${item.item_data?.isGallery ? 'Gallery' : 'Card'}`);
        
        try {
          const card = await this.createProfileItemCard(item);
          if (card && itemsGrid) {
            itemsGrid.appendChild(card);
            this.debug(`✅ Item ${item.id} added to grid`);
          } else {
            this.debug(`❌ Failed to create or append card for item ${item.id}`);
          }
        } catch (cardError) {
          this.debug(`❌ Error creating card for item ${item.id}:`, cardError);
          console.error(`Error creating card for item ${item.id}:`, cardError);
        }
      }
      
      this.debug('✅ All item cards created');
      
      // Hide loading indicator and show appropriate content
      const cardsLoading = document.getElementById('cardsLoading');
      const cardsEmpty = document.getElementById('cardsEmpty');
      const cardsGrid = document.getElementById('cardsGrid');
      
      if (cardsLoading) cardsLoading.style.display = 'none';
      
      if (this.userItems.length === 0) {
        if (cardsEmpty) cardsEmpty.style.display = 'block';
        if (cardsGrid) cardsGrid.style.display = 'none';
      } else {
        if (cardsEmpty) cardsEmpty.style.display = 'none';
        if (cardsGrid) cardsGrid.style.display = 'block';
      }
      
    } catch (error) {
      this.debug('❌ Error loading user cards:', error);
      console.error('Error loading user cards:', error);
      
      // Hide loading indicator on error too
      const cardsLoading = document.getElementById('cardsLoading');
      if (cardsLoading) cardsLoading.style.display = 'none';
      
      throw error;
    }
  }

  /**
   * Create a profile item card with proper controls
   */
  static async createProfileItemCard(item) {
    this.debug('🏗️ Creating profile item card for ID:', item.id);
    this.debug('🎴 Item data:', {
      id: item.id,
      itemName: item.item_data?.itemName,
      hero: item.item_data?.hero,
      user_email: item.user_email,
      user_alias: item.user_alias,
      isGallery: item.item_data?.isGallery,
      created_at: item.created_at
    });

    try {
      // Create card wrapper
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'profile-card-wrapper';
      cardWrapper.setAttribute('data-item-id', item.id);
      cardWrapper.style.cssText = `
        margin-bottom: 30px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
      `;

      // Add hover effect
      cardWrapper.addEventListener('mouseenter', () => {
        cardWrapper.style.transform = 'translateY(-3px)';
        cardWrapper.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.5)';
      });

      cardWrapper.addEventListener('mouseleave', () => {
        cardWrapper.style.transform = 'translateY(0)';
        cardWrapper.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
      });

      // Create delete button (only for own profile)
      if (this.isOwnProfile) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'profile-delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: linear-gradient(135deg, rgb(180, 60, 60) 0%, rgb(140, 40, 40) 100%);
          color: white;
          border: 2px solid rgb(200, 80, 80);
          border-radius: 50%;
          width: 35px;
          height: 35px;
          font-size: 16px;
          cursor: pointer;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
        `;

        deleteBtn.addEventListener('click', () => {
          const itemName = item.item_data?.itemName || 'this item';
          const itemType = item.item_data?.isGallery ? 'gallery' : 'item';
          if (confirm(`Are you sure you want to delete ${itemName}?`)) {
            this.deleteItem(item.id, itemType, itemName);
          }
        });

        cardWrapper.appendChild(deleteBtn);

        // Show delete button on hover
        cardWrapper.addEventListener('mouseenter', () => {
          deleteBtn.style.opacity = '1';
        });

        cardWrapper.addEventListener('mouseleave', () => {
          deleteBtn.style.opacity = '0';
        });
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
      `;

      const creatorAlias = item.user_alias || 'Unknown User';
      const createdDate = new Date(item.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Create clickable user link (only if viewing another user's profile)
      if (!this.isOwnProfile) {
        const userLink = this.createUserLink(creatorAlias);
        creatorInfo.innerHTML = `
          <span>Created by </span>
          <span>${createdDate}</span>
        `;
        
        // Insert the clickable link
        const createdBySpan = creatorInfo.querySelector('span');
        createdBySpan.appendChild(userLink);
      } else {
        creatorInfo.innerHTML = `
          <span>Created by <span style="color: rgb(218, 165, 32);">${creatorAlias}</span></span>
          <span>${createdDate}</span>
        `;
      }

      cardWrapper.appendChild(creatorInfo);

      // Create the actual card
      const cardData = {
        ...item.item_data,
        id: item.id,
        user_email: item.user_email,
        user_alias: item.user_alias,
        created_at: item.created_at,
        contest: item.contest,
        upvotes: item.upvotes
      };

      this.debug('🎴 Preparing card data for CardGenerator...');
      const cardElement = await CardGenerator.createCard({
        data: cardData,
        mode: 'browser',
        includeControls: true,
        skipValidation: item.item_data?.isGallery
      });

      if (cardElement) {
        this.debug('✅ Card element created successfully');
        
        // Wait for image to load
        const imageElement = cardElement.querySelector('img');
        if (imageElement) {
          await new Promise((resolve) => {
            if (imageElement.complete) {
              resolve();
            } else {
              imageElement.onload = resolve;
              imageElement.onerror = resolve;
            }
          });
        }

        // Add upvote button
        const upvoteButton = await this.createItemUpvoteButton(item);
        if (upvoteButton) {
          const controlsSection = cardElement.querySelector('.card-controls');
          if (controlsSection) {
            controlsSection.appendChild(upvoteButton);
            this.debug('✅ Working upvote button added to card controls');
          }
        }

        // Add export button
        const exportButton = this.createItemExportButton(item);
        if (exportButton) {
          const controlsSection = cardElement.querySelector('.card-controls');
          if (controlsSection) {
            controlsSection.appendChild(exportButton);
            this.debug('✅ Export button added to card controls');
          }
        }

        // Add gallery functionality if it's a gallery
        if (item.item_data?.isGallery) {
          this.debug('🖼️ Adding gallery functionality...');
          const galleryBtn = document.createElement('button');
          galleryBtn.className = 'card-gallery-btn';
          galleryBtn.innerHTML = '🖼️ View Gallery';
          galleryBtn.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: linear-gradient(135deg, rgb(138, 43, 226) 0%, rgb(98, 0, 234) 100%);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            cursor: pointer;
            z-index: 10;
            font-weight: bold;
          `;

          galleryBtn.addEventListener('click', () => {
            if (window.GalleryModal) {
              window.GalleryModal.open(item);
            }
          });

          cardElement.appendChild(galleryBtn);
          this.debug('✅ Gallery button added');

          // Add gallery styling
          cardWrapper.classList.add('gallery-item');
          this.debug('✅ Gallery styling applied');

          // Add gallery indicator
          const galleryIndicator = document.createElement('div');
          galleryIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, rgb(138, 43, 226) 0%, rgb(98, 0, 234) 100%);
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
            z-index: 10;
          `;
          galleryIndicator.innerHTML = '🖼️';
          cardElement.appendChild(galleryIndicator);
          this.debug('✅ Gallery indicator added');
        }

        // Create comments section
        this.debug('💬 Creating comments section...');
        const commentsSection = await this.createCommentsSection(item.id);
        if (commentsSection) {
          this.debug('✅ Comments section created');
        }

        // Position cooldown/ammo sections relative to on-use section
        this.debug('🎯 Positioning cooldown/ammo sections...');
        let retryCount = 0;
        const maxRetries = 5;
        
        const positionElements = async () => {
          try {
            await CardGenerator.positionElementsRelativeToOnUse(cardElement);
            this.debug('✅ Successfully positioned cooldown/ammo sections');
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 100;
              this.debug(`🔄 Retrying positioning (attempt ${retryCount}/${maxRetries}) in ${delay}ms`);
              setTimeout(positionElements, delay);
            } else {
              this.debug('❌ Failed to position elements after maximum retries');
            }
          }
        };

        await positionElements();

        cardWrapper.appendChild(cardElement);
        
        // Append comments section to cardWrapper (outside the card) like on browse page
        if (commentsSection) {
          cardWrapper.appendChild(commentsSection);
        }
        
        this.debug('🔧 Assembling card wrapper...');
        this.debug('✅ Profile item card completed for ID:', item.id);
        return cardWrapper;
      } else {
        this.debug('❌ Failed to create card element');
        return null;
      }
    } catch (error) {
      this.debug('❌ Error creating profile item card:', error);
      console.error('Error creating profile item card:', error);
      return null;
    }
  }

  /**
   * Load user's skills
   */
  static async loadUserSkills() {
    this.debug('⚡ Loading user skills...');
    
    try {
      // Show loading state
      const loadingEl = document.getElementById('skillsLoading');
      const gridEl = document.getElementById('skillsGrid');
      const emptyEl = document.getElementById('skillsEmpty');
      
      if (loadingEl) loadingEl.style.display = 'block';
      if (gridEl) gridEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'none';
      
      let skills;
      
      if (this.isOwnProfile) {
        // Load current user's skills
        this.debug('👤 Loading own skills...');
        skills = await SupabaseClient.getUserSkills();
      } else {
        // Load target user's skills by alias
        this.debug(`👤 Loading skills for user: ${this.targetUserAlias}`);
        skills = await SupabaseClient.getUserSkillsByAlias(this.targetUserAlias);
      }
      
      this.userSkills = skills || [];
      this.debug(`⚡ Loaded ${this.userSkills.length} skills`);
      
      // Hide loading state
      if (loadingEl) loadingEl.style.display = 'none';
      
      if (this.userSkills.length === 0) {
        this.debug('📭 No skills found, showing empty state');
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      
      // Create skill cards
      this.debug('⚡ Creating skill cards...');
      for (let i = 0; i < this.userSkills.length; i++) {
        const skill = this.userSkills[i];
        this.debug(`⚡ Creating skill ${i + 1}/${this.userSkills.length} - ID: ${skill.id}, Name: "${skill.skill_data?.skillName}"`);
        
        try {
          const skillCard = await this.createProfileSkill(skill);
          if (skillCard && gridEl) {
            gridEl.appendChild(skillCard);
            this.debug(`✅ Skill ${skill.id} added to grid`);
          } else {
            this.debug(`❌ Failed to create or append skill card for skill ${skill.id}`);
          }
        } catch (skillError) {
          this.debug(`❌ Error creating skill card for skill ${skill.id}:`, skillError);
          console.error(`Error creating skill card for skill ${skill.id}:`, skillError);
        }
      }
      
      this.debug('✅ All skill cards created');
      
    } catch (error) {
      this.debug('❌ Error loading user skills:', error);
      console.error('Error loading user skills:', error);
      
      // Hide loading and show error
      const loadingEl = document.getElementById('skillsLoading');
      const emptyEl = document.getElementById('skillsEmpty');
      
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) {
        emptyEl.innerHTML = '<h3>Error Loading Skills</h3><p>Failed to load skills. Please try refreshing the page.</p>';
        emptyEl.style.display = 'block';
      }
      
      throw error;
    }
  }

  /**
   * Create a skill element for profile display with enhanced styling
   */
  static async createProfileSkill(skill) {
    this.debug(`🏗️ Creating profile skill for ID: ${skill.id}`);
    
    try {
      this.debug(`📜 Skill data:`, {
        id: skill.id,
        skillName: skill.skill_data?.skillName,
        user_email: skill.user_email,
        user_alias: skill.user_alias
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'profile-card-wrapper';
      wrapper.style.cssText = 'position: relative; margin-bottom: 30px;';
      wrapper.setAttribute('data-item-id', skill.id); // Add unique identifier
      
      this.debug(`🎯 Skill wrapper created with data-item-id: ${skill.id}`);
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'profile-delete-btn';
      deleteBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%);
        border: 2px solid rgb(183, 28, 28);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        z-index: 1000;
        transition: all 0.3s ease;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      `;
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.title = `Delete "${skill.skill_data?.skillName || 'this skill'}"`;
      
      deleteBtn.onmouseenter = () => {
        deleteBtn.style.transform = 'translateY(-2px)';
        deleteBtn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.4)';
      };
      
      deleteBtn.onmouseleave = () => {
        deleteBtn.style.transform = 'translateY(0)';
        deleteBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
      };
      
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.debug(`🗑️ Delete button clicked for skill ${skill.id}`);
        this.deleteItem(skill.id, 'skill', skill.skill_data?.skillName || 'this skill');
      };
      
      wrapper.appendChild(deleteBtn);
      this.debug('✅ Delete button created and added');

      // Create creator info section (same as browse page)
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

      const creatorAlias = skill.user_alias || 'Your Creation';
      const createdDate = new Date(skill.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      this.debug('Creator info:', { creatorAlias, createdDate });

      creatorInfo.innerHTML = `
        <span style="font-weight: 600; color: rgb(251, 225, 183);">
          <span style="color: rgb(218, 165, 32);">Your Creation:</span> ${creatorAlias}
        </span>
        <span style="color: rgb(201, 175, 133); font-size: 12px;">${createdDate}</span>
      `;

      this.debug('✅ Creator info section created');
      
      wrapper.appendChild(creatorInfo);
      
      // Create the skill with enhanced styling
      this.debug('📜 Checking SkillGenerator availability...');
      if (typeof SkillGenerator !== 'undefined') {
        this.debug('📜 Creating skill element with SkillGenerator...');
        const skillElement = SkillGenerator.createSkill({
          data: skill.skill_data,
          mode: 'browser',
          includeControls: false, // Don't include default controls
          skipValidation: true // Skip validation for skills loaded from database
        });
        
        if (skillElement) {
          // Create custom controls section
          const controlsSection = document.createElement('div');
          controlsSection.className = 'skill-controls';
          controlsSection.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            align-items: center;
            padding: 10px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            margin-top: 10px;
          `;

          // *** ADD WORKING UPVOTE BUTTON ***
          const upvoteButton = await this.createSkillUpvoteButton(skill);
          controlsSection.appendChild(upvoteButton);
          this.debug('✅ Working skill upvote button added to skill controls');

          // *** ADD EXPORT BUTTON ***
          const exportButton = this.createSkillExportButton(skill);
          controlsSection.appendChild(exportButton);
          this.debug('✅ Export button added to skill controls');
          
          // Add controls section to skill element
          skillElement.appendChild(controlsSection);
          
          wrapper.appendChild(skillElement);
          this.debug('✅ Skill element created and added');
        } else {
          this.debug('❌ SkillGenerator returned null/undefined');
        }
      } else {
        this.debug('❌ SkillGenerator not available');
      }

      // Create comments section for skills too
      this.debug('💬 Creating comments section for skill...');
      const commentsSection = await this.createSkillCommentsSection(skill.id);
      if (commentsSection) {
        wrapper.appendChild(commentsSection);
        this.debug('✅ Comments section added to skill');
      } else {
        this.debug('⚠️ Comments section creation failed, continuing without comments');
      }
      
      this.debug(`✅ Profile skill completed for ID: ${skill.id}`);
      return wrapper;
    } catch (error) {
      this.debug(`❌ Error creating profile skill for ID: ${skill.id}:`, error);
      console.error('Error creating profile skill:', error);
      return null;
    }
  }

  /**
   * Display galleries with enhanced card creation
   */
  static async displayGalleries() {
    this.debug('🖼️ Starting to display galleries...');
    
    const loadingEl = document.getElementById('galleriesLoading');
    const gridEl = document.getElementById('galleriesGrid');
    const emptyEl = document.getElementById('galleriesEmpty');
    
    this.debug('Gallery DOM elements found:', {
      loadingEl: !!loadingEl,
      gridEl: !!gridEl,
      emptyEl: !!emptyEl
    });
    
    this.debug(`📊 Gallery stats: ${this.userGalleries.length} galleries available`);
    
    // Debug: Log the first gallery data structure
    if (this.userGalleries.length > 0) {
      this.debug('First gallery data structure:', {
        id: this.userGalleries[0].id,
        itemName: this.userGalleries[0].item_data?.itemName,
        isGallery: this.userGalleries[0].item_data?.isGallery,
        galleryItemsCount: this.userGalleries[0].item_data?.galleryItems?.length,
        galleryItems: this.userGalleries[0].item_data?.galleryItems?.slice(0, 2) // First 2 items
      });
    }
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (gridEl) gridEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';
    
    if (this.userGalleries.length === 0) {
      this.debug('📭 No galleries found, showing empty state');
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      this.debug(`🖼️ Creating ${this.userGalleries.length} gallery cards...`);
      
      // Display each gallery using the enhanced card creation
      for (let i = 0; i < this.userGalleries.length; i++) {
        const gallery = this.userGalleries[i];
        this.debug(`🖼️ Creating gallery ${i + 1}/${this.userGalleries.length} - ID: ${gallery.id}`);
        
        try {
          const galleryCard = await this.createProfileItemCard(gallery); // Use same method as regular cards
          if (galleryCard && gridEl) {
            gridEl.appendChild(galleryCard);
            this.debug(`✅ Gallery ${gallery.id} added to grid`);
          } else {
            this.debug(`❌ Failed to create or append gallery ${gallery.id}`);
          }
        } catch (error) {
          this.debug(`❌ Error creating gallery ${gallery.id}:`, error);
          console.error(`Failed to create gallery for item ${gallery.id}:`, error);
        }
      }
      
      if (loadingEl) loadingEl.style.display = 'none';
      this.debug('✅ All galleries displayed');
    }
  }

  /**
   * Switch between tabs
   */
  static switchTab(tab) {
    this.debug(`🔄 Switching to tab: ${tab}`);
    
    // Update current tab
    this.currentTab = tab;
    
    // Update tab button states
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    
    // Activate the clicked tab
    const activeButton = document.querySelector(`[onclick="ProfileController.switchTab('${tab}')"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show the selected content section
    const targetSection = document.getElementById(`${tab}Section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    this.debug(`✅ Switched to ${tab} tab`);
  }

  /**
   * Update statistics display
   */
  static updateStatistics() {
    this.debug('📊 Updating statistics...');
    
    const totalCardsEl = document.getElementById('totalCards');
    const totalSkillsEl = document.getElementById('totalSkills');
    
    if (totalCardsEl) {
      const totalCards = this.userItems.length + this.userGalleries.length;
      totalCardsEl.textContent = totalCards;
      this.debug(`📊 Total cards & galleries: ${totalCards}`);
    }
    
    if (totalSkillsEl) {
      totalSkillsEl.textContent = this.userSkills.length;
      this.debug(`📊 Total skills: ${this.userSkills.length}`);
    }
  }

  /**
   * Create comments section for items
   */
  static async createCommentsSection(itemId) {
    this.debug(`💬 Creating comments section for item: ${itemId}`);
    
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
          <button onclick="ProfileController.addComment('${itemId}')" 
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
   * Create comments section for skills
   */
  static async createSkillCommentsSection(skillId) {
    this.debug(`💬 Creating comments section for skill: ${skillId}`);
    
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
    commentsList.id = `skill-comments-${skillId}`;
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
          <button onclick="ProfileController.addSkillComment('${skillId}')" 
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
      
      if (comments && comments.length > 0) {
        comments.forEach(comment => {
          const commentDiv = document.createElement('div');
          commentDiv.style.cssText = `
            background: white; 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 6px; 
            border-left: 4px solid rgb(218, 165, 32);
          `;
          
          const userLink = this.createUserLink(comment.user_alias, comment.user_alias);
          const timestamp = new Date(comment.created_at).toLocaleString();
          
          commentDiv.innerHTML = `
            <strong>${userLink.outerHTML}</strong> 
            <span style="color: #666; font-size: 12px;">${timestamp}</span>
            <br>
            <span>${comment.comment_text}</span>
          `;
          
          container.appendChild(commentDiv);
        });
      } else {
        const noCommentsDiv = document.createElement('div');
        noCommentsDiv.style.cssText = 'text-align: center; color: rgb(251, 225, 183); font-style: italic; padding: 20px;';
        noCommentsDiv.textContent = 'No comments yet. Be the first to comment!';
        container.appendChild(noCommentsDiv);
      }
    } catch (error) {
      this.debug('❌ Error loading skill comments:', error);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'text-align: center; color: #f44336; font-style: italic; padding: 20px;';
      errorDiv.textContent = 'Failed to load comments';
      container.appendChild(errorDiv);
    }
  }

  /**
   * Add a comment to a skill
   */
  static async addSkillComment(skillId) {
    const input = document.getElementById(`skill-comment-input-${skillId}`);
    if (!input || !input.value.trim()) return;

    const commentText = input.value.trim();
    input.value = '';

    try {
      await SupabaseClient.addSkillComment(skillId, commentText);
      
      // Reload comments
      const commentsContainer = document.getElementById(`skill-comments-${skillId}`);
      if (commentsContainer) {
        commentsContainer.innerHTML = '';
        await this.loadSkillComments(skillId, commentsContainer);
      }
    } catch (error) {
      this.debug('❌ Error adding skill comment:', error);
      alert('Failed to add comment. Please try again.');
    }
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
   * Delete an item
   */
  static async deleteItem(itemId, type, itemName) {
    this.debug(`🗑️ Deleting ${type}: ${itemName} (ID: ${itemId})`);
    
    const confirmed = confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`);
    
    if (confirmed) {
      try {
        if (type === 'item' || type === 'card') {
          await SupabaseClient.deleteItem(itemId);
        } else if (type === 'skill') {
          await SupabaseClient.deleteSkill(itemId);
        }
        
        this.debug(`✅ ${type} deleted successfully`);
        
        // Reload content
        await this.loadAllContent();
        
        if (typeof Messages !== 'undefined') {
          Messages.showSuccess(`${type} deleted successfully`);
        }
      } catch (error) {
        this.debug(`❌ Error deleting ${type}: ${error.message}`);
        console.error(`Error deleting ${type}:`, error);
        
        if (typeof Messages !== 'undefined') {
          Messages.showError(`Failed to delete ${type}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Create working upvote button for items (copied from browse page)
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
   * Handle item upvote (copied from browse page)
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
   * Handle skill upvote (copied from browse page)
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
   * Create export button for profile page items (without "Save to Profile" option)
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
      this.toggleProfileExportMenu(exportBtn, item);
    };

    return exportBtn;
  }

  /**
   * Create export button for profile page skills (without "Save to Profile" option)
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
      this.toggleProfileExportMenu(exportBtn, skill);
    };

    return exportBtn;
  }

  /**
   * Toggle export menu for profile page (without "Save to Profile" option)
   */
  static toggleProfileExportMenu(button, itemData) {
    this.debug('💾 [DEBUG] toggleProfileExportMenu called', {button, itemData});
    
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
          this.debug('❌ No skill_data or item_data found in itemData:', itemData);
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
          this.debug('❌ No skill_data or item_data found in itemData:', itemData);
        }
        menu.style.display = 'none';
      };
      
      menu.appendChild(dataOption);
      menu.appendChild(pngOption);
      button.parentElement.appendChild(menu);
      this.debug('💾 [DEBUG] Profile export menu created');
    }

    menu.style.display = 'block';
  }

  /**
   * Retry logic for displaying user alias (after page loads)
   */
  static retryDisplayUserAlias() {
    this.debug('👤 Starting alias display retry logic...');
    
    let attempts = 0;
    const maxAttempts = 15; // Increased attempts
    const retryInterval = 500; // 500ms between attempts
    
    const attemptDisplayAlias = async () => {
      attempts++;
      this.debug(`👤 Alias display attempt ${attempts}/${maxAttempts}...`);
      
      const profileNameEl = document.getElementById('profileName');
      if (!profileNameEl) {
        this.debug('❌ Profile name element not found');
        if (attempts < maxAttempts) {
          setTimeout(attemptDisplayAlias, retryInterval);
        }
        return;
      }
      
      // Try multiple sources for the alias
      let displayName = null;
      
      // 1. Try GoogleAuth userProfile
      const userProfile = GoogleAuth.getUserProfile();
      if (userProfile && userProfile.alias && userProfile.alias !== 'User') {
        displayName = userProfile.alias;
        this.debug('✅ Found alias from GoogleAuth userProfile:', displayName);
      }
      
      // 2. Try GoogleAuth getUserDisplayName
      if (!displayName) {
        const displayNameFromMethod = GoogleAuth.getUserDisplayName();
        if (displayNameFromMethod && displayNameFromMethod !== 'User') {
          displayName = displayNameFromMethod;
          this.debug('✅ Found alias from getUserDisplayName:', displayName);
        }
      }
      
      // 3. Try to fetch from database if still not found
      if (!displayName && attempts >= 3) {
        this.debug('🗄️ Attempting to fetch alias from database...');
        try {
          const alias = await this.fetchAliasFromDatabase();
          if (alias && alias !== 'User') {
            displayName = alias;
            this.debug('✅ Alias fetched from database:', displayName);
          }
        } catch (error) {
          this.debug('❌ Error fetching alias from database:', error);
        }
      }
      
      // Set the display name if found
      if (displayName) {
        profileNameEl.textContent = displayName;
        this.debug('✅ User alias displayed successfully:', displayName);
        
        // Also update the navigation bar
        this.debug('🔄 Updating navigation bar with alias...');
        try {
          if (GoogleAuth && GoogleAuth.updateUserDisplay) {
            GoogleAuth.updateUserDisplay();
            this.debug('✅ Navigation bar updated with alias');
          }
        } catch (navError) {
          this.debug('❌ Error updating navigation bar:', navError);
        }
        
        return;
      }
      
      // Retry if not found and haven't exceeded max attempts
      if (attempts < maxAttempts) {
        this.debug(`⏳ Alias not found, retrying in ${retryInterval}ms...`);
        setTimeout(attemptDisplayAlias, retryInterval);
      } else {
        this.debug('❌ Failed to find user alias after maximum attempts');
        profileNameEl.textContent = 'User';
      }
    };
    
    // Start the retry process
    attemptDisplayAlias();
  }

  /**
   * Fetch user alias from database
   */
  static async fetchAliasFromDatabase() {
    try {
      const userEmail = GoogleAuth.getUserEmail();
      if (!userEmail) {
        throw new Error('No user email available');
      }
      
      const profile = await SupabaseClient.getUserProfile(userEmail);
      if (profile && profile.alias) {
        // Update GoogleAuth userProfile with the database data
        GoogleAuth.userProfile = profile;
        return profile.alias;
      }
      
      return null;
    } catch (error) {
      this.debug('❌ Error fetching alias from database:', error);
      return null;
    }
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