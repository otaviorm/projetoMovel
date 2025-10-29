import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';

// alterei aqui
import { ProfileSheet } from '../components/ProfileSheet';

type Profile = { full_name?: string | null; role?: string | null };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * alteração: removi o componente "RightSheet" local
 * Agora a tela usa somente o `ProfileSheet` de components/ProfileSheet.tsx,
 * que já cuida de dimensões, safe areas e rolagem
 */

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/(auth)/login');
          return;
        }

        setEmail(user.email ?? '');

        // garante linha no profiless
        await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' });

        const res = await supabase
          .from('profiles')
          .select('full_name, role, created_at')
          .eq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (res.error) throw res.error;

        const prof: Profile = res.data && res.data[0] ? res.data[0] : {};
        setProfile(prof ?? {});

        const { data: isAdm, error: rpcErr } = await supabase.rpc('is_admin');
        setIsAdmin(!rpcErr ? Boolean(isAdm) : (prof.role ?? '').toUpperCase() === 'ADMIN');
      } catch (e: any) {
        Alert.alert('Erro', e?.message ?? 'Falha ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleSheet() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSheetOpen((v) => !v);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Carregando…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      {/* alterei aqui: título correto no header da tela */}
      <Stack.Screen options={{ title: 'Início' }} />

      {/* Cabeçalho */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>Início</Text>
          <Text style={{ color: '#666' }}>
            Bem-vindo(a){profile?.full_name ? `, ${profile.full_name}` : ''}!
          </Text>
        </View>

        {/* Botão do Perfil */}
        <TouchableOpacity
          onPress={toggleSheet}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderRadius: 10,
            borderColor: '#ddd',
            backgroundColor: '#fff',
          }}
        >
          <Text style={{ fontWeight: '600' }}>Perfil ▸</Text>
        </TouchableOpacity>
      </View>

      {/* Atalhos principais */}
      <View style={{ padding: 16, gap: 12 }}>
        <ActionButton
          title="Fazer pedido de EPI"
          subtitle="Catálogo de EPIs para solicitar"
          onPress={() => router.push('/(employee)')}
        />

        {isAdmin && (
          <>
            <ActionButton
              title="Ver EPIs disponíveis"
              subtitle="Catálogo e manutenção"
              onPress={() => router.push('/(admin)/epis')}
            />
            <ActionButton
              title="Ver Alertas"
              subtitle="Estoque baixo e notificações"
              onPress={() => router.push('/(admin)/alerts')}
            />
            <ActionButton
              title="Entrada de EPIs"
              subtitle="Adicionar unidades ao estoque"
              onPress={() => router.push('/(admin)/stock-in')}
            />
            <ActionButton
              title="Saída de EPIs"
              subtitle="Dar baixa manual no estoque"
              onPress={() => router.push('/(admin)/stock-out')}
            />
            <ActionButton
              title="Pedidos Pendentes"
              subtitle="Aprovar ou rejeitar solicitações"
              onPress={() => router.push('/(admin)')}
            />
          </>
        )}
      </View>

      {/* alterei: use o componente pronto ProfileSheet (substitui RightSheet) */}
      <ProfileSheet
        visible={sheetOpen}
        email={email}
        name={profile?.full_name ?? '—'}
        role={profile?.role ?? '—'}
        onClose={() => setSheetOpen(false)}
        onLogout={logout}
      />
    </SafeAreaView>
  );
}

/** Botão grande de ação */
function ActionButton({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {!!subtitle && <Text style={{ color: '#666', marginTop: 2 }}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}
