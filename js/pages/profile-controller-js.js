/**
 * Profile Controller - Enhanced Implementation with Comprehensive Debugging
 * Handles user profile page functionality with proper image loading and detailed logging
 */
class ProfileController {
  static userItems = [];
  static userSkills = [];
  static userGalleries = [];
  static currentTab = 'cards';
  static debugMode = true; // Enable comprehensive debugging

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[ProfileController] ${message}`, data || '');
    }
  }

  /**
   * Initialize the profile page
   */
  static async init() {
    this.debug('🚀 Initializing ProfileController...');
    this.debug('Debug mode enabled:', this.debugMode);
    
    try {
      // Check if user is signed in
      this.debug('🔐 Checking authentication status...');
      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        this.debug('❌ User not signed in, redirecting to index.html');
        window.location.href = 'index.html';
        return;
      }

      this.debug('✅ User is signed in');

      // Check database connection
      this.debug('🗄️ Checking database connection...');
      if (!SupabaseClient || !SupabaseClient.isReady()) {
        this.debug('❌ Database not ready');
        throw new Error('Database not available');
      }

      this.debug('✅ Database is ready');

      // Wait for user profile to be loaded
      this.debug('👤 Waiting for user profile to be loaded...');
      await this.waitForUserProfile();

      // Display user info
      this.debug('👤 Displaying user information...');
      this.displayUserInfo();

      // Update user display in navigation bar
      this.debug('👤 Updating user display in navigation...');
      if (GoogleAuth && GoogleAuth.updateUserDisplay) {
        GoogleAuth.updateUserDisplay();
      }

      // Load user's content
      this.debug('📥 Loading user content...');
      await this.loadAllContent();

      this.debug('🎉 ProfileController initialization complete');

    } catch (error) {
      this.debug('❌ Initialization failed:', error);
      console.error('ProfileController initialization error:', error);
    }
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
   * Display user information
   */
  static displayUserInfo() {
    this.debug('👤 Getting user profile information...');
    
    const userProfile = GoogleAuth.getUserProfile();
    const userEmail = GoogleAuth.getUserEmail();
    const displayName = GoogleAuth.getUserDisplayName();

    this.debug('User profile data:', {
      userProfile,
      userEmail,
      displayName,
      alias: userProfile?.alias,
      currentUser: GoogleAuth.currentUser,
      currentUserName: GoogleAuth.currentUser?.name
    });

    const profileNameEl = document.getElementById('profileName');

    this.debug('DOM elements found:', {
      profileNameEl: !!profileNameEl
    });

    if (profileNameEl) {
      profileNameEl.textContent = displayName;
      this.debug('✅ Profile name set to:', displayName);
    } else {
      this.debug('❌ Profile name element not found');
    }
  }

  /**
   * Load all user content
   */
  static async loadAllContent() {
    this.debug('📥 Starting to load all user content...');
    
    try {
      this.debug('�� Loading user cards and galleries...');
      await this.loadUserCards();
      
      this.debug('📜 Loading user skills...');
      await this.loadUserSkills();
      
      this.debug('📈 Updating statistics...');
      this.updateStatistics();
      
      this.debug('✅ All content loaded successfully');
    } catch (error) {
      this.debug('❌ Error loading content:', error);
      console.error('Error loading content:', error);
      Messages.showError('Failed to load some content');
    }
  }

  /**
   * Load user's cards with proper image handling
   */
  static async loadUserCards() {
    this.debug('🎴 Starting to load user cards...');
    
    const loadingEl = document.getElementById('cardsLoading');
    const gridEl = document.getElementById('cardsGrid');
    const emptyEl = document.getElementById('cardsEmpty');
    
    this.debug('DOM elements found:', {
      loadingEl: !!loadingEl,
      gridEl: !!gridEl,
      emptyEl: !!emptyEl
    });

    try {
      this.debug('⏳ Setting loading state...');
      if (loadingEl) loadingEl.style.display = 'block';
      if (gridEl) gridEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'none';
      
      // Get user's items from database
      this.debug('🗄️ Fetching items from database...');
      const items = await SupabaseClient.getUserItems();
      this.debug(`📦 Retrieved ${items.length} items from database`);
      
      // Log raw item data for debugging
      this.debug('Raw items data preview:', items.slice(0, 2).map(item => ({
        id: item.id,
        user_email: item.user_email,
        user_alias: item.user_alias,
        itemName: item.item_data?.itemName,
        isGallery: item.item_data?.isGallery,
        created_at: item.created_at
      })));
      
      // Separate regular cards and galleries
      this.userItems = items.filter(item => !item.item_data?.isGallery);
      this.userGalleries = items.filter(item => item.item_data?.isGallery);
      
      this.debug('📊 Items categorized:', {
        totalItems: items.length,
        regularCards: this.userItems.length,
        galleries: this.userGalleries.length
      });
      
      // Debug: Log gallery detection
      this.debug('Gallery detection details:', items.map(item => ({
        id: item.id,
        itemName: item.item_data?.itemName,
        isGallery: item.item_data?.isGallery,
        galleryItemsCount: item.item_data?.galleryItems?.length,
        hasImageData: !!item.item_data?.imageData,
        firstGalleryItemImage: item.item_data?.galleryItems && item.item_data?.galleryItems[0] ? !!item.item_data?.galleryItems[0].imageData : false
      })));
      
      if (loadingEl) loadingEl.style.display = 'none';
      
      // Combine regular cards and galleries for display
      const allItemsToDisplay = [...this.userItems, ...this.userGalleries];
      
      if (allItemsToDisplay.length === 0) {
        this.debug('📭 No cards or galleries found, showing empty state');
        if (emptyEl) emptyEl.style.display = 'block';
      } else {
        this.debug(`🎴 Creating ${allItemsToDisplay.length} card/gallery elements...`);
        
        // Display each card/gallery using the same method as browse page
        for (let i = 0; i < allItemsToDisplay.length; i++) {
          const item = allItemsToDisplay[i];
          this.debug(`🎴 Creating item ${i + 1}/${allItemsToDisplay.length} - ID: ${item.id}, Name: "${item.item_data?.itemName}", Type: ${item.item_data?.isGallery ? 'Gallery' : 'Card'}`);
          
          try {
            // Use the same card creation method as BrowsePageController
            const cardWrapper = await this.createProfileItemCard(item);
            if (cardWrapper && gridEl) {
              gridEl.appendChild(cardWrapper);
              this.debug(`✅ Item ${item.id} added to grid`);
            } else {
              this.debug(`❌ Failed to create or append item ${item.id}`);
            }
          } catch (error) {
            this.debug(`❌ Error creating item ${item.id}:`, error);
            console.error(`Failed to create item for ${item.id}:`, error);
          }
        }
        
        this.debug('✅ All items created and added to grid');
      }
      
    } catch (error) {
      this.debug('❌ Error loading cards:', error);
      console.error('Error loading cards:', error);
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
    }
  }

  /**
   * Create profile item card using same logic as browse page but with delete functionality
   */
  static async createProfileItemCard(item) {
    this.debug(`🏗️ Creating profile item card for ID: ${item.id}`);
    
    if (!item.item_data) {
      this.debug(`❌ Item ${item.id} has no item_data`);
      console.warn(`Item ${item.id} has no item_data`);
      return null;
    }

    try {
      this.debug(`🎴 Item data:`, {
        id: item.id,
        itemName: item.item_data.itemName,
        hero: item.item_data.hero,
        user_email: item.user_email,
        user_alias: item.user_alias,
        isGallery: item.item_data.isGallery
      });

      // Create a wrapper div for the entire card section (same as browse page)
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'card-wrapper profile-card-wrapper';
      cardWrapper.style.cssText = 'margin-bottom: 30px; position: relative;';
      cardWrapper.setAttribute('data-item-id', item.id); // Add unique identifier
      
      this.debug(`🎯 Card wrapper created with data-item-id: ${item.id}`);

      // Add delete button first (positioned absolutely)
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
      deleteBtn.title = `Delete "${item.item_data?.itemName || 'this card'}"`;
      
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
        this.debug(`🗑️ Delete button clicked for item ${item.id}`);
        this.deleteItem(item.id, 'card', item.item_data?.itemName || 'this card');
      };

      this.debug('✅ Delete button created and configured');

      // Create creator info section (same as browse page but showing "Your Creation")
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

      const creatorAlias = item.user_alias || 'Your Creation';
      const createdDate = new Date(item.created_at).toLocaleDateString('en-US', {
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

      // Create the card using the same data structure as browse page
      this.debug('🎴 Preparing card data for CardGenerator...');
      const cardData = item.item_data;
      cardData.created_at = item.created_at;
      cardData.creator_alias = creatorAlias;
      cardData.database_id = item.id;

      // Debug gallery data specifically
      if (cardData.isGallery) {
        this.debug('🖼️ Gallery data debug:', {
          hasImageData: !!cardData.imageData,
          imageDataLength: cardData.imageData ? cardData.imageData.length : 0,
          hasGalleryItems: !!(cardData.galleryItems && cardData.galleryItems.length > 0),
          galleryItemsCount: cardData.galleryItems ? cardData.galleryItems.length : 0,
          firstGalleryItemImage: cardData.galleryItems && cardData.galleryItems[0] ? !!cardData.galleryItems[0].imageData : false,
          firstGalleryItemImageLength: cardData.galleryItems && cardData.galleryItems[0] && cardData.galleryItems[0].imageData ? cardData.galleryItems[0].imageData.length : 0
        });
      }

      this.debug('🎴 Calling CardGenerator.createCard...');
      
      // For galleries, skip validation since they have a different structure
      const cardElement = await CardGenerator.createCard({
        data: cardData,
        mode: 'browser',
        includeControls: true, // Include controls for full functionality
        skipValidation: item.item_data?.isGallery // Skip validation for galleries
      });

      if (!cardElement) {
        this.debug('❌ CardGenerator returned null/undefined');
        throw new Error('CardGenerator failed to create card element');
      }

      this.debug('✅ Card element created successfully');

      // Add gallery functionality if this is a saved gallery
      if (item.item_data?.isGallery && item.item_data?.galleryItems) {
        this.debug('🖼️ Adding gallery functionality...');
        
        // Add gallery button to view it
        if (typeof GalleryModal !== 'undefined') {
          GalleryModal.addGalleryButton(
            cardElement,
            item.item_data.galleryItems,
            0
          );
          this.debug('✅ Gallery button added');
        } else {
          this.debug('❌ GalleryModal not available');
        }
        
        // Style the card differently to show it's a gallery
        const passiveSection = cardElement.querySelector('.passive-section');
        if (passiveSection) {
          passiveSection.style.background = 'linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(48, 63, 159, 0.1) 100%)';
          passiveSection.style.borderColor = 'rgb(63, 81, 181)';
          this.debug('✅ Gallery styling applied');
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
        this.debug('✅ Gallery indicator added');
      }

      // Create comments section (same as browse page)
      this.debug('💬 Creating comments section...');
      const commentsSection = await this.createCommentsSection(item.id);
      this.debug('✅ Comments section created');

      // Assemble the wrapper
      this.debug('🔧 Assembling card wrapper...');
      cardWrapper.appendChild(deleteBtn);
      cardWrapper.appendChild(creatorInfo);
      cardWrapper.appendChild(cardElement);
      cardWrapper.appendChild(commentsSection); // Add comments section

      this.debug(`✅ Profile item card completed for ID: ${item.id}`);
      return cardWrapper;
    } catch (error) {
      this.debug(`❌ Error creating profile item card for ID: ${item.id}:`, error);
      console.error('Error creating profile item card:', error);
      return null;
    }
  }

  /**
   * Load user's skills
   */
  static async loadUserSkills() {
    this.debug('📜 Starting to load user skills...');
    
    const loadingEl = document.getElementById('skillsLoading');
    const gridEl = document.getElementById('skillsGrid');
    const emptyEl = document.getElementById('skillsEmpty');
    
    this.debug('DOM elements found:', {
      loadingEl: !!loadingEl,
      gridEl: !!gridEl,
      emptyEl: !!emptyEl
    });
    
    try {
      this.debug('⏳ Setting loading state...');
      if (loadingEl) loadingEl.style.display = 'block';
      if (gridEl) gridEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'none';
      
      // Get user's skills from database
      this.debug('🗄️ Fetching skills from database...');
      const skills = await SupabaseClient.getUserSkills();
      this.userSkills = skills;
      this.debug(`📜 Retrieved ${skills.length} skills from database`);
      
      // Log raw skill data for debugging
      this.debug('Raw skills data preview:', skills.slice(0, 2).map(skill => ({
        id: skill.id,
        user_email: skill.user_email,
        user_alias: skill.user_alias,
        skillName: skill.skill_data?.skillName,
        created_at: skill.created_at
      })));
      
      if (loadingEl) loadingEl.style.display = 'none';
      
      if (skills.length === 0) {
        this.debug('📭 No skills found, showing empty state');
        if (emptyEl) emptyEl.style.display = 'block';
      } else {
        this.debug(`📜 Creating ${skills.length} skill elements...`);
        
        // Display each skill
        for (let i = 0; i < skills.length; i++) {
          const skill = skills[i];
          this.debug(`📜 Creating skill ${i + 1}/${skills.length} - ID: ${skill.id}, Name: "${skill.skill_data?.skillName}"`);
          
          const skillWrapper = await this.createProfileSkill(skill);
          if (skillWrapper && gridEl) {
            gridEl.appendChild(skillWrapper);
            this.debug(`✅ Skill ${skill.id} added to grid`);
          } else {
            this.debug(`❌ Failed to create or append skill ${skill.id}`);
          }
        }
        
        this.debug('✅ All skills created and added to grid');
      }
      
    } catch (error) {
      this.debug('❌ Error loading skills:', error);
      console.error('Error loading skills:', error);
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
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
          includeControls: true,
          skipValidation: true // Skip validation for skills loaded from database
        });
        
        if (skillElement) {
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
      const commentsSection = await this.createCommentsSection(skill.id);
      wrapper.appendChild(commentsSection);
      this.debug('✅ Comments section added to skill');
      
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
    this.debug(`