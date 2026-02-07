import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://novmlrrrhuzddrnyfkiz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdm1scnJyaHV6ZGRybnlma2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTEzNzIsImV4cCI6MjA4MzE4NzM3Mn0.S1riqMN3p2E55zFFZyDFypAZjb1m7C52dOR9aeURplE';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
