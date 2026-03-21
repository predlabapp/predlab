# ORBS_TOKEN_SPEC.md — Token ORBS (Visão Futura)

## Status: PLANEJADO — não implementar agora
## Pré-requisito: 10k+ utilizadores activos com sistema de Orbs interno funcionando

---

## Visão geral

Os Orbs internos do PredLab evoluem para um token real on-chain.
Utilizadores que acumularam Orbs internos podem convertê-los 1:1 para ORBS token.
O token tem utilidade real dentro da plataforma — não é especulativo por design.

Enquadramento regulatório:
- SEC (EUA): Digital Tool / Utility Token — não é security (comunicado favorável Março 2026)
- Utilizador não paga nada para ganhar — não satisfaz Howey Test
- Empresa sediada fora do Brasil (jurisdição a definir — ex: Cayman, BVI, Singapura)

---

## Tokenomics

### Supply

```
Supply total (fixa): 1.000.000.000 ORBS (1 bilião)

Distribuição inicial:
────────────────────────────────────────────────
40%  400.000.000   Rewards Pool (ganhos por mérito)
20%  200.000.000   Equipa e fundadores (vesting 4 anos)
15%  150.000.000   Reserva da plataforma (treasury)
10%  100.000.000   Ecosystem / parcerias
10%  100.000.000   Liquidez inicial (DEX)
5%    50.000.000   Early adopters (conversão Orbs internos)
────────────────────────────────────────────────
100% 1.000.000.000
```

### Vesting da equipa
- Cliff de 12 meses (nenhum token liberado no 1º ano)
- Vesting linear de 36 meses após o cliff
- Protege contra dump imediato dos fundadores

---

## Mecânica de ganho — Rewards por Acurácia

### Princípio base
Não basta participar — tens de ser bom E divergir do mercado com convicção.
O sistema premia calibração real e previsões ousadas, não volume nem login.

### Definição de "correto"

A definição é baseada na direção da divergência face ao Polymarket, não apenas no resultado:

```
Se previste ACIMA do mercado → correto se o evento ACONTECER
Se previste ABAIXO do mercado → correto se o evento NÃO ACONTECER

Exemplos:
  Polymarket: 80% YES → tu: 95% YES (15pp acima)
    → Correto se o evento acontecer (apostaste que o mercado subestimava)

  Polymarket: 80% YES → tu: 60% YES (20pp abaixo)
    → Correto se o evento NÃO acontecer (apostaste que o mercado sobrestimava)
```

Esta definição elimina o gaming de "seguir mercados de alta probabilidade com ligeiro desconto".

### Tabela de rewards e penalizações

```
Tipo de previsão               Correto      Incorreto    EV bot (aleatório)
─────────────────────────────────────────────────────────────────────────────
Ousada  (divergência >20pp)    +10 ORBS     -3 ORBS      -0.4 ORBS ✅
Neutra  (divergência 5-20pp)   +3 ORBS      -1 ORBS      -0.2 ORBS ✅
Segura  (divergência <5pp)     +1 ORBS      -0.5 ORBS    -0.1 ORBS ✅
```

Bots têm expected value negativo em todos os tiers — o sistema é resistente a gaming aleatório.

### Reward proporcional à convicção

O reward base é multiplicado pela probabilidade declarada:

```
Reward final = reward_base × probabilidade_declarada

Exemplos (previsão ousada, base 10 ORBS):
  Dizes 85% → acontece → 10 × 0.85 = 8.5 ORBS
  Dizes 65% → acontece → 10 × 0.65 = 6.5 ORBS
  Dizes 99% → não acontece → -3 ORBS (penalização não é multiplicada)
```

Incentiva honestidade na probabilidade. Não adianta declarar sempre 99%.

### Multiplicador de nível

```
Nível 1-2: 1.0x
Nível 3-4: 1.2x
Nível 5-6: 1.5x
```

### Fallback para mercados sem Polymarket

```
Mercados Polymarket:  divergência calculada vs probabilidade do Polymarket
Mercados custom:      divergência calculada vs média das probabilidades
                      de todos os utilizadores no mesmo mercado
```

### Multiplicador por antecipação

Previsões feitas mais cedo valem mais — são genuinamente mais difíceis:

