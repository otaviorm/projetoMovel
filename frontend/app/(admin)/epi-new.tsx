import { Stack, router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

export default function NewEpiScreen() {
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [initialQty, setInitialQty] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      if (!name.trim()) {
        Alert.alert('Atenção', 'Informe o nome do EPI.');
        return;
      }

      const qtyNumber = parseInt(initialQty || '0', 10);
      if (isNaN(qtyNumber) || qtyNumber < 0) {
        Alert.alert('Atenção', 'Quantidade inicial deve ser zero ou um número positivo.');
        return;
      }

      setSaving(true);

      // 1) cria o EPI com estoque 0
      const { data, error } = await supabase
        .from('epis')
        .insert({
          name: name.trim(),
          size: size.trim() || null,
          qty: 0,
          is_active: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      const epiId = data.id as string;

      // 2) se tiver quantidade inicial > 0, registra via função de ajuste de estoque
      if (qtyNumber > 0) {
        const { error: stockErr } = await supabase.rpc('adjust_epi_stock', {
          p_epi_id: epiId,
          p_delta: qtyNumber,
          p_reason: 'Estoque inicial no cadastro do EPI',
        });

        if (stockErr) throw stockErr;
      }

      Alert.alert('Sucesso', 'EPI cadastrado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(), // volta para a tela anterior (Início ou lista de EPIs)
        },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message ?? 'Não foi possível cadastrar o EPI.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Cadastrar novo EPI' }} />

      <KeyboardAvoidingView
        style={{ flex: 1, padding: 16 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
            Novo EPI
          </Text>

          <Text style={{ fontWeight: '600', marginBottom: 4 }}>Nome do EPI</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Bota de segurança"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontWeight: '600', marginBottom: 4 }}>Tamanho (opcional)</Text>
          <TextInput
            value={size}
            onChangeText={setSize}
            placeholder="Ex: 41, M, G..."
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontWeight: '600', marginBottom: 4 }}>
            Quantidade inicial em estoque
          </Text>
          <TextInput
            value={initialQty}
            onChangeText={setInitialQty}
            placeholder="Ex: 10"
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 16,
            }}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              marginTop: 8,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
              backgroundColor: saving ? '#9ca3af' : '#16a34a',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {saving ? 'Salvando...' : 'Cadastrar EPI'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
