import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  LayoutAnimation,
  Platform,
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
  const [profile, setProfile] = useState<Profile>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 0) Usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/(auth)/login'); return; }
        setEmail(user.email ?? '');
        console.log('[DBG] user.id:', user.id, 'email:', user.email);

        // 1) Garante que exista linha em profiles (idempotente)
        //    (não sobrescreve full_name/role já definidos)
        const { error: upErr } = await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id' });
        if (upErr) console.log('[DBG] upsert profiles error:', upErr);

        // 2) Busca perfil de forma defensiva
        let { data: rows, error: selErr } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('[DBG] select profiles rows:', rows, 'error:', selErr);

        // 2a) Se não achou linha (rows vazio), tenta inserir explicitamente e ler de novo
        if (!selErr && (!rows || rows.length === 0)) {
          const { error: insErr } = await supabase
            .from('profiles')
            .insert({ id: user.id })
            .select('full_name, role')
            .limit(1);
          console.log('[DBG] insert empty profile error:', insErr);

          // Rebusca após tentativa de insert
          const res2 = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          rows = res2.data ?? [];
          selErr = res2.error ?? null;
          console.log('[DBG] re-select profiles rows:', rows, 'error:', selErr);
        }

        if (selErr) throw selErr;

        const prof: Profile = (rows && rows[0]) ? rows[0] : {};
        setProfile(prof ?? {});

        // 3) Decide ADMIN via RPC (se a função existir no projeto)
        const { data: isAdm, error: rpcErr } = await supabase.rpc('is_admin');
        if (!rpcErr) {
          setIsAdmin(Boolean(isAdm));
          console.log('[DBG] rpc is_admin =>', isAdm);
        } else {
          console.log('[DBG] rpc is_admin error:', rpcErr?.message);
          // Fallback: usa o campo role
          setIsAdmin(((prof.role ?? '').trim().toUpperCase() === 'ADMIN'));
        }
      } catch (e: any) {
        Alert.alert('Erro', e?.message ?? 'Falha ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
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

      {/* Botão só para ADMIN */}
      {isAdmin && (
        <View style={{ marginTop: 8 }}>
          <Button title="Ver EPIs disponíveis" onPress={() => router.push('/(admin)/epis')} />
        </View>
      )}

      {/* Aba de Perfil */}
      <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
        <TouchableOpacity
          onPress={toggle}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f6f6f6',
          }}
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