```
> 180 dias até resolução: ×1.5
90–180 dias:              ×1.25
30–90 dias:               ×1.0
< 30 dias:                ×0.5
```

### Elegibilidade para rewards

```
Para ser elegível para qualquer reward de previsão:
  - Conta com ≥ 30 dias
  - Mínimo 5 previsões resolvidas nos últimos 30 dias
  - Taxa de acerto ≥ 40% nas previsões resolvidas
    (% de acertos simples, não Brier Score — mais fácil de comunicar)
```

### Ganhos de streak (anti-bot)

Streak requer previsões reais com resultado — não apenas login:

```
Critério para contar 1 dia de streak:
  ✓ Fizeste ≥1 previsão nesse dia
  ✓ Tens ≥5 previsões resolvidas no total
  ✓ Taxa de acerto ≥40% nas previsões resolvidas

Se um dia falhar → streak volta a 0

Bónus de streak:
  Streak 7 dias consecutivos:   +25 ORBS
  Streak 30 dias consecutivos:  +100 ORBS
  Streak 100 dias consecutivos: +300 ORBS
```

Streak 100 dias com ≥40% acerto é genuinamente difícil — garante utilizadores reais e dedicados.

### Signup bonus

```
100 ORBS na criação de conta (único, não repetível)
```

### Removido (anti-bot)

```
❌ Login diário — fácil de farmar com bots, sem valor informativo
❌ Orbs por criar previsão (independente do resultado)
```

### Anti-gaming adicional

```
- Previsões com probabilidade entre 45-55% não são elegíveis para reward
  (muito próximo de 50/50 — sem convicção real)
- Máximo de 5 previsões por dia elegíveis para reward
- Previsões no mesmo mercado Polymarket contam apenas 1x por resolução
- Se detectado padrão suspeito (ex: copiar outros utilizadores),
  reward bloqueado por 30 dias
```

### Modo Discovery Yes/No (roadmap — 60-90 dias)

Feature secundária a implementar quando houver utilizadores suficientes:

```
- Mostra top mercados Polymarket com probabilidade actual
- Utilizador escolhe YES ou NO
- Rewards menores: máx 2 ORBS/dia neste modo
- Porta de entrada para utilizadores casuais
- Utilizadores evoluem para o modo Forecaster para rewards maiores
```

---

## Taxa nas transferências — Mecanismo de sustentabilidade

```
Taxa de transferência: 2% por transacção

Distribuição da taxa:
- 60% → Rewards Pool (alimenta futuros rewards)
- 30% → Treasury (operações da plataforma)
- 10% → Burn (deflação gradual do supply)
```

### Por que este modelo funciona

É um ciclo fechado:
1. Utilizadores ganham ORBS por mérito
2. Transferências entre utilizadores geram taxa
3. Taxa alimenta o pool de rewards
4. Mais rewards atraem mais utilizadores
5. Mais utilizadores → mais actividade → mais taxas

O burn gradual (10% das taxas) cria deflação natural ao longo do tempo —
supply efectivo diminui, o que beneficia os holders de longo prazo.

---

## Utilidade do token dentro da plataforma

O token tem utilidade real — não é apenas especulativo.

```
Uso                              Custo/Benefício
────────────────────────────────────────────────────
Badge "Oráculo Verificado"       500 ORBS
Tema premium da interface        1.000 ORBS
Frame de perfil raro             800 ORBS
Boost de visibilidade no ranking 200 ORBS / 7 dias
Acesso a analytics avançados     100 ORBS / mês
Criar bolão premium              50 ORBS
  (sem limite de membros)
Destaque na landing page         1.000 ORBS / semana
Token gates para grupos          definir por criador
```

### Token gating de grupos/bolões
Criadores de grupos podem exigir X ORBS para entrar.
Cria comunidades de qualidade — só entram utilizadores sérios.
O criador define o valor; a plataforma cobra 5% em ORBS sobre entradas.

---

## Claim — Orbs internos → ORBS token

### Modelo

Os Orbs internos continuam a existir e funcionando normalmente.
Quando o utilizador quer converter para token on-chain, faz um "claim" manual.
Não há conversão automática — é sempre uma acção intencional do utilizador.

### Regras de claim

