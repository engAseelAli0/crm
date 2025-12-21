-- Create 'reminders' table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  reason TEXT,
  duration_hours INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Policies (Permissive for this app's architecture)
CREATE POLICY "Enable read access for all users" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.reminders FOR DELETE USING (true);
