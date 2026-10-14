import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const SUPABASE_URL = 'https://yqutocmsoypjqaufcanz.supabase.co';
// The publishable key is designed to ship inside client apps. What protects the
// data is Row Level Security on the table (see supabase/schema.sql), not this key.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mP10IknyWiZvHfTQKszBbA_iy9AQpsy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// On native the refresh loop runs continuously, so tie it to the app being in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export type CheckedRow = {
  item_id: string;
  checked: boolean;
  updated_at: string;
};
