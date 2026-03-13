# LANDING_PAGE_SPEC.md — Spec Técnico Completo

## Objectivo
Transformar a página `/` numa landing page pública que:
1. Mostra mercados em alta do Polymarket em tempo real (sem login)
2. Converte visitantes em utilizadores pelo instinto de "quero dar a minha opinião"
3. Bloqueia a acção de prever até criar conta — mas só nesse momento

---

## Comportamento por tipo de utilizador

| Utilizador | Comportamento |
|------------|---------------|
| Não autenticado | Ver landing page completa com mercados reais |
| Autenticado | Redirecionar para `/dashboard` |

---

## Estrutura da página (de cima para baixo)

### Secção 1 — Navbar
```
[🔮 Prediction Journal]                    [Entrar]  [Criar conta →]
```
- Logo à esquerda
- Dois botões à direita: "Entrar" (ghost) e "Criar conta →" (accent)
- Fundo transparente com blur ao fazer scroll

---

### Secção 2 — Hero
Ocupar 60-70% do viewport inicial. Sem scroll necessário para ver o essencial.

```
                    ┌─ badge animado ─┐
                    │ 🟢 Ao vivo · X previsões hoje │
                    └─────────────────┘

        Toda a gente palpita.
        Poucos têm coragem de registar.

   Regista as tuas previsões com probabilidade real.
   Compara com o mercado. Constrói reputação verificável.

              [🌍 Ver mercados em alta →]
         já tens conta? entrar
```

**Detalhes:**
- Título em duas linhas, fonte Syne bold, grande (60-72px desktop, 36px mobile)
- "registar" em destaque com gradient ou cor accent
- Badge animado com contador real de previsões (buscar de `/api/stats/public`)
- CTA principal leva directamente à secção de mercados (scroll suave)
- Link secundário "já tens conta? entrar" em texto pequeno abaixo

---

### Secção 3 — Mercados em Alta (CORE da landing)

**Header da secção:**
```
🔥 Mercados em Alta
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Trending] [Política] [Crypto] [Geopolítica] [Esportes] [Economia] [Tech]
```

**Tabs de categorias** — filtram os mercados mostrados. "Trending" mostra os top por volume global.

**Grid de mercados** — 2 colunas desktop, 1 coluna mobile, mostrar 10 mercados:

```
┌─────────────────────────────────────────┐
│  💻 TECNOLOGIA                    🔥 Alto volume  │
│                                         │
│  "OpenAI lança GPT-5 antes de Junho?"   │
│                                         │
│  ████████████████░░░░░░░  67%           │
│  Volume: $2.4M · Expira: 30 Jun 2026   │
│                                         │
│  A tua previsão: [slider bloqueado 🔒]  │
│                                         │
│         [Prever neste mercado]          │
└─────────────────────────────────────────┘
```

**Comportamento do slider nos cards:**
- Slider visível mas com ícone 🔒 e opacidade reduzida
- Ao tentar mover → nada acontece, mas o card pulsa levemente
- Ao clicar "Prever neste mercado" → abre modal de conversão (ver abaixo)

**Dados a mostrar em cada card:**
- Categoria com emoji
- Badge de volume ("🔥 Alto volume" se > $1M, "⚡ Em alta" se volume cresceu > 20% nas últimas 24h)
- Pergunta do mercado (máximo 2 linhas)
- Barra de probabilidade actual com percentagem
- Volume total e data de expiração
- Botão "Prever neste mercado"

---

### Modal de Conversão — o momento crítico

Abre quando visitante não autenticado clica "Prever neste mercado".

```
┌─────────────────────────────────────────────┐
│                                             │
│  🔮 Qual é a tua previsão?                  │
│                                             │
│  "OpenAI lança GPT-5 antes de Junho?"       │
│  Mercado actual: 67%                        │
│                                             │
│  ──────────────────────────────────────     │
│  Para registar a tua previsão               │
│  cria uma conta grátis.                     │
│  É gratuito e demora 30 segundos.           │
│  ──────────────────────────────────────     │
│                                             │
│  [G] Continuar com Google                  │
│                                             │
│       ── ou ──                              │
│                                             │
│  [        Criar conta com email        ]    │
│                                             │
│  Já tens conta? Entrar                      │
│                                             │
└─────────────────────────────────────────────┘
```

**Comportamento após criar conta / fazer login a partir deste modal:**
- Redirecionar para `/dashboard` com parâmetro `?market={slug}`
- O dashboard detecta o parâmetro e abre automaticamente o modal de criação de previsão com o mercado pré-seleccionado
- O utilizador completa a previsão que já queria fazer antes de criar conta

Isto é crítico — o utilizador não pode "perder" a intenção que tinha quando clicou em "Prever".

---

### Secção 4 — Como funciona (3 passos)

Simples, visual, sem texto excessivo.

```
①                    ②                    ③
🌍                   📊                   🔥
Escolhe um mercado   Define a tua         Acompanha, resolve
do Polymarket ou     probabilidade        e partilha os
cria a tua previsão  e o teu argumento    acertos
```

Adicionar abaixo de cada passo um detalhe pequeno em texto muted:
- ① *"Mercados sobre política, crypto, economia, esportes e mais"*
- ② *"De 1% a 99% — sem respostas de sim/não"*
- ③ *"Forecast Score verificado automaticamente pelo Polymarket"*

---

### Secção 5 — Prova social / Diferenciais

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  🔒          │  │  ⚡          │  │  🏆          │
│  Imutável    │  │  Verificado  │  │  Rankings    │
│              │  │              │  │              │
│ Sem edições. │  │ Polymarket   │  │ Compete por  │
│ Sem          │  │ resolve      │  │ categoria,   │
│ exclusões.   │  │ automatica-  │  │ cidade e     │
│ A reputação  │  │ mente. Sem   │  │ país. Score  │
│ é real.      │  │ batota       │  │ verificado   │
│              │  │ possível.    │  │ apenas.      │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

