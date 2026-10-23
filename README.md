# Sentinela — Frontend

Painel web de monitoramento de servidores Linux (CPU, memória, disco, rede, serviços, alertas e incidentes).
Aplicação React independente que consome a API REST em Go (contrato: [`frontend-api.md`](./frontend-api.md), OpenAPI v0.6.0).

## Stack

React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS 4 · componentes no padrão shadcn/ui (Radix + cva) · Lucide ·
React Router 7 · TanStack Query 5 · Recharts 3 · React Hook Form + Zod · Axios · Vitest + Testing Library · ESLint.

## Comandos

Requer Node 20+ (testado com Node 24 / npm 11).

```bash
npm install
cp .env.example .env.local   # ajuste se necessário
npm run dev                  # http://localhost:5173
npm run lint
npm test                     # vitest run
npm run build                # tsc -b && vite build  → dist/
```

## Como o frontend fala com a API

A autenticação usa **cookie de sessão `HttpOnly` + `SameSite=Lax`**, então o frontend precisa estar na **mesma origem** da API:

- **Desenvolvimento:** o Vite faz proxy de `/api`, `/healthz` e `/readyz` para `VITE_DEV_PROXY_TARGET`
  (padrão `https://162.35.24.245`, certificado autoassinado → `secure: false`). O código usa sempre caminhos relativos
  (`VITE_API_BASE_URL=/api/v1`). Se a API responder `ORIGIN_NOT_ALLOWED`, adicione
  `CORS_ALLOWED_ORIGINS=http://localhost:5173` no `.env` da API e reinicie.
- **Produção:** sirva `dist/` pelo mesmo Nginx da API (ex.: em `/`), mantendo a API em `/api/`.
  Para SPA, use `try_files $uri /index.html;`.
- O `csrf_token` fica **só em memória** e é enviado em `X-CSRF-Token` em todo POST/PATCH/DELETE.
  Ao recarregar, a sessão é restaurada por `GET /auth/me`. Um `401` em qualquer chamada encerra a sessão local.
- **Tempo real:** `EventSource` em `GET /api/v1/events` (com reconexão). Cada evento invalida o cache do TanStack Query;
  o dado em si sempre vem da API REST. O polling (configurável em Configurações) continua como rede de segurança e
  pausa com a aba oculta.

## Estrutura

```
src/
  app/            router, providers, QueryClient
  components/
    layout/       AppLayout, Sidebar (recolhível + gaveta mobile), Header, indicador de conexão
    ui/           primitivos shadcn-style (button, card, dialog, table, tabs, …)
    charts/       TimeSeriesChart (Recharts) e ChartCard (loading/erro/vazio)
    data-display/ badges de estado, StatCard, Pagination, ConfirmDialog, estados de lista
  features/
    auth/ dashboard/ servers/ metrics/ services/ alerts/ incidents/ settings/ realtime/
      services/   chamadas HTTP por domínio (…Service.ts)
      hooks/      TanStack Query (queries e mutations)
      components/ pages/
  lib/            api.ts (Axios único), format.ts, periods.ts, forms.ts
  hooks/          preferências, debounce, paginação, janela de tempo
  types/api.ts    tipos do contrato da API
```

## Decisões relevantes

- **Sem dados fictícios:** a API real existe, então não há mocks no produto. Estados de carregamento, erro e vazio são
  distintos (falha de comunicação ≠ ausência de alertas).
- **Papéis:** a UI esconde o que o papel (`viewer < operator < admin`) não permite; a autorização real é da API.
- **Reconhecido ≠ resolvido:** badges, filtros e textos tratam os dois estados separadamente.
- **Gráficos:** percentuais, bytes e taxas nunca se misturam (`%`, `GB`, `MB/s`); rede é sempre taxa, não volume acumulado.
- **Token do agente:** exibido uma única vez ao emitir a credencial e nunca gravado em storage.
- **Preferências** (tema e intervalo de atualização) ficam em `localStorage`; nada sensível é guardado ali.

## Limitações conhecidas do contrato

- Não há série histórica de **disco** nem de **rede agregada**: o dashboard mostra a capacidade atual de armazenamento e
  o gráfico de rede de um servidor escolhido; o histórico de rede/swap está nas páginas de detalhe e de métricas.
- A lista de servidores não traz CPU/RAM/disco; a tabela busca `/servers/{id}/summary` por linha (só servidores com comunicação).
- `IssuedCredential`, `AlertRule` e `IncidentDetail` estão como `any` no guia; os tipos locais seguem o que o resto do contrato sugere.
