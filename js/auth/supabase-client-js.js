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
   * Load items with filters
   */
  static async loadItems(options = {}) {
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

      const { data, error } = await query;

      if (error) throw error;

      this.debug('Retrieved items successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      this.debug('Error loading items:', error);
      throw error;
    }
  }

  /**
   * Load skills with filters
   */
  static async loadSkills(options = {}) {
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

      const { data, error } = await query;

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

      return data || [];
    } catch (error) {
      this.debug('Error fetching user items:', error);
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

      const { data, error } = await this.supabase
        .rpc('delete_user_item', {
          item_id: parseInt(itemId),
          user_email: userEmail
        });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Item not found or not owned by user' };
      }

      return { success: true, deletedItem: data[0] };
    } catch (error) {
      this.debug('Error deleting item:', error);
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

      const { data, error } = await this.supabase
        .rpc('delete_user_skill', {
          skill_id: parseInt(skillId),
          user_email: userEmail
        });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Skill not found or not owned by user' };
      }

      return { success: true, deletedItem: data[0] };
    } catch (error) {
      this.debug('Error deleting skill:', error);
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
