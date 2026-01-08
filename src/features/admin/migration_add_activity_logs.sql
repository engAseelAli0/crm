-- Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'NAVIGATE', 'ACTION'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view all logs
CREATE POLICY "Admins can view all logs" ON public.activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'SUPERVISOR', 'MANAGER')
        )
    );

-- Users can insert their own logs (Public for prototype simplicity, or authenticated)
-- Since we manage auth manually via DataManager for this prototype, we might need open insert or check payload.
-- ideally:
CREATE POLICY "Users can insert logs" ON public.activity_logs
    FOR INSERT
    WITH CHECK (true); 

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
