import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert,
    Button,
    LayoutAnimation, Platform,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';

type Profile = { full_name?: string | null; role?: string | null };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        setEmail(user.email ?? '');

        await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' });

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data ?? {});
      } catch (e: any) {
        Alert.alert('Erro', e?.message ?? 'Falha ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Carregando perfil…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 16 }} edges={['top', 'left', 'right']}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Início</Text>
      <Text style={{ color: '#666' }}>
        Bem-vindo(a){profile?.full_name ? `, ${profile.full_name}` : ''}!
      </Text>

      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
        <TouchableOpacity
          onPress={toggle}
          style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row',
                   alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f6f6f6' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700' }}>Meu Perfil</Text>
          <Text style={{ fontSize: 16 }}>{open ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {open && (
          <View style={{ padding: 16, gap: 8 }}>
            <Text><Text style={{ fontWeight: '600' }}>E-mail:</Text> {email}</Text>
            <Text><Text style={{ fontWeight: '600' }}>Nome:</Text> {profile?.full_name ?? '—'}</Text>
            <Text><Text style={{ fontWeight: '600' }}>Papel:</Text> {profile?.role ?? '—'}</Text>
            <View style={{ marginTop: 8 }}>
              <Button title="Sair" onPress={logout} />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
