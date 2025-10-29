import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type Epi = {
  id: string;
  name: string;
  size?: string | null;
  qty: number;
  is_active: boolean;
};

export default function StockIn() {
  const [epis, setEpis] = useState<Epi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Epi | null>(null);
  const [amount, setAmount] = useState<string>('1');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
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
      }
    })();
  }, []);

  function inc(n: number) {
    const v = Math.max(0, parseInt(amount || '0', 10) + n);
    setAmount(String(v));
  }

  async function confirm() {
    if (!selected) {
      Alert.alert('Selecione um EPI');
      return;
    }
    const qty = parseInt(amount || '0', 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Quantidade inválida', 'Informe um número maior que zero.');
      return;
    }

    try {
      setSending(true);

      
      const { data: rpcData, error: rpcErr } = await supabase.rpc('adjust_epi_stock', {
        epi_id: selected.id,
        delta: qty, 
      });

      if (!rpcErr) {
        Alert.alert('Sucesso', `Entrada de ${qty} unidade(s) em "${selected.name}".`);
      } else {
        
        const { error } = await supabase
          .from('epis')
          .update({ qty: selected.qty + qty })
          .eq('id', selected.id);

        if (error) throw error;
        Alert.alert('Sucesso', `Entrada de ${qty} unidade(s) em "${selected.name}".`);
      }

      // atualiza a lista local
      setEpis(prev =>
        prev.map(e => (e.id === selected.id ? { ...e, qty: e.qty + qty } : e)),
      );
      setSelected(null);
      setAmount('1');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao aplicar entrada.');
    } finally {
      setSending(false);
    }
  }

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
      <Stack.Screen options={{ title: 'Entrada de EPIs' }} />
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Entrada de EPIs</Text>

        <FlatList
          data={epis}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSel = selected?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => {
                  setSelected(item);
                  setAmount('1');
                }}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isSel ? '#1976D2' : '#ddd',
                  backgroundColor: isSel ? '#E3F2FD' : '#fff',
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                {!!item.size && <Text>Tamanho: {item.size}</Text>}
                <Text>Em estoque: {item.qty}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text>Não há EPIs ativos cadastrados.</Text>}
        />

        {/* Painel de quantidade + confirmar */}
        {selected && (
          <View
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 10,
              padding: 12,
              backgroundColor: '#fff',
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: '700' }}>Selecionado: {selected.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => inc(-1)}
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 20 }}>−</Text>
              </TouchableOpacity>
              <TextInput
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
                style={{
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  minWidth: 70,
                  textAlign: 'center',
                }}
              />
              <TouchableOpacity
                onPress={() => inc(1)}
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 20 }}>＋</Text>
              </TouchableOpacity>
            </View>

            <Button title={sending ? 'Aplicando…' : 'Confirmar Entrada'} onPress={confirm} disabled={sending} />
          </View>
        )}

        
      </View>
    </SafeAreaView>
  );
}
