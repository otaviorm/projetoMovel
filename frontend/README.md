# Controle de EPIs – Carbon Ambiental

Aplicativo mobile desenvolvido em **React Native (Expo)** com **Supabase** como backend.  
O sistema tem como objetivo facilitar o **controle de Equipamentos de Proteção Individual (EPIs)** dentro de empresas, eliminando o uso de planilhas manuais e centralizando a gestão de solicitações e estoque.

---

## Funcionalidades Principais

- **Login e Cadastro de Usuários**
  - Autenticação via Supabase Auth
  - Redefinição e alteração de senha dentro do app

- **Gestão de EPIs**
  - Cadastro, edição e visualização de estoque
  - Alerta para níveis baixos de estoque

- **Pedidos de EPIs**
  - Solicitação de EPIs por colaboradores
  - Aprovação/Rejeição de pedidos por administradores
  - Atualização automática do estoque

- **Perfil de Usuário**
  - Visualização de nome, e-mail e papel (Administrador / Colaborador)
  - Opção para sair da conta

---

## Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|--------|-------------|------------|
| **Frontend** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) | Desenvolvimento mobile multiplataforma |
| **Backend / Banco** | [Supabase](https://supabase.com/) | Banco de dados PostgreSQL, autenticação e API |
| **Linguagem** | TypeScript / JavaScript | Base da aplicação |
| **Gerenciamento de Estado** | React Hooks | Controle dos dados e estados da interface |
| **Testes** | Expo Go | Testes em dispositivos físicos e simuladores |

---

## Estrutura do Projeto

```
projetoMovel/
├── app/
│   ├── (admin)/         → Telas de administração (controle de estoque, pedidos)
│   ├── (employee)/      → Telas do colaborador
│   ├── (auth)/          → Login, cadastro e recuperação de senha
│   ├── index.tsx        → Tela inicial
│   └── _layout.tsx      → Navegação principal
├── src/
│   ├── lib/
│   │   └── supabase.ts  → Configuração do Supabase
│   └── components/
│       └── ProfileSheet.tsx
├── package.json
└── README.md
```

---

## Como Executar o Projeto

### 1. Clone o repositório
```bash
git clone https://github.com/otaviorm/projetoMovel.git
cd projetoMovel
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase
Crie um arquivo `.env` na raiz com as seguintes variáveis:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://<sua-url>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon>
```

### 4. Inicie o app
```bash
npx expo start
```

 Escaneie o QR code com o **Expo Go** (Android ou iOS).

---

## Estrutura de Perfis

- **Administrador**
  - Acesso total ao estoque e aos pedidos
  - Pode cadastrar, editar e aprovar solicitações
- **Colaborador**
  - Pode solicitar EPIs e acompanhar o status dos pedidos
  - Acesso restrito apenas às suas próprias requisições

---

## Banco de Dados (Supabase)

Tabelas principais:

- **profiles** → dados de usuário (nome, papel, email)
- **epis** → lista de equipamentos com quantidade
- **requests** → solicitações de EPIs (pendente, aprovado, rejeitado)
- **request_items** → relação entre pedidos e EPIs
- **stock_moves** → histórico de movimentações de estoque

---

## Testes Realizados

- Login e logout de usuários  
- Criação de novos pedidos  
- Aprovação e rejeição de pedidos  
- Atualização de estoque em tempo real  
- Redefinição de senha  
- Criação de novos colaboradores  

---

## Layout

Interface simples, intuitiva e em português, pensada para fácil utilização por colaboradores de diferentes níveis de escolaridade.

---

## Autor

| Nome | Função | Contato |
|------|--------|----------|
| **Otavio Rodrigues Machado** | Desenvolvimento, testes e documentação | [GitHub](https://github.com/otaviorm) |

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos na disciplina de **Programação Para Dispositivos Móveis em Android**  
**UNIMETROCAMP Wyden – 2025**

---

## Agradecimentos

Agradecimentos especiais ao professor Luiz Gustavo Turatti pelo suporte técnico e orientação no desenvolvimento do projeto.
