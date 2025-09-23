
# App Mobile (Expo + React Native)

Este é o aplicativo do projeto (frontend mobile), feito com **Expo + React Native** e **Supabase**.

---

##  Pré-requisitos
- **Node.js** LTS (18 ou superior recomendado)
- **Expo CLI** (já vem com `npx expo`)
- Conta no **Supabase** (ou usar as chaves de exemplo em `.env.example`)
- App **Expo Go** no celular (para testes)

---

##  Configuração do Ambiente

1. **Clone este repositório**  
   ```bash
   git clone https://github.com/otaviorm/projetoModelo.git
   cd projetoModelo/frontend/mobile
   ```

2. **Instale as dependências**  
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**  
   Copie o arquivo `.env.example` para `.env` e preencha com os dados do Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://SUA-INSTANCE.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=CHAVE_ANON_AQUI
   ```

---

##  Rodando o App

### Opção 1 — Túnel (funciona em redes diferentes)
```bash
npm run start:tunnel
```
Escaneie o QR Code gerado com o aplicativo **Expo Go** no seu celular.

### Opção 2 — Ambiente Local (mesma rede Wi-Fi)
```bash
npm start
```

### Opção 3 — Web (visualização rápida, nem todos recursos funcionam)
```bash
npm run web
```

---

##  Telas Implementadas

- **Login**  
  - E-mail + senha  
  - Botão **Entrar**  
  - Botão **Registrar** (nova conta)  
  - Link **Esqueci minha senha**

- **Profile (Início)**  
  - Saudação com nome do usuário  
  - Aba expansível **Meu Perfil** com:  
    - E-mail  
    - Nome completo  
    - Papel (ADMIN ou EMPLOYEE)  
    - Botão **Sair**

 Após login bem-sucedido, o usuário é redirecionado automaticamente para a tela de **Perfil**.

---

##  Estrutura de Pastas

```
mobile/
├─ app/
│  ├─ _layout.tsx
│  ├─ index.tsx
│  ├─ profile.tsx
│  └─ (auth)/
│     └─ login.tsx
├─ src/
│  └─ lib/
│     └─ supabase.ts
├─ assets/
│  ├─ icon.png
│  ├─ adaptive-icon.png
│  └─ favicon.png
├─ .env.example
├─ .gitignore
├─ app.json
├─ babel.config.js
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

##  Banco de Dados (Supabase)

O projeto espera a seguinte tabela no **Supabase**:

- **profiles**
  - `id` → `uuid` (Primary Key, FK para `auth.users.id`)
  - `full_name` → `text`
  - `role` → `text` (`ADMIN` | `EMPLOYEE`)

---

## ⚠️ Notas Importantes

- O arquivo `.env` **não deve ser commitado** (apenas o `.env.example`).
- Se usar **Supabase Auth**, a tabela `profiles` deve ser criada com **trigger** para inserir o perfil após `signUp` (ou gerenciada pelo app).
- O projeto usa **expo-router** e organiza as telas pelo sistema de pastas (`app/`).

---

##  Instruções para Teste (Professor)

1. Entre em `projetoModelo/frontend/mobile/`
2. Rode `npm install`
3. Crie `.env` com as credenciais do Supabase
4. Execute `npm run start:tunnel`
5. Escaneie o QR Code com o **Expo Go** no celular

Pronto! O app abre diretamente no dispositivo.

---
