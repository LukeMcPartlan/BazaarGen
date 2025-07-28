/**
 * Database Migration Utility
 * Handles migrating existing data to new formats
 */
class MigrationUtility {
  static debugMode = true;
  static isRunning = false;

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[Migration] ${message}`, data || '');
    }
  }

  /**
   * Show migration progress in UI
   */
  static showProgress(current, total, message) {
    const progress = Math.round((current / total) * 100);
    console.log(`🔄 Migration Progress: ${progress}% (${current}/${total}) - ${message}`);
    
    // Update UI if progress element exists
    const progressElement = document.getElementById('migration-progress');
    if (progressElement) {
      progressElement.innerHTML = `
        <div class="migration-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">${progress}% - ${message}</div>
        </div>
      `;
    }
  }

  /**
   * Migrate base64 images to Supabase Storage
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  static async migrateImagesToStorage(options = {}) {
    if (this.isRunning) {
      throw new Error('Migration already in progress');
    }

    this.isRunning = true;
    const results = {
      totalItems: 0,
      totalSkills: 0,
      migratedItems: 0,
      migratedSkills: 0,
      errors: 0,
      startTime: new Date(),
      endTime: null
    };

    try {
      this.debug('🚀 Starting image migration to storage...');

      // Check if ImageStorage is available
      if (typeof ImageStorage === 'undefined') {
        throw new Error('ImageStorage not available. Please load the image storage utility first.');
      }

      // Initialize storage
      await ImageStorage.initStorage();

      // Get all items and skills
      const items = await SupabaseClient.getAllItems();
      const skills = await SupabaseClient.getAllSkills();

      results.totalItems = items.length;
      results.totalSkills = skills.length;

      this.debug(`📊 Found ${items.length} items and ${skills.length} skills to process`);

      // Process items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        this.showProgress(i, items.length + skills.length, `Processing item ${i + 1}/${items.length}`);

        try {
          if (item.item_data?.imageData && item.item_data.imageData.startsWith('data:')) {
            // Migrate main image
            const newImageUrl = await ImageStorage.uploadBase64Image(
              item.item_data.imageData,
              item.item_data.itemName || `item_${item.id}`,
              'card'
            );

            // Update database
            await SupabaseClient.supabase
              .from('items')
              .update({
                item_data: {
                  ...item.item_data,
                  imageData: newImageUrl
                }
              })
              .eq('id', item.id);

            results.migratedItems++;
            this.debug(`✅ Migrated item ${item.id} image`);
          }

          // Migrate gallery images
          if (item.item_data?.galleryItems) {
            let galleryUpdated = false;
            for (let j = 0; j < item.item_data.galleryItems.length; j++) {
              const galleryItem = item.item_data.galleryItems[j];
              if (galleryItem.imageData && galleryItem.imageData.startsWith('data:')) {
                const newGalleryImageUrl = await ImageStorage.uploadBase64Image(
                  galleryItem.imageData,
                  galleryItem.itemName || `gallery_item_${j}`,
                  'gallery'
                );

                item.item_data.galleryItems[j].imageData = newGalleryImageUrl;
                galleryUpdated = true;
              }
            }

            // Update database with migrated gallery
            if (galleryUpdated) {
              await SupabaseClient.supabase
                .from('items')
                .update({
                  item_data: item.item_data
                })
                .eq('id', item.id);
              this.debug(`✅ Migrated gallery images for item ${item.id}`);
            }
          }
        } catch (error) {
          this.debug(`❌ Error migrating item ${item.id}:`, error);
          results.errors++;
        }
      }

      // Process skills
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        this.showProgress(items.length + i, items.length + skills.length, `Processing skill ${i + 1}/${skills.length}`);

        try {
          if (skill.skill_data?.imageData && skill.skill_data.imageData.startsWith('data:')) {
            const newImageUrl = await ImageStorage.uploadBase64Image(
              skill.skill_data.imageData,
              skill.skill_data.skillName || `skill_${skill.id}`,
              'skill'
            );

            await SupabaseClient.supabase
              .from('skills')
              .update({
                skill_data: {
                  ...skill.skill_data,
                  imageData: newImageUrl
                }
              })
              .eq('id', skill.id);

            results.migratedSkills++;
            this.debug(`✅ Migrated skill ${skill.id} image`);
          }
        } catch (error) {
          this.debug(`❌ Error migrating skill ${skill.id}:`, error);
          results.errors++;
        }
      }

      results.endTime = new Date();
      const duration = (results.endTime - results.startTime) / 1000;

      this.debug('🎉 Migration completed:', {
        ...results,
        duration: `${duration.toFixed(1)} seconds`
      });

      return results;

    } catch (error) {
      this.debug('❌ Migration failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clean up orphaned images in storage
   * @returns {Promise<number>} Number of images cleaned up
   */
  static async cleanupOrphanedImages() {
    try {
      this.debug('🧹 Starting orphaned image cleanup...');

      if (typeof ImageStorage === 'undefined') {
        throw new Error('ImageStorage not available');
      }

      const deletedCount = await ImageStorage.cleanupOrphanedImages();
      
      this.debug(`✅ Cleanup completed: ${deletedCount} orphaned images deleted`);
      return deletedCount;

    } catch (error) {
      this.debug('❌ Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  static async getStorageStats() {
    try {
      if (typeof ImageStorage === 'undefined') {
        throw new Error('ImageStorage not available');
      }

      const stats = await ImageStorage.getStorageStats();
      this.debug('📊 Storage statistics:', stats);
      return stats;

    } catch (error) {
      this.debug('❌ Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Create migration UI
   */
  static createMigrationUI() {
    const container = document.createElement('div');
    container.id = 'migration-ui';
    container.innerHTML = `
      <div class="migration-panel">
        <h3>🔄 Database Migration</h3>
        
