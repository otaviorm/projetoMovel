import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function ChangePasswordScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        router.replace('/(auth)/login');
        return;
      }
      setEmail(user.email ?? null);
    })();
  }, []);

  async function handleChangePassword() {
    if (!email) {
      Alert.alert('Erro', 'Não foi possível encontrar o e-mail do usuário.');
      return;
    }

    if (!currentPassword || !newPassword || !confirm) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirm) {
      Alert.alert('Atenção', 'A confirmação de senha não confere.');
      return;
    }

    try {
      setLoading(true);

      // 1) valida a senha atual tentando fazer login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erro', 'Senha atual incorreta.');
        setLoading(false);
        return;
      }

      // 2) atualiza a senha do usuário logado
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert('Sucesso', 'Senha alterada com sucesso.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Alterar senha' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding' })}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Alterar senha
          </Text>

          <View style={{ gap: 10 }}>
            <Text style={{ fontWeight: '600' }}>Senha atual</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Sua senha atual"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 46,
              }}
            />

            <Text style={{ fontWeight: '600' }}>Nova senha</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nova senha"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 46,
              }}
            />

            <Text style={{ fontWeight: '600' }}>Confirmar nova senha</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repita a nova senha"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 46,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={loading}
            style={{
              marginTop: 8,
              height: 46,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
