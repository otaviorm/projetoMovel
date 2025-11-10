// app/(admin)/stock-in.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView, // 👈 ADICIONADO
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
  qty: number | null;
};

export default function StockInScreen() {
  const [epis, setEpis] = useState<Epi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');

  // Carrega lista de EPIs
  async function loadEpis() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('epis')
        .select('id, name, size, qty')
        .order('name', { ascending: true });

      if (error) throw error;
      setEpis(data ?? []);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao carregar EPIs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEpis();
  }, []);

  // Entrada de estoque
  async function handleAddToStock() {
    try {
      if (!selectedId) {
        Alert.alert('Atenção', 'Selecione um EPI.');
        return;
      }

      const n = parseInt(amount, 10);
      if (isNaN(n) || n <= 0) {
        Alert.alert('Atenção', 'Informe uma quantidade maior que zero.');
        return;
      }

      setSaving(true);

      const { error } = await supabase.rpc('adjust_epi_stock', {
        p_epi_id: selectedId,
        p_delta: n, // ENTRADA = número positivo
        p_reason: 'Entrada manual pelo admin',
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Estoque atualizado com sucesso!');
      setAmount('');
      await loadEpis();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível atualizar o estoque.');
    } finally {
      setSaving(false);
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

      {/* 👇 ENVOLVE O CONTEÚDO COM KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1, padding: 16 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
            Selecione um EPI e informe a quantidade de entrada
          </Text>

          <FlatList
            data={epis}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 300 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedId(item.id)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isSelected ? '#1976D2' : '#ddd',
                    backgroundColor: isSelected ? '#E3F2FD' : '#fff',
                  }}
                >
                  <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                  {item.size ? <Text>Tamanho: {item.size}</Text> : null}
                  <Text>Estoque atual: {item.qty ?? 0}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20 }}>
                Nenhum EPI cadastrado.
              </Text>
            }
          />

          {/* Área de quantidade + botão */}
          <View style={{ marginTop: 8, gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>Quantidade para adicionar ao estoque</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Ex: 10"
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            />

            <TouchableOpacity
              onPress={handleAddToStock}
              disabled={saving}
              style={{
                marginTop: 4,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                backgroundColor: saving ? '#90CAF9' : '#1976D2',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {saving ? 'Atualizando...' : 'Adicionar ao estoque'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
