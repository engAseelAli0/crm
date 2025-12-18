-- Create table for Account Types (Dynamic Categories)
CREATE TABLE IF NOT EXISTS account_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
