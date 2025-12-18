
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjeudnouuemtpfprubju.supabase.co';
const supabaseKey = 'sb_publishable_GkASHcsoGb8dA5tHR2TAVg_U3Mz34q1';

export const supabase = createClient(supabaseUrl, supabaseKey);
