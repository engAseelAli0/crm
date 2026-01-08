import { supabase } from '../../lib/supabase';

export const LogManager = {
    /**
     * Log a user login event
     * @param {string} userId 
     * @param {string} role 
     */
    logLogin: async (userId, role) => {
        if (role === 'ADMIN') return; // Do not log admins
        try {
            await supabase.from('activity_logs').insert({
                user_id: userId,
                action_type: 'LOGIN',
                details: { role, platform: navigator.platform, userAgent: navigator.userAgent }
            });
        } catch (e) {
            console.error('Failed to log login', e);
        }
    },

    /**
     * Log a navigation event (Tab switch)
     * @param {string} userId
     * @param {string} role 
     * @param {string} tabId 
     * @param {string} tabName 
     */
    logNavigation: async (userId, role, tabId, tabName) => {
        if (role === 'ADMIN') return; // Do not log admins
        try {
            await supabase.from('activity_logs').insert({
                user_id: userId,
                action_type: 'NAVIGATE',
                details: { tabId, tabName, url: window.location.href }
            });
        } catch (e) {
            console.error('Failed to log navigation', e);
        }
    },

    /**
     * Log a specific action (e.g., Create Complaint, End Call)
     * @param {string} userId
     * @param {string} role 
     * @param {string} actionName 
     * @param {object} metadata 
     */
    logAction: async (userId, role, actionName, metadata = {}) => {
        if (role === 'ADMIN') return; // Do not log admins
        try {
            await supabase.from('activity_logs').insert({
                user_id: userId,
                action_type: 'ACTION',
                details: { action: actionName, ...metadata }
            });
        } catch (e) {
            console.error('Failed to log action', e);
        }
    }
};
