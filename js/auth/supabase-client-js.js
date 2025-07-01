/**
 * Supabase Database Client with Debugging
 * Handles all database operations for cards, skills, and user profiles
 */
class SupabaseClient {
  static supabase = null;
  static isInitialized = false;
  static debugMode = true; // Enable debugging

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
      
      // Your actual Supabase credentials
      const supabaseUrl = 'https://zslsedcfihgwbfljqhod.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbHNlZGNmaWhnd2JmbGpxaG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTEwNzksImV4cCI6MjA2NTQyNzA3OX0.wA23SQZ8PZRambG4RVVWlcxUxdVUz4dNKLQgqY_xR08';

      this.debug('Using Supabase URL:', supabaseUrl);
      this.debug('Anon key length:', supabaseAnonKey.length);

      if (typeof supabase === 'undefined') {
        throw new Error('Supabase library not loaded - check if CDN script is included');
      }

      this.debug('Supabase library found, creating client...');
      this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      });

      this.isInitialized = true;
      this.debug('Supabase client initialized successfully');

      // Test connection immediately
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
    const ready = this.isInitialized && this.supabase !== null;
    this.debug('Checking if ready:', ready);
    return ready;
  }

  /**
   * Test database connection
   */
  static async testConnection() {
    try {
      this.debug('Testing database connection...');
      
      if (!this.isReady()) {
        throw new Error('Supabase not initialized');
      }

      // Simple query to test connection - try to access a table
      this.debug('Attempting to query database...');
      const { data, error, count } = await this.supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      this.debug('Connection test query result:', { data, error, count });

      if (error) {
        this.debug('Connection test failed with error:', error);
        throw error;
      }

      this.debug('Database connection successful');
      return { success: true, userCount: count };
    } catch (error) {
      this.debug('Database connection test failed:', error);
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get or create user profile
   */
  static async getUserProfile(email) {
    try {
      this.debug('Getting user profile for email:', email);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!email) {
        throw new Error('Email is required');
      }

      this.debug('Querying users table...');
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      this.debug('User profile query result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        this.debug('User profile query error:', error);
        throw error;
      }

      if (data) {
        this.debug('Found existing user profile:', data);
      } else {
        this.debug('No existing user profile found');
      }

      return data;
    } catch (error) {
      this.debug('Error fetching user profile:', error);
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Save or update user profile
   */
  static async saveUserProfile(profileData) {
    try {
      this.debug('Saving user profile:', profileData);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!profileData.email) {
        throw new Error('Email is required for user profile');
      }

      if (!profileData.alias) {
        throw new Error('Alias is required for user profile');
      }

      // Check if user already exists
      this.debug('Checking for existing user...');
      const existingUser = await this.getUserProfile(profileData.email);

      if (existingUser) {
        // Update existing user
        this.debug('Updating existing user profile...');
        const { data, error } = await this.supabase
          .from('users')
          .update({
            alias: profileData.alias,
            updated_at: new Date().toISOString()
          })
          .eq('email', profileData.email)
          .select()
          .single();

        this.debug('User profile update result:', { data, error });

        if (error) {
          this.debug('User profile update error:', error);
          throw error;
        }

        this.debug('User profile updated successfully:', data);
        return data;
      } else {
        // Create new user
        this.debug('Creating new user profile...');
        const newUser = {
          email: profileData.email,
          alias: profileData.alias,
          google_id: profileData.google_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.debug('New user data:', newUser);

        const { data, error } = await this.supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        this.debug('User profile creation result:', { data, error });

        if (error) {
          this.debug('User profile creation error:', error);
          throw error;
        }

        this.debug('User profile created successfully:', data);
        return data;
      }
    } catch (error) {
      this.debug('Error saving user profile:', error);
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Save card to database
   */
 static async saveCard(cardData) {
  try {
    if (!this.isReady()) {
      throw new Error('Database not initialized');
    }

    const user = GoogleAuth.getUser();
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // Get user ID from email
    const userId = await this.getUserId(user.email);

    // Prepare item data
    const itemData = {
      name: cardData.itemName,
      hero: cardData.hero || 'Neutral',
      item_size: cardData.itemSize || 'Medium',
      rarity: cardData.border || 'gold',
      passive_effects: cardData.passiveEffects || [],
      on_use_effects: cardData.onUseEffects || [],
      tags: cardData.tags || [],
      scaling_values: cardData.scalingValues || {},
      cooldown: cardData.cooldown || null,
      ammo: cardData.ammo || null,
      crit: cardData.crit || null,
      multicast: cardData.multicast || null,
      image_data: cardData.imageData || null,
      user_id: userId
    };

    console.log('[SupabaseClient] Saving card:', itemData);

    const { data, error } = await this.client
      .from('items')
      .insert([{ item_data: itemData, user_id: userId }])
      .select(); // Add .select() to return the inserted data

    if (error) {
      console.error('[SupabaseClient] Error saving card:', error);
      throw error;
    }

    console.log('[SupabaseClient] Card saved successfully:', data);
    
    // Return success with the saved data including ID
    return { 
      success: true, 
      data: data[0] // Return the first (and only) inserted item
    };

  } catch (error) {
    console.error('[SupabaseClient] Save card error:', error);
    return { success: false, error: error.message };
  }
}
  /**
   * Save skill to database
   */
  static async saveSkill(skillData) {
    try {
      this.debug('Saving skill to database:', skillData);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      const userProfile = GoogleAuth.getUserProfile();

      this.debug('User context:', { userEmail, userProfile });

      if (!userEmail) {
        throw new Error('User email not available');
      }

      const skillRecord = {
        user_email: userEmail,
        user_alias: userProfile?.alias || 'Unknown',
        skill_data: skillData,
        created_at: new Date().toISOString()
      };

      this.debug('Skill record to insert:', skillRecord);

      const { data, error } = await this.supabase
        .from('skills')
        .insert([skillRecord])
        .select()
        .single();

      this.debug('Skill save result:', { data, error });

      if (error) {
        this.debug('Skill save error:', error);
        throw error;
      }

      this.debug('Skill saved successfully:', data);
      return { success: true, data };
    } catch (error) {
      this.debug('Error saving skill:', error);
      console.error('Error saving skill:', error);
      throw error;
    }
  }

  /**
   * Get user's saved items
   */
  static async getUserItems() {
    try {
      this.debug('Getting user items...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      this.debug('Fetching items for user:', userEmail);

      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      this.debug('User items query result:', { data, error, count: data?.length });

      if (error) {
        this.debug('User items query error:', error);
        throw error;
      }

      this.debug('Retrieved user items successfully:', data?.length || 0, 'items');
      return data || [];
    } catch (error) {
      this.debug('Error fetching user items:', error);
      console.error('Error fetching user items:', error);
      throw error;
    }
  }

  /**
   * Get user's saved skills
   */
  static async getUserSkills() {
    try {
      this.debug('Getting user skills...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const userEmail = GoogleAuth.getUserEmail();
      this.debug('Fetching skills for user:', userEmail);

      const { data, error } = await this.supabase
        .from('skills')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      this.debug('User skills query result:', { data, error, count: data?.length });

      if (error) {
        this.debug('User skills query error:', error);
        throw error;
      }

      this.debug('Retrieved user skills successfully:', data?.length || 0, 'skills');
      return data || [];
    } catch (error) {
      this.debug('Error fetching user skills:', error);
      console.error('Error fetching user skills:', error);
      throw error;
    }
  }

/**
 * Delete item using custom function (bypasses RLS)
 */
static async deleteItem(itemId) {
  try {
    this.debug('Deleting item with custom function:', itemId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    this.debug('Deleting item for user:', userEmail);

    // Use custom function instead of direct delete
    const { data, error } = await this.supabase
      .rpc('delete_user_item', {
        item_id: parseInt(itemId),
        user_email: userEmail
      });

    this.debug('Item deletion result:', { data, error });

    if (error) {
      this.debug('Item deletion error:', error);
      return { success: false, error: error.message };
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      this.debug('No item was deleted - possibly wrong ID or not owned by user');
      return { success: false, error: 'Item not found or not owned by user' };
    }

    this.debug('Item deleted successfully');
    return { success: true, error: null, deletedItem: data[0] };
  } catch (error) {
    this.debug('Error deleting item:', error);
    console.error('Error deleting item:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete skill using custom function (bypasses RLS)
 */
static async deleteSkill(skillId) {
  try {
    this.debug('Deleting skill with custom function:', skillId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    this.debug('Deleting skill for user:', userEmail);

    // Use custom function instead of direct delete
    const { data, error } = await this.supabase
      .rpc('delete_user_skill', {
        skill_id: parseInt(skillId),
        user_email: userEmail
      });

    this.debug('Skill deletion result:', { data, error });

    if (error) {
      this.debug('Skill deletion error:', error);
      return { success: false, error: error.message };
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      this.debug('No skill was deleted - possibly wrong ID or not owned by user');
      return { success: false, error: 'Skill not found or not owned by user' };
    }

    this.debug('Skill deleted successfully');
    return { success: true, error: null, deletedItem: data[0] };
  } catch (error) {
    this.debug('Error deleting skill:', error);
    console.error('Error deleting skill:', error);
    return { success: false, error: error.message };
  }
}
  /**
   * Get database statistics
   */
  static async getStatistics() {
    try {
      this.debug('Getting database statistics...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Get total counts
      this.debug('Querying table counts...');
      const [itemsResult, skillsResult, usersResult] = await Promise.all([
        this.supabase.from('items').select('id', { count: 'exact', head: true }),
        this.supabase.from('skills').select('id', { count: 'exact', head: true }),
        this.supabase.from('users').select('id', { count: 'exact', head: true })
      ]);

      this.debug('Statistics query results:', { itemsResult, skillsResult, usersResult });

      const stats = {
        items: itemsResult.count || 0,
        skills: skillsResult.count || 0,
        users: usersResult.count || 0
      };

      this.debug('Database statistics:', stats);
      return stats;
    } catch (error) {
      this.debug('Error getting statistics:', error);
      console.error('Error getting statistics:', error);
      return { items: 0, skills: 0, users: 0, error: error.message };
    }
  }

  /**
   * Get public items for contests
   */
  static async getPublicItems(contestNumber = null) {
    try {
      this.debug('Getting public items, contest:', contestNumber);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      let query = this.supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (contestNumber !== null) {
        query = query.eq('contest_number', contestNumber);
        this.debug('Filtering by contest number:', contestNumber);
      }

      const { data, error } = await query;

      this.debug('Public items query result:', { data, error, count: data?.length });

      if (error) {
        this.debug('Public items query error:', error);
        throw error;
      }

      this.debug('Retrieved public items successfully:', data?.length || 0, 'items');
      return data || [];
    } catch (error) {
      this.debug('Error fetching public items:', error);
      console.error('Error fetching public items:', error);
      throw error;
    }
  }

/**
 * Get comments for an item
 * @param {string|number} itemId - Item ID
 * @returns {Promise<Array>} Array of comments
 */
static async getComments(itemId) {
  try {
    this.debug('Getting comments for item:', itemId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    const { data, error } = await this.supabase
      .from('comments')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      this.debug('Comments query error:', error);
      throw error;
    }

    this.debug('Retrieved comments:', data?.length || 0);
    return data || [];
  } catch (error) {
    this.debug('Error fetching comments:', error);
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Add a comment to an item
 * @param {string|number} itemId - Item ID
 * @param {string} commentText - Comment text
 * @returns {Promise<Object>} Created comment
 */
static async addComment(itemId, commentText) {
  try {
    this.debug('Adding comment to item:', itemId);
    
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
      content: commentText,  // Changed from comment_text to content
      created_at: new Date().toISOString()
    };

    this.debug('Comment data:', commentData);

    const { data, error } = await this.supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      this.debug('Comment insert error:', error);
      throw error;
    }

    this.debug('Comment added successfully:', data);
    return data;
  } catch (error) {
    this.debug('Error adding comment:', error);
    console.error('Error adding comment:', error);
    throw error;
  }
}




  
  /**
   * Load items with filters for browse page
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of items
   */
  static async loadItems(options = {}) {
    try {
      this.debug('Loading items from database with options:', options);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

     // Start with base query - get all items
let query = this.supabase
  .from('items')
  .select('*')
  .order('created_at', { ascending: false });

      // Apply hero filter
      if (options.hero) {
        this.debug('Filtering by hero:', options.hero);
        // Use filter on the JSON column
        query = query.filter('item_data->hero', 'eq', `"${options.hero}"`);
      }

      // Apply contest filter
      if (options.contest !== undefined && options.contest !== '') {
        this.debug('Filtering by contest:', options.contest);
        query = query.eq('contest_number', parseInt(options.contest));
      }

      // Apply search filter
      if (options.search) {
        this.debug('Searching for:', options.search);
        // Search in the item name within the JSON data
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
        // Note: upvotes sorting would require a votes/upvotes column in your database
      }

      const { data, error } = await query;

      this.debug('Items query result:', { data, error, count: data?.length });

      if (error) {
        this.debug('Items query error:', error);
        throw error;
      }

      this.debug('Retrieved items successfully:', data?.length || 0, 'items');
      return data || [];
    } catch (error) {
      this.debug('Error loading items:', error);
      console.error('Error loading items:', error);
      throw error;
    }
  }

/**
 * SupabaseClient Skills Collection Extension
 * Add these methods to your existing SupabaseClient class
 */

// Add these methods to your existing SupabaseClient class:

/**
 * Save skill collection to database
 * @param {Object} collectionData - Collection data to save
 * @returns {Promise<Object>} Save result
 */
static async saveSkillCollection(collectionData) {
  try {
    this.debug('Saving skill collection to database:', collectionData.name);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    const userProfile = GoogleAuth.getUserProfile();

    if (!userEmail) {
      throw new Error('User email not available');
    }

    const collectionRecord = {
      user_email: userEmail,
      user_alias: userProfile?.alias || 'Unknown',
      name: collectionData.name,
      description: collectionData.description,
      skill_count: collectionData.skill_count,
      skills_data: collectionData.skills, // JSON array of skills
      created_at: new Date().toISOString()
    };

    this.debug('Collection record to insert:', collectionRecord);

    const { data, error } = await this.supabase
      .from('skill_collections')
      .insert([collectionRecord])
      .select()
      .single();

    this.debug('Collection save result:', { data, error });

    if (error) {
      this.debug('Collection save error:', error);
      throw error;
    }

    this.debug('Collection saved successfully:', data);
    return { success: true, data };
  } catch (error) {
    this.debug('Error saving skill collection:', error);
    console.error('Error saving skill collection:', error);
    throw error;
  }
}

/**
 * Get user's skill collections
 * @returns {Promise<Array>} Array of user's skill collections
 */
static async getUserSkillCollections() {
  try {
    this.debug('Getting user skill collections...');
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    this.debug('Fetching skill collections for user:', userEmail);

    const { data, error } = await this.supabase
      .from('skill_collections')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    this.debug('User skill collections query result:', { data, error, count: data?.length });

    if (error) {
      this.debug('User skill collections query error:', error);
      throw error;
    }

    this.debug('Retrieved user skill collections successfully:', data?.length || 0, 'collections');
    return data || [];
  } catch (error) {
    this.debug('Error fetching user skill collections:', error);
    console.error('Error fetching user skill collections:', error);
    throw error;
  }
}

/**
 * Get a specific skill collection by ID
 * @param {string|number} collectionId - Collection ID
 * @returns {Promise<Object>} Collection data
 */
static async getSkillCollection(collectionId) {
  try {
    this.debug('Getting skill collection by ID:', collectionId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    const { data, error } = await this.supabase
      .from('skill_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_email', userEmail) // Ensure user owns this collection
      .single();

    this.debug('Skill collection query result:', { data, error });

    if (error) {
      this.debug('Skill collection query error:', error);
      throw error;
    }

    // Transform the data to match expected format
    const collection = {
      id: data.id,
      name: data.name,
      description: data.description,
      skill_count: data.skill_count,
      skills: data.skills_data, // The JSON array of skills
      created_at: data.created_at,
      user_alias: data.user_alias
    };

    this.debug('Retrieved skill collection successfully:', collection);
    return collection;
  } catch (error) {
    this.debug('Error fetching skill collection:', error);
    console.error('Error fetching skill collection:', error);
    throw error;
  }
}

/**
 * Delete skill collection using custom function (bypasses RLS)
 * @param {string|number} collectionId - Collection ID
 * @returns {Promise<Object>} Delete result
 */
static async deleteSkillCollection(collectionId) {
  try {
    this.debug('Deleting skill collection with custom function:', collectionId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    this.debug('Deleting skill collection for user:', userEmail);

    // Use custom function instead of direct delete (you'll need to create this function in Supabase)
    const { data, error } = await this.supabase
      .rpc('delete_user_skill_collection', {
        collection_id: parseInt(collectionId),
        user_email: userEmail
      });

    this.debug('Skill collection deletion result:', { data, error });

    if (error) {
      this.debug('Skill collection deletion error:', error);
      return { success: false, error: error.message };
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      this.debug('No collection was deleted - possibly wrong ID or not owned by user');
      return { success: false, error: 'Collection not found or not owned by user' };
    }

    this.debug('Skill collection deleted successfully');
    return { success: true, error: null, deletedCollection: data[0] };
  } catch (error) {
    this.debug('Error deleting skill collection:', error);
    console.error('Error deleting skill collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get public skill collections for browsing
 * @param {number} limit - Number of collections to retrieve
 * @returns {Promise<Array>} Array of public skill collections
 */
static async getPublicSkillCollections(limit = 50) {
  try {
    this.debug('Getting public skill collections...');
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    const { data, error } = await this.supabase
      .from('skill_collections')
      .select('id, name, description, skill_count, user_alias, created_at')
      .eq('is_public', true) // Assuming you have a public flag
      .order('created_at', { ascending: false })
      .limit(limit);

    this.debug('Public skill collections query result:', { data, error, count: data?.length });

    if (error) {
      this.debug('Public skill collections query error:', error);
      throw error;
    }

    this.debug('Retrieved public skill collections successfully:', data?.length || 0, 'collections');
    return data || [];
  } catch (error) {
    this.debug('Error fetching public skill collections:', error);
    console.error('Error fetching public skill collections:', error);
    throw error;
  }
}

/**
 * SupabaseClient Skills Collection Extension
 * Add these methods to your existing SupabaseClient class
 */

// Add these methods to your existing SupabaseClient class:

/**
 * Save skill collection to database
 * @param {Object} collectionData - Collection data to save
 * @returns {Promise<Object>} Save result
 */
static async saveSkillCollection(collectionData) {
  try {
    this.debug('Saving skill collection to database:', collectionData.name);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    const userProfile = GoogleAuth.getUserProfile();

    if (!userEmail) {
      throw new Error('User email not available');
    }

    const collectionRecord = {
      user_email: userEmail,
      user_alias: userProfile?.alias || 'Unknown',
      name: collectionData.name,
      description: collectionData.description,
      skill_count: collectionData.skill_count,
      skills_data: collectionData.skills, // JSON array of skills
      created_at: new Date().toISOString()
    };

    this.debug('Collection record to insert:', collectionRecord);

    const { data, error } = await this.supabase
      .from('skill_collections')
      .insert([collectionRecord])
      .select()
      .single();

    this.debug('Collection save result:', { data, error });

    if (error) {
      this.debug('Collection save error:', error);
      throw error;
    }

    this.debug('Collection saved successfully:', data);
    return { success: true, data };
  } catch (error) {
    this.debug('Error saving skill collection:', error);
    console.error('Error saving skill collection:', error);
    throw error;
  }
}

/**
 * Get user's skill collections
 * @returns {Promise<Array>} Array of user's skill collections
 */
static async getUserSkillCollections() {
  try {
    this.debug('Getting user skill collections...');
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    this.debug('Fetching skill collections for user:', userEmail);

    const { data, error } = await this.supabase
      .from('skill_collections')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    this.debug('User skill collections query result:', { data, error, count: data?.length });

    if (error) {
      this.debug('User skill collections query error:', error);
      throw error;
    }

    this.debug('Retrieved user skill collections successfully:', data?.length || 0, 'collections');
    return data || [];
  } catch (error) {
    this.debug('Error fetching user skill collections:', error);
    console.error('Error fetching user skill collections:', error);
    throw error;
  }
}

/**
 * Get a specific skill collection by ID
 * @param {string|number} collectionId - Collection ID
 * @returns {Promise<Object>} Collection data
 */
static async getSkillCollection(collectionId) {
  try {
    this.debug('Getting skill collection by ID:', collectionId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    const { data, error } = await this.supabase
      .from('skill_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_email', userEmail) // Ensure user owns this collection
      .single();

    this.debug('Skill collection query result:', { data, error });

    if (error) {
      this.debug('Skill collection query error:', error);
      throw error;
    }

    // Transform the data to match expected format
    const collection = {
      id: data.id,
      name: data.name,
      description: data.description,
      skill_count: data.skill_count,
      skills: data.skills_data, // The JSON array of skills
      created_at: data.created_at,
      user_alias: data.user_alias
    };

    this.debug('Retrieved skill collection successfully:', collection);
    return collection;
  } catch (error) {
    this.debug('Error fetching skill collection:', error);
    console.error('Error fetching skill collection:', error);
    throw error;
  }
}

/**
 * Delete skill collection using custom function (bypasses RLS)
 * @param {string|number} collectionId - Collection ID
 * @returns {Promise<Object>} Delete result
 */
static async deleteSkillCollection(collectionId) {
  try {
    this.debug('Deleting skill collection with custom function:', collectionId);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();
    this.debug('Deleting skill collection for user:', userEmail);

    // Use custom function instead of direct delete (you'll need to create this function in Supabase)
    const { data, error } = await this.supabase
      .rpc('delete_user_skill_collection', {
        collection_id: parseInt(collectionId),
        user_email: userEmail
      });

    this.debug('Skill collection deletion result:', { data, error });

    if (error) {
      this.debug('Skill collection deletion error:', error);
      return { success: false, error: error.message };
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      this.debug('No collection was deleted - possibly wrong ID or not owned by user');
      return { success: false, error: 'Collection not found or not owned by user' };
    }

    this.debug('Skill collection deleted successfully');
    return { success: true, error: null, deletedCollection: data[0] };
  } catch (error) {
    this.debug('Error deleting skill collection:', error);
    console.error('Error deleting skill collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get public skill collections for browsing
 * @param {number} limit - Number of collections to retrieve
 * @returns {Promise<Array>} Array of public skill collections
 */
static async getPublicSkillCollections(limit = 50) {
  try {
    this.debug('Getting public skill collections...');
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    const { data, error } = await this.supabase
      .from('skill_collections')
      .select('id, name, description, skill_count, user_alias, created_at')
      .eq('is_public', true) // Assuming you have a public flag
      .order('created_at', { ascending: false })
      .limit(limit);

    this.debug('Public skill collections query result:', { data, error, count: data?.length });

    if (error) {
      this.debug('Public skill collections query error:', error);
      throw error;
    }

    this.debug('Retrieved public skill collections successfully:', data?.length || 0, 'collections');
    return data || [];
  } catch (error) {
    this.debug('Error fetching public skill collections:', error);
    console.error('Error fetching public skill collections:', error);
    throw error;
  }
}

/**
 * Update skill collection
 * @param {string|number} collectionId - Collection ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update result
 */
static async updateSkillCollection(collectionId, updateData) {
  try {
    this.debug('Updating skill collection:', collectionId, updateData);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const userEmail = GoogleAuth.getUserEmail();

    const { data, error } = await this.supabase
      .from('skill_collections')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .eq('user_email', userEmail) // Ensure user owns this collection
      .select()
      .single();

    this.debug('Skill collection update result:', { data, error });

    if (error) {
      this.debug('Skill collection update error:', error);
      throw error;
    }

    this.debug('Skill collection updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    this.debug('Error updating skill collection:', error);
    console.error('Error updating skill collection:', error);
    throw error;
  }
}
  
// Add these methods to your existing SupabaseClient class:

/**
 * Debug authentication status
 */
static async debugAuthStatus() {
  try {
    this.debug('=== AUTHENTICATION DEBUG ===');
    
    // Check if Supabase is ready
    this.debug('Supabase ready:', this.isReady());
    
    // Check Google Auth status
    this.debug('Google Auth available:', typeof GoogleAuth !== 'undefined');
    if (typeof GoogleAuth !== 'undefined') {
      this.debug('Google Auth signed in:', GoogleAuth.isSignedIn());
      this.debug('Google user email:', GoogleAuth.getUserEmail());
      this.debug('Google user profile:', GoogleAuth.getUserProfile());
    }
    
    // Check Supabase auth status
    if (this.isReady()) {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      this.debug('Supabase auth user:', user);
      this.debug('Supabase auth error:', error);
      
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      this.debug('Supabase session:', session);
      this.debug('Supabase session error:', sessionError);
    }
    
    this.debug('=== END AUTHENTICATION DEBUG ===');
    
    return {
      supabaseReady: this.isReady(),
      googleAuthAvailable: typeof GoogleAuth !== 'undefined',
      googleSignedIn: GoogleAuth?.isSignedIn() || false,
      googleEmail: GoogleAuth?.getUserEmail() || null,
      supabaseUser: this.isReady() ? (await this.supabase.auth.getUser()).data.user : null
    };
  } catch (error) {
    this.debug('Auth debugging failed:', error);
    return { error: error.message };
  }
}

/**
 * Enhanced save skill collection with better auth handling
 */
static async saveSkillCollectionFixed(collectionData) {
  try {
    this.debug('=== SAVING SKILL COLLECTION (FIXED) ===');
    
    // Debug auth status first
    const authStatus = await this.debugAuthStatus();
    this.debug('Auth status:', authStatus);
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
      throw new Error('User not signed in to Google');
    }

    const userEmail = GoogleAuth.getUserEmail();
    const userProfile = GoogleAuth.getUserProfile();

    if (!userEmail) {
      throw new Error('User email not available from Google Auth');
    }

    this.debug('Using user email:', userEmail);
    this.debug('Using user profile:', userProfile);

    const collectionRecord = {
      user_email: userEmail,
      user_alias: userProfile?.alias || GoogleAuth.getUserDisplayName() || 'Unknown User',
      name: collectionData.name,
      description: collectionData.description,
      skill_count: collectionData.skill_count,
      skills_data: collectionData.skills, // JSON array of skills
      is_public: false, // Default to private
      created_at: new Date().toISOString()
    };

    this.debug('Collection record to insert:', collectionRecord);

    // Try the insert with explicit error handling
    const { data, error } = await this.supabase
      .from('skill_collections')
      .insert([collectionRecord])
      .select()
      .single();

    this.debug('Collection save result:', { data, error });

    if (error) {
      this.debug('Detailed error information:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Provide helpful error messages
      if (error.code === '42501') {
        throw new Error('Permission denied. RLS policies may be blocking access. Try running the RLS bypass SQL.');
      } else if (error.code === '42P01') {
        throw new Error('Table "skill_collections" does not exist. Please run the database setup SQL.');
      } else if (error.code === '23505') {
        throw new Error('A collection with this name already exists.');
      } else {
        throw new Error(`Database error (${error.code}): ${error.message}`);
      }
    }

    this.debug('Collection saved successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    this.debug('Error in saveSkillCollectionFixed:', error);
    console.error('Error saving skill collection:', error);
    throw error;
  }
}

/**
 * Test database connection and permissions
 */
static async testSkillCollectionsTable() {
  try {
    this.debug('Testing skill_collections table...');
    
    if (!this.isReady()) {
      throw new Error('Database not available');
    }

    // Test if we can read from the table
    const { data, error, count } = await this.supabase
      .from('skill_collections')
      .select('id', { count: 'exact', head: true });

    this.debug('Table test result:', { data, error, count });

    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          error: 'Table does not exist', 
          suggestion: 'Run the database setup SQL'
        };
      } else if (error.code === '42501') {
        return { 
          success: false, 
          error: 'Permission denied', 
          suggestion: 'Run the RLS bypass SQL'
        };
      } else {
        return { 
          success: false, 
          error: error.message, 
          code: error.code 
        };
      }
    }

    return { 
      success: true, 
      message: 'Table accessible', 
      rowCount: count 
    };
    
  } catch (error) {
    this.debug('Table test failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Override the original method temporarily
static originalSaveSkillCollection = this.saveSkillCollection;

// Replace with the fixed version
static saveSkillCollection = this.saveSkillCollectionFixed;

  
  /**
   * Setup real-time subscriptions
   */
  static setupRealtimeSubscriptions() {
    if (!this.isReady()) {
      this.debug('Cannot setup realtime subscriptions - not ready');
      return;
    }

    this.debug('Setting up realtime subscriptions...');

    // Subscribe to new items
    this.supabase
      .channel('public:items')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'items' },
        (payload) => {
          this.debug('New item created via realtime:', payload.new);
          document.dispatchEvent(new CustomEvent('newItemCreated', { 
            detail: payload.new 
          }));
        }
      )
      .subscribe((status) => {
        this.debug('Items subscription status:', status);
      });

    // Subscribe to new skills
    this.supabase
      .channel('public:skills')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'skills' },
        (payload) => {
          this.debug('New skill created via realtime:', payload.new);
          document.dispatchEvent(new CustomEvent('newSkillCreated', { 
            detail: payload.new 
          }));
        }
      )
      .subscribe((status) => {
        this.debug('Skills subscription status:', status);
      });

    this.debug('Realtime subscriptions setup complete');
  }

  /**
   * Cleanup subscriptions
   */
  static cleanup() {
    this.debug('Cleaning up subscriptions...');
    if (this.supabase) {
      this.supabase.removeAllChannels();
      this.debug('All channels removed');
    }
  }

  /**
   * Get detailed connection info
   */
  static getConnectionInfo() {
    return {
      isInitialized: this.isInitialized,
      hasClient: !!this.supabase,
      isReady: this.isReady(),
      url: this.supabase?.supabaseUrl,
      key: this.supabase?.supabaseKey?.substring(0, 20) + '...',
      debugMode: this.debugMode
    };
  }

  /**
   * Toggle debug mode
   */
  static toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.debug('Debug mode toggled:', this.debugMode ? 'ON' : 'OFF');
    return this.debugMode;
  }
}

// Auto-initialize Supabase client
document.addEventListener('DOMContentLoaded', () => {
  SupabaseClient.debug('DOM loaded, initializing...');
  SupabaseClient.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  SupabaseClient.cleanup();
});

// Make available globally
window.SupabaseClient = SupabaseClient;

// Global debug functions
window.debugSupabase = () => {
  console.log('=== Supabase Debug Info ===');
  console.log('Connection Info:', SupabaseClient.getConnectionInfo());
  console.log('Is Ready:', SupabaseClient.isReady());
  
  if (SupabaseClient.isReady()) {
    SupabaseClient.testConnection().then(result => {
      console.log('Connection Test Result:', result);
    });
  }
};

window.toggleSupabaseDebug = () => {
  const newMode = SupabaseClient.toggleDebugMode();
  console.log('Supabase debug mode:', newMode ? 'ENABLED' : 'DISABLED');
};
