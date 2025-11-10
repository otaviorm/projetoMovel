import { Stack, router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Button,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendLink() {
    if (!email) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // aqui poderia ser um deep link do seu app no futuro
        redirectTo: 'https://exemplo.com/reset-password',
      });

      if (error) throw error;

      Alert.alert(
        'Verifique seu e-mail',
        'Enviamos um link para redefinir sua senha.'
      );

      // volta para a tela de login
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível enviar o link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Recuperar senha' }} />

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
            Esqueceu a senha
          </Text>

          <Text style={{ textAlign: 'center', color: '#555', marginBottom: 8 }}>
            Digite o e-mail cadastrado que enviaremos um link para redefinir sua
            senha.
          </Text>

          <View style={{ gap: 10 }}>
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
          </View>

          <View style={{ marginTop: 16 }}>
            <Button
              title={loading ? 'Enviando...' : 'Enviar link de recuperação'}
              onPress={handleSendLink}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