        <div class="migration-section">
          <h4>Image Migration</h4>
          <p>Migrate existing base64 images to Supabase Storage for better performance.</p>
          <button id="migrate-images-btn" class="migration-btn">
            🚀 Start Image Migration
          </button>
          <div id="migration-progress"></div>
        </div>

        <div class="migration-section">
          <h4>Storage Management</h4>
          <button id="cleanup-images-btn" class="migration-btn">
            🧹 Cleanup Orphaned Images
          </button>
          <button id="storage-stats-btn" class="migration-btn">
            📊 View Storage Stats
          </button>
        </div>

        <div id="migration-results"></div>
      </div>
    `;

    // Add event listeners
    container.querySelector('#migrate-images-btn').addEventListener('click', async () => {
      try {
        const results = await this.migrateImagesToStorage();
        container.querySelector('#migration-results').innerHTML = `
          <div class="migration-success">
            <h4>✅ Migration Completed</h4>
            <p>Migrated ${results.migratedItems} items and ${results.migratedSkills} skills</p>
            <p>Errors: ${results.errors}</p>
            <p>Duration: ${((results.endTime - results.startTime) / 1000).toFixed(1)} seconds</p>
          </div>
        `;
      } catch (error) {
        container.querySelector('#migration-results').innerHTML = `
          <div class="migration-error">
            <h4>❌ Migration Failed</h4>
            <p>${error.message}</p>
          </div>
        `;
      }
    });

    container.querySelector('#cleanup-images-btn').addEventListener('click', async () => {
      try {
        const deletedCount = await this.cleanupOrphanedImages();
        container.querySelector('#migration-results').innerHTML = `
          <div class="migration-success">
            <h4>✅ Cleanup Completed</h4>
            <p>Deleted ${deletedCount} orphaned images</p>
          </div>
        `;
      } catch (error) {
        container.querySelector('#migration-results').innerHTML = `
          <div class="migration-error">
            <h4>❌ Cleanup Failed</h4>
            <p>${error.message}</p>
          </div>
        `;
      }
    });

    container.querySelector('#storage-stats-btn').addEventListener('click', async () => {
      try {
        const stats = await this.getStorageStats();
        container.querySelector('#migration-results').innerHTML = `
          <div class="migration-success">
            <h4>📊 Storage Statistics</h4>
            <p>Total Files: ${stats.totalFiles}</p>
            <p>Total Size: ${stats.totalSize.toFixed(2)} MB</p>
            <p>Card Images: ${stats.cardImages}</p>
            <p>Skill Images: ${stats.skillImages}</p>
            <p>Gallery Images: ${stats.galleryImages}</p>
          </div>
        `;
      } catch (error) {
        container.querySelector('#migration-results').innerHTML = `
          <div class="migration-error">
            <h4>❌ Failed to get stats</h4>
            <p>${error.message}</p>
          </div>
        `;
      }
    });

    return container;
  }

  /**
   * Show migration UI in a modal
   */
  static showMigrationUI() {
    const modal = document.createElement('div');
    modal.className = 'migration-modal';
    modal.innerHTML = `
      <div class="migration-modal-content">
        <span class="migration-close">&times;</span>
        <div id="migration-content"></div>
      </div>
    `;

    const content = modal.querySelector('#migration-content');
    content.appendChild(this.createMigrationUI());

    modal.querySelector('.migration-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
  }
}

// Add CSS for migration UI
const migrationStyles = `
  .migration-modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
  }

  .migration-modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
    border-radius: 8px;
    position: relative;
  }

  .migration-close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }

  .migration-close:hover {
    color: #000;
  }

  .migration-panel {
    margin-top: 20px;
  }

  .migration-section {
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .migration-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
  }

  .migration-btn:hover {
    background: #0056b3;
  }

  .migration-success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
  }

  .migration-error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
  }

  .migration-progress {
    margin: 10px 0;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #007bff;
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    margin-top: 5px;
    font-size: 14px;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = migrationStyles;
document.head.appendChild(styleSheet);

// Make available globally
window.MigrationUtility = MigrationUtility;

// Global function to show migration UI
window.showMigrationUI = () => {
  MigrationUtility.showMigrationUI();
}; 