/**
 * Supabase Client Configuration
 * Centralized Supabase connection and operations
 */
class SupabaseClient {
  
  static SUPABASE_URL = 'https://zslsedcfihgwbfljqhod.supabase.co';
  static SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbHNlZGNmaWhnd2JmbGpxaG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTEwNzksImV4cCI6MjA2NTQyNzA3OX0.wA23SQZ8PZRambG4RVVWlcxUxdVUz4dNKLQgqY_xR08';
  
  static client = null;
  static isInitialized = false;

  /**
   * Initialize Supabase client
   */
  static init() {
    if (this.isInitialized || !window.supabase) {
      return this.client !== null;
    }

    try {
      this.client = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
      this.isInitialized = true;
      console.log('Supabase client initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return false;
    }
  }

  /**
   * Test database connection
   * @returns {Promise<Object>} Connection test result
   */
  static async testConnection() {
    if (!this.client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await this.client.from('items').select('id').limit(1);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object|null>} Current user or null
   */
  static async getCurrentUser() {
    if (!this.client) return null;

    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get current session
   * @returns {Promise<Object|null>} Current session or null
   */
  static async getCurrentSession() {
    if (!this.client) return null;

    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Save card to database
   * @param {Object} cardData - Card data to save
   * @returns {Promise<Object>} Save result
   */
  static async saveCard(cardData) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('User not authenticated');
    }

    try {
      const itemToSave = {
        user_id: session.user.id,
        user_google_id: session.user.user_metadata?.sub,
        contest_number: 0, // Default to general items
        item_data: {
          name: cardData.itemName,
          hero: cardData.hero,
          item_size: cardData.itemSize,
          rarity: cardData.border,
          cooldown: cardData.cooldown || null,
          ammo: cardData.ammo || null,
          crit: cardData.crit || null,
          multicast: cardData.multicast || null,
          passive_effect: cardData.passiveEffect || null,
          on_use_effects: cardData.onUseEffects || [],
          tags: cardData.tags || [],
          scaling_values: cardData.scalingValues || {},
          image_data: cardData.imageData,
          created_with: "BazaarGen",
          version: "1.0"
        }
      };

      const { data, error } = await this.client
        .from('items')
        .insert([itemToSave])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data };
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  }

  /**
   * Save skill to database
   * @param {Object} skillData - Skill data to save
   * @returns {Promise<Object>} Save result
   */
  static async saveSkill(skillData) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('User not authenticated');
    }

    try {
      const skillToSave = {
        user_id: session.user.id,
        user_google_id: session.user.user_metadata?.sub,
        contest_number: 0, // Default to general skills
        skill_data: {
          name: skillData.skillName,
          effect: skillData.skillEffect,
          rarity: skillData.border,
          image_data: skillData.imageData,
          created_with: "BazaarGen",
          version: "1.0"
        }
      };

      const { data, error } = await this.client
        .from('skills')
        .insert([skillToSave])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data };
    } catch (error) {
      console.error('Error saving skill:', error);
      throw error;
    }
  }

  /**
   * Load items from database with filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of items
   */
  static async loadItems(options = {}) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      let query = this.client
        .from('items')
        .select(`
          id,
          created_at,
          contest_number,
          item_data,
          users!items_user_id_fkey(alias)
        `);

      // Apply filters
      if (options.hero) {
        query = query.eq('item_data->>hero', options.hero);
      }

      if (options.contest !== undefined && options.contest !== '') {
        query = query.eq('contest_number', parseInt(options.contest));
      }

      if (options.search) {
        query = query.ilike('item_data->>name', `%${options.search}%`);
      }

      if (options.rarity) {
        query = query.eq('item_data->>rarity', options.rarity);
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('item_data->>name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading items:', error);
      throw error;
    }
  }

  /**
   * Load skills from database with filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of skills
   */
  static async loadSkills(options = {}) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      let query = this.client
        .from('skills')
        .select(`
          id,
          created_at,
          contest_number,
          skill_data,
          users!skills_user_id_fkey(alias)
        `);

      // Apply filters
      if (options.search) {
        query = query.ilike('skill_data->>name', `%${options.search}%`);
      }

      if (options.contest !== undefined && options.contest !== '') {
        query = query.eq('contest_number', parseInt(options.contest));
      }

      if (options.rarity) {
        query = query.eq('skill_data->>rarity', options.rarity);
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('skill_data->>name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading skills:', error);
      throw error;
    }
  }

  /**
   * Get user's own items
   * @returns {Promise<Array>} Array of user's items
   */
  static async getUserItems() {
    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      return [];
    }

    return this.loadItems({ 
      userId: session.user.id,
      sortBy: 'recent'
    });
  }

  /**
   * Get user's own skills
   * @returns {Promise<Array>} Array of user's skills
   */
  static async getUserSkills() {
    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      return [];
    }

    return this.loadSkills({ 
      userId: session.user.id,
      sortBy: 'recent'
    });
  }

  /**
   * Delete an item (only if user owns it)
   * @param {string} itemId - ID of item to delete
   * @returns {Promise<Object>} Delete result
   */
  static async deleteItem(itemId) {
    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await this.client
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', session.user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Item not found or permission denied');
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  /**
   * Delete a skill (only if user owns it)
   * @param {string} skillId - ID of skill to delete
   * @returns {Promise<Object>} Delete result
   */
  static async deleteSkill(skillId) {
    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await this.client
        .from('skills')
        .delete()
        .eq('id', skillId)
        .eq('user_id', session.user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Skill not found or permission denied');
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error deleting skill:', error);
      throw error;
    }
  }

  /**
   * Update an item (only if user owns it)
   * @param {string} itemId - ID of item to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateItem(itemId, updateData) {
    const session = await this.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await this.client
        .from('items')
        .update(updateData)
        .eq('id', itemId)
        .eq('user_id', session.user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Item not found or permission denied');
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Get item count
      const { count: itemCount, error: itemError } = await this.client
        .from('items')
        .select('*', { count: 'exact', head: true });

      if (itemError) throw itemError;

      // Get skill count
      const { count: skillCount, error: skillError } = await this.client
        .from('skills')
        .select('*', { count: 'exact', head: true });

      if (skillError) throw skillError;

      // Get user count
      const { count: userCount, error: userError } = await this.client
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      return {
        items: itemCount || 0,
        skills: skillCount || 0,
        users: userCount || 0
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Check if client is ready
   * @returns {boolean} Whether client is initialized and ready
   */
  static isReady() {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get client instance (for advanced usage)
   * @returns {Object|null} Supabase client instance
   */
  static getClient() {
    return this.client;
  }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Supabase library to load
  setTimeout(() => {
    SupabaseClient.init();
  }, 100);
});