```
Threshold mínimo:     200 ORBS (ajustável — baixo para não desanimar)
Taxa de claim:        5% fixa (sem tiers — taxa simples e previsível)
Taxa de conversão:    1 Orb interno = 1 ORBS token (antes da taxa)

Exemplo:
  Utilizador faz claim de 500 ORBS
  Taxa: 25 ORBS (5%)
  Recebe: 475 ORBS on-chain
  Distribuição da taxa:
    → 15 ORBS (60%) para Rewards Pool
    → 10 ORBS (40%) para Treasury

Frequência:           máximo 1 claim por semana por utilizador
  (semanal cria ritual de engagement sem ser restritivo)

Estimativa de ganho semanal:
  Utilizador casual (2 prev/dia, 50% acerto): ~50 ORBS/semana
    → claim de 200 ORBS em ~4 semanas ✅
  Utilizador ativo (5 prev/dia, 55% acerto):  ~100 ORBS/semana
    → claim de 200 ORBS em ~2 semanas ✅

Elegibilidade:
  - Conta com mais de 30 dias
  - Mínimo 5 previsões resolvidas
  - Telemóvel verificado (KYC básico anti-bot)
  - Wallet conectada (Privy embedded wallet, MetaMask ou WalletConnect)
```

### Orbs internos continuam válidos sempre

Utilizadores que não querem crypto nunca são forçados a nada:
- Orbs internos funcionam normalmente para badges, features, loja
- Claim é sempre opcional
- Não há penalização por não fazer claim
- Orbs internos não expiram

### Promoções de claim (futuro)

Taxa fixa de 5% como padrão. Promoções pontuais para eventos especiais:
- "Semana de lançamento — taxa 0% nos primeiros claims"
- "Copa do Mundo — taxa 2% durante o torneio"
Promoções criam urgência e recompensam utilizadores activos no momento certo.

### Early adopter advantage

Quem estiver na plataforma antes do token launch tem vantagem:
- Acumulou Orbs gratuitamente por mérito
- Converte 1:1 (menos a taxa de 5%)
- Primeiros a ter liquidez real no mercado

Esta é a narrativa para os early adopters — é genuinamente poderosa.

---

## Stake opcional — vantagens para holders

### Princípio

Stake é sempre voluntário. Ninguém é obrigado a fazer stake para usar a plataforma.
Quem faz stake escolhe bloquear tokens por um período em troca de vantagens reais.

### Vantagens do stake

```
Tier 1 — stake 5.000 ORBS:
  - Multiplicador de rewards: 1.5x
  - Taxa de claim reduzida: 3% (vs 5% padrão)
  - Badge exclusivo "Stakeholder"
  - Acesso a analytics avançados gratuito

Tier 2 — stake 25.000 ORBS:
  - Multiplicador de rewards: 2.0x
  - Taxa de claim reduzida: 1%
  - Badge "Oráculo Stakeholder"
  - Voto em decisões da plataforma (governança futura)
  - Destaque no ranking global

Tier 3 — stake 100.000 ORBS:
  - Multiplicador de rewards: 3.0x
  - Taxa de claim: 0%
  - Badge raro "Fundador Oráculo"
  - Acesso antecipado a novas features
  - Linha directa com a equipa
```

### Períodos de lock

```
30 dias  → sem bónus adicional de tempo
90 dias  → +10% nos rewards do período
180 dias → +25% nos rewards do período
365 dias → +50% nos rewards do período
```

### Distribuição dos rewards de stake

Tokens em stake geram rewards do Rewards Pool:
- APY base: 8% ao ano (ajustável conforme tamanho do pool)
- Pago semanalmente em ORBS on-chain
- Se pool ficar abaixo de 50M ORBS, APY reduz automaticamente

### O que acontece com os tokens em stake

Ficam bloqueados no smart contract — não podem ser transferidos nem gastos.
Após o período de lock, utilizador pode retirar ou renovar o stake.
Tokens em stake contam para o tier de vantagens mas não para o saldo livre.

---

## Infraestrutura técnica (quando implementar)

### Blockchain — Base (decisão definitiva)

**Base (L2 do Ethereum)** — escolha confirmada

