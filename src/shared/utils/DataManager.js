import { supabase } from '../../lib/supabase';

export const DataManager = {
  // --- Initialization ---
  seed: () => {
    // No local seeding needed anymore
  },

  // --- Auth ---
  login: async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // In using plain text for prototype, usually hash this
        .single();

      if (error) {
        console.error('Login error:', error);
        return null;
      }

      if (data) {
        localStorage.setItem('app_session', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem('app_session');
  },

  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('app_session'));
    } catch (e) {
      console.error('Error parsing session data', e);
      localStorage.removeItem('app_session');
      return null;
    }
  },

  // --- Users ---
  getUsers: async () => {
    const { data } = await supabase.from('users').select('*');
    return data || [];
  },

  addUser: async (user) => {
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) console.error('Error adding user:', error);
    return data;
  },

  updateUser: async (id, updates) => {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) console.error('Error updating user:', error);
  },

  deleteUser: async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Error deleting user:', error);
  },

  // --- Categories & Lookups (Separate Tables Strategy) ---

  TABLE_MAP: {
    classification: 'classifications',
    location: 'locations',
    procedure: 'procedures',
    action: 'actions',
    account_type: 'account_types'
  },

  getCategoriesByType: async (type = 'classification') => {
    const tableName = DataManager.TABLE_MAP[type];
    if (!tableName) {
      console.error(`[DataManager] Unknown type: ${type}`);
      return [];
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`[DataManager] Error fetching ${type} from ${tableName}:`, error);
      return [];
    }

    // Build tree for hierarchical data (locations, classifications)
    // Procedures might be flat, but this logic handles flat lists fine (all become roots)
    const buildTree = (items) => {
      const rootItems = [];
      const lookup = {};

      for (const item of items) {
        item.children = [];
        lookup[item.id] = item;
      }

      for (const item of items) {
        if (item.parent_id && lookup[item.parent_id]) {
          lookup[item.parent_id].children.push(item);
        } else {
          rootItems.push(item);
        }
      }
      return rootItems;
    };

    return buildTree(data || []);
  },

  // Kept for backward compatibility
  getCategories: async () => {
    return DataManager.getCategoriesByType('classification');
  },

  addCategory: async (name, parentId = null, type = 'classification', options = {}) => {
    const tableName = DataManager.TABLE_MAP[type];
    if (!tableName) throw new Error(`Unknown type: ${type}`);

    const payload = { name };
    // Only classifications and locations have parent_id
    if (type !== 'procedure' && type !== 'action' && type !== 'account_type') {
      payload.parent_id = parentId;
    }

    // Support "Required" flag
    if (options.isRequired) {
      payload.is_required = true;
    }

    const { data, error } = await supabase.from(tableName).insert([payload]).select().single();

    if (error) {
      console.error(`Error adding to ${tableName}:`, error);
      throw error;
    }
    return data;
  },

  // Now requires type to know which table to update
  updateCategory: async (id, name, type = 'classification', options = {}) => {
    const tableName = DataManager.TABLE_MAP[type];
    if (!tableName) return;

    const payload = {};
    if (name) payload.name = name; // Only update name if provided

    if (options.isRequired !== undefined) {
      payload.is_required = options.isRequired;
    }
    if (options.sort_order !== undefined) {
      payload.sort_order = options.sort_order;
    }

    const { error } = await supabase.from(tableName).update(payload).eq('id', id);
    if (error) console.error(`Error updating ${tableName}:`, error);
  },

  // Now requires type to know which table to delete from
  deleteCategory: async (id, type = 'classification') => {
    const tableName = DataManager.TABLE_MAP[type];
    if (!tableName) return { error: 'Invalid type' };

    // Manual Cascade for hierarchical types
    if (type === 'classification' || type === 'location') {
      try {
        const { data: children } = await supabase
          .from(tableName)
          .select('id')
          .eq('parent_id', id);

        if (children && children.length > 0) {
          // Recursively delete children
          for (const child of children) {
            await DataManager.deleteCategory(child.id, type);
          }
        }
      } catch (err) {
        console.warn("Cascade delete check failed", err);
        // Continue to try deleting the item itself
      }
    }

    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) console.error(`Error deleting from ${tableName}:`, error);
    return { error };
  },

  // --- Calls ---
  getCalls: async () => {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase getCalls error:', error);
      return [];
    }

    return (data || []).map(c => ({
      ...c, // Keep original snake_case
      id: c.id,
      agentId: c.agent_id,
      callerNumber: c.caller_number,
      classificationPath: c.classification_path,
      formData: c.form_data,
      status: c.status,
      timestamp: c.timestamp,
      duration: c.duration || (c.form_data && c.form_data.duration) || 0 // Fallback to form_data
    }));
  },

  addCall: async (call) => {
    // Debug: Ensure critical fields present
    if (!call.agentId) {
      alert("Error: Agent ID missing in call data");
      console.error("Missing agentId", call);
      return null;
    }

    // Store duration in form_data if column missing in DB schema
    const formData = call.formData || {};
    if (call.duration) {
      formData.duration = call.duration;
    }

    const { data, error } = await supabase.from('calls').insert([{
      agent_id: call.agentId,
      caller_number: call.callerNumber,
      classification_path: call.classificationPath || [],
      form_data: formData,
      status: call.status,
      // duration: call.duration, // REMOVED: Column does not exist
      timestamp: call.timestamp || new Date().toISOString()
    }]).select().single();

    if (error) {
      console.error('Supabase INSERT Error:', error);
      // alert(`Database Error (Insert): ${error.message} \nCode: ${error.code}\nDetails: ${error.details}`); // REMOVED for Offline First
      return null;
    }
    return data;
  },

  updateCall: async (id, updates) => {
    // Map camcelCase to snake_case if needed, but here updates usually come from our own object structure.
    // However, our `calls` table uses snake_case.
    // We should be careful what 'updates' contains.
    // For simplicity, we assume 'updates' keys match DB columns or we map them.
    const dbUpdates = {};
    if (updates.classificationPath) dbUpdates.classification_path = updates.classificationPath;
    if (updates.classification_path) dbUpdates.classification_path = updates.classification_path; // Robustness

    // Handle form_data merging
    let newFormData = updates.formData || updates.form_data || {};

    if (updates.status) dbUpdates.status = updates.status;

    // Move duration to form_data
    if (updates.duration) {
      newFormData = { ...newFormData, duration: updates.duration };
      // dbUpdates.duration = updates.duration; // REMOVED: Column does not exist
    }

    if (Object.keys(newFormData).length > 0) {
      dbUpdates.form_data = newFormData;
    }

    if (updates.agentId) dbUpdates.agent_id = updates.agentId;
    if (updates.callerNumber) dbUpdates.caller_number = updates.callerNumber;

    // Safety check for empty updates
    if (Object.keys(dbUpdates).length === 0) return;

    const { data, error } = await supabase
      .from('calls')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase UPDATE Error:', error);
      // alert(`Database Error (Update): ${error.message}`); // REMOVED for Offline First
      return null;
    }
    return data;
  },

  // --- Customers ---
  getCustomers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
    return data || [];
  },

  getCustomer: async (phoneNumber) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (data) return data;

    return {
      name: 'عميل غير مسجل',
      gender: 'غير محدد',
      city: 'غير محدد',
      phone: phoneNumber
    };
  },

  updateCustomer: async (phoneNumber, updates) => {
    // First check if customer exists
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (existing) {
      // Update existing customer
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('phone', phoneNumber);
      if (error) console.error('Error updating customer:', error);
    } else {
      // Create new customer
      const { error } = await supabase
        .from('customers')
        .insert([{ phone: phoneNumber, ...updates }]);
      if (error) console.error('Error creating customer:', error);
    }
  },

  // --- Knowledge Base ---
  getKnowledgeBase: async () => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge base:', error);
      return [];
    }
    return data || [];
  },

  addKnowledgeBaseItem: async (item) => {
    // Item should contain { title, content, images: [] }
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error adding KB item:', error.message, error);
      return null;
    }
    return data;
  },

  updateKnowledgeBaseItem: async (id, updates) => {
    const { error } = await supabase
      .from('knowledge_base')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id);

    if (error) console.error('Error updating KB item:', error);
    return error;
  },

  deleteKnowledgeBaseItem: async (id) => {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting KB item:', error);
    return error;
  }
};
