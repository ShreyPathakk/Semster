import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Supabase project credentials
const supabaseUrl = 'https://zlikozbrfvqraxtywcco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWtvemJyZnZxcmF4dHl3Y2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzMyNDcsImV4cCI6MjA1MDUwOTI0N30.izwOCKFJQz59PViAVOrAinTtmdysVQ2v4PqqAEWBCvo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    AsyncStorage.removeItem('supabase.auth.token');
  } else if (event === 'SIGNED_IN' && session) {
    AsyncStorage.setItem('supabase.auth.token', session.refresh_token);
  }
});