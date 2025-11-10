import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, Href } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function RoleGate() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login' as Href); return; }

      await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' });

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) { router.replace('/login' as Href); return; }

      const toAdmin: Href = '/(admin)';        // <- isso funcionava
      const toEmployee: Href = '/(employee)';// <- isso tbm
      if (profile.role === 'ADMIN') router.replace(toAdmin);
      else router.replace(toEmployee);

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
        <Text>Carregando…</Text>
      </View>
    );
  }
  return null;
}
