import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  reason?: string | null;
  created_at: string;
  is_hidden?: boolean;
  request_items?: RequestItem[];
};

export default function EmployeeOrdersScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setLoading(true);

      // pega usuário logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        return;
      }

      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          reason,
          created_at,
          is_hidden,
          request_items (
            qty_requested,
            epis (
              name,
              size
            )
          )
        `)
        .eq('employee_id', user.id)
        .eq('is_hidden', false) // só pedidos não escondidos
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data ?? []) as Request[]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar seus pedidos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  /** traduz o status para portugues e define uma cor */
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

  /** marca como escondidos no banco os pedidos que n estao mais pendentes */
  async function handleClearCompleted() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        return;
      }

      // marca como escondidos todos os pedidos do usuário que NÃO estão pendentes
      const { error } = await supabase
        .from('requests')
        .update({ is_hidden: true })
        .eq('employee_id', user.id)
        .neq('status', 'PENDING');

      if (error) throw error;

      // atualiza a lista em memória tbm
      setRequests((prev) => prev.filter((r) => r.status === 'PENDING'));
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message ?? 'Não foi possível limpar os pedidos.');
    }
  }

  if (loading && !refreshing && requests.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator />
        <Text>Carregando seus pedidos…</Text>
      </SafeAreaView>
    );
  }

  const hasCompleted = requests.some((r) => r.status !== 'PENDING');

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Meus pedidos' }} />

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
          Meus pedidos
        </Text>

        {/* botão para limpar pedidos já concluídos (não pendentes) */}
        <TouchableOpacity
          onPress={handleClearCompleted}
          disabled={!hasCompleted}
          style={{
            alignSelf: 'flex-start',
            marginBottom: 12,
            opacity: hasCompleted ? 1 : 0.5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#9ca3af',
            backgroundColor: '#f3f4f6',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
            Limpar pedidos concluídos
          </Text>
        </TouchableOpacity>

        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.status);

            return (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  backgroundColor: '#fff',
                }}
              >
                <Text style={{ fontWeight: '700' }}>
                  Pedido #{item.id.slice(0, 8)}
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
                    <Text
                      style={{
                        fontWeight: '600',
                        marginBottom: 4,
                      }}
                    >
                      Itens:
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
              </View>
            );
          }}
          ListEmptyComponent={<Text>Você ainda não fez nenhum pedido.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}
