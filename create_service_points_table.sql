-- Create Service Points Table
create table if not exists service_points (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('POS', 'Agent')), -- Agent = وكيل, POS = نقطة بيع
  governorate_id uuid references locations(id),
  district_id uuid references locations(id),
  address text,
  phone text,
  google_map_link text,
  working_hours text,
  deposit_withdrawal text,  -- New: سحب وايداع (ممتاز، جيد، ضعيف)
  registration_activation text, -- New: تسجيل وتفعيل (ممتاز، جيد، ضعيف)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for fast search
create index if not exists idx_service_points_governorate on service_points(governorate_id);
create index if not exists idx_service_points_district on service_points(district_id);
create index if not exists idx_service_points_type on service_points(type);

-- RLS Policies (Row Level Security)
alter table service_points enable row level security;

-- Everyone can read (Agents need to search)
create policy "Enable read access for all users" on service_points for select using (true);

-- Only Admins/Supervisors can insert/update/delete
-- (Assuming we trust the app logic for now, or you can add specific role checks using auth.uid())
create policy "Enable write access for authenticated users" on service_points for all using (auth.role() = 'authenticated');
