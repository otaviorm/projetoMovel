import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type RequestItem = {
  epi_id: string;
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

function getStatusInfo(status: Request['status']) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pendente', color: '#f59e0b' }; // amarelo
    case 'APPROVED':
      return { label: 'Aprovado', color: '#16a34a' }; // verde
    case 'REJECTED':
      return { label: 'Rejeitado', color: '#dc2626' }; // vermelho
    case 'CANCELED':
      return { label: 'Cancelado', color: '#6b7280' }; // cinza
    default:
      return { label: status, color: '#000000' };
  }
}

export default function AdminHome() {
  const [pending, setPending] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /** Carrega pedidos pendentes + nome do funcionário + itens do pedido */
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          employee_id,
          status,
          reason,
          created_at,
          profiles:employee_id (
            full_name
          ),
          request_items (
            epi_id,
            qty_requested,
            epis (
              name,
              size
            )
          )
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPending((data ?? []) as Request[]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar pedidos pendentes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /** Aprova pedido: baixa estoque de cada EPI e marca pedido como APROVADO */
  async function approveRequest(id: string) {
    try {
      // busca itens do pedido
      const { data: items, error: itemsError } = await supabase
        .from('request_items')
        .select('epi_id, qty_requested')
        .eq('request_id', id);

      if (itemsError) throw itemsError;
      if (!items?.length) {
        throw new Error('Nenhum item encontrado no pedido.');
      }

      // atualiza estoque de cada EPI
      for (const item of items) {
        const { data: epiData, error: fetchErr } = await supabase
          .from('epis')
          .select('qty')
          .eq('id', item.epi_id)
          .single();

        if (fetchErr) throw fetchErr;

        const newQty = (epiData?.qty ?? 0) - item.qty_requested;
        if (newQty < 0) {
          throw new Error('Estoque insuficiente para um dos itens.');
        }

        const { error: updateErr } = await supabase
          .from('epis')
          .update({ qty: newQty })
          .eq('id', item.epi_id);

        if (updateErr) throw updateErr;
      }

      // marca o pedido como aprovado
      const { error: updateReqErr } = await supabase
        .from('requests')
        .update({ status: 'APPROVED' })
        .eq('id', id);

      if (updateReqErr) throw updateReqErr;

      Alert.alert('Sucesso', 'Pedido aprovado e estoque atualizado!');
      loadRequests();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', err?.message ?? 'Falha ao aprovar pedido.');
    }
  }

  /** Rejeita pedido (não mexe no estoque) */
  async function rejectRequest(id: string) {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'REJECTED' })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Rejeitado', 'Pedido marcado como rejeitado.');
      loadRequests();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message ?? 'Falha ao rejeitar pedido.');
    }
  }

  useEffect(() => {
    loadRequests();

    // Realtime: atualiza lista automaticamente quando a tabela requests muda
    const channel = supabase
      .channel('requests-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  function onRefresh() {
    setRefreshing(true);
    loadRequests();
  }

  const isInitialLoading = loading && !refreshing && pending.length === 0;

  if (isInitialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Carregando pedidos…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Pedidos Pendentes' }} />

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 10 }}>
          Pedidos Pendentes
        </Text>

        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.status);
            const employeeName =
              item.profiles?.full_name?.trim() || 'Não identificado';

            return (
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
                <Text style={{ fontWeight: '700' }}>
                  Pedido #{item.id.slice(0, 8)}
                </Text>
                <Text>
                  Funcionário:{' '}
                  <Text style={{ fontWeight: '600' }}>{employeeName}</Text>
                </Text>
                <Text>
                  Status:{' '}
                  <Text style={{ fontWeight: '600', color: statusInfo.color }}>
                    {statusInfo.label}
                  </Text>
                </Text>
                {item.reason && <Text>Motivo: {item.reason}</Text>}
                <Text style={{ color: '#666' }}>
                  Criado em: {new Date(item.created_at).toLocaleString()}
                </Text>

                {item.request_items && item.request_items.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 4 }}>
                      Itens do pedido:
                    </Text>
                    {item.request_items.map((ri, index) => (
                      <Text key={`${item.id}-${index}`}>
                        • {ri.epis?.name ?? 'EPI'}
                        {ri.epis?.size ? ` (Tamanho: ${ri.epis.size})` : ''} –{' '}
                        {ri.qty_requested} un.
                      </Text>
                    ))}
                  </View>
                )}

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
            );
          }}
          ListEmptyComponent={
            <Text>Nenhum pedido pendente no momento.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
