// app/(admin)/alerts.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type Epi = {
  id: string;
  name: string;
  size: string | null;
  qty: number;
};

const LOW_STOCK_THRESHOLD = 10; // 👈 aqui você decide o que é "baixo estoque"

export default function AlertsScreen() {
  const [epis, setEpis] = useState<Epi[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('epis')
        .select('id, name, size, qty')
        .lte('qty', LOW_STOCK_THRESHOLD) // qty <= threshold
        .order('qty', { ascending: true });

      if (error) throw error;

      setEpis(data ?? []);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar alertas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Título do header */}
      <Stack.Screen options={{ title: 'Alertas de Estoque' }} />

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
          Alertas de estoque
        </Text>
        <Text style={{ color: '#666', marginBottom: 16 }}>
          EPIs com quantidade menor ou igual a {LOW_STOCK_THRESHOLD}.
        </Text>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Carregando…</Text>
          </View>
        ) : epis.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>Nenhum EPI com estoque baixo 🎉</Text>
          </View>
        ) : (
          <FlatList
            data={epis}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#f5c6cb',
                  backgroundColor: '#f8d7da',
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700' }}>
                  {item.name}
                </Text>
                {item.size && (
                  <Text style={{ marginTop: 2 }}>Tamanho: {item.size}</Text>
                )}
                <Text style={{ marginTop: 2 }}>
                  Quantidade atual:{' '}
                  <Text style={{ fontWeight: '700', color: '#b71c1c' }}>
                    {item.qty}
                  </Text>
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