Justificativa baseada em dados (Março 2026):
- TVL da Base: $2.9B e crescendo — Polygon caiu de $10B para $740M
- Endereços activos diários: Base ~900k e subindo — Polygon caiu de 1.3M para 550k
- Momentum claro de migração: projectos como Aavegotchi migraram de Polygon para Base com 93% dos votos
- Coinbase Wallet — a wallet mais fácil para utilizadores não-crypto (público do PredLab)
- Taxas ~$0.01 por transacção
- Herda segurança total do Ethereum via Optimistic Rollup
- Ecossistema crescente: Uniswap, Aerodrome e principais protocolos DeFi presentes
- Alinhamento estratégico: Coinbase tem incentivo real para continuar a crescer a Base
- Privy já gera embedded wallets na Base para todos os utilizadores ✅

### Smart contract

Usar OpenZeppelin como base (contratos auditados) + código custom mínimo.
O risco vem do código custom — manter simples reduz risco sem audit formal.

```solidity
// ORBS Token — ERC-20 com taxa de transferência
// Base: OpenZeppelin ERC20 (auditado)
// Custom: override _transfer para taxa de 2%
contract ORBSToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public transferFee = 200; // 2% em basis points

    address public rewardsPool;
    address public treasury;

    // Distribuição da taxa de transferência:
    // 60% rewardsPool, 30% treasury, 10% burn
    function _transfer(address from, address to, uint256 amount)
        internal override {
        uint256 fee = (amount * transferFee) / 10000;
        uint256 rewardShare = (fee * 60) / 100;
        uint256 treasuryShare = (fee * 30) / 100;
        uint256 burnShare = fee - rewardShare - treasuryShare;

        super._transfer(from, rewardsPool, rewardShare);
        super._transfer(from, treasury, treasuryShare);
        _burn(from, burnShare);
        super._transfer(from, to, amount - fee);
    }
}

// Claim Contract — converte Orbs internos para ORBS on-chain
contract ORBSClaim {
    ORBSToken public token;
    address public rewardsPool;
    address public treasury;
    uint256 public claimFee = 500;           // 5% em basis points
    uint256 public minClaimAmount = 200 * 10**18;  // 200 ORBS (ajustável)
    uint256 public claimCooldown = 7 days;   // 1x por semana

    mapping(address => uint256) public lastClaimTime;

    // Backend assina a mensagem confirmando saldo de Orbs internos
    // Utilizador submete a assinatura para fazer claim
    function claim(uint256 amount, bytes memory signature) external {
        require(amount >= minClaimAmount, "Below minimum");
        require(block.timestamp >= lastClaimTime[msg.sender] + claimCooldown,
            "Cooldown active");
        require(verifySignature(msg.sender, amount, signature), "Invalid sig");

        uint256 fee = (amount * claimFee) / 10000;
        uint256 rewardShare = (fee * 60) / 100;
        uint256 treasuryShare = fee - rewardShare;
        uint256 userAmount = amount - fee;

        token.transfer(rewardsPool, rewardShare);
        token.transfer(treasury, treasuryShare);
        token.transfer(msg.sender, userAmount);

        lastClaimTime[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, amount, userAmount, fee);
    }
}

// Staking Contract — stake opcional com lock periods
contract ORBSStaking {
    ORBSToken public token;
    address public rewardsPool;

    struct Stake {
        uint256 amount;
        uint256 lockEnd;
        uint256 lockDays;    // 30 | 90 | 180 | 365
        uint256 stakedAt;
    }

    mapping(address => Stake) public stakes;

    // Multiplicador de tempo: 30d=1.0x, 90d=1.1x, 180d=1.25x, 365d=1.5x
    function stake(uint256 amount, uint256 lockDays) external {
        require(lockDays == 30 || lockDays == 90 ||
                lockDays == 180 || lockDays == 365, "Invalid lock");
        token.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] = Stake(amount, block.timestamp + lockDays * 1 days,
            lockDays, block.timestamp);
        emit Staked(msg.sender, amount, lockDays);
    }

    function unstake() external {
        Stake memory s = stakes[msg.sender];
        require(block.timestamp >= s.lockEnd, "Still locked");
        delete stakes[msg.sender];
        token.transfer(msg.sender, s.amount);
        emit Unstaked(msg.sender, s.amount);
    }

    // APY base 8% — backend distribui rewards semanalmente
    function distributeRewards(address[] calldata stakers,
        uint256[] calldata amounts) external onlyOwner {
        for (uint i = 0; i < stakers.length; i++) {
            token.transferFrom(rewardsPool, stakers[i], amounts[i]);
        }
    }
}
```

