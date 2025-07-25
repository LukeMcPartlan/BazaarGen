  /**
 * Unified Supabase Database Client
 * Handles all database operations for items and skills with simplified structure
 */
class SupabaseClient {
  static supabase = null;
  static isInitialized = false;
  static debugMode = true;

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[SupabaseClient] ${message}`, data || '');
    }
  }

  /**
   * Initialize Supabase client
   */
  static init() {
    if (this.isInitialized) {
      this.debug('Already initialized, skipping...');
      return;
    }

    try {
      this.debug('Initializing Supabase client...');
      
      const supabaseUrl = 'https://zslsedcfihgwbfljqhod.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbHNlZGNmaWhnd2JmbGpxaG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTEwNzksImV4cCI6MjA2NTQyNzA3OX0.wA23SQZ8PZRambG4RVVWlcxUxdVUz4dNKLQgqY_xR08';

      if (typeof supabase === 'undefined') {
        throw new Error('Supabase library not loaded');
      }

      this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
        db: {
          schema: 'public'
        }
      });

      this.isInitialized = true;
      this.debug('Supabase client initialized successfully');

      this.testConnection().then(result => {
        this.debug('Initial connection test result:', result);
      });

    } catch (error) {
      this.debug('Failed to initialize Supabase:', error);
      console.error('Supabase initialization error:', error);
    }
  }

  /**
   * Check if Supabase is ready
   */
  static isReady() {
    return this.isInitialized && this.supabase !== null;
  }

  /**
   * Test database connection
   */
  static async testConnection() {
    try {
      if (!this.isReady()) {
        throw new Error('Supabase not initialized');
      }

      const { data, error, count } = await this.supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      this.debug('Database connection successful');
      return { success: true, userCount: count };
    } catch (error) {
      this.debug('Database connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get or create user profile
   */
  static async getUserProfile(email) {
    try {
      if (!this.isReady() || !email) {
        throw new Error('Database not available or email missing');
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      this.debug('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Save or update user profile
   */
  static async saveUserProfile(profileData) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!profileData.email || !profileData.alias) {
        throw new Error('Email and alias are required');
      }

      const existingUser = await this.getUserProfile(profileData.email);

      if (existingUser) {
        const { data, error } = await this.supabase
          .from('users')
          .update({
            alias: profileData.alias,
            updated_at: new Date().toISOString()
          })
          .eq('email', profileData.email)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const newUser = {
          email: profileData.email,
          alias: profileData.alias,
          google_id: profileData.google_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      this.debug('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Save item to database
   */
  static async saveItem(itemData) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      const userProfile = GoogleAuth.getUserProfile();

      this.debug('Saving item with user data:', {
        userEmail,
        userProfile,
        userAlias: userProfile?.alias,
        itemName: itemData.itemName
      });

      const itemRecord = {
        user_email: userEmail,
        user_alias: userProfile?.alias || 'Unknown',
        item_data: itemData,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('items')
        .insert([itemRecord])
        .select()
        .single();

      if (error) throw error;

      this.debug('Item saved successfully');
      return { success: true, data };
    } catch (error) {
      this.debug('Error saving item:', error);
      throw error;
    }
  }

  /**
   * Save skill to database (handles both individual skills and collections)
   */
  static async saveSkill(skillData) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      const userProfile = GoogleAuth.getUserProfile();

      // Determine if this is a collection
      const isCollection = skillData.isCollection || false;
      const skillCount = isCollection ? (skillData.skills?.length || 0) : 1;

      const skillRecord = {
        user_email: userEmail,
        user_alias: userProfile?.alias || 'Unknown',
        skill_data: skillData,
        is_collection: isCollection,
        collection_name: isCollection ? skillData.skillName : null,
        collection_description: isCollection ? skillData.skillEffect : null,
        skill_count: skillCount,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('skills')
        .insert([skillRecord])
        .select()
        .single();

      if (error) throw error;

      this.debug('Skill/Collection saved successfully');
      return { success: true, data };
    } catch (error) {
      this.debug('Error saving skill/collection:', error);
      throw error;
    }
  }

  /**
   * Save skill collection to database (alias for saveSkill)
   */
  static async saveSkillCollection(collectionData) {
    try {
      this.debug('Saving skill collection:', collectionData);
      
      // Convert collection data to skill format
      const skillData = {
        skillName: collectionData.name,
        skillEffect: collectionData.description,
        skills: collectionData.skills,
        isCollection: true,
        border: 'gold' // Default border for collections
      };

      return await this.saveSkill(skillData);
    } catch (error) {
      this.debug('Error saving skill collection:', error);
      throw error;
    }
  }

  /**
   * Save item collection/gallery to database
   */
  static async saveItemCollection(itemData) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      const userProfile = GoogleAuth.getUserProfile();

      // Debug the incoming data
      this.debug('🖼️ Saving gallery - Original data:', {
        hasImageData: !!itemData.imageData,
        imageDataLength: itemData.imageData ? itemData.imageData.length : 0,
        hasGalleryItems: !!(itemData.galleryItems && itemData.galleryItems.length > 0),
        firstGalleryItemImage: itemData.galleryItems && itemData.galleryItems[0] ? !!itemData.galleryItems[0].imageData : false
      });

      // Optimize the gallery data to reduce size but keep images
      const optimizedItemData = this.optimizeGalleryData(itemData);

      // Debug the optimized data
      this.debug('🖼️ Saving gallery - Optimized data:', {
        hasImageData: !!optimizedItemData.imageData,
        imageDataLength: optimizedItemData.imageData ? optimizedItemData.imageData.length : 0,
        hasGalleryItems: !!(optimizedItemData.galleryItems && optimizedItemData.galleryItems.length > 0),
        firstGalleryItemImage: optimizedItemData.galleryItems && optimizedItemData.galleryItems[0] ? !!optimizedItemData.galleryItems[0].imageData : false
      });

      const itemRecord = {
        user_email: userEmail,
        user_alias: userProfile?.alias || 'Unknown',
        item_data: optimizedItemData,
        created_at: new Date().toISOString()
      };

      const dataSize = JSON.stringify(optimizedItemData).length;
      this.debug('Saving item collection with data size:', dataSize);

      // For large galleries, we'll use a more robust approach with multiple retry strategies
      let data = null;
      let error = null;
      
      // Strategy 1: Try normal insert with select
      try {
        this.debug('Attempting gallery save with normal insert...');
        const result = await this.supabase
          .from('items')
          .insert([itemRecord])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } catch (e) {
        error = e;
      }

      // Strategy 2: If timeout, try insert without select
      if (error && (error.code === '57014' || error.message.includes('timeout'))) {
        this.debug('Timeout detected, trying insert without select...');
        try {
          const { error: insertError } = await this.supabase
            .from('items')
            .insert([itemRecord]);
            
          if (insertError) {
            throw insertError;
          }
          
          // If insert succeeded, fetch the inserted record
          const { data: fetchedData, error: fetchError } = await this.supabase
            .from('items')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (fetchError) {
            throw fetchError;
          }
          
          data = fetchedData;
          error = null;
          this.debug('Gallery saved successfully with fallback method');
        } catch (fallbackError) {
          error = fallbackError;
          this.debug('Fallback method also failed:', fallbackError);
        }
      }

      if (error) throw error;

      this.debug('Item collection saved successfully');
      return { success: true, data };
    } catch (error) {
      this.debug('Error saving item collection:', error);
      throw error;
    }
  }

  /**
   * Optimize gallery data to reduce database payload size while keeping images
   */
  static optimizeGalleryData(itemData) {
    if (!itemData.isGallery || !itemData.galleryItems) {
      return itemData;
    }

    // Create a simplified version of the gallery data
    const optimizedData = {
      itemName: itemData.itemName,
      hero: itemData.hero,
      itemSize: itemData.itemSize,
      border: itemData.border,
      tags: itemData.tags,
      passiveEffects: itemData.passiveEffects,
      onUseEffects: itemData.onUseEffects,
      scalingValues: itemData.scalingValues,
      imageData: itemData.imageData, // Preserve the main gallery image
      timestamp: itemData.timestamp,
      isGallery: true,
      galleryInfo: {
        name: itemData.galleryInfo?.name,
        itemCount: itemData.galleryInfo?.itemCount,
        createdBy: itemData.galleryInfo?.createdBy,
        createdAt: itemData.galleryInfo?.createdAt
      },
      // Keep all gallery items with their images (as before)
      galleryItems: itemData.galleryItems.map(item => ({
        itemName: item.itemName,
        hero: item.hero,
        itemSize: item.itemSize,
        border: item.border,
        tags: item.tags,
        passiveEffects: item.passiveEffects,
        onUseEffects: item.onUseEffects,
        scalingValues: item.scalingValues,
        imageData: item.imageData, // Keep the image
        timestamp: item.timestamp
      }))
    };

    return optimizedData;
  }

  /**
   * Check if gallery data size is within acceptable limits
   */
  static checkGallerySize(itemData) {
    const dataSize = JSON.stringify(itemData).length;
    const sizeInMB = dataSize / (1024 * 1024);
    
    this.debug(`Gallery data size: ${sizeInMB.toFixed(2)}MB (${dataSize} bytes)`);
    
    // No size limits - allow any size gallery
    return { 
      acceptable: true,
      info: `Gallery size: ${sizeInMB.toFixed(1)}MB`
    };
  }

  /**
   * Split large gallery into smaller chunks for saving
   */
  static async saveLargeGallery(itemData) {
    const maxItemsPerChunk = 10; // Maximum items per chunk
    const galleryItems = itemData.galleryItems || [];
    
    if (galleryItems.length <= maxItemsPerChunk) {
      // Small enough to save as single collection
      return await this.saveItemCollection(itemData);
    }

    // Split into multiple collections
    const chunks = [];
    for (let i = 0; i < galleryItems.length; i += maxItemsPerChunk) {
      chunks.push(galleryItems.slice(i, i + maxItemsPerChunk));
    }

    this.debug(`Splitting gallery into ${chunks.length} chunks of max ${maxItemsPerChunk} items each`);

    const savedCollections = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkData = {
        ...itemData,
        itemName: `${itemData.itemName} (Part ${i + 1}/${chunks.length})`,
        galleryItems: chunks[i],
        galleryInfo: {
          ...itemData.galleryInfo,
          name: `${itemData.galleryInfo.name} (Part ${i + 1}/${chunks.length})`,
          itemCount: chunks[i].length,
          partNumber: i + 1,
          totalParts: chunks.length
        }
      };

      const result = await this.saveItemCollection(chunkData);
      savedCollections.push(result);
    }

    return {
      success: true,
      data: savedCollections,
      split: true,
      totalParts: chunks.length
    };
  }

 /**
 * Load items with filters - CORRECTED VERSION
 */
static async loadItems(options = {}, requestOptions = {}) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    let query = this.supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply hero filter
    if (options.hero) {
      query = query.filter('item_data->hero', 'eq', `"${options.hero}"`);
    }

    // Apply contest filter
    if (options.contest !== undefined && options.contest !== '') {
      query = query.eq('contest_number', parseInt(options.contest));
    }

    // Apply search filter
    if (options.search) {
      query = query.filter('item_data->itemName', 'ilike', `%${options.search}%`);
    }

    // Apply sorting
    switch (options.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // *** CORRECTED ABORT SIGNAL SUPPORT ***
    let queryPromise;
    if (requestOptions.signal) {
      // Wrap the query in a Promise.race with abort signal
      queryPromise = Promise.race([
        query,
        new Promise((_, reject) => {
          requestOptions.signal.addEventListener('abort', () => {
            reject(new DOMException('Query was aborted', 'AbortError'));
          });
        })
      ]);
    } else {
      queryPromise = query;
    }

    const { data, error } = await queryPromise;

    if (error) throw error;

    this.debug('Retrieved items successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    this.debug('Error loading items:', error);
    throw error;
  }
}

/**
 * Load skills with filters - CORRECTED VERSION
 */
static async loadSkills(options = {}, requestOptions = {}) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    let query = this.supabase
      .from('skills')
      .select('*');

    // Apply rarity filter
    if (options.rarity) {
      query = query.filter('skill_data->border', 'eq', `"${options.rarity}"`);
    }

    // Apply search filter
    if (options.search) {
      query = query.filter('skill_data->skillName', 'ilike', `%${options.search}%`);
    }

    // Apply creator filter
    if (options.creator) {
      query = query.filter('user_alias', 'ilike', `%${options.creator}%`);
    }

    // Apply sorting
    switch (options.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name':
        query = query.order('skill_data->skillName', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('skill_data->skillName', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // *** CORRECTED ABORT SIGNAL SUPPORT ***
    let queryPromise;
    if (requestOptions.signal) {
      // Wrap the query in a Promise.race with abort signal
      queryPromise = Promise.race([
        query,
        new Promise((_, reject) => {
          requestOptions.signal.addEventListener('abort', () => {
            reject(new DOMException('Query was aborted', 'AbortError'));
          });
        })
      ]);
    } else {
      queryPromise = query;
    }

    const { data, error } = await queryPromise;

    if (error) throw error;

    let filteredSkills = data || [];

    // Apply client-side filters for complex operations
    if (options.keywords) {
      const keywordLower = options.keywords.toLowerCase();
      filteredSkills = filteredSkills.filter(skill => 
        skill.skill_data?.skillEffect?.toLowerCase().includes(keywordLower)
      );
    }

    if (options.length) {
      filteredSkills = filteredSkills.filter(skill => {
        const effectLength = skill.skill_data?.skillEffect?.length || 0;
        switch (options.length) {
          case 'short': return effectLength < 100;
          case 'medium': return effectLength >= 100 && effectLength <= 200;
          case 'long': return effectLength > 200;
          default: return true;
        }
      });
    }

    this.debug('Retrieved skills successfully:', filteredSkills.length);
    return filteredSkills;
  } catch (error) {
    this.debug('Error loading skills:', error);
    throw error;
  }
}
  /**
   * Load item collections/galleries from database
   */
  static async loadItemCollections(options = {}) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      let query = this.supabase
        .from('items')
        .select('*')
        .filter('item_data->isGallery', 'eq', true)
        .order('created_at', { ascending: false });

      // Apply user filter if specified
      if (options.userEmail) {
        query = query.eq('user_email', options.userEmail);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.debug(`Loaded ${data.length} item collections`);
      return data;

    } catch (error) {
      this.debug('Error loading item collections:', error);
      throw error;
    }
  }

  /**
   * Get a specific item collection by ID
   */
  static async getItemCollection(collectionId) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('id', collectionId)
        .filter('item_data->isGallery', 'eq', true)
        .single();

      if (error) throw error;

      this.debug('Loaded item collection:', data);
      return data;

    } catch (error) {
      this.debug('Error loading item collection:', error);
      throw error;
    }
  }
  /**
   * Get user's saved items
   */
  static async getUserItems() {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();

      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Debug: Log the raw data returned from database
      this.debug('Raw database items data:', data?.map(item => ({
        id: item.id,
        itemName: item.item_data?.itemName,
        isGallery: item.item_data?.isGallery,
        hasImageData: !!item.item_data?.imageData,
        galleryItemsCount: item.item_data?.galleryItems?.length,
        firstGalleryItemImage: item.item_data?.galleryItems && item.item_data?.galleryItems[0] ? !!item.item_data?.galleryItems[0].imageData : false
      })));

      return data || [];
    } catch (error) {
      this.debug('Error fetching user items:', error);
      throw error;
    }
  }

/**
 * Get comments for a skill
 */
static async getSkillComments(skillId) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    const { data, error } = await this.supabase
      .from('comments')
      .select('*')
      .eq('skill_id', skillId)  // Use skill_id instead of item_id
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    this.debug('Error fetching skill comments:', error);
    throw error;
  }
}

/**
 * Add a comment to a skill
 */
static async addSkillComment(skillId, commentText) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    const userProfile = GoogleAuth.getUserProfile();

    const commentData = {
      skill_id: skillId,  // Use skill_id instead of item_id
      user_email: userEmail,
      user_alias: userProfile?.alias || 'Unknown',
      content: commentText,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    this.debug('Error adding skill comment:', error);
    throw error;
  }
}


  

  /**
   * Get user's saved skills
   */
  static async getUserSkills() {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();

      const { data, error } = await this.supabase
        .from('skills')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      this.debug('Error fetching user skills:', error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  static async deleteItem(itemId) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    // First, verify the user owns this item
    const { data: item, error: itemError } = await this.supabase
      .from('items')
      .select('id, user_email, item_data')
      .eq('id', itemId)
      .eq('user_email', userEmail)
      .single();

    if (itemError || !item) {
      return { success: false, error: 'Item not found or not owned by user' };
    }

    this.debug('Deleting item and related records for item:', itemId);

    // Delete in order: comments -> votes -> item (respecting foreign key constraints)

    // 1. Delete related comments
    const { error: commentsError } = await this.supabase
      .from('comments')
      .delete()
      .eq('item_id', itemId);

    if (commentsError) {
      this.debug('Error deleting item comments:', commentsError);
      // Continue anyway - comments might not exist
    } else {
      this.debug('Deleted comments for item:', itemId);
    }

    // 2. Delete related votes
    const { error: votesError } = await this.supabase
      .from('votes')
      .delete()
      .eq('item_id', itemId);

    if (votesError) {
      this.debug('Error deleting item votes:', votesError);
      // Continue anyway - votes might not exist
    } else {
      this.debug('Deleted votes for item:', itemId);
    }

    // 3. Finally, delete the item itself
    const { data: deletedItem, error: deleteError } = await this.supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (deleteError) {
      this.debug('Error deleting item:', deleteError);
      return { success: false, error: deleteError.message };
    }

    this.debug('Item deleted successfully:', itemId);
    return { success: true, deletedItem: deletedItem };

  } catch (error) {
    this.debug('Error in deleteItem:', error);
    return { success: false, error: error.message };
  }
}
  /**
   * Delete skill
   */
  static async deleteSkill(skillId) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    // First, verify the user owns this skill
    const { data: skill, error: skillError } = await this.supabase
      .from('skills')
      .select('id, user_email, skill_data')
      .eq('id', skillId)
      .eq('user_email', userEmail)
      .single();

    if (skillError || !skill) {
      return { success: false, error: 'Skill not found or not owned by user' };
    }

    this.debug('Deleting skill and related records for skill:', skillId);

    // Delete in order: comments -> votes -> skill (respecting foreign key constraints)

    // 1. Delete related comments
    const { error: commentsError } = await this.supabase
      .from('comments')
      .delete()
      .eq('skill_id', skillId);

    if (commentsError) {
      this.debug('Error deleting skill comments:', commentsError);
      // Continue anyway - comments might not exist
    } else {
      this.debug('Deleted comments for skill:', skillId);
    }

    // 2. Delete related votes  
    const { error: votesError } = await this.supabase
      .from('votes')
      .delete()
      .eq('skill_id', skillId);

    if (votesError) {
      this.debug('Error deleting skill votes:', votesError);
      // Continue anyway - votes might not exist
    } else {
      this.debug('Deleted votes for skill:', skillId);
    }

    // 3. Finally, delete the skill itself
    const { data: deletedSkill, error: deleteError } = await this.supabase
      .from('skills')
      .delete()
      .eq('id', skillId)
      .eq('user_email', userEmail)
      .select();

    if (deleteError) {
      this.debug('Error deleting skill:', deleteError);
      return { success: false, error: deleteError.message };
    }

    this.debug('Skill deleted successfully:', skillId);
    return { success: true, deletedItem: deletedSkill };

  } catch (error) {
    this.debug('Error in deleteSkill:', error);
    return { success: false, error: error.message };
  }
}
  /**
   * Get comments for an item
   */
  static async getComments(itemId) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      const { data, error } = await this.supabase
        .from('comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      this.debug('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Add a comment to an item
   */
  static async addComment(itemId, commentText) {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      const userProfile = GoogleAuth.getUserProfile();

      const commentData = {
        item_id: itemId,
        user_email: userEmail,
        user_alias: userProfile?.alias || 'Unknown',
        content: commentText,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('comments')
        .insert([commentData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      this.debug('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getStatistics() {
    try {
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      const [itemsResult, skillsResult, usersResult] = await Promise.all([
        this.supabase.from('items').select('id', { count: 'exact', head: true }),
        this.supabase.from('skills').select('id', { count: 'exact', head: true }),
        this.supabase.from('users').select('id', { count: 'exact', head: true })
      ]);

      return {
        items: itemsResult.count || 0,
        skills: skillsResult.count || 0,
        users: usersResult.count || 0
      };
    } catch (error) {
      this.debug('Error getting statistics:', error);
      return { items: 0, skills: 0, users: 0, error: error.message };
    }
  }

  /**
   * Search skills by keyword
   */
  static async searchSkillsByKeyword(keyword, limit = 50) {
    try {
      if (!this.isReady() || !keyword?.trim()) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const keywordLower = keyword.toLowerCase();
      const matchingSkills = (data || [])
        .filter(skill => {
          const skillEffect = skill.skill_data?.skillEffect?.toLowerCase() || '';
          const skillName = skill.skill_data?.skillName?.toLowerCase() || '';
          return skillEffect.includes(keywordLower) || skillName.includes(keywordLower);
        })
        .slice(0, limit);

      return matchingSkills;
    } catch (error) {
      this.debug('Error searching skills by keyword:', error);
      throw error;
    }
  }

/**
 * Check if user has already voted on an item - FIXED VERSION
 */
static async hasUserVoted(itemId, voteType = 'upvote') {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      return false;
    }

    const userEmail = GoogleAuth.getUserEmail();

    // *** FIX: Use .maybeSingle() instead of .single() ***
    const { data, error } = await this.supabase
      .from('votes')
      .select('id')
      .eq('item_id', itemId)
      .eq('user_email', userEmail)
      .eq('vote_type', voteType)
      .maybeSingle(); // ← This allows 0 or 1 rows without error

    if (error) {
      throw error;
    }

    return !!data; // Returns true if vote exists, false if not
  } catch (error) {
    this.debug('Error checking user vote:', error);
    return false;
  }
}

/**
 * Check if user has already voted on a skill - FIXED VERSION
 */
static async hasUserVotedSkill(skillId, voteType = 'upvote') {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      return false;
    }

    const userEmail = GoogleAuth.getUserEmail();

    // *** FIX: Use .maybeSingle() instead of .single() ***
    const { data, error } = await this.supabase
      .from('votes')
      .select('id')
      .eq('skill_id', skillId)
      .eq('user_email', userEmail)
      .eq('vote_type', voteType)
      .maybeSingle(); // ← This allows 0 or 1 rows without error

    if (error) {
      throw error;
    }

    return !!data;
  } catch (error) {
    this.debug('Error checking user skill vote:', error);
    return false;
  }
}

/**
 * Vote on an item - SIMPLIFIED VERSION
 */
static async voteItem(itemId, voteType = 'upvote') {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    // Check if user has already voted
    const alreadyVoted = await this.hasUserVoted(itemId, voteType);
    if (alreadyVoted) {
      throw new Error('You have already voted on this item');
    }

    // Add vote record
    const voteData = {
      item_id: itemId,
      user_email: userEmail,
      vote_type: voteType,
      created_at: new Date().toISOString()
    };

    const { data: voteRecord, error: voteError } = await this.supabase
      .from('votes')
      .insert([voteData])
      .select()
      .single();

    if (voteError) throw voteError;

    // *** SIMPLIFIED: Just increment the existing count ***
    const newCount = await this.getItemUpvoteCount(itemId);
    
    // Update item upvote count - FIXED VERSION
    const { error: updateError } = await this.supabase
      .from('items')
      .update({ 
        upvotes: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      this.debug('Warning: Could not update item upvote count:', updateError);
      // Don't throw error - the vote was still recorded
    }

    this.debug('Vote added successfully for item:', itemId);
    return { 
      success: true, 
      vote: voteRecord, 
      newCount: newCount 
    };

  } catch (error) {
    this.debug('Error voting on item:', error);
    throw error;
  }
}

/**
 * Vote on a skill - SIMPLIFIED VERSION  
 */
static async voteSkill(skillId, voteType = 'upvote') {
  try {
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    // Check if user has already voted
    const alreadyVoted = await this.hasUserVotedSkill(skillId, voteType);
    if (alreadyVoted) {
      throw new Error('You have already voted on this skill');
    }

    // Add vote record
    const voteData = {
      skill_id: skillId,
      user_email: userEmail,
      vote_type: voteType,
      created_at: new Date().toISOString()
    };

    const { data: voteRecord, error: voteError } = await this.supabase
      .from('votes')
      .insert([voteData])
      .select()
      .single();

    if (voteError) throw voteError;

    // *** SIMPLIFIED: Just get the count without updating skills table ***
    const newCount = await this.getSkillUpvoteCount(skillId);

    // Try to update skill upvote count (this might fail if column doesn't exist)
    try {
      await this.supabase
        .from('skills')
        .update({ 
          upvotes: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', skillId);
    } catch (updateError) {
      this.debug('Warning: Could not update skill upvote count (column may not exist):', updateError);
      // Don't throw error - the vote was still recorded
    }

    this.debug('Vote added successfully for skill:', skillId);
    return { 
      success: true, 
      vote: voteRecord, 
      newCount: newCount 
    };

  } catch (error) {
    this.debug('Error voting on skill:', error);
    throw error;
  }
}

/**
 * Get upvote count for an item - SAFE VERSION
 */
static async getItemUpvoteCount(itemId) {
  try {
    const { count, error } = await this.supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
      .eq('vote_type', 'upvote');

    if (error) {
      this.debug('Error getting item upvote count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    this.debug('Error getting item upvote count:', error);
    return 0;
  }
}

/**
 * Get upvote count for a skill - SAFE VERSION
 */
static async getSkillUpvoteCount(skillId) {
  try {
    const { count, error } = await this.supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('skill_id', skillId)
      .eq('vote_type', 'upvote');

    if (error) {
      this.debug('Error getting skill upvote count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    this.debug('Error getting skill upvote count:', error);
    return 0;
  }
}




  
  /**
   * Setup real-time subscriptions
   */
  static setupRealtimeSubscriptions() {
    if (!this.isReady()) return;

    this.supabase
      .channel('public:items')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'items' },
        (payload) => {
          document.dispatchEvent(new CustomEvent('newItemCreated', { 
            detail: payload.new 
          }));
        }
      )
      .subscribe();

    this.supabase
      .channel('public:skills')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'skills' },
        (payload) => {
          document.dispatchEvent(new CustomEvent('newSkillCreated', { 
            detail: payload.new 
          }));
        }
      )
      .subscribe();
  }

  /**
   * Cleanup subscriptions
   */
  static cleanup() {
    if (this.supabase) {
      this.supabase.removeAllChannels();
    }
  }

  /**
   * Toggle debug mode
   */
  static toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.debug('Debug mode toggled:', this.debugMode ? 'ON' : 'OFF');
    return this.debugMode;
  }

  /**
   * Load and reassemble split galleries
   */
  static async loadCompleteGallery(collectionId) {
    try {
      // First, get the main collection
      const mainCollection = await this.getItemCollection(collectionId);
      
      if (!mainCollection || !mainCollection.item_data?.galleryInfo) {
        throw new Error('Collection not found or invalid');
      }

      const galleryInfo = mainCollection.item_data.galleryInfo;
      
      // If it's not a split collection, return as is
      if (!galleryInfo.totalParts || galleryInfo.totalParts <= 1) {
        return mainCollection;
      }

      // For split collections, find all parts
      const allParts = [];
      
      // Get the base name (remove "Part X/Y" suffix)
      const baseName = galleryInfo.name.replace(/\s*\(Part\s+\d+\/\d+\)$/, '');
      
      // Query for all parts of this collection
      const { data: allCollections, error } = await this.supabase
        .from('items')
        .select('*')
        .filter('item_data->galleryInfo->name', 'ilike', `${baseName} (Part %`)
        .filter('item_data->isGallery', 'eq', true)
        .order('item_data->galleryInfo->partNumber', { ascending: true });

      if (error) throw error;

      // Reassemble the complete gallery
      const completeGallery = {
        ...mainCollection,
        item_data: {
          ...mainCollection.item_data,
          galleryItems: [],
          galleryInfo: {
            ...galleryInfo,
            name: baseName, // Remove part suffix
            itemCount: 0,
            partNumber: undefined,
            totalParts: undefined
          }
        }
      };

      // Combine all gallery items from all parts
      allCollections.forEach(collection => {
        const items = collection.item_data?.galleryItems || [];
        completeGallery.item_data.galleryItems.push(...items);
      });

      // Update total item count
      completeGallery.item_data.galleryInfo.itemCount = completeGallery.item_data.galleryItems.length;

      this.debug(`Reassembled split gallery: ${completeGallery.item_data.galleryItems.length} items from ${allCollections.length} parts`);
      
      return completeGallery;

    } catch (error) {
      this.debug('Error loading complete gallery:', error);
      throw error;
    }
  }

  /**
   * Get all items from database (for comprehensive filtering)
   */
  static async getAllItems() {
    try {
      if (!this.isReady()) {
        throw new Error('Supabase not initialized');
      }

      this.debug('Loading all items for comprehensive filtering...');

      const { data, error } = await this.supabase
        .from('items')
        .select(`
          id,
          user_email,
          user_alias,
          item_data,
          created_at,
          contest,
          upvotes
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.debug('Error loading all items:', error);
        throw error;
      }

      this.debug(`Loaded ${data?.length || 0} items for filtering`);
      return data || [];
    } catch (error) {
      this.debug('Failed to load all items:', error);
      console.error('Error loading all items:', error);
      return [];
    }
  }

  /**
   * Get all skills from database (for comprehensive filtering)
   */
  static async getAllSkills() {
    try {
      if (!this.isReady()) {
        throw new Error('Supabase not initialized');
      }

      this.debug('Loading all skills for comprehensive filtering...');

      const { data, error } = await this.supabase
        .from('skills')
        .select(`
          id,
          user_email,
          user_alias,
          skill_data,
          created_at,
          upvotes
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.debug('Error loading all skills:', error);
        throw error;
      }

      this.debug(`Loaded ${data?.length || 0} skills for filtering`);
      return data || [];
    } catch (error) {
      this.debug('Failed to load all skills:', error);
      console.error('Error loading all skills:', error);
      return [];
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  SupabaseClient.init();
});

window.addEventListener('beforeunload', () => {
  SupabaseClient.cleanup();
});

// Make available globally
window.SupabaseClient = SupabaseClient;
