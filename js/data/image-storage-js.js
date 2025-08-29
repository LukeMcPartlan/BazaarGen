/**
 * Image Storage Utility - TEMPORARILY DISABLED
 * Handles saving and retrieving images using Supabase Storage
 * 
 * NOTE: Storage functionality has been temporarily disabled due to RLS policy issues.
 * To re-enable:
 * 1. Set up proper RLS policies in Supabase dashboard
 * 2. Create storage bucket manually
 * 3. Uncomment the storage functions below
 */
class ImageStorage {
  static debugMode = true;
  static storageBucket = 'bazaargen-images';
  static maxImageSize = 5 * 1024 * 1024; // 5MB limit
  static supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[ImageStorage] ${message}`, data || '');
    }
  }

  /**
   * Initialize storage bucket - TEMPORARILY DISABLED
   */
  static async initStorage() {
    try {
      this.debug('Storage bucket initialization temporarily disabled');
      return false; // Return false to indicate storage is not available
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Supabase not available');
      }

      // Check if bucket exists, create if not
      const { data: buckets, error } = await SupabaseClient.supabase.storage.listBuckets();
      
      if (error) {
        this.debug('Error checking buckets:', error);
        throw error;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.storageBucket);
      
      if (!bucketExists) {
        this.debug('Creating storage bucket...');
        const { error: createError } = await SupabaseClient.supabase.storage.createBucket(this.storageBucket, {
          public: true,
          allowedMimeTypes: this.supportedFormats,
          fileSizeLimit: this.maxImageSize
        });
        
        if (createError) {
          this.debug('Error creating bucket:', createError);
          throw createError;
        }
      }

      this.debug('Storage initialized successfully');
      return true;
      */
    } catch (error) {
      this.debug('Failed to initialize storage:', error);
      return false; // Return false instead of throwing
    }
  }

  /**
   * Upload image to storage - TEMPORARILY DISABLED
   * @param {File} imageFile - Image file to upload
   * @param {string} itemName - Name for the image (used in filename)
   * @param {string} type - 'card' or 'skill'
   * @returns {Promise<string>} Public URL of uploaded image
   */
  static async uploadImage(imageFile, itemName, type = 'card') {
    try {
      this.debug('Image upload temporarily disabled - storage buckets not working');
      throw new Error('Image upload temporarily disabled - please set up storage buckets first');
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      this.debug('Starting image upload:', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        itemName,
        type
      });

      // Validate file
      this.validateImageFile(imageFile);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFilename(itemName);
      const fileExtension = imageFile.name.split('.').pop().toLowerCase();
      const filename = `${type}/${timestamp}_${sanitizedName}.${fileExtension}`;

      // Upload to storage
      const { data, error } = await SupabaseClient.supabase.storage
        .from(this.storageBucket)
        .upload(filename, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        this.debug('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = SupabaseClient.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(filename);

      this.debug('Image upload successful:', {
        filename,
        publicUrl: urlData.publicUrl
      });

      return urlData.publicUrl;
      */
    } catch (error) {
      this.debug('Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images for a gallery - TEMPORARILY DISABLED
   * @param {Array<File>} imageFiles - Array of image files
   * @param {string} galleryName - Name of the gallery
   * @returns {Promise<Array<string>>} Array of public URLs
   */
  static async uploadGalleryImages(imageFiles, galleryName) {
    try {
      this.debug('Gallery image upload temporarily disabled - storage buckets not working');
      throw new Error('Gallery image upload temporarily disabled - please set up storage buckets first');
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      this.debug('Uploading gallery images:', {
        imageCount: imageFiles.length,
        galleryName
      });

      const uploadPromises = imageFiles.map((file, index) => {
        const itemName = `${galleryName}_item_${index + 1}`;
        return this.uploadImage(file, itemName, 'gallery');
      });

      const urls = await Promise.all(uploadPromises);
      
      this.debug('Gallery images uploaded successfully:', {
        uploadedCount: urls.length,
        urls: urls.slice(0, 3) // Log first 3 URLs
      });

      return urls;
      */
    } catch (error) {
      this.debug('Failed to upload gallery images:', error);
      throw error;
    }
  }

  /**
   * Delete image from storage - TEMPORARILY DISABLED
   * @param {string} imageUrl - Public URL of image to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteImage(imageUrl) {
    try {
      this.debug('Image deletion temporarily disabled - storage buckets not working');
      return false; // Return false since deletion is disabled
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      if (!imageUrl) {
        this.debug('No image URL provided for deletion');
        return true;
      }

      // Extract filename from URL
      const filename = this.extractFilenameFromUrl(imageUrl);
      
      if (!filename) {
        this.debug('Could not extract filename from URL:', imageUrl);
        return false;
      }

      const { error } = await SupabaseClient.supabase.storage
        .from(this.storageBucket)
        .remove([filename]);

      if (error) {
        this.debug('Error deleting image:', error);
        return false;
      }

      this.debug('Image deleted successfully:', filename);
      return true;
      */
    } catch (error) {
      this.debug('Failed to delete image:', error);
      return false;
    }
  }

  /**
   * Convert base64 image to file and upload - TEMPORARILY DISABLED
   * @param {string} base64Data - Base64 image data
   * @param {string} itemName - Name for the image
   * @param {string} type - 'card' or 'skill'
   * @returns {Promise<string>} Public URL of uploaded image
   */
  static async uploadBase64Image(base64Data, itemName, type = 'card') {
    try {
      this.debug('Base64 image upload temporarily disabled - storage buckets not working');
      throw new Error('Base64 image upload temporarily disabled - please set up storage buckets first');
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      this.debug('Converting base64 to file and uploading...');

      // Convert base64 to file
      const file = this.base64ToFile(base64Data, itemName);
      
      // Upload the file
      return await this.uploadImage(file, itemName, type);
      */
    } catch (error) {
      this.debug('Failed to upload base64 image:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   */
  static validateImageFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxImageSize) {
      throw new Error(`File too large. Maximum size is ${this.maxImageSize / (1024 * 1024)}MB`);
    }

    if (!this.supportedFormats.includes(file.type)) {
      throw new Error(`Unsupported file type. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
  }

  /**
   * Convert base64 to File object
   * @param {string} base64Data - Base64 data URL
   * @param {string} filename - Filename for the file
   * @returns {File} File object
   */
  static base64ToFile(base64Data, filename) {
    // Remove data URL prefix
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    return new File([blob], filename, { type: 'image/png' });
  }

  /**
   * Sanitize filename for storage
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
  }

  /**
   * Extract filename from storage URL
   * @param {string} url - Storage URL
   * @returns {string|null} Filename or null
   */
  static extractFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (error) {
      this.debug('Error extracting filename from URL:', error);
      return null;
    }
  }

  /**
   * Get storage usage statistics - TEMPORARILY DISABLED
   * @returns {Promise<Object>} Storage statistics
   */
  static async getStorageStats() {
    try {
      this.debug('Storage stats temporarily disabled - storage buckets not working');
      return {
        totalFiles: 0,
        totalSize: 0,
        cardImages: 0,
        skillImages: 0,
        galleryImages: 0
      };
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      const { data, error } = await SupabaseClient.supabase.storage
        .from(this.storageBucket)
        .list('', { limit: 1000 });

      if (error) {
        this.debug('Error getting storage stats:', error);
        throw error;
      }

      const totalFiles = data.length;
      const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const cardImages = data.filter(file => file.name.startsWith('card/')).length;
      const skillImages = data.filter(file => file.name.startsWith('skill/')).length;
      const galleryImages = data.filter(file => file.name.startsWith('gallery/')).length;

      return {
        totalFiles,
        totalSize: totalSize / (1024 * 1024), // Convert to MB
        cardImages,
        skillImages,
        galleryImages
      };
      */
    } catch (error) {
      this.debug('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned images (images not referenced in database) - TEMPORARILY DISABLED
   * @returns {Promise<number>} Number of images cleaned up
   */
  static async cleanupOrphanedImages() {
    try {
      this.debug('Orphaned image cleanup temporarily disabled - storage buckets not working');
      return 0; // Return 0 since cleanup is disabled
      
      /* TEMPORARILY COMMENTED OUT - STORAGE BUCKETS NOT WORKING
      this.debug('Starting orphaned image cleanup...');

      // Get all images in storage
      const { data: storageFiles, error: storageError } = await SupabaseClient.supabase.storage
        .from(this.storageBucket)
        .list('', { limit: 1000 });

      if (storageError) {
        this.debug('Error getting storage files:', storageError);
        throw storageError;
      }

      // Get all items from database
      const items = await SupabaseClient.getAllItems();
      const skills = await SupabaseClient.getAllSkills();

      // Extract image URLs from database
      const dbImageUrls = new Set();
      
      // Extract from items
      items.forEach(item => {
        if (item.item_data?.imageData) {
          dbImageUrls.add(item.item_data.imageData);
        }
        if (item.item_data?.galleryItems) {
          item.item_data.galleryItems.forEach(galleryItem => {
            if (galleryItem.imageData) {
              dbImageUrls.add(galleryItem.imageData);
            }
          });
        }
      });

      // Extract from skills
      skills.forEach(skill => {
        if (skill.skill_data?.imageData) {
          dbImageUrls.add(skill.skill_data.imageData);
        }
      });

      // Find orphaned files
      const orphanedFiles = storageFiles.filter(file => {
        const fileUrl = SupabaseClient.supabase.storage
          .from(this.storageBucket)
          .getPublicUrl(file.name).data.publicUrl;
        return !dbImageUrls.has(fileUrl);
      });

      // Delete orphaned files
      let deletedCount = 0;
      for (const file of orphanedFiles) {
        const success = await this.deleteImage(file.name);
        if (success) deletedCount++;
      }

      this.debug(`Cleanup completed: ${deletedCount} orphaned images deleted`);
      return deletedCount;
    } catch (error) {
      this.debug('Failed to cleanup orphaned images:', error);
      throw error;
    }
  }

  /**
   * Migrate existing base64 images to storage
   * @param {number} batchSize - Number of items to process per batch
   * @returns {Promise<Object>} Migration results
   */
  static async migrateBase64Images(batchSize = 10) {
    try {
      this.debug('Starting base64 to storage migration...');

      const items = await SupabaseClient.getAllItems();
      const skills = await SupabaseClient.getAllSkills();
      
      let migratedItems = 0;
      let migratedSkills = 0;
      let errors = 0;

      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            if (item.item_data?.imageData && item.item_data.imageData.startsWith('data:')) {
              // Migrate main image
              const newImageUrl = await this.uploadBase64Image(
                item.item_data.imageData,
                item.item_data.itemName || 'item',
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

              migratedItems++;
              this.debug(`Migrated item ${item.id} image`);
            }

            // Migrate gallery images
            if (item.item_data?.galleryItems) {
              for (let j = 0; j < item.item_data.galleryItems.length; j++) {
                const galleryItem = item.item_data.galleryItems[j];
                if (galleryItem.imageData && galleryItem.imageData.startsWith('data:')) {
                  const newGalleryImageUrl = await this.uploadBase64Image(
                    galleryItem.imageData,
                    galleryItem.itemName || `gallery_item_${j}`,
                    'gallery'
                  );
                  
                  item.item_data.galleryItems[j].imageData = newGalleryImageUrl;
                }
              }

              // Update database with migrated gallery
              if (item.item_data.galleryItems.some(item => item.imageData && !item.imageData.startsWith('data:'))) {
                await SupabaseClient.supabase
                  .from('items')
                  .update({
                    item_data: item.item_data
                  })
                  .eq('id', item.id);
              }
            }
          } catch (error) {
            this.debug(`Error migrating item ${item.id}:`, error);
            errors++;
          }
        }
      }

      // Process skills
      for (let i = 0; i < skills.length; i += batchSize) {
        const batch = skills.slice(i, i + batchSize);
        
        for (const skill of batch) {
          try {
            if (skill.skill_data?.imageData && skill.skill_data.imageData.startsWith('data:')) {
              const newImageUrl = await this.uploadBase64Image(
                skill.skill_data.imageData,
                skill.skill_data.skillName || 'skill',
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

              migratedSkills++;
              this.debug(`Migrated skill ${skill.id} image`);
            }
          } catch (error) {
            this.debug(`Error migrating skill ${skill.id}:`, error);
            errors++;
          }
        }
      }

      const results = {
        migratedItems,
        migratedSkills,
        errors,
        totalProcessed: items.length + skills.length
      };

      this.debug('Migration completed:', results);
      return results;
    } catch (error) {
      this.debug('Failed to migrate images:', error);
      throw error;
    }
  }
}

// Auto-initialize storage on page load - TEMPORARILY DISABLED
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Storage initialization temporarily disabled
    ImageStorage.debug('Image storage initialization skipped - storage buckets not working');
    // await ImageStorage.initStorage();
    // ImageStorage.debug('Image storage ready');
  } catch (error) {
    ImageStorage.debug('Failed to initialize image storage:', error);
  }
});

// Make available globally
window.ImageStorage = ImageStorage; 