### Secção 6 — CTA Final

```
Qual é a tua primeira previsão?

        [🌍 Ver mercados em alta →]

   Grátis · Sem cartão · Sem crypto
```

---

### Footer minimal
```
Prediction Journal · 2026
Termos · Privacidade · Twitter/X
```

---

## API pública necessária

### GET /api/stats/public
Retorna estatísticas públicas para o badge animado no hero.
```typescript
// Resposta
{
  totalPredictions: number,  // total de previsões criadas
  totalUsers: number,        // total de utilizadores
  predictionsToday: number,  // previsões criadas hoje
  avgAccuracy: number        // média do scoreVerified de todos os utilizadores
}
```
Sem autenticação. Cachear por 5 minutos.

### GET /api/markets/hot
Retorna os mercados em alta do Polymarket para a landing page.
```typescript
// Parâmetros
?category=TECHNOLOGY&limit=10

// Resposta
{
  markets: [
    {
      slug: string,
      question: string,
      probability: number,      // 0-100
      volume: number,           // em USD
      volumeChange24h: number,  // percentagem de variação
      expiresAt: string,
      category: string,
      isHot: boolean,           // volume > $1M
      isTrending: boolean       // volumeChange24h > 20%
    }
  ]
}
```

Buscar directamente da API do Polymarket e cachear por 10 minutos:
```typescript
const res = await fetch(
  `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=10&order=volume&ascending=false`,
  { next: { revalidate: 600 } } // Next.js cache 10 min
);
```

Sem autenticação. Público.

---

## Redirecionamento após autenticação com mercado pendente

Em `/app/dashboard/page.tsx`, detectar parâmetro `market` na URL:

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage({
  searchParams
}: {
  searchParams: { market?: string }
}) {
  // Se vier ?market=slug, passar para o client component
  // O client component abre automaticamente o modal de criação
  // com o mercado pré-seleccionado
  return (
    <DashboardClient
      pendingMarketSlug={searchParams.market || null}
      // ... resto das props
    />
  )
}
```

Em `DashboardClient.tsx`:
```typescript
// Detectar mercado pendente ao montar
useEffect(() => {
  if (pendingMarketSlug) {
    // Buscar dados do mercado pelo slug
    // Abrir modal de criação com mercado pré-seleccionado
    // Limpar o parâmetro da URL sem reload: 
    window.history.replaceState({}, '', '/dashboard')
  }
}, [pendingMarketSlug])
```

---

## Ficheiros a criar / modificar

| Ficheiro | Acção |
|----------|-------|
| `app/page.tsx` | **Substituir** — nova landing page completa |
| `app/api/stats/public/route.ts` | **Criar** — estatísticas públicas |
| `app/api/markets/hot/route.ts` | **Criar** — mercados em alta do Polymarket |
| `components/landing/HeroSection.tsx` | **Criar** |
| `components/landing/HotMarketsGrid.tsx` | **Criar** — grid de mercados com tabs |
| `components/landing/MarketCard.tsx` | **Criar** — card individual de mercado |
| `components/landing/ConversionModal.tsx` | **Criar** — modal de conversão |
| `components/landing/HowItWorks.tsx` | **Criar** |
| `components/landing/Differentials.tsx` | **Criar** |
| `app/dashboard/page.tsx` | **Modificar** — detectar `?market=slug` |
| `components/dashboard/DashboardClient.tsx` | **Modificar** — aceitar `pendingMarketSlug` |

---

## Design da landing page

Seguir o design system existente (CSS variables em globals.css).

**Especificidades da landing:**
- Background com gradiente subtil no hero: radial gradient de `var(--accent-glow)` no centro
- Cards de mercado com hover state animado (elevar levemente)
- Slider bloqueado com cursor `not-allowed` e ícone de cadeado
- Modal de conversão com backdrop blur
- Animações de entrada com `animate-fade-in` escalonadas (stagger)
- Mobile first — o grid de mercados passa a 1 coluna em mobile

**Tipografia:**
- Hero title: Syne Bold, muito grande
- "registar" ou palavra-chave: gradient-text
- Corpo: tamanho normal, color text-secondary
- Badges: DM Mono

---

## Ordem de implementação

1. Criar `/api/stats/public` e `/api/markets/hot`
2. Criar `components/landing/MarketCard.tsx`
3. Criar `components/landing/HotMarketsGrid.tsx` com tabs
4. Criar `components/landing/ConversionModal.tsx`
5. Criar `components/landing/HeroSection.tsx`
6. Criar `components/landing/HowItWorks.tsx` e `Differentials.tsx`
7. Montar tudo em `app/page.tsx` — substituir redirect por landing completa
8. Modificar `app/dashboard/page.tsx` e `DashboardClient.tsx` para `pendingMarketSlug`
9. Testar fluxo completo: visitante → clica "Prever" → cria conta → dashboard com modal aberto

---

## Fluxo completo a testar

```
1. Visitante chega a /
2. Vê hero + mercados em alta sem login
3. Clica "Prever neste mercado" num card
4. Abre ConversionModal com o mercado em contexto
5. Clica "Continuar com Google" ou "Criar conta com email"
6. Redireciona para /dashboard?market={slug}
7. Dashboard detecta ?market={slug}
8. Abre automaticamente modal de criação com mercado pré-seleccionado
9. Utilizador define probabilidade e cria previsão
10. Recebe boas-vindas: +500 coins + badge "Primeiro Palpite"
11. Vê o dashboard com a primeira previsão criada
```
