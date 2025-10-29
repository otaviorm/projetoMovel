// components/ProfileSheet.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Button,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  onClose: () => void;
  onLogout: () => void;
};

export function ProfileSheet({ visible, email, name, role, onClose, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1)).current;
  const { height, width } = Dimensions.get('window');

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Fundo escuro */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Painel lateral */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateX }],
            marginTop: insets.top + 20,
            marginBottom: insets.bottom + 20,
            height: height * 0.85, // 👈 ocupa 85% da tela (como o seu desenho)
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Meu Perfil</Text>

          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>{email ?? '—'}</Text>

          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{name ?? '—'}</Text>

          <Text style={styles.label}>Papel</Text>
          <Text style={styles.value}>{role ?? '—'}</Text>

          <View style={{ marginTop: 20 }}>
            <Button
              title="Sair"
              color={Platform.OS === 'ios' ? undefined : '#E53935'}
              onPress={onLogout}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center', // 👈 centraliza verticalmente
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    width: '86%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 22, // 👈 bordas arredondadas como no seu exemplo
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  content: {
    padding: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    fontWeight: '700',
    marginTop: 10,
  },
  value: {
    fontSize: 15,
    color: '#333',
  },
});
