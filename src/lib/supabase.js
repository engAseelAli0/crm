import { createClient } from '@supabase/supabase-js';

const originalUrl = 'https://fjeudnouuemtpfprubju.supabase.co';

const supabaseUrl = import.meta.env.PROD 
  ? `${window.location.origin}/api/supabase` 
  : originalUrl;

const supabaseKey = 'sb_publishable_GkASHcsoGb8dA5tHR2TAVg_U3Mz34q1';

export const supabase = createClient(supabaseUrl, supabaseKey);