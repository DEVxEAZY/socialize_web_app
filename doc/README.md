# Socialize MVP - API Backend

REST API para a plataforma social de eventos **Socialize**. Permite registro de usuarios, criacao e descoberta de eventos, participacao, curtidas e favoritos.

**Stack:** Node.js, Express, SQLite (better-sqlite3), JWT, bcryptjs, Nodemailer

**Producao:** `https://socializeserverbackend-production.up.railway.app`

---

## Sumario

- [Setup](#setup)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Autenticacao](#autenticacao)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Categorias](#categorias)
  - [Usuario / Perfil](#usuario--perfil)
  - [Eventos](#eventos)
  - [Interacoes com Eventos](#interacoes-com-eventos)
  - [Chat](#chat)
- [Modelos de Dados](#modelos-de-dados)
- [Erros](#erros)
- [Arquitetura](#arquitetura)

---

## Setup

```bash
# Instalar dependencias
npm install

# Copiar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Popular banco com dados de desenvolvimento
npm run db:seed

# Iniciar em desenvolvimento (com hot reload)
npm run dev

# Iniciar em producao
npm start
```

### Scripts

| Comando | Descricao |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run start:local` | Inicia carregando `.env` |
| `npm run dev` | Desenvolvimento com `--watch` e `.env` |
| `npm run db:seed` | Popula categorias, usuario demo e evento de exemplo |

---

## Variaveis de Ambiente

| Variavel | Obrigatoria | Default | Descricao |
|---|---|---|---|
| `JWT_SECRET` | Sim | - | Chave secreta para assinar tokens JWT |
| `PORT` | Nao | `3000` | Porta do servidor |
| `NODE_ENV` | Nao | `production` | `development`, `production` ou `test` |
| `CORS_ORIGIN` | Sim (prod) | - | Origens permitidas, separadas por virgula |
| `DATABASE_PATH` | Nao | `./data/socialize.sqlite` | Caminho do banco SQLite |
| `SMTP_HOST` | Nao | `smtp.hostinger.com` | Host SMTP |
| `SMTP_PORT` | Nao | `465` | Porta SMTP |
| `SMTP_USER` | Sim (prod) | - | Usuario SMTP |
| `SMTP_PASSWORD` | Sim (prod) | - | Senha SMTP |
| `SMTP_FROM` | Sim (prod) | - | Email remetente |
| `APP_URL` | Nao | - | URL base da aplicacao |
| `ALLOW_DEV_USER_HEADERS` | Nao | `true` (dev) | Permite header `x-user-id` |
| `ALLOW_DEMO_USER` | Nao | `true` (dev) | Permite fallback para usuario demo |
| `DEMO_USER_EMAIL` | Nao | `demo@socialize.local` | Email do usuario demo |
| `EXPOSE_DB_HEALTH` | Nao | `false` | Expoe endpoint `/health/db` |

---

## Autenticacao

A API usa **JWT Bearer tokens**. Apos registro ou login, o token e retornado no campo `token` da resposta.

```
Authorization: Bearer <token>
```

- Tokens expiram em **7 dias**
- Endpoints marcados com "Auth: Sim" exigem o header `Authorization`
- Token invalido ou expirado retorna `401`
- Ausencia de autenticacao em producao retorna `401`

### Respostas de erro da autenticacao

| Status | Mensagem | Quando |
|---|---|---|
| 401 | `Token invalido ou expirado` | JWT expirado, malformado ou assinatura invalida |
| 401 | `Autenticacao obrigatoria` | Nenhum token fornecido (producao) |
| 400 | `Cabecalho x-user-id invalido` | Header `x-user-id` com valor nao numerico (dev) |
| 503 | `Usuario demo nao encontrado. Execute npm run db:seed` | Demo user nao existe no banco (dev) |

> O frontend deve interceptar respostas `401` globalmente para redirecionar ao login ou limpar o token armazenado.

### Metodos de autenticacao (ordem de prioridade)

| # | Metodo | Ambiente | Descricao |
|---|---|---|---|
| 1 | `Authorization: Bearer <JWT>` | Todos | Autenticacao padrao via token |
| 2 | `x-user-id: <id>` | Dev/Test | Header direto com ID do usuario |
| 3 | Usuario demo (fallback) | Dev/Test | Usa `DEMO_USER_EMAIL` automaticamente |

> Em producao (`NODE_ENV=production`), apenas o metodo 1 (Bearer token) esta disponivel.

---

## Endpoints

**Base URL:** `https://socializeserverbackend-production.up.railway.app`

Todos os endpoints retornam JSON. Requests com body devem usar `Content-Type: application/json`.

---

### Health

#### `GET /`

Informacoes basicas da API.

**Auth:** Nao

**Resposta `200`:**
```json
{
  "message": "API socialize MVP",
  "version": "0.1.0"
}
```

---

#### `GET /health`

Health check do servico.

**Auth:** Nao

**Resposta `200`:**
```json
{
  "ok": true,
  "service": "socialize-mvp"
}
```

---

#### `GET /health/db`

Diagnostico do banco de dados (migrations e tabelas).

**Auth:** Nao  
**Disponibilidade:** Apenas quando `EXPOSE_DB_HEALTH=true` ou `NODE_ENV != production`

**Resposta `200`:**
```json
{
  "ok": true,
  "migrations": [
    { "version": "001", "applied_at": "2026-04-03T..." },
    { "version": "002", "applied_at": "2026-04-03T..." },
    { "version": "003", "applied_at": "2026-04-03T..." }
  ],
  "tables": ["categories", "conversation_members", "conversations", "direct_conversation_map", "event_favorites", "event_likes", "event_participations", "events", "messages", "password_resets", "schema_migrations", "user_interests", "users"]
}
```

---

### Auth

#### `POST /api/auth/register`

Cria uma nova conta de usuario.

**Auth:** Nao

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "minhasenha123",
  "displayName": "Nome do Usuario"
}
```

| Campo | Tipo | Obrigatorio | Validacao |
|---|---|---|---|
| `email` | string | Sim | Formato de email valido, unico |
| `password` | string | Sim | Minimo 8 caracteres |
| `displayName` | string | Sim | - |

**Resposta `201`:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@email.com",
    "displayName": "Nome do Usuario"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

> **Nota:** O objeto `user` retornado no register e login e **resumido** (apenas `id`, `email`, `displayName`). Para obter o perfil completo (com `avatarUrl`, `bio`, `locationLabel`, etc.), use `GET /api/me` apos autenticar.

**Erros:**
| Status | Mensagem |
|---|---|
| 400 | `email e obrigatorio` |
| 400 | `password e obrigatorio` |
| 400 | `displayName e obrigatorio` |
| 400 | `Formato de email invalido` |
| 400 | `Senha deve ter no minimo 8 caracteres` |
| 409 | `Email ja cadastrado` |

---

#### `POST /api/auth/login`

Autentica um usuario existente.

**Auth:** Nao

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "minhasenha123"
}
```

**Resposta `200`:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@email.com",
    "displayName": "Nome do Usuario"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Erros:**
| Status | Mensagem |
|---|---|
| 400 | `email e password sao obrigatorios` |
| 401 | `Credenciais invalidas` |

---

#### `POST /api/auth/forgot-password`

Solicita codigo de redefinicao de senha (enviado por email).

**Auth:** Nao

**Body:**
```json
{
  "email": "usuario@email.com"
}
```

**Resposta `200`:**
```json
{
  "message": "Se o email estiver cadastrado, enviaremos um codigo de redefinicao."
}
```

> A resposta e sempre a mesma, independente de o email existir ou nao (seguranca).

O codigo enviado por email e um numero de 6 digitos, valido por **15 minutos**.

---

#### `POST /api/auth/reset-password`

Redefine a senha usando o codigo recebido por email.

**Auth:** Nao

**Body:**
```json
{
  "token": "123456",
  "newPassword": "novasenha123"
}
```

| Campo | Tipo | Obrigatorio | Validacao |
|---|---|---|---|
| `token` | string | Sim | Codigo de 6 digitos |
| `newPassword` | string | Sim | Minimo 8 caracteres |

**Resposta `200`:**
```json
{
  "message": "Senha redefinida com sucesso."
}
```

**Erros:**
| Status | Mensagem |
|---|---|
| 400 | `token e obrigatorio` |
| 400 | `newPassword e obrigatorio` |
| 400 | `Senha deve ter no minimo 8 caracteres` |
| 400 | `Token invalido ou expirado` |

---

### Categorias

#### `GET /api/categories`

Lista todas as categorias disponiveis.

**Auth:** Nao

**Resposta `200`:**
```json
{
  "categories": [
    {
      "id": 1,
      "slug": "esporte",
      "name": "Esporte",
      "isEventCategory": true,
      "isInterestCategory": true
    }
  ]
}
```

**Categorias do seed:**

| ID | Slug | Nome |
|---|---|---|
| 1 | `esporte` | Esporte |
| 2 | `cultura` | Cultura |
| 3 | `musica` | Musica |
| 4 | `trilha` | Trilha |
| 5 | `yoga` | Yoga |

---

### Usuario / Perfil

#### `GET /api/me`

Retorna dados do usuario autenticado.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@email.com",
    "displayName": "Nome do Usuario",
    "avatarUrl": null,
    "locationLabel": null,
    "bio": null,
    "joinedAt": "2026-04-03T04:28:10.551Z",
    "createdAt": "2026-04-03T04:28:10.551Z",
    "updatedAt": "2026-04-03T04:28:10.551Z"
  }
}
```

---

#### `GET /api/profile/me`

Retorna perfil completo com interesses e estatisticas.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@email.com",
    "displayName": "Nome do Usuario",
    "avatarUrl": null,
    "locationLabel": null,
    "bio": null,
    "joinedAt": "2026-04-03T04:28:10.551Z",
    "createdAt": "2026-04-03T04:28:10.551Z",
    "updatedAt": "2026-04-03T04:28:10.551Z"
  },
  "interests": [
    {
      "id": 1,
      "slug": "esporte",
      "name": "Esporte",
      "isEventCategory": true,
      "isInterestCategory": true
    }
  ],
  "stats": {
    "friendsCount": 0,
    "createdCount": 2,
    "participatedCount": 1,
    "savedCount": 3,
    "likedCount": 5
  }
}
```

---

#### `GET /api/profile/me/events`

Lista eventos do usuario autenticado filtrados por tab.

**Auth:** Sim

**Query params:**

| Param | Tipo | Default | Valores |
|---|---|---|---|
| `tab` | string | `created` | `created`, `participated`, `saved` |

**Resposta `200`:**
```json
{
  "tab": "created",
  "events": [
    {
      "id": 1,
      "creatorId": 1,
      "categoryId": 1,
      "title": "Treino em grupo",
      "description": "Descricao do evento",
      "startsAt": "2026-04-10T18:00:00.000Z",
      "endsAt": null,
      "timezone": null,
      "locationText": "Parque central",
      "locationLat": null,
      "locationLng": null,
      "status": "published",
      "visibility": "public",
      "createdAt": "2026-04-03T04:28:10.551Z",
      "updatedAt": "2026-04-03T04:28:10.551Z"
    }
  ]
}
```

---

### Eventos

#### `GET /api/events`

Lista eventos publicados. No modo `recommended`, filtra por interesses do usuario.

**Auth:** Sim

**Query params:**

| Param | Tipo | Default | Valores |
|---|---|---|---|
| `mode` | string | `recommended` | `recommended`, `all` |
| `limit` | number | `50` | `1` a `100` |

**Resposta `200`:**
```json
{
  "mode": "recommended",
  "events": [
    {
      "id": 1,
      "creatorId": 1,
      "categoryId": 1,
      "title": "Treino em grupo",
      "description": "Descricao do evento",
      "startsAt": "2026-04-10T18:00:00.000Z",
      "endsAt": null,
      "timezone": null,
      "locationText": "Parque central",
      "locationLat": null,
      "locationLng": null,
      "status": "published",
      "visibility": "public",
      "createdAt": "2026-04-03T04:28:10.551Z",
      "updatedAt": "2026-04-03T04:28:10.551Z"
    }
  ]
}
```

---

#### `POST /api/events`

Cria um novo evento.

**Auth:** Sim

**Body:**
```json
{
  "categoryId": 1,
  "title": "Treino em grupo",
  "startsAt": "2026-04-10T18:00:00.000Z",
  "endsAt": "2026-04-10T20:00:00.000Z",
  "timezone": "America/Sao_Paulo",
  "locationText": "Parque central",
  "description": "Descricao do evento",
  "visibility": "public"
}
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `categoryId` | number | Sim | ID de uma categoria com `isEventCategory = true` |
| `title` | string | Sim | Titulo do evento |
| `startsAt` | string | Sim | Data/hora de inicio (ISO 8601) |
| `endsAt` | string | Nao | Data/hora de termino (ISO 8601) |
| `timezone` | string | Nao | Timezone (ex: `America/Sao_Paulo`) |
| `locationText` | string | Nao | Local do evento em texto |
| `description` | string | Nao | Descricao do evento |
| `visibility` | string | Nao | `public` (default), `friends` ou `private` |

**Resposta `201`:**
```json
{
  "event": {
    "id": 1,
    "creatorId": 1,
    "categoryId": 1,
    "title": "Treino em grupo",
    "description": "Descricao do evento",
    "startsAt": "2026-04-10T18:00:00.000Z",
    "endsAt": "2026-04-10T20:00:00.000Z",
    "timezone": "America/Sao_Paulo",
    "locationText": "Parque central",
    "locationLat": null,
    "locationLng": null,
    "status": "published",
    "visibility": "public",
    "createdAt": "2026-04-03T...",
    "updatedAt": "2026-04-03T..."
  }
}
```

**Erros:**
| Status | Mensagem |
|---|---|
| 400 | `categoryId invalido` |
| 400 | `title e obrigatorio` |
| 400 | `startsAt e obrigatorio (ISO 8601)` |
| 400 | `Categoria nao pode ser usada em eventos` |
| 404 | `Categoria nao encontrada` |

---

### Interacoes com Eventos

#### `POST /api/events/:id/participate`

Registra o usuario como participante do evento.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "eventId": 1,
  "status": "registered"
}
```

**Erros:**
| Status | Mensagem |
|---|---|
| 400 | `id do evento invalido` |
| 400 | `Evento nao esta aberto para participacao` |
| 404 | `Evento nao encontrado` |

---

#### `POST /api/events/:id/favorite`

Adiciona evento aos favoritos/salvos.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "eventId": 1,
  "saved": true
}
```

---

#### `DELETE /api/events/:id/favorite`

Remove evento dos favoritos/salvos.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "eventId": 1,
  "saved": false
}
```

---

#### `POST /api/events/:id/like`

Curte um evento.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "eventId": 1,
  "liked": true
}
```

---

#### `DELETE /api/events/:id/like`

Remove curtida de um evento.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "eventId": 1,
  "liked": false
}
```

---

> **Erros comuns em todas as interacoes:**
>
> | Status | Mensagem |
> |---|---|
> | 400 | `id do evento invalido` |
> | 404 | `Evento nao encontrado` |

---

### Chat

#### `GET /api/chat/conversations`

Lista conversas do usuario autenticado.

**Auth:** Sim

**Query params:**

| Param | Tipo | Default | Valores |
|---|---|---|---|
| `type` | string | `all` | `all`, `direct`, `group` |
| `limit` | number | `50` | `1` a `100` |

**Resposta `200`:**
```json
{
  "type": "all",
  "conversations": [
    {
      "id": 1,
      "type": "direct",
      "title": "Maria",
      "createdAt": "2026-04-03T04:28:10.551Z",
      "updatedAt": "2026-04-03T04:30:10.551Z",
      "unreadCount": 1,
      "memberCount": 2,
      "lastMessage": {
        "id": 10,
        "body": "Oi, tudo bem?",
        "createdAt": "2026-04-03T04:30:10.551Z",
        "senderId": 2
      },
      "members": [
        {
          "role": "member",
          "joinedAt": "2026-04-03T04:28:10.551Z",
          "lastReadAt": "2026-04-03T04:29:00.000Z",
          "user": {
            "id": 1,
            "displayName": "Joao",
            "avatarUrl": null,
            "locationLabel": null
          }
        }
      ]
    }
  ]
}
```

---

#### `POST /api/chat/conversations/direct`

Cria ou reutiliza uma conversa direta entre o usuario autenticado e outro usuario.

**Auth:** Sim

**Body:**
```json
{
  "userId": 2
}
```

**Resposta `201`:**
```json
{
  "conversation": {
    "id": 1,
    "type": "direct",
    "title": "Maria",
    "createdAt": "2026-04-03T04:28:10.551Z",
    "updatedAt": "2026-04-03T04:28:10.551Z",
    "unreadCount": 0,
    "memberCount": 2,
    "lastMessage": null,
    "members": []
  }
}
```

---

#### `POST /api/chat/conversations/group`

Cria uma conversa em grupo.

**Auth:** Sim

**Body:**
```json
{
  "title": "Trilha de domingo",
  "memberIds": [2, 3]
}
```

**Resposta `201`:**
```json
{
  "conversation": {
    "id": 2,
    "type": "group",
    "title": "Trilha de domingo",
    "createdAt": "2026-04-03T04:28:10.551Z",
    "updatedAt": "2026-04-03T04:28:10.551Z",
    "unreadCount": 0,
    "memberCount": 3,
    "lastMessage": null,
    "members": []
  }
}
```

---

#### `GET /api/chat/conversations/:id/messages`

Lista mensagens da conversa.

**Auth:** Sim

**Query params:**

| Param | Tipo | Default | Valores |
|---|---|---|---|
| `limit` | number | `50` | `1` a `100` |
| `beforeId` | number | - | ID da mensagem para paginacao retroativa |

**Resposta `200`:**
```json
{
  "conversation": {
    "id": 1,
    "type": "direct",
    "title": "Maria",
    "createdAt": "2026-04-03T04:28:10.551Z",
    "updatedAt": "2026-04-03T04:30:10.551Z",
    "unreadCount": 1,
    "memberCount": 2,
    "lastMessage": {
      "id": 10,
      "body": "Oi, tudo bem?",
      "createdAt": "2026-04-03T04:30:10.551Z",
      "senderId": 2
    },
    "members": []
  },
  "messages": [
    {
      "id": 9,
      "conversationId": 1,
      "senderId": 1,
      "body": "Oi!",
      "createdAt": "2026-04-03T04:29:10.551Z",
      "sender": {
        "id": 1,
        "displayName": "Joao",
        "avatarUrl": null,
        "locationLabel": null
      }
    }
  ]
}
```

---

#### `POST /api/chat/conversations/:id/messages`

Envia uma nova mensagem na conversa.

**Auth:** Sim

**Body:**
```json
{
  "body": "Oi! Bora combinar?"
}
```

**Resposta `201`:**
```json
{
  "message": {
    "id": 11,
    "conversationId": 1,
    "senderId": 1,
    "body": "Oi! Bora combinar?",
    "createdAt": "2026-04-03T04:31:10.551Z",
    "sender": {
      "id": 1,
      "displayName": "Joao",
      "avatarUrl": null,
      "locationLabel": null
    }
  }
}
```

---

#### `POST /api/chat/conversations/:id/read`

Marca a conversa como lida para o usuario autenticado.

**Auth:** Sim

**Resposta `200`:**
```json
{
  "conversationId": 1,
  "readAt": "2026-04-03T04:31:10.551Z"
}
```

---

## Modelos de Dados

### User

```json
{
  "id": 1,
  "email": "usuario@email.com",
  "displayName": "Nome do Usuario",
  "avatarUrl": "https://...",
  "locationLabel": "Sao Paulo, SP",
  "bio": "Sobre mim...",
  "joinedAt": "2026-04-03T04:28:10.551Z",
  "createdAt": "2026-04-03T04:28:10.551Z",
  "updatedAt": "2026-04-03T04:28:10.551Z"
}
```

### Category

```json
{
  "id": 1,
  "slug": "esporte",
  "name": "Esporte",
  "isEventCategory": true,
  "isInterestCategory": true
}
```

### Event

```json
{
  "id": 1,
  "creatorId": 1,
  "categoryId": 1,
  "title": "Treino em grupo",
  "description": "Descricao do evento",
  "startsAt": "2026-04-03T18:00:00.000Z",
  "endsAt": "2026-04-03T20:00:00.000Z",
  "timezone": "America/Sao_Paulo",
  "locationText": "Parque central",
  "locationLat": -23.5505,
  "locationLng": -46.6333,
  "status": "published",
  "visibility": "public",
  "createdAt": "2026-04-03T04:28:10.551Z",
  "updatedAt": "2026-04-03T04:28:10.551Z"
}
```

**Status do evento:** `draft`, `published`, `cancelled`, `completed`

**Visibilidade:** `public`, `friends`, `private`

**Status de participacao:** `registered`, `waitlist`, `cancelled`, `attended`

### Conversation

```json
{
  "id": 1,
  "type": "direct",
  "title": "Maria",
  "createdAt": "2026-04-03T04:28:10.551Z",
  "updatedAt": "2026-04-03T04:30:10.551Z",
  "unreadCount": 1,
  "memberCount": 2,
  "lastMessage": {
    "id": 10,
    "body": "Oi, tudo bem?",
    "createdAt": "2026-04-03T04:30:10.551Z",
    "senderId": 2
  },
  "members": [
    {
      "role": "member",
      "joinedAt": "2026-04-03T04:28:10.551Z",
      "lastReadAt": "2026-04-03T04:29:00.000Z",
      "user": {
        "id": 2,
        "displayName": "Maria",
        "avatarUrl": null,
        "locationLabel": null
      }
    }
  ]
}
```

### Message

```json
{
  "id": 11,
  "conversationId": 1,
  "senderId": 1,
  "body": "Oi! Bora combinar?",
  "createdAt": "2026-04-03T04:31:10.551Z",
  "sender": {
    "id": 1,
    "displayName": "Joao",
    "avatarUrl": null,
    "locationLabel": null
  }
}
```

---

## Erros

Todos os erros seguem o formato:

```json
{
  "error": "Mensagem descritiva do erro"
}
```

### Codigos HTTP

| Codigo | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Erro de validacao / request invalido |
| 401 | Nao autenticado / token invalido ou expirado |
| 403 | Origin bloqueada pelo CORS |
| 404 | Recurso nao encontrado |
| 409 | Conflito (ex: email duplicado) |
| 500 | Erro interno do servidor |
| 503 | Servico indisponivel (ex: demo user nao encontrado em dev) |

### Erro generico

Qualquer erro inesperado no servidor retorna:

```json
// Status 500
{ "error": "Erro interno" }
```

### Erro de CORS

Requests de origens nao permitidas retornam:

```json
// Status 403
{ "error": "Origin not allowed" }
```

---

## Arquitetura

O projeto segue **Clean Architecture** com separacao clara de responsabilidades:

```
src/
  application/         # Casos de uso e regras de negocio
    createAuthUseCases.js
    createAppUseCases.js
    errors.js
  config/              # Configuracao de ambiente
    env.js
  domain/              # Entidades e interfaces de repositorio
    entities/
    repositories/
  infrastructure/      # Implementacoes concretas
    database/          # SQLite: conexao, migrations, seed
    repositories/      # Repositorios SQLite
    services/          # Email service (Nodemailer)
    container.js       # Container de injecao de dependencia
  presentation/        # Camada HTTP
    http/
      middleware/      # Autenticacao (resolveUser)
      routes/          # Definicao de rotas
      serializers.js   # Serializacao de respostas
  server.js            # Entry point Express
```

### Banco de Dados

SQLite com migrations versionadas em `src/infrastructure/database/migrations/`. As migrations rodam automaticamente ao iniciar o servidor.

### CORS

Em producao, `CORS_ORIGIN` e obrigatorio. Aceita multiplas origens separadas por virgula:

```
CORS_ORIGIN=https://meuapp.com,https://admin.meuapp.com
```
