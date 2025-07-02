/**
 * Supabase Database Client with Skills Support and Debugging
 * Handles all database operations for cards, skills, skill collections, and user profiles
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
      this.debug('Saving card to database:', cardData);
      
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

      const itemRecord = {
        user_email: userEmail,
        user_alias: userProfile?.alias || 'Unknown',
        item_data: cardData,
        created_at: new Date().toISOString()
      };

      this.debug('Item record to insert:', itemRecord);

      const { data, error } = await this.supabase
        .from('items')
        .insert([itemRecord])
        .select()
        .single();

      this.debug('Card save result:', { data, error });

      if (error) {
        this.debug('Card save error:', error);
        throw error;
      }

      this.debug('Card saved successfully:', data);
      return { success: true, data };
    } catch (error) {
      this.debug('Error saving card:', error);
      console.error('Error saving card:', error);
      throw error;
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
   * Load skills with filters for browse page
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of skills
   */
  static async loadSkills(options = {}) {
    try {
      this.debug('Loading skills from database with options:', options);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Start with base query - get all skills
      let query = this.supabase
        .from('skills')
        .select('*');

      // Apply rarity filter
      if (options.rarity) {
        this.debug('Filtering by rarity:', options.rarity);
        // Use filter on the JSON column
        query = query.filter('skill_data->border', 'eq', `"${options.rarity}"`);
      }

      // Apply search filter (skill name)
      if (options.search) {
        this.debug('Searching for:', options.search);
        // Search in the skill name within the JSON data
        query = query.filter('skill_data->skillName', 'ilike', `%${options.search}%`);
      }

      // Apply creator filter
      if (options.creator) {
        this.debug('Filtering by creator:', options.creator);
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

      const { data, error } = await query;

      this.debug('Skills query result:', { data, error, count: data?.length });

      if (error) {
        this.debug('Skills query error:', error);
        throw error;
      }

      let filteredSkills = data || [];

      // Apply client-side filters for complex operations
      if (options.keywords) {
        const keywordLower = options.keywords.toLowerCase();
        filteredSkills = filteredSkills.filter(skill => 
          skill.skill_data?.skillEffect?.toLowerCase().includes(keywordLower)
        );
        this.debug('Applied keyword filter:', options.keywords, 'Results:', filteredSkills.length);
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
        this.debug('Applied length filter:', options.length, 'Results:', filteredSkills.length);
      }

      this.debug('Retrieved skills successfully:', filteredSkills.length, 'skills');
      return filteredSkills;
    } catch (error) {
      this.debug('Error loading skills:', error);
      console.error('Error loading skills:', error);
      throw error;
    }
  }

  /**
   * Load skill collections with filters for browse page
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of skill collections
   */
  static async loadSkillCollections(options = {}) {
    try {
      this.debug('Loading skill collections from database with options:', options);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Start with base query - get all public skill collections
      let query = this.supabase
        .from('skill_collections')
        .select('*')
        .eq('is_public', true); // Only show public collections in browse

      // Apply creator filter
      if (options.creator) {
        this.debug('Filtering collections by creator:', options.creator);
        query = query.filter('user_alias', 'ilike', `%${options.creator}%`);
      }

      // Apply search filter (collection name or description)
      if (options.search) {
        this.debug('Searching collections for:', options.search);
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      this.debug('Skill collections query result:', { data, error, count: data?.length });

      if (error) {
        this.debug('Skill collections query error:', error);
        throw error;
      }

      let filteredCollections = data || [];

      // Apply client-side filters for complex operations
      if (options.keywords) {
        const keywordLower = options.keywords.toLowerCase();
        filteredCollections = filteredCollections.filter(collection => {
          // Search in collection name, description, and within the skills data
          const nameMatch = collection.name?.toLowerCase().includes(keywordLower);
          const descMatch = collection.description?.toLowerCase().includes(keywordLower);
          
          // Search within skills in the collection
          const skillsMatch = collection.skills_data?.some(skill => 
            skill.skillEffect?.toLowerCase().includes(keywordLower) ||
            skill.skillName?.toLowerCase().includes(keywordLower)
          );
          
          return nameMatch || descMatch || skillsMatch;
        });
        this.debug('Applied keyword filter to collections:', options.keywords, 'Results:', filteredCollections.length);
      }

      if (options.rarity) {
        filteredCollections = filteredCollections.filter(collection => {
          // Check if any skill in the collection has the specified rarity
          return collection.skills_data?.some(skill => 
            skill.border === options.rarity
          );
        });
        this.debug('Applied rarity filter to collections:', options.rarity, 'Results:', filteredCollections.length);
      }

      if (options.length) {
        filteredCollections = filteredCollections.filter(collection => {
          const skillCount = collection.skill_count || 0;
          switch (options.length) {
            case 'short': return skillCount <= 3;
            case 'medium': return skillCount > 3 && skillCount <= 8;
            case 'long': return skillCount > 8;
            default: return true;
          }
        });
        this.debug('Applied length filter to collections:', options.length, 'Results:', filteredCollections.length);
      }

      this.debug('Retrieved skill collections successfully:', filteredCollections.length, 'collections');
      return filteredCollections;
    } catch (error) {
      this.debug('Error loading skill collections:', error);
      console.error('Error loading skill collections:', error);
      throw error;
    }
  }

  /**
   * Get skill statistics
   * @returns {Promise<Object>} Statistics about skills
   */
  static async getSkillStatistics() {
    try {
      this.debug('Getting skill statistics...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Get total count
      const { data, error, count } = await this.supabase
        .from('skills')
        .select('skill_data', { count: 'exact' });

      if (error) {
        this.debug('Skill statistics query error:', error);
        throw error;
      }

      // Calculate statistics from the data
      const stats = {
        totalSkills: count || 0,
        byRarity: {
          bronze: 0,
          silver: 0,
          gold: 0,
          diamond: 0,
          legendary: 0
        },
        averageEffectLength: 0,
        byLengthCategory: {
          short: 0,
          medium: 0,
          long: 0
        }
      };

      if (data && data.length > 0) {
        let totalEffectLength = 0;

        data.forEach(skill => {
          const skillData = skill.skill_data;
          
          // Count by rarity
          const rarity = skillData?.border || 'gold';
          if (stats.byRarity.hasOwnProperty(rarity)) {
            stats.byRarity[rarity]++;
          }

          // Calculate effect length statistics
          const effectLength = skillData?.skillEffect?.length || 0;
          totalEffectLength += effectLength;

          if (effectLength < 100) {
            stats.byLengthCategory.short++;
          } else if (effectLength <= 200) {
            stats.byLengthCategory.medium++;
          } else {
            stats.byLengthCategory.long++;
          }
        });

        stats.averageEffectLength = Math.round(totalEffectLength / data.length);
      }

      this.debug('Skill statistics:', stats);
      return stats;
    } catch (error) {
      this.debug('Error getting skill statistics:', error);
      console.error('Error getting skill statistics:', error);
      return {
        totalSkills: 0,
        byRarity: { bronze: 0, silver: 0, gold: 0, diamond: 0, legendary: 0 },
        averageEffectLength: 0,
        byLengthCategory: { short: 0, medium: 0, long: 0 },
        error: error.message
      };
    }
  }

  /**
   * Get skill collection statistics
   * @returns {Promise<Object>} Statistics about skill collections
   */
  static async getSkillCollectionStatistics() {
    try {
      this.debug('Getting skill collection statistics...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Get all public collections
      const { data, error, count } = await this.supabase
        .from('skill_collections')
        .select('skill_count, skills_data', { count: 'exact' })
        .eq('is_public', true);

      if (error) {
        this.debug('Skill collection statistics query error:', error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        totalCollections: count || 0,
        totalSkillsInCollections: 0,
        averageCollectionSize: 0,
        bySizeCategory: {
          small: 0,    // 1-3 skills
          medium: 0,   // 4-8 skills  
          large: 0     // 9+ skills
        },
        byRarity: {
          bronze: 0,
          silver: 0,
          gold: 0,
          diamond: 0,
          legendary: 0
        }
      };

      if (data && data.length > 0) {
        data.forEach(collection => {
          const skillCount = collection.skill_count || 0;
          stats.totalSkillsInCollections += skillCount;

          // Size categories
          if (skillCount <= 3) {
            stats.bySizeCategory.small++;
          } else if (skillCount <= 8) {
            stats.bySizeCategory.medium++;
          } else {
            stats.bySizeCategory.large++;
          }

          // Count rarities in collection skills
          if (collection.skills_data && Array.isArray(collection.skills_data)) {
            collection.skills_data.forEach(skill => {
              const rarity = skill.border || 'gold';
              if (stats.byRarity.hasOwnProperty(rarity)) {
                stats.byRarity[rarity]++;
              }
            });
          }
        });

        stats.averageCollectionSize = Math.round(stats.totalSkillsInCollections / data.length);
      }

      this.debug('Skill collection statistics:', stats);
      return stats;
    } catch (error) {
      this.debug('Error getting skill collection statistics:', error);
      console.error('Error getting skill collection statistics:', error);
      return {
        totalCollections: 0,
        totalSkillsInCollections: 0,
        averageCollectionSize: 0,
        bySizeCategory: { small: 0, medium: 0, large: 0 },
        byRarity: { bronze: 0, silver: 0, gold: 0, diamond: 0, legendary: 0 },
        error: error.message
      };
    }
  }

  /**
   * Search skills by keyword in effect text
   * @param {string} keyword - Keyword to search for
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of matching skills
   */
  static async searchSkillsByKeyword(keyword, limit = 50) {
    try {
      this.debug('Searching skills by keyword:', keyword);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!keyword || keyword.trim().length === 0) {
        return [];
      }

      // Get all skills and filter client-side for complex text search
      const { data, error } = await this.supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Reasonable limit for client-side filtering

      if (error) {
        this.debug('Skills search query error:', error);
        throw error;
      }

      const keywordLower = keyword.toLowerCase();
      const matchingSkills = (data || [])
        .filter(skill => {
          const skillEffect = skill.skill_data?.skillEffect?.toLowerCase() || '';
          const skillName = skill.skill_data?.skillName?.toLowerCase() || '';
          return skillEffect.includes(keywordLower) || skillName.includes(keywordLower);
        })
        .slice(0, limit);

      this.debug('Keyword search results:', matchingSkills.length, 'skills found');
      return matchingSkills;
    } catch (error) {
      this.debug('Error searching skills by keyword:', error);
      console.error('Error searching skills by keyword:', error);
      throw error;
    }
  }

  /**
   * Get popular skill keywords (most common words in skill effects)
   * @param {number} limit - Number of keywords to return
   * @returns {Promise<Array>} Array of popular keywords with counts
   */
  static async getPopularSkillKeywords(limit = 20) {
    try {
      this.debug('Getting popular skill keywords...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Get all skills
      const { data, error } = await this.supabase
        .from('skills')
        .select('skill_data')
        .limit(1000);

      if (error) {
        this.debug('Popular keywords query error:', error);
        throw error;
      }

      // Extract and count keywords
      const keywordCounts = new Map();
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

      (data || []).forEach(skill => {
        const effectText = skill.skill_data?.skillEffect || '';
        // Extract words from effect text
        const words = effectText
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
          .split(/\s+/)
          .filter(word => word.length > 2 && !commonWords.has(word)); // Filter out short words and common words

        words.forEach(word => {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        });
      });

      // Sort by count and return top keywords
      const popularKeywords = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword, count]) => ({ keyword, count }));

      this.debug('Popular keywords:', popularKeywords);
      return popularKeywords;
    } catch (error) {
      this.debug('Error getting popular keywords:', error);
      console.error('Error getting popular keywords:', error);
      return [];
    }
  }

  /**
   * Get a specific skill collection by ID
   * @param {number} collectionId - Collection ID
   * @returns {Promise<Object>} Collection data
   */
  static async getSkillCollection(collectionId) {
    try {
      this.debug('Getting skill collection:', collectionId);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      const { data, error } = await this.supabase
        .from('skill_collections')
        .select('*')
        .eq('id', collectionId)
        .eq('is_public', true)
        .single();

      if (error) {
        this.debug('Skill collection query error:', error);
        throw error;
      }

      this.debug('Retrieved skill collection:', data);
      return data;
    } catch (error) {
      this.debug('Error getting skill collection:', error);
      console.error('Error getting skill collection:', error);
      throw error;
    }
  }

  /**
   * Search skill collections by keyword
   * @param {string} keyword - Keyword to search for
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of matching collections
   */
  static async searchSkillCollectionsByKeyword(keyword, limit = 50) {
    try {
      this.debug('Searching skill collections by keyword:', keyword);
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      if (!keyword || keyword.trim().length === 0) {
        return [];
      }

      // Get all public collections for client-side filtering
      const { data, error } = await this.supabase
        .from('skill_collections')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(500); // Reasonable limit for client-side filtering

      if (error) {
        this.debug('Collections search query error:', error);
        throw error;
      }

      const keywordLower = keyword.toLowerCase();
      const matchingCollections = (data || [])
        .filter(collection => {
          const nameMatch = collection.name?.toLowerCase().includes(keywordLower);
          const descMatch = collection.description?.toLowerCase().includes(keywordLower);
          
          // Search within skills in the collection
          const skillsMatch = collection.skills_data?.some(skill => 
            skill.skillEffect?.toLowerCase().includes(keywordLower) ||
            skill.skillName?.toLowerCase().includes(keywordLower)
          );
          
          return nameMatch || descMatch || skillsMatch;
        })
        .slice(0, limit);

      this.debug('Collection keyword search results:', matchingCollections.length, 'collections found');
      return matchingCollections;
    } catch (error) {
      this.debug('Error searching skill collections by keyword:', error);
      console.error('Error searching skill collections by keyword:', error);
      throw error;
    }
  }

  /**
   * Get popular collection keywords
   * @param {number} limit - Number of keywords to return
   * @returns {Promise<Array>} Array of popular keywords with counts
   */
  static async getPopularCollectionKeywords(limit = 15) {
    try {
      this.debug('Getting popular collection keywords...');
      
      if (!this.isReady()) {
        throw new Error('Database not available');
      }

      // Get all public collections
      const { data, error } = await this.supabase
        .from('skill_collections')
        .select('name, description, skills_data')
        .eq('is_public', true)
        .limit(500);

      if (error) {
        this.debug('Popular collection keywords query error:', error);
        throw error;
      }

      // Extract and count keywords
      const keywordCounts = new Map();
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'collection', 'skill', 'skills']);

      (data || []).forEach(collection => {
        // Extract words from collection name and description
        let text = `${collection.name || ''} ${collection.description || ''}`;
        
        // Also extract from skill names and effects in the collection
        if (collection.skills_data && Array.isArray(collection.skills_data)) {
          collection.skills_data.forEach(skill => {
            text += ` ${skill.skillName || ''} ${skill.skillEffect || ''}`;
          });
        }
        
        const words = text
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
          .split(/\s+/)
          .filter(word => word.length > 2 && !commonWords.has(word)); // Filter out short words and common words

        words.forEach(word => {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        });
      });

      // Sort by count and return top keywords
      const popularKeywords = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword, count]) => ({ keyword, count }));

      this.debug('Popular collection keywords:', popularKeywords);
      return popularKeywords;
    } catch (error) {
      this.debug('Error getting popular collection keywords:', error);
      console.error('Error getting popular collection keywords:', error);
      return [];
    }
  }

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
