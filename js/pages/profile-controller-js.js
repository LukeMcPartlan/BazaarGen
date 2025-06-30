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
      cardWrapper.setAttribute('data-item-id', item.id); // Add unique identifier

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

      // Create comments section (same as browse page)
      const commentsSection = await this.createCommentsSection(item.id);

      // Assemble the wrapper
      cardWrapper.appendChild(deleteBtn);
      cardWrapper.appendChild(creatorInfo);
      cardWrapper.appendChild(cardElement);
      cardWrapper.appendChild(commentsSection); // Add comments section

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
      wrapper.setAttribute('data-item-id', skill.id); // Add unique identifier
      
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

      // Create comments section for skills too
      const commentsSection = await this.createCommentsSection(skill.id);
      wrapper.appendChild(commentsSection);
      
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
