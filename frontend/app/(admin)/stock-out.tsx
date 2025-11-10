// app/(admin)/stock-out.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
  size: string | null;
  qty: number;
};

export default function StockOutScreen() {
  const [epis, setEpis] = useState<Epi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const selected = epis.find((e) => e.id === selectedId) ?? null;

  async function load() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('epis')
        .select('id, name, size, qty')
        .order('name', { ascending: true });

      if (error) throw error;
      setEpis((data ?? []) as Epi[]);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar EPIs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!selected) {
      Alert.alert('Atenção', 'Selecione um EPI primeiro.');
      return;
    }

    const q = Number.parseInt(amount, 10);
    if (!Number.isFinite(q) || q <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida maior que zero.');
      return;
    }

    if (q > selected.qty) {
      Alert.alert(
        'Estoque insuficiente',
        `Você está tentando retirar ${q}, mas só há ${selected.qty} unidades.`
      );
      return;
    }

    try {
      setLoading(true);

      const newQty = selected.qty - q;

      // 👇 ALTERAÇÃO IMPORTANTE:
      // removemos o .select().single() porque não precisamos do registro de volta
      const { error } = await supabase
        .from('epis')
        .update({ qty: newQty })
        .eq('id', selected.id);

      if (error) throw error;

      // Atualiza lista em memória
      setEpis((old) =>
        old.map((epi) =>
          epi.id === selected.id ? { ...epi, qty: newQty } : epi
        )
      );

      setAmount('');
      Alert.alert('Sucesso', 'Saída registrada no estoque.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao registrar saída');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* título do header */}
      <Stack.Screen options={{ title: 'Saída de EPIs' }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
            Saída de EPIs
          </Text>

          <Text style={{ fontSize: 16, marginBottom: 12 }}>
            Selecione um EPI e informe a quantidade de saída.
          </Text>

          {loading && epis.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>Carregando…</Text>
            </View>
          ) : (
            <>
              {/* Lista de EPIs */}
              <FlatList
                data={epis}
                keyExtractor={(item) => item.id}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedId(item.id)}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: isSelected ? '#1976d2' : '#ddd',
                        backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700' }}>
                        {item.name}
                      </Text>
                      {item.size && (
                        <Text style={{ marginTop: 2 }}>Tamanho: {item.size}</Text>
                      )}
                      <Text style={{ marginTop: 2 }}>
                        Estoque atual: {item.qty}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Campo e botão */}
              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 16, marginBottom: 6 }}>
                  Quantidade para retirar do estoque
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Ex: 5"
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                    backgroundColor: '#fff',
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  marginTop: 18,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: loading ? '#90caf9' : '#1976d2',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  Dar baixa no estoque
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
