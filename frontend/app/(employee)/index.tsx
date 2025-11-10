import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type Epi = {
  id: string;
  name: string;
  size?: string | null;
  qty: number;          // estoque atual
  is_active: boolean;
};

export default function EmployeeHome() {
  const [epis, setEpis] = useState<Epi[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({}); // epi_id -> qty selecionada
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('epis')
        .select('id, name, size, qty, is_active')
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
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  function add(epiId: string) {
    const item = epis.find(e => e.id === epiId);
    if (!item) return;
    const already = cart[epiId] ?? 0;
    const disponivel = item.qty - already; // quanto ainda posso adicionar desse EPI

    if (disponivel <= 0) {
      Alert.alert('Estoque insuficiente', `Não há mais unidades de "${item.name}" disponíveis.`);
      return;
    }
    setCart(prev => ({ ...prev, [epiId]: already + 1 }));
  }

  function remove(epiId: string) {
    setCart(prev => {
      const q = (prev[epiId] ?? 0) - 1;
      const next = { ...prev };
      if (q <= 0) delete next[epiId];
      else next[epiId] = q;
      return next;
    });
  }

  async function submitOrder() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        router.replace('/(auth)/login');
        return;
      }

      const items = Object.entries(cart).map(([epi_id, qty]) => ({ epi_id, qty }));
      if (items.length === 0) {
        Alert.alert('Ops', 'Seu carrinho está vazio.');
        return;
      }

      // validação extra no cliente (confere estoque vs. quantidades do carrinho)
      for (const { epi_id, qty } of items) {
        const item = epis.find(e => e.id === epi_id);
        if (!item) {
          Alert.alert('Erro', 'Um item do carrinho não existe mais.');
          return;
        }
        if (qty > item.qty) {
          Alert.alert(
            'Estoque insuficiente',
            `Você selecionou ${qty}x de "${item.name}", mas só há ${item.qty} em estoque.`
          );
          return;
        }
      }

      // cria o cabeçalho do pedido
      const { data: req, error: e1 } = await supabase
        .from('requests')
        .insert({ employee_id: user.id, status: 'PENDING', reason: 'Pedido via app' })
        .select('id')
        .single();
      if (e1 || !req) throw e1;

      // insere os itens do pedido
      const rows = items.map(i => ({
        request_id: req.id,
        epi_id: i.epi_id,
        qty_requested: i.qty,
      }));
      const { error: e2 } = await supabase.from('request_items').insert(rows);
      if (e2) throw e2;

      setCart({});

      // 👇 melhoria: orientar o usuário para "Meus pedidos"
      Alert.alert(
        'Sucesso',
        'Pedido enviado! Você poderá acompanhar o status em "Meus pedidos".',
        [
          {
            text: 'Ver meus pedidos',
            onPress: () => router.push('/(employee)/orders'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao enviar pedido');
    }
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Carregando catálogo…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Fazer pedido de EPI' }} />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
          Catálogo de EPIs
        </Text>

        <FlatList
          data={epis}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const q = cart[item.id] ?? 0;
            const restante = Math.max(0, item.qty - q); // quanto ainda posso adicionar
            const podeAdicionar = restante > 0;

            return (
              <View
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 10,
                  marginBottom: 10,
                  backgroundColor: '#fff',
                }}
              >
                <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                {!!item.size && <Text>Tamanho: {item.size}</Text>}
                <Text>Em estoque: {item.qty}</Text>
                {q > 0 && <Text>Selecionado: {q}</Text>}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => remove(item.id)}
                    disabled={q === 0}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderRadius: 8,
                      opacity: q === 0 ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>−</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => add(item.id)}
                    disabled={!podeAdicionar}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderRadius: 8,
                      opacity: podeAdicionar ? 1 : 0.4,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>＋</Text>
                  </TouchableOpacity>
                </View>

                {!podeAdicionar && (
                  <Text style={{ marginTop: 6, color: '#b00' }}>
                    Estoque insuficiente para adicionar mais unidades.
                  </Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text>Não há EPIs ativos cadastrados.</Text>}
        />

        <Button
          title={`Enviar pedido (${cartCount} itens)`}
          onPress={submitOrder}
          disabled={cartCount === 0}
        />
      </View>
    </SafeAreaView>
  );
}
