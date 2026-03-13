# Prediction Journal — Guia para Claude Code

## O que é este projeto
Uma aplicação web para registar, acompanhar e melhorar previsões pessoais sobre o futuro.
Fase atual: **MVP — Personal Forecast Tracker**

Roadmap:
- Fase 1 (atual): Ferramenta individual — registar previsões pessoais ✅
- Fase 2: Compartilhamento — cards partilháveis no X/LinkedIn
- Fase 3: Leaderboard público
- Fase 4: Rede social / comunidade

---

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **DB**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth v4 (Email+senha + Google OAuth)
- **Fontes**: Syne (display) + DM Mono (mono)
- **Design system**: Dark theme, CSS variables em globals.css

---

## Setup inicial (fazer uma vez)

```bash
# 1. Instalar dependências
npm install

# 2. Copiar .env.example e preencher
cp .env.example .env

# 3. Preencher .env:
#    DATABASE_URL — URL do PostgreSQL local
#    NEXTAUTH_SECRET — gerar com: openssl rand -base64 32
#    GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET — Google Cloud Console
#      → https://console.cloud.google.com
#      → Criar projeto → OAuth 2.0 → Redirect URI: http://localhost:3000/api/auth/callback/google

# 4. Criar banco e gerar Prisma client
npx prisma db push
npx prisma generate

# 5. Iniciar
npm run dev
```

---

## Estrutura de ficheiros
```
app/
  page.tsx                    — Landing page (redireciona para /dashboard se autenticado)
  layout.tsx                  — Root layout com SessionProvider
  globals.css                 — Design system (CSS variables, classes utilitárias)
  auth/
    signin/page.tsx           — Login (email+senha + Google)
    signup/page.tsx           — Registo
  dashboard/
    layout.tsx                — Layout protegido com Navbar
    page.tsx                  — Dashboard principal (server component)
  api/
    auth/[...nextauth]/route.ts  — NextAuth handler
    auth/register/route.ts       — POST /api/auth/register
    predictions/route.ts         — GET + POST /api/predictions
    predictions/[id]/route.ts    — PATCH + DELETE /api/predictions/:id
    user/stats/route.ts          — GET /api/user/stats

components/
  layout/
    Providers.tsx             — SessionProvider wrapper
    Navbar.tsx                — Navbar com menu do utilizador
  dashboard/
    DashboardClient.tsx       — Client component principal do dashboard
    StatsBar.tsx              — Barra de estatísticas (total, pendentes, score)
  predictions/
    PredictionCard.tsx        — Card individual de previsão
    CreatePredictionModal.tsx — Modal para criar nova previsão

lib/
  prisma.ts                   — Singleton do Prisma client
  auth.ts                     — Configuração NextAuth
  utils.ts                    — Helpers: cn, formatDate, getProbabilityColor, CATEGORIES, calculateAccuracyScore

types/
  index.ts                    — Types TypeScript + extensão NextAuth Session

prisma/
  schema.prisma               — Schema: User, Account, Session, Prediction (+ enums Category, Resolution)
```

---

## CSS Variables (design system)
```css
--bg: #0a0a0f              /* fundo principal */
--bg-card: #111118         /* fundo dos cards */
--border: #1e1e2e          /* bordas normais */
--border-bright: #2a2a3e   /* bordas hover */
--text-primary: #e8e8f0    /* texto principal */
--text-secondary: #8888aa  /* texto secundário */
--text-muted: #555570      /* texto muted */
--accent: #7c6af7          /* roxo accent */
--accent-dim: #3d3580      /* roxo escuro */
--accent-glow: rgba(124,106,247,0.15)
--green: #34d399
--yellow: #fbbf24
--orange: #fb923c
--red: #f87171
```

Classes utilitárias prontas: `.card`, `.input-base`, `.btn-primary`, `.btn-ghost`, `.gradient-text`, `.font-display`, `.font-mono`, `.animate-fade-in`

---

## O que falta construir (próximas tarefas)

### Prioridade Alta
1. **Página de detalhes da previsão** `/dashboard/[id]`
   - Ver previsão completa com argumento e evidência
   - Histórico de alterações
   - Botão de resolver com confirmação

2. **Card partilhável** (OG image ou componente visual)
   - Quando o utilizador clica "Partilhar", gerar imagem ou card bonito
   - Texto pré-formatado para X e LinkedIn

3. **Perfil público** `/p/[username]`
   - Mostrar previsões públicas do utilizador
   - Mostrar Forecast Score
   - Já tem `shareToken` e `isPublic` no schema

4. **Página de estatísticas** `/dashboard/stats`
   - Gráfico de accuracy ao longo do tempo (recharts já instalado)
   - Breakdown por categoria
   - Histórico de resoluções

### Prioridade Média
5. **Editar previsão** — PATCH com mais campos
6. **Notificações de expiração** — previsões que expiram em breve
7. **Filtro por tags**
8. **Exportar dados** — CSV download

### Melhorias de UX
- Skeleton loading nos cards
- Toast notifications (react-hot-toast ou similar)
- Confirmar antes de apagar
- Mobile responsive melhorado

---

## Modelo de dados (Prisma)

### Prediction
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | cuid | Primary key |
| userId | String | FK para User |
| title | String | Texto da previsão |
| description | String? | Argumento/raciocínio |
| probability | Int | 1-99 |
| category | Category | Enum: TECHNOLOGY, ECONOMY, MARKETS... |
| expiresAt | DateTime | Quando a previsão expira |
| resolvedAt | DateTime? | Quando foi resolvida |
| resolution | Resolution? | CORRECT, INCORRECT, PARTIAL, CANCELLED |
| isPublic | Boolean | Default false |
| shareToken | String? | Token único para partilha |
| evidence | String? | Evidências/fontes |
| tags | String[] | Array de tags |

### Enums
```
Category: TECHNOLOGY | ECONOMY | MARKETS | STARTUPS | GEOPOLITICS | SCIENCE | SPORTS | CULTURE | OTHER
Resolution: CORRECT | INCORRECT | PARTIAL | CANCELLED
```

---

## Notas de implementação
- Todas as APIs usam `getServerSession(authOptions)` para autenticação
- Prisma usa `globalThis` pattern para evitar múltiplas instâncias em dev
- `calculateAccuracyScore` usa Brier-like scoring (não apenas % de acertos)
- Session JWT tem `id` e `username` do utilizador
- `CATEGORIES` em utils.ts tem emoji + label para cada categoria

---

## Comandos úteis
```bash
npm run dev          # Iniciar em modo desenvolvimento
npm run build        # Build de produção
npx prisma studio    # GUI para ver/editar o banco
npx prisma db push   # Sincronizar schema com DB
npx prisma generate  # Regenerar Prisma client
```
