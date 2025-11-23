import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type RequestItem = {
  qty_requested: number;
  epis?: {
    name: string;
    size: string | null;
  } | null;
};

type Request = {
  id: string;
  employee_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  reason?: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
  request_items?: RequestItem[];
};

export default function AdminHome() {
  const [pending, setPending] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  /** Tradução para português */
  function getStatusPtBr(status: Request['status']) {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'APPROVED':
        return 'Aprovado';
      case 'REJECTED':
        return 'Rejeitado';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from('requests')
      .select(`
        id,
        employee_id,
        status,
        reason,
        created_at,
        profiles (
          full_name
        ),
        request_items (
          qty_requested,
          epis (
            name,
            size
          )
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Erro', error.message);
    else setPending(data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel('requests-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /** Função para aprovar */
  async function approveRequest(id: string) {
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'APPROVED',
          reason: comment || 'Pedido aprovado.',
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Pedido aprovado!');
      setComment('');
      loadRequests();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  /** Função de deixar pendente (com comentário) */
  async function addPendingReason(id: string) {
    Alert.prompt(
      "Adicionar motivo",
      "Explique ao colaborador o motivo pelo qual o pedido continua pendente:",
      async (text) => {
        if (!text || text.trim() === "") {
          Alert.alert("Atenção", "O motivo não pode estar vazio.");
          return;
        }

        try {
          const { error } = await supabase
            .from("requests")
            .update({ reason: text })
            .eq("id", id);

          if (error) throw error;

          Alert.alert("Sucesso", "Comentário adicionado ao pedido!");
          loadRequests();
        } catch (err: any) {
          Alert.alert("Erro", err.message ?? "Não foi possível salvar o comentário.");
        }
      }
    );
  }

  /** Função para rejeitar */
  async function rejectRequest(id: string) {
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'REJECTED',
          reason: comment || 'Pedido rejeitado.',
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Rejeitado', 'Pedido rejeitado com sucesso.');
      setComment('');
      loadRequests();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Stack.Screen options={{ title: 'Pedidos Pendentes' }} />

      <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 10 }}>
        Pedidos Pendentes
      </Text>

      <Text style={{ fontWeight: '600' }}>Comentário (opcional)</Text>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Ex: Estoque em reposição, volte mais tarde..."
        style={{
          borderWidth: 1,
          borderColor: '#bbb',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 42,
          marginBottom: 20,
        }}
      />

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
                padding: 14,
                marginBottom: 14,
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontWeight: '700' }}>
                Pedido #{item.id.slice(0, 8)}
              </Text>

              <Text>
                Colaborador:{' '}
                <Text style={{ fontWeight: '700' }}>
                  {item.profiles?.full_name ?? 'Não identificado'}
                </Text>
              </Text>

              <Text>
                Status: <Text>{getStatusPtBr(item.status)}</Text>
              </Text>

              {item.reason && (
                <Text>
                  Motivo: <Text style={{ fontWeight: '600' }}>{item.reason}</Text>
                </Text>
              )}

              <Text style={{ color: '#666' }}>
                Criado em: {new Date(item.created_at).toLocaleString()}
              </Text>

              {/* Lista de EPIs do pedido */}
              {item.request_items && item.request_items.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>
                    Itens do pedido:
                  </Text>
                  {item.request_items.map((ri, idx) => (
                    <Text key={idx}>
                      • {ri.epis?.name} {ri.epis?.size ? `(Tam: ${ri.epis.size})` : ''} –{' '}
                      {ri.qty_requested} un.
                    </Text>
                  ))}
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                }}
              >
                <Button title="Aprovar" color="#4CAF50" onPress={() => approveRequest(item.id)} />
                <Button title="Manter pendente" color="#FFA500" onPress={() => addPendingReason(item.id)} />
                <Button title="Rejeitar" color="#E53935" onPress={() => rejectRequest(item.id)} />
              </View>
            </View>
          )}
          ListEmptyComponent={<Text>Nenhum pedido pendente.</Text>}
        />
      )}
    </SafeAreaView>
  );
}
