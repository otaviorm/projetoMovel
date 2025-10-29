import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type Request = {
  id: string;
  employee_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  reason?: string | null;
  created_at: string;
};

export default function AdminHome() {
  const [pending, setPending] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('id, employee_id, status, reason, created_at')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Erro', error.message);
    else setPending(data ?? []);
    setLoading(false);
  }

  async function approveRequest(id: string) {
    const { error } = await supabase
      .from('requests')
      .update({ status: 'APPROVED' })
      .eq('id', id);

    if (error) Alert.alert('Erro', error.message);
    else {
      Alert.alert('Sucesso', 'Pedido aprovado e estoque atualizado!');
      loadRequests();
    }
  }

  async function rejectRequest(id: string) {
    const { error } = await supabase
      .from('requests')
      .update({ status: 'REJECTED' })
      .eq('id', id);

    if (error) Alert.alert('Erro', error.message);
    else {
      Alert.alert('Rejeitado', 'Pedido marcado como rejeitado.');
      loadRequests();
    }
  }

  useEffect(() => {
    loadRequests();

    // negocio pra atualizar automaticamente
    const channel = supabase
      .channel('requests-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          console.log('🔄 Atualização recebida:', payload);
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Stack.Screen options={{ title: 'Pedidos Pendentes' }} />
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 10 }}>Pedidos Pendentes</Text>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text>Carregando pedidos…</Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 12,
                marginBottom: 12,
                padding: 12,
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontWeight: '700' }}>Pedido #{item.id.slice(0, 8)}</Text>
              <Text>Funcionário: {item.employee_id}</Text>
              <Text>Status: {item.status}</Text>
              {item.reason && <Text>Motivo: {item.reason}</Text>}
              <Text style={{ color: '#666' }}>
                Criado em: {new Date(item.created_at).toLocaleString()}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 10,
                }}
              >
                <Button
                  title="Aprovar"
                  color="#4CAF50"
                  onPress={() => approveRequest(item.id)}
                />
                <Button
                  title="Rejeitar"
                  color="#F44336"
                  onPress={() => rejectRequest(item.id)}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={<Text>Nenhum pedido pendente.</Text>}
        />
      )}

     
    </SafeAreaView>
  );
}
