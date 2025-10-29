import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type Notif = { id: string; type: string; message: string; epi_id?: string|null; qty?: number|null; created_at: string; seen: boolean };

export default function AlertsScreen() {
  const [items, setItems] = useState<Notif[]>([]);

  async function load() {
    const { data, error } = await supabase
      .from('notifications')
      .select('id,type,message,epi_id,qty,created_at,seen')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) Alert.alert('Erro', error.message);
    else setItems(data ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('notif-low-stock')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => setItems(prev => [payload.new as any, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function markSeen(id: string) {
    const { error } = await supabase.from('notifications').update({ seen: true }).eq('id', id);
    if (error) Alert.alert('Erro', error.message);
    else setItems(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Stack.Screen options={{ title: 'Alertas' }} />
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Alertas</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, marginBottom: 8, borderWidth: 1, borderRadius: 8, borderColor: item.seen ? '#ddd' : '#f90', backgroundColor: '#fff' }}>
            <Text style={{ fontWeight: '700' }}>{item.type === 'LOW_STOCK' ? 'Estoque baixo' : item.type}</Text>
            <Text>{item.message}</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>{new Date(item.created_at).toLocaleString()}</Text>
            {!item.seen && <Button title="Marcar como lida" onPress={() => markSeen(item.id)} />}
          </View>
        )}
        ListEmptyComponent={<Text>Sem alertas.</Text>}
      />
    </SafeAreaView>
  );
}
