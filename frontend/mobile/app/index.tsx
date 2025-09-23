import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function Index() {
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      router.replace(session ? '/profile' : '/login');
    })();
  }, []);
  return null;
}
