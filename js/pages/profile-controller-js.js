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

      // Display user info
      this.debug('👤 Displaying user information...');
      this.displayUserInfo();

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
   * Display user information
   */
  static displayUserInfo() {
    this.debug('👤 Getting user profile information...');
    
    const userProfile = GoogleAuth.getUserProfile();
    const userEmail = GoogleAuth.getUserEmail();

    this.debug('User profile data:', {
      userProfile,
      userEmail,
      alias: userProfile?.alias
    });

    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');

    if (profileNameEl) {
      // Always use alias or fallback to email username
      let displayedName = userProfile?.alias;
      if (!displayedName && userEmail) {
        displayedName = userEmail.split('@')[0];
      }
      if (!displayedName) {
        displayedName = 'Unknown User';
      }
      profileNameEl.textContent = displayedName;
      this.debug('✅ Profile name set to:', displayedName);
    } else {
      this.debug('❌ Profile name element not found');
    }

    if (profileEmailEl) {
      const displayedEmail = userEmail || '-';
      profileEmailEl.textContent = displayedEmail;
      this.debug('✅ Profile email set to:', displayedEmail);
    } else {
      this.debug('❌ Profile email element not found');
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
    this.debug(`🔄 Switching to tab: ${tab} (from ${this.currentTab})`);
    
    this.currentTab = tab;
    
    // Update tab buttons
    this.debug('🔄 Updating tab button states...');
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all sections
    this.debug('🔄 Hiding all content sections...');
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show selected section
    this.debug(`🔄 Showing ${tab} section...`);
    switch(tab) {
      case 'cards':
        document.getElementById('cardsSection').classList.add('active');
        this.debug('✅ Cards section activated');
        break;
      case 'skills':
        document.getElementById('skillsSection').classList.add('active');
        this.debug('✅ Skills section activated');
        break;
      default:
        this.debug(`❌ Unknown tab: ${tab}`);
    }
  }

  /**
   * Update statistics
   */
  static updateStatistics() {
    this.debug('📊 Updating statistics...');
    
    const stats = {
      cards: this.userItems.length + this.userGalleries.length, // Include galleries in card count
      skills: this.userSkills.length
    };
    
    this.debug('📊 Stats calculated:', stats);
    
    // Update DOM elements
    const totalCardsEl = document.getElementById('totalCards');
    const totalSkillsEl = document.getElementById('totalSkills');
    
    if (totalCardsEl) {
      totalCardsEl.textContent = stats.cards;
      this.debug('✅ Cards count updated:', stats.cards);
    } else {
      this.debug('❌ Total cards element not found');
    }
    
    if (totalSkillsEl) {
      totalSkillsEl.textContent = stats.skills;
      this.debug('✅ Skills count updated:', stats.skills);
    } else {
      this.debug('❌ Total skills element not found');
    }
    
    this.debug('✅ Statistics update complete');
  }

  /**
   * Create comments section for an item (same as browse page)
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
      ">Show</button>
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
      display: none;
    `;

    // Add comment form
    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    commentForm.style.display = 'none';
    
    if (window.GoogleAuth && GoogleAuth.isSignedIn()) {
      commentForm.innerHTML = `
        <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 2px solid rgb(218, 165, 32); padding-top: 15px;">
          <input type="text" 
                 id="comment-input-${itemId}" 
                 placeholder="Add a comment..." 
                 style="flex: 1; padding: 10px 15px !important; border: 2px solid rgb(218, 165, 32) !important; border-radius: 6px !important; background-color: rgba(37, 26, 12, 0.8) !important; color: rgb(251, 225, 183) !important; font-size: 14px !important; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);">
          <button onclick="ProfileController.addComment('${itemId}')" 
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
   * Load comments for an item (same as browse page)
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
   * Add a comment to an item (same as browse page)
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
  static async deleteItem(itemId, type, itemName) {
    const confirmed = confirm(`Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone and will permanently remove this ${type} from the database.`);
    
    if (!confirmed) return;

    // Find the card wrapper that contains this item
    const cardWrapper = document.querySelector(`[data-item-id="${itemId}"]`);
    
    // Show loading state
    const deleteButton = cardWrapper ? cardWrapper.querySelector('.profile-delete-btn') : null;
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.innerHTML = '⏳ Deleting...';
      deleteButton.style.opacity = '0.6';
    }
    
    // Add visual feedback to the card
    if (cardWrapper) {
      cardWrapper.style.opacity = '0.6';
      cardWrapper.style.pointerEvents = 'none';
    }
    
    try {
      console.log(`🗑️ Attempting to delete ${type} with ID: ${itemId}, Name: "${itemName}"`);
      Messages.showInfo(`Deleting ${type}...`);
      
      let result;
      if (type === 'skill') {
        result = await SupabaseClient.deleteSkill(itemId);
      } else {
        result = await SupabaseClient.deleteItem(itemId);
      }
      
      console.log(`🗑️ Delete result:`, result);
      
      // Check for successful deletion
      // In Supabase, success is indicated by error: null
      if (result && (result.error === null || result.success === true)) {
        Messages.showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        
        // Remove the item from our local arrays
        if (type === 'skill') {
          this.userSkills = this.userSkills.filter(skill => skill.id !== itemId);
        } else {
          // Remove from both userItems and userGalleries arrays
          this.userItems = this.userItems.filter(item => item.id !== itemId);
          this.userGalleries = this.userGalleries.filter(gallery => gallery.id !== itemId);
        }
        
        // Remove the card wrapper from the DOM with animation
        if (cardWrapper) {
          cardWrapper.style.transition = 'all 0.3s ease';
          cardWrapper.style.opacity = '0';
          cardWrapper.style.transform = 'scale(0.8)';
          
          setTimeout(() => {
            if (cardWrapper.parentNode) {
              cardWrapper.remove();
            }
          }, 300);
        }
        
        // Update statistics
        this.updateStatistics();
        
        console.log(`✅ ${type} deleted successfully from database, removing from UI...`);
        
        // Remove the card wrapper from the DOM with animation
        if (cardWrapper) {
          cardWrapper.style.transition = 'all 0.3s ease';
          cardWrapper.style.opacity = '0';
          cardWrapper.style.transform = 'scale(0.8)';
          
          setTimeout(() => {
            if (cardWrapper.parentNode) {
              cardWrapper.remove();
              console.log(`🎯 Card wrapper removed from DOM for ${type} ID: ${itemId}`);
            }
          }, 300);
        } else {
          console.warn(`⚠️ Could not find card wrapper for ${type} ID: ${itemId}`);
        }
        
      } else {
        // Handle deletion failure
        const errorMessage = result?.error?.message || result?.error || 'Delete operation failed';
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('Error deleting item:', error);
      Messages.showError(`Failed to delete ${type}: ` + error.message);
      
      // Re-enable button and restore card on error
      if (deleteButton) {
        deleteButton.disabled = false;
        deleteButton.innerHTML = '🗑️ Delete';
        deleteButton.style.opacity = '1';
      }
      
      if (cardWrapper) {
        cardWrapper.style.opacity = '1';
        cardWrapper.style.pointerEvents = 'auto';
      }
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth to be ready
  let authCheckCount = 0;
  const checkAuth = setInterval(() => {
    authCheckCount++;
    
    if (typeof GoogleAuth !== 'undefined' && GoogleAuth.isInitialized) {
      clearInterval(checkAuth);
      
      if (GoogleAuth.isSignedIn()) {
        ProfileController.init();
      } else {
        console.log('User not signed in, redirecting...');
        window.location.href = 'index.html';
      }
    }
    
    // Timeout after 5 seconds
    if (authCheckCount > 50) {
      clearInterval(checkAuth);
      console.error('Auth system failed to initialize');
      alert('Authentication system failed to load. Please refresh the page.');
    }
  }, 100);
});

// Make available globally
window.ProfileController = ProfileController;