### Wallet integration no app

```typescript
// Privy já gera embedded wallets na Base para todos os utilizadores no signup
// Utilizadores têm wallet automaticamente — sem fricção extra

// Para claim on-chain:
// - Embedded wallet Privy (já existe) — zero fricção
// - MetaMask (browser extension) — utilizadores crypto avançados
// - WalletConnect (mobile) — qualquer wallet mobile
```

---

## Listing em exchanges

### Fase 1 — DEX (Descentralizado)
Aerodrome ou Uniswap v3 na Base.
Criar pool ORBS/USDC com liquidez inicial do treasury.
Sem KYC necessário, acessível globalmente.
Aerodrome é o principal DEX nativo da Base — melhor liquidez e visibilidade dentro do ecossistema.

### Fase 2 — CEX pequenas (3-6 meses depois)
Gate.io, MEXC, ou similar.
Requer application formal + volume mínimo comprovado.

### Fase 3 — CEX tier 1 (12+ meses depois)
Coinbase, Binance — apenas com volume e comunidade estabelecidos.

---

## Jurisdição e estrutura legal

### Estrutura recomendada

```
PredLab Labs Ltd (Cayman Islands)
├── Emite o token ORBS
├── Controla o treasury
└── Detentor dos IP

PredLab Brasil Ltda (Brasil)
├── Opera o produto
├── Relação com utilizadores brasileiros
└── Paga royalties/licença à entity Cayman
```

### Por que Cayman Islands
- Sem imposto sobre ganhos de capital
- Jurisdição estabelecida para crypto
- Fácil de abrir com advogados especializados
- Utilizada por Binance, FTX (rip), e a maioria dos projetos DeFi

### Alternativas
- British Virgin Islands (BVI) — similar às Cayman, mais barato
- Singapura — mais caro mas mais reputação institucional
- Suíça (Zug) — crypto-friendly, boa reputação, caro

---

## KPIs para lançar o token

Não lançar antes de atingir estes números:

```
Utilizadores activos mensais:  ≥ 10.000
Previsões criadas total:       ≥ 50.000
Retenção D30:                  ≥ 30%
Orbs internos em circulação:   ≥ 5.000.000
Streak médio:                  ≥ 5 dias
```

---

## Roadmap para o token

```
2026 Q1-Q2: Sistema de Orbs interno — já implementado ✅
2026 Q2:    Mecânica de rewards por acurácia implementada
2026 Q2:    Testnet Base Sepolia — contrato ORBS em teste
2026 Q3:    Atingir KPIs acima
2026 Q4:    Whitepaper + estrutura legal Cayman
2027 Q1:    Smart contract auditado + testnet final
2027 Q2:    Token launch + DEX listing
2027 Q3:    Conversão Orbs → ORBS para early adopters
2027 Q4:    CEX applications
```

---

## Comunicação com utilizadores (antes do launch)

### O que dizer agora (sem prometer nada)

Na UI do app, junto ao saldo de Orbs:

```
🔮 1.240 Orbs

Os teus Orbs são a moeda do PredLab.
Ganha-os fazendo boas previsões.
Usa-os para desbloquear badges e features.

Estamos a explorar formas de trazer ainda
mais valor aos teus Orbs no futuro. 👀
```

Nunca prometer conversão para token antes de ser certo —
isso cria expectativa de lucro que pode enquadrar como security.

---

## Notas importantes

1. **Não prometer valorização** — o token tem utilidade, não é investimento
2. **Não fazer ICO/presale** — distribuição apenas por mérito e liquidez inicial
3. **OpenZeppelin como base** — contratos base são auditados; manter código custom mínimo reduz risco
4. **Audit formal** — contratar firma antes do launch mainnet (ex: OpenZeppelin, Certik); buscar opções mais baratas
5. **Legal opinion** — obter legal opinion escrita de advogado crypto antes de qualquer comunicação pública sobre o token
6. **Não mencionar "retorno"** — comunicar sempre como "utilidade" e "recompensa por participação"
7. **Brasil** — utilizadores brasileiros podem receber tokens mas a empresa não pode ser brasileira para evitar regulação CVM
