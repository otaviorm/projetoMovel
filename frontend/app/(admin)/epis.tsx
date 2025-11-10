  import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';


  type Epi = { id: string; name: string; size?: string | null; is_active: boolean };

  export default function AdminEpisScreen() {
    const [epis, setEpis] = useState<Epi[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
      try {
        const { data, error } = await supabase
          .from('epis')
          .select('id, name, size, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        setEpis(data ?? []);
      } catch (e: any) {
        Alert.alert('Erro', e?.message ?? 'Falha ao carregar EPIs');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

    useEffect(() => {
      (async () => {
        // checar se é admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/(auth)/login'); return; }

        // se quiser bloquear não-admin:
        // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        // if (!profile || (profile.role ?? '').toUpperCase() !== 'ADMIN') {
        //   Alert.alert('Acesso negado', 'Somente administradores podem ver esta página.');
        //   router.back();
        //   return;
        // }

        load();
      })();
    }, [load]);

    const onRefresh = () => {
      setRefreshing(true);
      load();
    };

    if (loading) {
      return (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text>Carregando EPIs…</Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ title: 'EPIs Disponíveis' }} />
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>EPIs disponíveis</Text>

          <FlatList
            data={epis}
            keyExtractor={(i) => i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  backgroundColor: '#fff',
                }}
              >
                <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                {item.size ? <Text>Tamanho: {item.size}</Text> : null}
                <Text style={{ color: '#0a0' }}>Ativo</Text>
              </View>
            )}
            ListEmptyComponent={<Text>Não há EPIs ativos cadastrados.</Text>}
          />
        </View>
      </SafeAreaView>
    );
  }
