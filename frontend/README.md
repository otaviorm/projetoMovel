#  Projeto Móvel – Sistema de Controle de EPIs

## Projeto da disciplina de Programação de Dispositivos Móveis com React Native + Expo (Android)
**Orientador:** Prof. Luiz Gustavo Turatti

A solução desenvolvida neste repositório consiste na criação de uma **plataforma mobile para gerenciamento de EPIs**.  
O sistema controla estoque, pedidos, aprovação de administradores e reposição de materiais, utilizando React Native + Expo e Supabase.

---

#  Equipe do Projeto
**202302380972 – Otavio Rodrigues Machado**  
**202304039569 – Anna Lua Frisa Franzati**  

---

#  Sumário
1. Requisitos  
2. Configuração de acesso aos dados  
3. Estrutura do projeto  
4. Instalação no Windows 11  
5. Execução do projeto  
6. Telas do projeto

---

#  1. Requisitos

### Linguagens & Ferramentas
- NodeJS LTS 20+
- React Native 0.73+
- Expo SDK 50+
- Expo Go (Android/iOS)
- Python 3.10+
- Supabase (Auth + DB + Policies + Email Templates)

---

#  2. Banco de Dados

### Tabelas

## `profiles`
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | UUID | ID do usuário |
| full_name | text | Nome |
| role | text | ADMIN/EMPLOYEE |
| created_at | timestamp | Data |

## `epis`
| Campo | Tipo |
|------|------|
| id | UUID |
| name | text |
| size | text |
| qty | int |
| is_active | boolean |

## `requests`
| Campo | Tipo |
|------|------|
| id | UUID |
| employee_id | UUID |
| status | PENDING / APPROVED / REJECTED |
| reason | text |
| created_at | timestamp |
| is_hidden | boolean |

## `request_items`
| Campo | Tipo |
|------|------|
| id | UUID |
| request_id | UUID |
| epi_id | UUID |
| qty_requested | int |

---

#  3. Configuração de Acesso

Crie um arquivo `.env` no diretório `/frontend`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
```

---

#  4. Estrutura do Projeto

```
projetoMovel/
├── apresentacao/
├── backend/
│   └── password-reset/
│       ├── app.py
│       ├── requirements.txt
│       ├── vercel.json
│       ├── static/
│       └── templates/
├── documentacao/
├── frontend/
│   ├── app/
│   ├── src/
│   ├── assets/
│   ├── package.json
│   └── readme.md
└── video/
```

---

#  5. Instalação (Windows 11)

Instale o Chocolatey:

```powershell
Set-ExecutionPolicy AllSigned
Set-ExecutionPolicy Bypass -Scope Process -Force; `
[System.Net.ServicePointManager]::SecurityProtocol = `
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
```

Instale dependências:

```
choco install nodejs-lts -y
choco install openjdk17 -y
```

---

#  6. Executando o Projeto

No diretório `frontend/`:

```bash
npm install
npx expo start
```

---

#  7. Telas do Projeto

- Tela de Login  
- Tela de Criação de Usuário  
- Tela de Recuperação de Senha (Vercel)  
- Tela Inicial (do Colaborador)  
- Tela de Fazer Pedido  
- Tela “Meus Pedidos”  
- Tela Inicial (do Administrador)
- Tela do Catálogo de EPIs
- Tela de Cadastro de Novo EPI
- Tela de Alertas
- Tela de Entrada de EPIs
- Tela de Saída de EPIs
- Tela de Pedidos Pendentes
