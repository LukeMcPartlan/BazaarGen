/**
 * Profile Controller - Simple Implementation
 * Handles user profile page functionality
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
   * Load user's cards
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
        // Display each card
        for (const item of this.userItems) {
          const cardWrapper = await this.createProfileCard(item);
          if (cardWrapper) {
            gridEl.appendChild(cardWrapper);
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
   * Create a card element for profile display
   */
  static async createProfileCard(item) {
    try {
      const wrapper = document.createElement('div');
      wrapper.className = 'profile-card-wrapper';
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'profile-delete-btn';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => this.deleteItem(item.id, 'card', item.item_data?.itemName || 'this card');
      
      wrapper.appendChild(deleteBtn);
      
      // Create the card
      const cardElement = await CardGenerator.createCard({
        data: item.item_data,
        mode: 'browser',
        includeControls: false
      });
      
      if (cardElement) {
        wrapper.appendChild(cardElement);
      }
      
      return wrapper;
    } catch (error) {
      console.error('Error creating profile card:', error);
      return null;
    }
  }

  /**
   * Create a skill element for profile display
   */
  static async createProfileSkill(skill) {
    try {
      const wrapper = document.createElement('div');
      wrapper.className = 'profile-card-wrapper';
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'profile-delete-btn';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => this.deleteItem(skill.id, 'skill', skill.skill_data?.skillName || 'this skill');
      
      wrapper.appendChild(deleteBtn);
      
      // Create the skill
      if (typeof SkillGenerator !== 'undefined') {
        const skillElement = SkillGenerator.createSkill({
          data: skill.skill_data,
          mode: 'browser',
          includeControls: false
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
   * Display galleries
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
      // Display each gallery
      for (const gallery of this.userGalleries) {
        const galleryCard = await this.createGalleryCard(gallery);
        if (galleryCard) {
          gridEl.appendChild(galleryCard);
        }
      }
      loadingEl.style.display = 'none';
    }
  }

  /**
   * Create a gallery card for display
   */
  static async createGalleryCard(gallery) {
    try {
      const wrapper = document.createElement('div');
      wrapper.className = 'profile-card-wrapper';
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'profile-delete-btn';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => this.deleteItem(gallery.id, 'gallery', gallery.item_data?.galleryInfo?.name || 'this gallery');
      
      wrapper.appendChild(deleteBtn);
      
      // Create gallery card with special styling
      const galleryCard = await CardGenerator.createCard({
        data: gallery.item_data,
        mode: 'browser',
        includeControls: false
      });
      
      if (galleryCard) {
        // Add gallery button to view the gallery
        if (gallery.item_data.galleryItems && window.GalleryModal) {
          GalleryModal.addGalleryButton(
            galleryCard,
            gallery.item_data.galleryItems,
            0
          );
        }
        
        wrapper.appendChild(galleryCard);
      }
      
      return wrapper;
    } catch (error) {
      console.error('Error creating gallery card:', error);
      return null;
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
   * Delete an item with confirmation
   */
  static async deleteItem(itemId, type, itemName) {
    const confirmed = confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
      Messages.showInfo('Deleting...');
      
      let result;
      if (type === 'skill') {
        result = await SupabaseClient.deleteSkill(itemId);
      } else {
        result = await SupabaseClient.deleteItem(itemId);
      }
      
      if (result?.success) {
        Messages.showSuccess(`${type} deleted successfully`);
        
        // Reload the appropriate content
        if (type === 'skill') {
          await this.loadUserSkills();
        } else {
          await this.loadUserCards();
        }
        
        this.updateStatistics();
      }
      
    } catch (error) {
      console.error('Error deleting item:', error);
      Messages.showError('Failed to delete item: ' + error.message);
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