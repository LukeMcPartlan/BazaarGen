/**
 * Database Operations with Enhanced Debugging
 * Handles saving cards and skills to the database
 */
class Database {
  static debugMode = true; // Enable debugging

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[Database] ${message}`, data || '');
    }
  }

  /**
   * Save card to database
   * @param {Object} cardData - Card data to save
   * @returns {Promise<void>}
   */
  static async saveCard(cardData) {
    try {
      this.debug('Starting card save process...', cardData);

      // Check if user is signed in
      if (!GoogleAuth || typeof GoogleAuth.isSignedIn !== 'function') {
        throw new Error('GoogleAuth not available');
      }

      if (!GoogleAuth.isSignedIn()) {
        this.debug('User not signed in, cannot save card');
        Messages.showError('Please sign in to save items to the database');
        return;
      }

      this.debug('User is signed in');

      // Check if Supabase is available
      if (!SupabaseClient || typeof SupabaseClient.isReady !== 'function') {
        throw new Error('SupabaseClient not available');
      }

      if (!SupabaseClient.isReady()) {
        this.debug('Database not ready');
        Messages.showError('Database connection not available. Please try again later.');
        return;
      }

      this.debug('Database is ready');

      // Show loading state
      const saveButtons = document.querySelectorAll('.card-save-btn');
      const saveButton = this.findSaveButton(saveButtons, cardData);

      if (saveButton) {
        this.debug('Setting save button to loading state');
        this.setSaveButtonState(saveButton, 'loading');
      }

      // Save to database
      this.debug('Calling SupabaseClient.saveCard...');
      const result = await SupabaseClient.saveCard(cardData);
      this.debug('Database save result:', result);

      if (result.success) {
        this.debug('Card saved successfully');
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
      this.debug('Error saving card to database:', error);
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
      this.debug('Starting skill save process...', skillData);

      // Check if user is signed in
      if (!GoogleAuth || typeof GoogleAuth.isSignedIn !== 'function') {
        throw new Error('GoogleAuth not available');
      }

      if (!GoogleAuth.isSignedIn()) {
        this.debug('User not signed in, cannot save skill');
        Messages.showError('Please sign in to save skills to the database');
        return;
      }

      this.debug('User is signed in');

      // Check if Supabase is available
      if (!SupabaseClient || typeof SupabaseClient.isReady !== 'function') {
        throw new Error('SupabaseClient not available');
      }

      if (!SupabaseClient.isReady()) {
        this.debug('Database not ready');
        Messages.showError('Database connection not available. Please try again later.');
        return;
      }

      this.debug('Database is ready');

      // Show loading state
      const saveButtons = document.querySelectorAll('.skill-save-btn');
      const saveButton = this.findSaveButton(saveButtons, skillData);

      if (saveButton) {
        this.debug('Setting save button to loading state');
        this.setSaveButtonState(saveButton, 'loading');
      }

      // Save to database
      this.debug('Calling SupabaseClient.saveSkill...');
      const result = await SupabaseClient.saveSkill(skillData);
      this.debug('Database save result:', result);

      if (result.success) {
        this.debug('Skill saved successfully');
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
      this.debug('Error saving skill to database:', error);
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
    this.debug('Finding save button for item:', itemData.itemName || itemData.skillName);
    
    // Try to find button by timestamp or other unique identifier
    const foundButton = Array.from(saveButtons).find(btn => {
      // If button has data-timestamp attribute, use that
      const timestamp = btn.getAttribute('data-timestamp');
      if (timestamp && itemData.timestamp === timestamp) {
        this.debug('Found button by timestamp match');
        return true;
      }
      
      // Fallback: find by checking if button is not disabled (last clicked)
      const notDisabled = !btn.disabled;
      if (notDisabled) {
        this.debug('Found button by disabled state');
      }
      return notDisabled;
    });

    this.debug('Save button found:', !!foundButton);
    return foundButton;
  }

  /**
   * Set save button visual state
   * @param {HTMLElement} button - Save button element
   * @param {string} state - Button state ('default', 'loading', 'success', 'error')
   */
  static setSaveButtonState(button, state) {
    this.debug('Setting button state to:', state);
    
    // Reset classes and styles
    button.disabled = false;
    button.style.background = '';
    
    switch (state) {
      case 'loading':
        button.disabled = true;
        button.innerHTML = '⏳';
        button.title = 'Saving...';
        this.debug('Button set to loading state');
        break;
        
      case 'success':
        button.innerHTML = '✅';
        button.title = 'Saved to database';
        button.style.background = 'linear-gradient(135deg, rgb(46, 125, 50) 0%, rgb(27, 94, 32) 100%)';
        this.debug('Button set to success state');
        break;
        
      case 'error':
        button.innerHTML = '❌';
        button.title = 'Failed to save';
        button.style.background = 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(211, 47, 47) 100%)';
        this.debug('Button set to error state');
        break;
        
      case 'default':
      default:
        button.innerHTML = '🗃️';
        button.title = 'Save to database';
        button.disabled = false;
        this.debug('Button set to default state');
        break;
    }
  }

  /**
   * Get user-friendly error message from error object
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  static getErrorMessage(error) {
    this.debug('Processing error message:', error);
    
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
    } else if (error.message?.includes('GoogleAuth not available')) {
      return 'Authentication system not loaded. Please refresh the page.';
    } else if (error.message?.includes('SupabaseClient not available')) {
      return 'Database system not loaded. Please refresh the page.';
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
      this.debug(`Loading user ${type}...`);

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      const hideLoading = Messages.showLoading(`Loading your ${type}...`);

      let items;
      if (type === 'cards') {
        this.debug('Calling getUserItems...');
        items = await SupabaseClient.getUserItems();
      } else {
        this.debug('Calling getUserSkills...');
        items = await SupabaseClient.getUserSkills();
      }

      this.debug(`Loaded ${items.length} ${type}`);
      hideLoading();
      return items;

    } catch (error) {
      this.debug(`Error loading user ${type}:`, error);
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
      this.debug(`Deleting ${type.slice(0, -1)} with ID:`, itemId);

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      const confirmMessage = `Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`;
      
      return new Promise((resolve) => {
        Messages.showConfirmation(
          confirmMessage,
          async () => {
            try {
              this.debug('User confirmed deletion');
              
              let result;
              if (type === 'cards') {
                result = await SupabaseClient.deleteItem(itemId);
              } else {
                result = await SupabaseClient.deleteSkill(itemId);
              }

              this.debug('Delete result:', result);

              if (result.success) {
                this.debug('Item deleted successfully');
                Messages.showSuccess(`${type.slice(0, -1)} deleted successfully!`);
                resolve(true);
              } else {
                throw new Error('Delete operation failed');
              }
            } catch (error) {
              this.debug('Delete operation failed:', error);
              Messages.showError(`Failed to delete ${type.slice(0, -1)}: ${error.message}`);
              resolve(false);
            }
          },
          () => {
            this.debug('User canceled deletion');
            resolve(false);
          }
        );
      });

    } catch (error) {
      this.debug(`Error deleting ${type.slice(0, -1)}:`, error);
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
      this.debug('Getting database statistics...');

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      const stats = await SupabaseClient.getStatistics();
      this.debug('Database statistics:', stats);
      return stats;

    } catch (error) {
      this.debug('Error getting database statistics:', error);
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
      this.debug('Checking database connection...');

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        this.debug('SupabaseClient not ready');
        return false;
      }

      const result = await SupabaseClient.testConnection();
      this.debug('Connection check result:', result);
      return result.success;

    } catch (error) {
      this.debug('Database connection check failed:', error);
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Setup database event listeners
   */
  static setupEventListeners() {
    this.debug('Setting up database event listeners...');

    // Global functions for HTML onclick handlers
    window.saveCardToDatabase = (cardData) => {
      this.debug('saveCardToDatabase called from HTML');
      this.saveCard(cardData);
    };

    window.saveSkillToDatabase = (skillData) => {
      this.debug('saveSkillToDatabase called from HTML');
      this.saveSkill(skillData);
    };

    // Listen for authentication state changes
    document.addEventListener('userSignedIn', (event) => {
      this.debug('User signed in event received:', event.detail);
      
      // Re-enable save buttons when user signs in
      document.querySelectorAll('.card-save-btn, .skill-save-btn').forEach(btn => {
        btn.disabled = false;
        btn.title = 'Save to database';
      });
    });

    document.addEventListener('userSignedOut', (event) => {
      this.debug('User signed out event received');
      
      // Disable save buttons when user signs out
      document.querySelectorAll('.card-save-btn, .skill-save-btn').forEach(btn => {
        btn.disabled = true;
        btn.title = 'Sign in to save';
      });
    });

    this.debug('Database event listeners setup complete');
  }

  /**
   * Show database status in UI
   * @param {string} containerId - ID of container to show status in
   */
  static async showDatabaseStatus(containerId = 'database-status') {
    this.debug('Showing database status in container:', containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
      this.debug('Status container not found');
      return;
    }

    try {
      const isConnected = await this.checkConnection();
      const stats = await this.getStatistics();

      this.debug('Database status:', { isConnected, stats });

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
      
      this.debug('Database status UI updated');
    } catch (error) {
      this.debug('Error showing database status:', error);
      container.innerHTML = `
        <div class="database-status error">
          <h4>Database Status</h4>
          <div>Error: ${error.message}</div>
        </div>
      `;
    }
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  static getDebugInfo() {
    return {
      debugMode: this.debugMode,
      googleAuthAvailable: typeof GoogleAuth !== 'undefined',
      googleAuthReady: typeof GoogleAuth !== 'undefined' && GoogleAuth.isInitialized,
      supabaseClientAvailable: typeof SupabaseClient !== 'undefined',
      supabaseClientReady: typeof SupabaseClient !== 'undefined' && SupabaseClient.isReady(),
      messagesAvailable: typeof Messages !== 'undefined'
    };
  }

  /**
   * Toggle debug mode
   * @returns {boolean} New debug mode state
   */
  static toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.debug('Debug mode toggled:', this.debugMode ? 'ON' : 'OFF');
    return this.debugMode;
  }

  /**
   * Run diagnostic tests
   * @returns {Promise<Object>} Diagnostic results
   */
  static async runDiagnostics() {
    this.debug('Running database diagnostics...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Check if classes are available
    results.tests.classesAvailable = {
      googleAuth: typeof GoogleAuth !== 'undefined',
      supabaseClient: typeof SupabaseClient !== 'undefined',
      messages: typeof Messages !== 'undefined'
    };

    // Test 2: Check authentication
    if (typeof GoogleAuth !== 'undefined') {
      results.tests.authentication = {
        initialized: GoogleAuth.isInitialized,
        signedIn: GoogleAuth.isSignedIn(),
        userEmail: GoogleAuth.getUserEmail(),
        displayName: GoogleAuth.getUserDisplayName()
      };
    }

    // Test 3: Check database connection
    if (typeof SupabaseClient !== 'undefined') {
      try {
        const connectionTest = await SupabaseClient.testConnection();
        results.tests.database = {
          ready: SupabaseClient.isReady(),
          connectionTest: connectionTest,
          statistics: await this.getStatistics()
        };
      } catch (error) {
        results.tests.database = {
          ready: false,
          error: error.message
        };
      }
    }

    this.debug('Diagnostic results:', results);
    return results;
  }
}

// Auto-setup event listeners
Database.setupEventListeners();

// Make available globally
window.Database = Database;

// Global debug functions
window.debugDatabase = () => {
  console.log('=== Database Debug Info ===');
  console.log('Debug Info:', Database.getDebugInfo());
  
  Database.runDiagnostics().then(results => {
    console.log('Diagnostic Results:', results);
  });
};

window.toggleDatabaseDebug = () => {
  const newMode = Database.toggleDebugMode();
  console.log('Database debug mode:', newMode ? 'ENABLED' : 'DISABLED');
};

// Run diagnostics on load
document.addEventListener('DOMContentLoaded', () => {
  Database.debug('Database class loaded and ready');
  
  // Run diagnostics after a delay to let other systems load
  setTimeout(async () => {
    if (Database.debugMode) {
      await Database.runDiagnostics();
    }
  }, 3000);
});
