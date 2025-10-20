import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView, Platform,
  Text, TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingIn, setLoadingIn] = useState(false);
  const [loadingUp, setLoadingUp] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    try {
      setLoadingIn(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/profile');
    } catch (e: any) {
      Alert.alert('Erro ao entrar', e?.message ?? 'Tente novamente.');
    } finally {
      setLoadingIn(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    try {
      setLoadingUp(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      Alert.alert('Conta criada', 'Verifique seu e-mail e depois faça login.');
    } catch (e: any) {
      Alert.alert('Erro ao registrar', e?.message ?? 'Tente novamente.');
    } finally {
      setLoadingUp(false);
    }
  }

  async function handleResetPassword() {
    if (!email) return Alert.alert('Atenção', 'Digite seu e-mail para redefinir a senha.');
    try {
      setLoadingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://exemplo.com/reset-password',
      });
      if (error) throw error;
      Alert.alert('Verifique seu e-mail', 'Enviamos um link para redefinir sua senha.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível enviar o link.');
    } finally {
      setLoadingReset(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding' })}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
            Entrar
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
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 46 }}
            />

            <Text style={{ fontWeight: '600' }}>Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              secureTextEntry
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 46 }}
            />

            <TouchableOpacity onPress={handleResetPassword} disabled={loadingReset}>
              <Text style={{ color: 'blue', marginTop: 6 }}>
                {loadingReset ? 'Enviando...' : 'Esqueci minha senha'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12, marginTop: 8 }}>
            <Button title={loadingIn ? 'Entrando...' : 'Entrar'} onPress={handleSignIn} disabled={loadingIn} />
            <TouchableOpacity onPress={handleSignUp} disabled={loadingUp} style={{ opacity: loadingUp ? 0.6 : 1 }}>
              <View style={{
                height: 46, borderRadius: 8, borderWidth: 1, borderColor: '#333',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Text style={{ fontWeight: '600' }}>
                  {loadingUp ? 'Registrando...' : 'Registrar'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
