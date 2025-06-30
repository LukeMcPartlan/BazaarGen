/**
 * Profile Controller - Enhanced Implementation with Image Loading
 * Handles user profile page functionality with proper image loading
 */
class ProfileController {
  static userItems = [];
  static userSkills = [];
  static userGalleries = [];
  static currentTab = 'cards';

  /**
   * Initialize the profile page
   */
  static async init() {
    console.log('Initializing ProfileController...');
    
    // Check if user is signed in
    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      console.log('User not signed in, redirecting...');
      window.location.href = 'index.html';
      return;
    }

    // Display user info
    this.displayUserInfo();
    
    // Load user's content
    await this.loadAllContent();
  }

  /**
   * Display user information
   */
  static displayUserInfo() {
    const userProfile = GoogleAuth.getUserProfile();
    const userEmail = GoogleAuth.getUserEmail();
    const displayName = GoogleAuth.getUserDisplayName();

    document.getElementById('profileName').textContent = userProfile?.alias || displayName || 'Unknown User';
    document.getElementById('profileEmail').textContent = userEmail || '-';
  }

  /**
   * Load all user content
   */
  static async loadAllContent() {
    try {
      await this.loadUserCards();
      await this.loadUserSkills();
      this.updateStatistics();
    } catch (error) {
      console.error('Error loading content:', error);
      Messages.showError('Failed to load some content');
    }
  }

  /**
   * Load user's cards with proper image handling
   */
  static async loadUserCards() {
    const loadingEl = document.getElementById('cardsLoading');
    const gridEl = document.getElementById('cardsGrid');
    const emptyEl = document.getElementById('cardsEmpty');
    
    try {
      loadingEl.style.display = 'block';
      gridEl.innerHTML = '';
      emptyEl.style.display = 'none';
      
      // Get user's items from database
      const items = await SupabaseClient.getUserItems();
      console.log(`Loaded ${items.length} items`);
      
      // Separate regular cards and galleries
      this.userItems = items.filter(item => !item.item_data?.isGallery);
      this.userGalleries = items.filter(item => item.item_data?.isGallery);
      
      loadingEl.style.display = 'none';
      
      if (this.userItems.length === 0) {
        emptyEl.style.display = 'block';
      } else {
        // Display each card using the same method as browse page
        for (const item of this.userItems) {
          try {
            // Use the same card creation method as BrowsePageController
            const cardWrapper = await this.createProfileItemCard(item);
            if (cardWrapper) {
              gridEl.appendChild(cardWrapper);
            }
          } catch (error) {
            console.error(`Failed to create card for item ${item.id}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading cards:', error);
      loadingEl.style.display = 'none';
      emptyEl.style.display = 'block';
    }
  }

  /**
   * Create profile item card using same logic as browse page but with delete functionality
   */
  static async createProfileItemCard(item) {
    if (!item.item_data) {
      console.warn(`Item ${item.id} has no item_data`);
      return null;
    }

    try {
      // Create a wrapper div for the entire card section (same as browse page)
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'card-wrapper profile-card-wrapper';
      cardWrapper.style.cssText = 'margin-bottom: 30px; position: relative;';

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
        this.deleteItem(item.id, 'card', item.item_data?.itemName || 'this card');
      };

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

      creatorInfo.innerHTML = `
        <span style="font-weight: 600; color: rgb(251, 225, 183);">
          <span style="color: rgb(218, 165, 32);">Your Creation:</span> ${creatorAlias}
        </span>
        <span style="color: rgb(201, 175, 133); font-size: 12px;">${createdDate}</span>
      `;

      // Create the card using the same data structure as browse page
      const cardData = item.item_data;
      cardData.created_at = item.created_at;
      cardData.creator_alias = creatorAlias;
      cardData.database_id = item.id;

      const cardElement = await CardGenerator.createCard({
        data: cardData,
        mode: 'browser',
        includeControls: true // Include controls for full functionality
      });

      // Add gallery functionality if this is a saved gallery
      if (item.item_data?.isGallery && item.item_data?.galleryItems) {
        // Add gallery button to view it
        if (typeof GalleryModal !== 'undefined') {
          GalleryModal.addGalleryButton(
            cardElement,
            item.item_data.galleryItems,
            0
          );
        }
        
        // Style the card differently to show it's a gallery
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

      // Assemble the wrapper
      cardWrapper.appendChild(deleteBtn);
      cardWrapper.appendChild(creatorInfo);
      cardWrapper.appendChild(cardElement);

      return cardWrapper;
    } catch (error) {
      console.error('Error creating profile item card:', error);
      return null;
    }
  }

  /**
   * Load user's skills
   */
  static async loadUserSkills() {
    const loadingEl = document.getElementById('skillsLoading');
    const gridEl = document.getElementById('skillsGrid');
    const emptyEl = document.getElementById('skillsEmpty');
    
    try {
      loadingEl.style.display = 'block';
      gridEl.innerHTML = '';
      emptyEl.style.display = 'none';
      
      // Get user's skills from database
      const skills = await SupabaseClient.getUserSkills();
      this.userSkills = skills;
      console.log(`Loaded ${skills.length} skills`);
      
      loadingEl.style.display = 'none';
      
      if (skills.length === 0) {
        emptyEl.style.display = 'block';
      } else {
        // Display each skill
        for (const skill of skills) {
          const skillWrapper = await this.createProfileSkill(skill);
          if (skillWrapper) {
            gridEl.appendChild(skillWrapper);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading skills:', error);
      loadingEl.style.display = 'none';
      emptyEl.style.display = 'block';
    }
  }

  /**
   * Create a skill element for profile display with enhanced styling
   */
  static async createProfileSkill(skill) {
    try {
      const wrapper = document.createElement('div');
      wrapper.className = 'profile-card-wrapper';
      wrapper.style.cssText = 'position: relative; margin-bottom: 30px;';
      
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
        this.deleteItem(skill.id, 'skill', skill.skill_data?.skillName || 'this skill');
      };
      
      wrapper.appendChild(deleteBtn);
      
      // Create the skill with enhanced styling
      if (typeof SkillGenerator !== 'undefined') {
        const skillElement = SkillGenerator.createSkill({
          data: skill.skill_data,
          mode: 'browser',
          includeControls: true
        });
        
        if (skillElement) {
          wrapper.appendChild(skillElement);
        }
      }
      
      return wrapper;
    } catch (error) {
      console.error('Error creating profile skill:', error);
      return null;
    }
  }

  /**
   * Display galleries with enhanced card creation
   */
  static async displayGalleries() {
    const loadingEl = document.getElementById('galleriesLoading');
    const gridEl = document.getElementById('galleriesGrid');
    const emptyEl = document.getElementById('galleriesEmpty');
    
    loadingEl.style.display = 'block';
    gridEl.innerHTML = '';
    emptyEl.style.display = 'none';
    
    if (this.userGalleries.length === 0) {
      loadingEl.style.display = 'none';
      emptyEl.style.display = 'block';
    } else {
      // Display each gallery using the enhanced card creation
      for (const gallery of this.userGalleries) {
        const galleryCard = await this.createProfileItemCard(gallery); // Use same method as regular cards
        if (galleryCard) {
          gridEl.appendChild(galleryCard);
        }
      }
      loadingEl.style.display = 'none';
    }
  }

  /**
   * Switch between tabs
   */
  static switchTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show selected section
    switch(tab) {
      case 'cards':
        document.getElementById('cardsSection').classList.add('active');
        break;
      case 'skills':
        document.getElementById('skillsSection').classList.add('active');
        break;
      case 'galleries':
        document.getElementById('galleriesSection').classList.add('active');
        this.displayGalleries();
        break;
    }
  }

  /**
   * Update statistics
   */
  static updateStatistics() {
    document.getElementById('totalCards').textContent = this.userItems.length;
    document.getElementById('totalSkills').textContent = this.userSkills.length;
    document.getElementById('totalGalleries').textContent = this.userGalleries.length;
  }

  /**
   * Delete an item with confirmation and proper cleanup
   */
  static async deleteItem(itemId, type, itemName) {
    const confirmed = confirm(`Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone and will permanently remove this ${type} from the database.`);
    
    if (!confirmed) return;

    // Show loading state
    const deleteButtons = document.querySelectorAll(`[onclick*="${itemId}"]`);
    deleteButtons.forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '⏳ Deleting...';
      btn.style.opacity = '0.6';
    });
    
    try {
      Messages.showInfo(`Deleting ${type}...`);
      
      let result;
      if (type === 'skill') {
        result = await SupabaseClient.deleteSkill(itemId);
      } else {
        result = await SupabaseClient.deleteItem(itemId);
      }
      
      if (result?.success) {
        Messages.showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        
        // Reload the appropriate content
        if (type === 'skill') {
          await this.loadUserSkills();
        } else {
          await this.loadUserCards();
        }
        
        this.updateStatistics();
      } else {
        throw new Error(result?.error || 'Delete operation failed');
      }
      
    } catch (error) {
      console.error('Error deleting item:', error);
      Messages.showError(`Failed to delete ${type}: ` + error.message);
      
      // Re-enable buttons on error
      deleteButtons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = '🗑️ Delete';
        btn.style.opacity = '1';
      });
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
