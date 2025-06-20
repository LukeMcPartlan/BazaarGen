/**
 * Database Operations
 * Handles saving cards and skills to the database
 */
class Database {
  
  /**
   * Save card to database
   * @param {Object} cardData - Card data to save
   * @returns {Promise<void>}
   */
  static async saveCard(cardData) {
    try {
      // Check if user is signed in
      if (!GoogleAuth.isSignedIn()) {
        Messages.showError('Please sign in to save items to the database');
        return;
      }

      // Check if Supabase is available
      if (!SupabaseClient.isReady()) {
        Messages.showError('Database connection not available. Please try again later.');
        return;
      }

      // Show loading state
      const saveButtons = document.querySelectorAll('.card-save-btn');
      const saveButton = this.findSaveButton(saveButtons, cardData);

      if (saveButton) {
        this.setSaveButtonState(saveButton, 'loading');
      }

      // Save to database
      const result = await SupabaseClient.saveCard(cardData);

      if (result.success) {
        Messages.showSuccess(`"${cardData.itemName}" saved to database successfully!`);
        
        if (saveButton) {
          this.setSaveButtonState(saveButton, 'success');
          
          // Reset button after 2 seconds
          setTimeout(() => {
            this.setSaveButtonState(saveButton, 'default');
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Error saving card to database:', error);
      
      let errorMessage = 'Failed to save item to database. ';
      errorMessage += this.getErrorMessage(error);
      
      Messages.showError(errorMessage);

      // Reset button on error
      const saveButtons = document.querySelectorAll('.card-save-btn');
      const saveButton = this.findSaveButton(saveButtons, cardData);
      if (saveButton) {
        this.setSaveButtonState(saveButton, 'error');
        
        setTimeout(() => {
          this.setSaveButtonState(saveButton, 'default');
        }, 2000);
      }
    }
  }

  /**
   * Save skill to database
   * @param {Object} skillData - Skill data to save
   * @returns {Promise<void>}
   */
  static async saveSkill(skillData) {
    try {
      // Check if user is signed in
      if (!GoogleAuth.isSignedIn()) {
        Messages.showError('Please sign in to save skills to the database');
        return;
      }

      // Check if Supabase is available
      if (!SupabaseClient.isReady()) {
        Messages.showError('Database connection not available. Please try again later.');
        return;
      }

      // Show loading state
      const saveButtons = document.querySelectorAll('.skill-save-btn');
      const saveButton = this.findSaveButton(saveButtons, skillData);

      if (saveButton) {
        this.setSaveButtonState(saveButton, 'loading');
      }

      // Save to database
      const result = await SupabaseClient.saveSkill(skillData);

      if (result.success) {
        Messages.showSuccess(`"${skillData.skillName}" saved to database successfully!`);
        
        if (saveButton) {
          this.setSaveButtonState(saveButton, 'success');
          
          // Reset button after 2 seconds
          setTimeout(() => {
            this.setSaveButtonState(saveButton, 'default');
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Error saving skill to database:', error);
      
      let errorMessage = 'Failed to save skill to database. ';
      errorMessage += this.getErrorMessage(error);
      
      Messages.showError(errorMessage);

      // Reset button on error
      const saveButtons = document.querySelectorAll('.skill-save-btn');
      const saveButton = this.findSaveButton(saveButtons, skillData);
      if (saveButton) {
        this.setSaveButtonState(saveButton, 'error');
        
        setTimeout(() => {
          this.setSaveButtonState(saveButton, 'default');
        }, 2000);
      }
    }
  }

  /**
   * Find the save button associated with specific item data
   * @param {NodeList} saveButtons - List of save buttons
   * @param {Object} itemData - Item data to match
   * @returns {HTMLElement|null} The matching save button
   */
  static findSaveButton(saveButtons, itemData) {
    // Try to find button by timestamp or other unique identifier
    return Array.from(saveButtons).find(btn => {
      // If button has data-timestamp attribute, use that
      const timestamp = btn.getAttribute('data-timestamp');
      if (timestamp && itemData.timestamp === timestamp) {
        return true;
      }
      
      // Fallback: find by checking if button is not disabled (last clicked)
      return !btn.disabled;
    });
  }

  /**
   * Set save button visual state
   * @param {HTMLElement} button - Save button element
   * @param {string} state - Button state ('default', 'loading', 'success', 'error')
   */
  static setSaveButtonState(button, state) {
    // Reset classes and styles
    button.disabled = false;
    button.style.background = '';
    
    switch (state) {
      case 'loading':
        button.disabled = true;
        button.innerHTML = '⏳';
        button.title = 'Saving...';
        break;
        
      case 'success':
        button.innerHTML = '✅';
        button.title = 'Saved to database';
        button.style.background = 'linear-gradient(135deg, rgb(46, 125, 50) 0%, rgb(27, 94, 32) 100%)';
        break;
        
      case 'error':
        button.innerHTML = '❌';
        button.title = 'Failed to save';
        button.style.background = 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%)';
        break;
        
      case 'default':
      default:
        button.innerHTML = '🗃️';
        button.title = 'Save to database';
        button.disabled = false;
        break;
    }
  }

  /**
   * Get user-friendly error message from error object
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  static getErrorMessage(error) {
    if (error.code === '42501') {
      return 'Permission denied. Please check your account permissions.';
    } else if (error.code === '23505') {
      return 'This item may already exist in the database.';
    } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      return 'Database schema error. Please contact support.';
    } else if (error.message?.includes('not authenticated')) {
      return 'Please sign in to save items.';
    } else if (error.message?.includes('network')) {
      return 'Network error. Please check your internet connection.';
    } else {
      return `Error: ${error.message || 'Unknown error occurred'}`;
    }
  }

  /**
   * Load user's saved items from database
   * @param {string} type - 'cards' or 'skills'
   * @returns {Promise<Array>} Array of user's items
   */
  static async loadUserItems(type = 'cards') {
    try {
      if (!GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      if (!SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      const hideLoading = Messages.showLoading(`Loading your ${type}...`);

      let items;
      if (type === 'cards') {
        items = await SupabaseClient.getUserItems();
      } else {
        items = await SupabaseClient.getUserSkills();
      }

      hideLoading();
      return items;

    } catch (error) {
      console.error(`Error loading user ${type}:`, error);
      Messages.showError(`Failed to load your ${type}: ${error.message}`);
      return [];
    }
  }

  /**
   * Delete item from database
   * @param {string} itemId - ID of item to delete
   * @param {string} type - 'cards' or 'skills'
   * @returns {Promise<boolean>} Success status
   */
  static async deleteItem(itemId, type = 'cards') {
    try {
      if (!GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      if (!SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      const confirmMessage = `Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`;
      
      return new Promise((resolve) => {
        Messages.showConfirmation(
          confirmMessage,
          async () => {
            try {
              let result;
              if (type === 'cards') {
                result = await SupabaseClient.deleteItem(itemId);
              } else {
                result = await SupabaseClient.deleteSkill(itemId);
              }

              if (result.success) {
                Messages.showSuccess(`${type.slice(0, -1)} deleted successfully!`);
                resolve(true);
              } else {
                throw new Error('Delete operation failed');
              }
            } catch (error) {
              Messages.showError(`Failed to delete ${type.slice(0, -1)}: ${error.message}`);
              resolve(false);
            }
          },
          () => resolve(false)
        );
      });

    } catch (error) {
      console.error(`Error deleting ${type.slice(0, -1)}:`, error);
      Messages.showError(`Failed to delete ${type.slice(0, -1)}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  static async getStatistics() {
    try {
      if (!SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      const stats = await SupabaseClient.getStatistics();
      return stats;

    } catch (error) {
      console.error('Error getting database statistics:', error);
      return {
        items: 0,
        skills: 0,
        users: 0,
        error: error.message
      };
    }
  }

  /**
   * Check database connection status
   * @returns {Promise<boolean>} Connection status
   */
  static async checkConnection() {
    try {
      if (!SupabaseClient.isReady()) {
        return false;
      }

      const result = await SupabaseClient.testConnection();
      return result.success;

    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Setup database event listeners
   */
  static setupEventListeners() {
    // Global functions for HTML onclick handlers
    window.saveCardToDatabase = (cardData) => {
      this.saveCard(cardData);
    };

    window.saveSkillToDatabase = (skillData) => {
      this.saveSkill(skillData);
    };

    // Listen for authentication state changes
    document.addEventListener('userSignedIn', () => {
      // Re-enable save buttons when user signs in
      document.querySelectorAll('.card-save-btn, .skill-save-btn').forEach(btn => {
        btn.disabled = false;
        btn.title = 'Save to database';
      });
    });

    document.addEventListener('userSignedOut', () => {
      // Disable save buttons when user signs out
      document.querySelectorAll('.card-save-btn, .skill-save-btn').forEach(btn => {
        btn.disabled = true;
        btn.title = 'Sign in to save';
      });
    });
  }

  /**
   * Show database status in UI
   * @param {string} containerId - ID of container to show status in
   */
  static async showDatabaseStatus(containerId = 'database-status') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const isConnected = await this.checkConnection();
      const stats = await this.getStatistics();

      container.innerHTML = `
        <div class="database-status ${isConnected ? 'connected' : 'disconnected'}">
          <h4>Database Status</h4>
          <div class="status-indicator">
            <span class="status-dot ${isConnected ? 'green' : 'red'}"></span>
            ${isConnected ? 'Connected' : 'Disconnected'}
          </div>
          ${isConnected ? `
            <div class="stats">
              <div>Items: ${stats.items}</div>
              <div>Skills: ${stats.skills}</div>
              <div>Users: ${stats.users}</div>
            </div>
          ` : `
            <div class="error">Unable to connect to database</div>
          `}
        </div>
      `;
    } catch (error) {
      container.innerHTML = `
        <div class="database-status error">
          <h4>Database Status</h4>
          <div>Error: ${error.message}</div>
        </div>
      `;
    }
  }

  /**
   * Backup user data
   * @returns {Promise<void>}
   */
  static async backupUserData() {
    try {
      if (!GoogleAuth.isSignedIn()) {
        Messages.showError('Please sign in to backup your data');
        return;
      }

      const hideLoading = Messages.showLoading('Creating backup...');

      // Load user's cards and skills
      const [cards, skills] = await Promise.all([
        this.loadUserItems('cards'),
        this.loadUserItems('skills')
      ]);

      hideLoading();

      // Create backup data
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        user: GoogleAuth.getUserDisplayName(),
        backup_type: "full_user_data",
        cards: cards || [],
        skills: skills || [],
        stats: {
          total_cards: cards?.length || 0,
          total_skills: skills?.length || 0
        }
      };

      // Download backup
      const filename = `BazaarGen-backup-${GoogleAuth.getUserDisplayName()}-${ExportImport.getDateString()}.json`;
      ExportImport.downloadJSON(backupData, filename);

      Messages.showSuccess(`Backup created successfully! Downloaded ${backupData.stats.total_cards} cards and ${backupData.stats.total_skills} skills.`);

    } catch (error) {
      console.error('Error creating backup:', error);
      Messages.showError('Failed to create backup: ' + error.message);
    }
  }

  /**
   * Restore user data from backup
   * @param {Event} event - File input change event
   * @returns {Promise<void>}
   */
  static async restoreUserData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (!GoogleAuth.isSignedIn()) {
        Messages.showError('Please sign in to restore data');
        return;
      }

      const fileContent = await ExportImport.readFileAsText(file);
      const backupData = JSON.parse(fileContent);

      // Validate backup data
      if (!backupData.backup_type || backupData.backup_type !== 'full_user_data') {
        throw new Error('Invalid backup file format');
      }

      const confirmMessage = `This will restore ${backupData.stats?.total_cards || 0} cards and ${backupData.stats?.total_skills || 0} skills from backup created on ${new Date(backupData.timestamp).toLocaleDateString()}. Continue?`;

      Messages.showConfirmation(
        confirmMessage,
        async () => {
          try {
            const hideLoading = Messages.showLoading('Restoring data...');

            let restoredCards = 0;
            let restoredSkills = 0;

            // Restore cards
            if (backupData.cards && Array.isArray(backupData.cards)) {
              for (const cardData of backupData.cards) {
                try {
                  await SupabaseClient.saveCard(cardData);
                  restoredCards++;
                } catch (error) {
                  console.warn('Failed to restore card:', cardData.itemName, error);
                }
              }
            }

            // Restore skills
            if (backupData.skills && Array.isArray(backupData.skills)) {
              for (const skillData of backupData.skills) {
                try {
                  await SupabaseClient.saveSkill(skillData);
                  restoredSkills++;
                } catch (error) {
                  console.warn('Failed to restore skill:', skillData.skillName, error);
                }
              }
            }

            hideLoading();
            Messages.showSuccess(`Restore completed! Restored ${restoredCards} cards and ${restoredSkills} skills.`);

          } catch (error) {
            Messages.showError('Failed to restore data: ' + error.message);
          }
        }
      );

    } catch (error) {
      Messages.showError('Error reading backup file: ' + error.message);
    } finally {
      event.target.value = '';
    }
  }

  /**
   * Get user's usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  static async getUserStats() {
    try {
      if (!GoogleAuth.isSignedIn()) {
        return null;
      }

      const [cards, skills] = await Promise.all([
        this.loadUserItems('cards'),
        this.loadUserItems('skills')
      ]);

      // Calculate statistics
      const cardsByHero = {};
      const cardsByRarity = {};
      const skillsByRarity = {};

      cards.forEach(card => {
        const hero = card.item_data?.hero || 'Unknown';
        const rarity = card.item_data?.rarity || 'Unknown';
        
        cardsByHero[hero] = (cardsByHero[hero] || 0) + 1;
        cardsByRarity[rarity] = (cardsByRarity[rarity] || 0) + 1;
      });

      skills.forEach(skill => {
        const rarity = skill.skill_data?.rarity || 'Unknown';
        skillsByRarity[rarity] = (skillsByRarity[rarity] || 0) + 1;
      });

      return {
        totalCards: cards.length,
        totalSkills: skills.length,
        cardsByHero,
        cardsByRarity,
        skillsByRarity,
        joinDate: cards.length > 0 ? new Date(Math.min(...cards.map(c => new Date(c.created_at)))).toDateString() : 'Unknown'
      };

    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Display user statistics in UI
   * @param {string} containerId - ID of container to display stats
   */
  static async displayUserStats(containerId = 'user-stats') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const stats = await this.getUserStats();
      
      if (!stats) {
        container.innerHTML = '<div class="stats-error">Please sign in to view your statistics</div>';
        return;
      }

      container.innerHTML = `
        <div class="user-stats">
          <h4>Your Statistics</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">${stats.totalCards}</div>
              <div class="stat-label">Cards Created</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.totalSkills}</div>
              <div class="stat-label">Skills Created</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${Object.keys(stats.cardsByHero).length}</div>
              <div class="stat-label">Heroes Used</div>
            </div>
            <div class="stat-item">
              <div class="stat-date">${stats.joinDate}</div>
              <div class="stat-label">Member Since</div>
            </div>
          </div>
          
          ${stats.totalCards > 0 ? `
            <div class="stats-breakdown">
              <h5>Cards by Hero</h5>
              <div class="breakdown-list">
                ${Object.entries(stats.cardsByHero)
                  .sort((a, b) => b[1] - a[1])
                  .map(([hero, count]) => `<div>${hero}: ${count}</div>`)
                  .join('')}
              </div>
            </div>
          ` : ''}
          
          ${stats.totalCards > 0 || stats.totalSkills > 0 ? `
            <div class="stats-breakdown">
              <h5>Items by Rarity</h5>
              <div class="breakdown-list">
                ${Object.entries({...stats.cardsByRarity, ...stats.skillsByRarity})
                  .sort((a, b) => b[1] - a[1])
                  .map(([rarity, count]) => `<div>${rarity}: ${count}</div>`)
                  .join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

    } catch (error) {
      container.innerHTML = `<div class="stats-error">Error loading statistics: ${error.message}</div>`;
    }
  }

  /**
   * Setup periodic auto-backup
   * @param {number} intervalMinutes - Backup interval in minutes
   */
  static setupAutoBackup(intervalMinutes = 60) {
    if (!GoogleAuth.isSignedIn()) return;

    setInterval(async () => {
      try {
        if (GoogleAuth.isSignedIn()) {
          const stats = await this.getUserStats();
          if (stats && (stats.totalCards > 0 || stats.totalSkills > 0)) {
            console.log('Performing auto-backup...');
            await this.backupUserData();
          }
        }
      } catch (error) {
        console.warn('Auto-backup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Auto-setup event listeners
Database.setupEventListeners();

// Setup global functions for HTML
window.Database = Database;