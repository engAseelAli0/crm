-- Create table for Complaint Types (Categories & Form Configuration)
CREATE TABLE IF NOT EXISTS complaint_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fields JSONB DEFAULT '[]'::jsonb, -- dynamic fields definition
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Complaints (The actual submissions)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_number TEXT NOT NULL,
    type_id UUID REFERENCES complaint_types(id),
    agent_id UUID REFERENCES users(id), -- Assuming 'users' table exists as per DataManager
    form_data JSONB DEFAULT '{}'::jsonb, -- The values for the dynamic fields
    status TEXT DEFAULT 'Pending', -- Pending, Processing, Suspended, Resolved
    suspension_reason TEXT,
    notes TEXT, -- Agent notes
    reminder_count INTEGER DEFAULT 0, -- For prioritization
    resolved_by UUID REFERENCES users(id), -- To track who resolved it (for preventing Re-open if admin closed)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Enable RLS (Row Level Security) if needed
-- ALTER TABLE complaint_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Policy examples (Adjust based on your Auth setup):
-- CREATE POLICY "Enable read access for all users" ON complaint_types FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for admins" ON complaint_types FOR INSERT WITH CHECK (true); -- Add admin check
-- ... etc
