import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: true,            // mostra o header em todas as telas
          headerTitleAlign: 'center',   
          headerBackTitle: 'Voltar',    
          //headerBackTitleVisible: true, 
        }}
      />
    </ThemeProvider>
  );
}
