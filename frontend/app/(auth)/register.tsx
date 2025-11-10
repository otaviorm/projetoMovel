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

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const user = data.user;

      // cria/atualiza perfil com nome e papel padrão COLABORADOR
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              full_name: fullName.trim(),
              role: 'EMPLOYEE', // armazenamos assim e mostramos "Colaborador" na UI
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error('Erro ao salvar perfil:', profileError);
        }
      }

      Alert.alert(
        'Conta criada',
        'Sua conta foi criada com sucesso. Agora faça login.',
        [
          {
            text: 'Ir para login',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro ao registrar', e?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Criar conta' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding' })}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 16 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Criar conta
          </Text>

          <View style={{ gap: 10 }}>
            <Text style={{ fontWeight: '600' }}>Nome completo</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex: João da Silva"
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 46,
              }}
            />

            <Text style={{ fontWeight: '600' }}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seuemail@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 46,
              }}
            />

            <Text style={{ fontWeight: '600' }}>Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 46,
              }}
            />

            <Text style={{ fontWeight: '600' }}>Confirmar senha</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repita a senha"
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
            onPress={handleSignUp}
            disabled={loading}
            style={{
              marginTop: 8,
              height: 46,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: loading ? '#9ca3af' : '#16a34a',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={{ marginTop: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#2563eb' }}>Já tenho conta, fazer login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
