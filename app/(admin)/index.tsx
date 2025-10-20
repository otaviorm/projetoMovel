// app/(admin)/index.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

type Request = {
  id: string;
  employee_id: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export default function AdminHome() {
  const [pending, setPending] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select('id, employee_id, created_at, status')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPending((data ?? []) as Request[]);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Realtime: atualiza quando inserir/atualizar/deletar pedidos
  useEffect(() => {
    const channel = supabase
      .channel('requests_admin_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload: any) => {
          const newRow = payload.new as Request | undefined;
          const oldRow = payload.old as Request | undefined;

          setPending(prev => {
            if (newRow) {
              if (newRow.status === 'PENDING') {
                const exists = prev.some(r => r.id === newRow.id);
                if (exists) {
                  return prev
                    .map(r => (r.id === newRow.id ? newRow : r))
                    .sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    );
                }
                return [...prev, newRow].sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
              }
              // deixou de ser PENDING
              return prev.filter(r => r.id !== newRow.id);
            }
            // DELETE
            if (oldRow) return prev.filter(r => r.id !== oldRow.id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function setStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const { error } = await supabase.from('requests').update({ status }).eq('id', id);
      if (error) throw error;
      Alert.alert('Ok', `Pedido ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'}.`);
      // O realtime já atualiza a lista.
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar o pedido');
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const headerTitle = useMemo(
    () => `Pedidos pendentes (${pending.length})`,
    [pending.length]
  );

  // No Android, SafeAreaView não cobre a StatusBar: dá um padding extra
  const androidTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { paddingTop: androidTop + 8 }]}>
        <Text style={styles.title}>{headerTitle}</Text>

        {loading && pending.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.muted}>Carregando...</Text>
          </View>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={(i) => i.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={[
              pending.length === 0 ? styles.emptyContainer : undefined,
              { paddingHorizontal: 16, paddingBottom: 16 },
            ]}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    #{item.id.slice(0, 8)} • {new Date(item.created_at).toLocaleString()}
                  </Text>
                  <Badge text={item.status} tone="warning" />
                </View>

                <Text style={styles.body}>Funcionário: {item.employee_id}</Text>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Btn onPress={() => setStatus(item.id, 'APPROVED')} label="Aprovar" kind="primary" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Btn onPress={() => setStatus(item.id, 'REJECTED')} label="Rejeitar" kind="danger" />
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.muted}>Nenhum pedido pendente.</Text>
              </View>
            }
          />
        )}

        <View style={styles.footer}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Btn onPress={load} label="Atualizar" />
          </View>
          <View style={{ flex: 1 }}>
            <Btn onPress={logout} label="Sair" kind="ghost" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/** ------- UI helpers ------- */

function Btn({
  label,
  onPress,
  kind = 'default',
}: {
  label: string;
  onPress: () => void;
  kind?: 'default' | 'primary' | 'danger' | 'ghost';
}) {
  const palette =
    kind === 'primary'
      ? styles.btnPrimary
      : kind === 'danger'
      ? styles.btnDanger
      : kind === 'ghost'
      ? styles.btnGhost
      : styles.btnDefault;

  const textStyle = kind === 'ghost' ? styles.btnGhostText : styles.btnText;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, palette]} activeOpacity={0.85}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

function Badge({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const style =
    tone === 'success'
      ? styles.badgeSuccess
      : tone === 'warning'
      ? styles.badgeWarning
      : tone === 'danger'
      ? styles.badgeDanger
      : styles.badgeNeutral;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

/** ------- Styles ------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A', // slate-900
  },
  container: {
    flex: 1,
  },

  // Header
  title: {
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#E5E7EB', // gray-200
    marginBottom: 8,
  },

  // States
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    color: '#9CA3AF', // gray-400
    marginTop: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Card
  card: {
    borderWidth: 1,
    borderColor: '#1F2937', // gray-800
    backgroundColor: '#111827', // gray-900
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#F3F4F6', // gray-100
  },
  body: {
    color: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8, // SafeAreaView cobre o iOS; este padding é extra/estético
    paddingTop: 4,
  },

  // Buttons
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  btnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  btnDefault: {
    backgroundColor: '#374151', // gray-700
  },
  btnPrimary: {
    backgroundColor: '#2563EB', // blue-600
  },
  btnDanger: {
    backgroundColor: '#DC2626', // red-600
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'transparent',
  },
  btnGhostText: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 16,
  },

  // Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },
  badgeNeutral: { backgroundColor: '#D1D5DB' },
  badgeSuccess: { backgroundColor: '#86EFAC' },
  badgeWarning: { backgroundColor: '#FCD34D' },
  badgeDanger: { backgroundColor: '#FCA5A5' },
});
