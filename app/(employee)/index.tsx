// app/(employee)/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';

type Epi = { id: string; name: string; size?: string | null };

export default function EmployeeHome() {
  const [epis, setEpis] = useState<Epi[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({}); // epi_id -> qty

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('epis')
        .select('id,name,size')
        .eq('is_active', true)
        .order('name');

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        setEpis(data ?? []);
      }
    })();
  }, []);

  function add(epiId: string) {
    setCart(prev => ({ ...prev, [epiId]: (prev[epiId] ?? 0) + 1 }));
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Alert.alert('Erro', 'Faça login novamente.');

      const items = Object.entries(cart).map(([epi_id, qty]) => ({ epi_id, qty: qty as number }));
      if (items.length === 0) return Alert.alert('Ops', 'Seu carrinho está vazio.');

      const { data: req, error: e1 } = await supabase
        .from('requests')
        .insert({ employee_id: user.id, status: 'PENDING', reason: 'Pedido via app' })
        .select('id')
        .single();
      if (e1 || !req) throw e1;

      const rows = items.map(i => ({ request_id: req.id, epi_id: i.epi_id, qty_requested: i.qty }));
      const { error: e2 } = await supabase.from('request_items').insert(rows);
      if (e2) throw e2;

      setCart({});
      Alert.alert('Sucesso', 'Pedido enviado!');
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao enviar pedido');
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    // com typedRoutes, o caminho do login é /login (grupo (auth) não aparece)
    router.replace('/login');
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Catálogo de EPIs</Text>

      <FlatList
        data={epis}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const q = cart[item.id] ?? 0;
          return (
            <View
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 8,
                marginBottom: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                {!!item.size && <Text>Tamanho: {item.size}</Text>}
                {q > 0 && <Text>Selecionado: {q}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => remove(item.id)}
                  disabled={q === 0}
                  style={{ padding: 8, borderWidth: 1, borderRadius: 6, opacity: q === 0 ? 0.5 : 1 }}
                >
                  <Text>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => add(item.id)}
                  style={{ padding: 8, borderWidth: 1, borderRadius: 6 }}
                >
                  <Text>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text>Nenhum EPI ativo encontrado.</Text>}
      />

      <Button title={`Enviar pedido (${cartCount} itens)`} onPress={submitOrder} disabled={cartCount === 0} />
      <Button title="Sair" onPress={logout} />
    </View>
  );
}
