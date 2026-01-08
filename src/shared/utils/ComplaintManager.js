import { supabase } from '../../lib/supabase';

export const ComplaintManager = {
    // --- Complaint Types ---

    /**
     * Fetch all complaint types with their field definitions
     */
    getComplaintTypes: async () => {
        const { data, error } = await supabase
            .from('complaint_types')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching complaint types:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Create a new complaint type
     * @param {Object} typeData - { name, fields: [] }
     */
    createComplaintType: async (typeData) => {
        const { data, error } = await supabase
            .from('complaint_types')
            .insert([typeData])
            .select()
            .single();

        if (error) {
            console.error('Error creating complaint type:', error);
            throw error;
        }
        return data;
    },

    /**
     * Update an existing complaint type
     * @param {string} id 
     * @param {Object} updates 
     */
    updateComplaintType: async (id, updates) => {
        const { data, error } = await supabase
            .from('complaint_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating complaint type:', error);
            throw error;
        }
        return data;
    },

    /**
     * Delete a complaint type
     * @param {string} id 
     */
    deleteComplaintType: async (id) => {
        const { error } = await supabase
            .from('complaint_types')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting complaint type:', error);
            throw error;
        }
    },

    // --- Complaints ---

    /**
     * Fetch all complaints (for Admin)
     */
    getAllComplaints: async (limit = 1000) => {
        const { data, error } = await supabase
            .from('complaints')
            .select(`
        *,
        type:complaint_types (name, fields),
        agent:users!agent_id (id, name),
        resolver:users!resolved_by (id, name),
        last_actor:users!last_action_by (id, name)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching complaints:', error);
            return [];
        }
        console.log('ComplaintManager: Fetched complaints:', data);
        if (data && data.length > 0) {
            console.log('Sample Resolver:', data[0].resolver);
            console.log('Sample ResolvedBy UUID:', data[0].resolved_by);
        }
        return data || [];
    },

    /**
     * Fetch a single complaint by ID with all relations
     * @param {string} id
     */
    getComplaintById: async (id) => {
        const { data, error } = await supabase
            .from('complaints')
            .select(`
        *,
        type:complaint_types (name, fields),
        agent:users!agent_id (name),
        resolver:users!resolved_by (name),
        last_actor:users!last_action_by (name)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching complaint by ID:', error);
            return null;
        }
        return data;
    },

    /**
     * Fetch complaints submitted by a specific agent
     * @param {string} agentId 
     */
    getAgentComplaints: async (agentId, limit = 500) => {
        const { data, error } = await supabase
            .from('complaints')
            .select(`
        *,
        type:complaint_types (name, fields),
        agent:users!agent_id (name),
        resolver:users!resolved_by (name),
        last_actor:users!last_action_by (name)
      `)
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching agent complaints:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Submit a new complaint
     * @param {Object} complaintData 
     */
    submitComplaint: async (complaintData) => {
        // Expected structure:
        // {
        //   customer_name: '...',
        //   customer_number: '...',
        //   type_id: '...',
        //   form_data: { ...dynamic fields... },
        //   agent_id: '...',
        //   notes: '...',
        //   status: 'Pending'
        // }
        const { data, error } = await supabase
            .from('complaints')
            .insert([complaintData])
            .select()
            .single();

        if (error) {
            console.error('Error submitting complaint:', error);
            throw error;
        }
        return data;
    },

    /**
     * Update a complaint (e.g., status change)
     * @param {string} id 
     * @param {Object} updates 
     */
    updateComplaint: async (id, updates) => {
        const { data, error } = await supabase
            .from('complaints')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating complaint:', error);
            throw error;
        }
        return data;
    },

    /**
     * Increment the reminder count for a complaint (Admin Notification)
     * @param {string} id 
     */
    incrementReminder: async (id, user) => {
        // 1. Fetch current data
        const { data: current, error: fetchError } = await supabase
            .from('complaints')
            .select('reminder_count, reminder_logs')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error fetching reminder count:', fetchError);
            throw fetchError;
        }

        const newCount = (current?.reminder_count || 0) + 1;
        const currentLogs = current?.reminder_logs || [];

        // Check for cooldown (5 minutes)
        if (currentLogs.length > 0) {
            const lastLog = currentLogs[currentLogs.length - 1];
            const lastTime = new Date(lastLog.timestamp).getTime();
            const now = new Date().getTime();
            if (now - lastTime < 5 * 60 * 1000) {
                throw new Error('Please wait 5 minutes before sending another reminder.');
            }
        }

        // Add new log entry
        const newLog = {
            agent_name: user?.name || 'Unknown',
            timestamp: new Date().toISOString()
        };
        const newLogs = [...currentLogs, newLog];

        // 2. Update to new count and logs
        const { data, error } = await supabase
            .from('complaints')
            .update({
                reminder_count: newCount,
                reminder_logs: newLogs,
                // Force update 'updated_at' to trigger realtime if needed (though Supabase usually handles this)
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error incrementing reminder:', error);
            throw error;
        }
        return data;

    },

    /**
     * Delete a complaint
     * @param {string} id
     */
    deleteComplaint: async (id) => {
        const { error } = await supabase
            .from('complaints')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting complaint:', error);
            throw error;
        }
    }
};
