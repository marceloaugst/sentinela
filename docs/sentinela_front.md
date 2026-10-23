# Projeto: Dashboard de Monitoramento de Servidores

## 1. Objetivo

Desenvolva o frontend de uma plataforma web de monitoramento de servidores Linux, com foco em observabilidade, desempenho, disponibilidade e visualização de métricas em tempo real.

A aplicação deverá permitir que o usuário acompanhe múltiplos servidores VPS por meio de um dashboard centralizado, visualizando CPU, memória RAM, armazenamento, tráfego de rede, disponibilidade, serviços ativos e alertas.

O backend será desenvolvido separadamente em Go, disponibilizando uma API REST. O frontend deverá ser independente e consumir essa API por meio de uma camada de serviços bem organizada.

O projeto deve ter aparência de um produto profissional de observabilidade, com uma interface moderna, limpa, responsiva e intuitiva.

## 2. Stack tecnológica obrigatória

Utilize as seguintes tecnologias:

- React: construção da interface por componentes.
- TypeScript: tipagem estática e segurança no desenvolvimento.
- Vite: ambiente de desenvolvimento e build.
- Tailwind CSS: estilização e layout responsivo.
- shadcn/ui: componentes de interface reutilizáveis.
- Lucide React: ícones.
- React Router: navegação entre páginas.
- TanStack Query: gerenciamento das requisições HTTP, cache, atualização e estados de carregamento.
- Recharts: gráficos de métricas históricas.
- React Hook Form: gerenciamento de formulários.
- Zod: validação dos dados dos formulários.
- Axios: cliente HTTP para comunicação com a API Go.

Não utilize Laravel, Inertia.js ou Blade. O frontend deve funcionar como uma aplicação React independente.

Antes de instalar dependências, verifique a versão do Node.js, do npm e a compatibilidade das bibliotecas escolhidas. Utilize versões estáveis e evite instalar pacotes redundantes.

## 3. Identidade visual

Crie uma interface inspirada em plataformas modernas de infraestrutura e observabilidade, sem copiar integralmente nenhum produto existente.

Diretrizes visuais:

- Tema escuro como padrão.
- Fundo em tons de grafite e cinza-escuro.
- Cards com contraste discreto e bordas sutis.
- Azul como cor principal de destaque.
- Verde para estados saudáveis.
- Amarelo ou laranja para alertas.
- Vermelho para falhas críticas.
- Tipografia legível e hierarquia visual consistente.
- Ícones simples e consistentes.
- Gráficos com legendas, tooltips, eixos e unidades.
- Espaçamento consistente entre elementos.
- Layout responsivo para desktop, tablet e celular.
- Animações discretas, sem prejudicar o desempenho.
- Estados visuais claros para carregamento, ausência de dados e erros.

Crie uma identidade visual própria para a aplicação. Utilize inicialmente o nome provisório "Sentinela".

Não use emojis como substitutos de ícones da interface.

## 4. Estrutura principal da interface

### Sidebar

Crie uma barra lateral com:

- Logo e nome da aplicação.
- Visão geral.
- Servidores.
- Métricas.
- Serviços.
- Alertas.
- Incidentes.
- Configurações.
- Perfil do usuário.

A sidebar deverá poder ser recolhida no desktop e transformada em menu apropriado para dispositivos móveis.

Destaque visualmente a página ativa.

### Header

O cabeçalho deverá conter:

- Título da página atual.
- Breadcrumbs quando necessário.
- Campo de pesquisa, se pertinente.
- Indicador do estado da conexão com a API.
- Botão de notificações.
- Menu do usuário.

### Dashboard principal

A página inicial deverá apresentar:

1. Quantidade de servidores cadastrados.
2. Servidores online.
3. Servidores offline.
4. Servidores com alertas ativos.
5. Gráfico de utilização da CPU ao longo do tempo.
6. Gráfico de utilização da memória RAM.
7. Gráfico de tráfego de rede.
8. Gráfico de utilização de armazenamento.
9. Lista de servidores com seus respectivos estados.
10. Lista dos alertas e incidentes mais recentes.

Os indicadores devem utilizar unidades corretas, valores formatados e estados visuais consistentes.

Não invente métricas reais. Enquanto a API não estiver implementada, utilize dados fictícios claramente identificados como demonstração.

## 5. Página de servidores

Implemente uma página para visualizar e administrar os servidores cadastrados.

A tabela deverá conter:

- Nome do servidor.
- Endereço ou hostname.
- Sistema operacional.
- Estado da conexão.
- CPU.
- Memória RAM.
- Armazenamento.
- Última comunicação.
- Ações disponíveis.

Funcionalidades:

- Pesquisar servidores.
- Filtrar por estado.
- Ordenar colunas.
- Visualizar detalhes de um servidor.
- Cadastrar um servidor.
- Editar seus metadados.
- Remover um servidor mediante confirmação.
- Exibir paginação quando necessária.

Não disponibilize ações perigosas de execução remota de comandos no frontend.

## 6. Página de detalhes do servidor

Ao selecionar um servidor, abra uma página detalhada com:

- Nome, hostname e sistema operacional.
- Estado atual.
- Tempo de atividade.
- Última comunicação do agente.
- Utilização atual da CPU.
- Memória total, utilizada e disponível.
- Espaço total e utilizado em cada volume.
- Tráfego de rede recebido e enviado.
- Histórico das métricas.
- Lista de serviços monitorados.
- Alertas relacionados ao servidor.
- Histórico de incidentes.

Inclua filtros de período para os gráficos, por exemplo:

- Últimos 15 minutos.
- Última hora.
- Últimas 6 horas.
- Últimas 24 horas.
- Últimos 7 dias.

Os filtros devem alterar os parâmetros enviados à API.

## 7. Página de serviços

Crie uma página para acompanhar serviços monitorados, como:

- Nginx.
- PostgreSQL.
- Redis.
- Docker.
- APIs HTTP.
- Outros serviços Linux.

Cada item deverá apresentar nome, servidor relacionado, estado, última verificação e horário da última mudança de estado.

Diferencie claramente os estados saudável, degradado, indisponível e desconhecido, conforme os estados efetivamente definidos pelo backend.

## 8. Página de alertas e incidentes

Crie uma interface para visualizar e filtrar alertas.

Cada alerta poderá apresentar:

- Título.
- Servidor relacionado.
- Severidade.
- Data e hora.
- Descrição.
- Estado atual.
- Data de resolução, quando aplicável.

Inclua filtros por severidade, servidor, estado e período.

Permita visualizar detalhes do incidente e reconhecer um alerta quando essa operação estiver prevista na API.

Não considere um alerta resolvido apenas porque foi reconhecido. Reconhecimento e resolução devem ser estados diferentes.

## 9. Página de configurações

Prepare uma página para configurações da plataforma, contemplando:

- Preferências visuais.
- Intervalo de atualização dos dados.
- Gerenciamento de regras de alertas.
- Configurações de notificações.
- Preferências do usuário.
- Informações da versão da aplicação.

Implemente apenas operações que possuam suporte no contrato da API. Elementos sem backend não devem aparentar executar operações reais.

## 10. Arquitetura do frontend

Organize o código por funcionalidades e responsabilidades.

Utilize uma estrutura semelhante a esta:

src/
app/
router.tsx
providers.tsx
components/
layout/
AppLayout.tsx
Sidebar.tsx
Header.tsx
ui/
charts/
data-display/
features/
dashboard/
components/
hooks/
services/
types/
pages/
servers/
components/
hooks/
services/
types/
pages/
metrics/
services/
alerts/
incidents/
settings/
lib/
api.ts
utils.ts
hooks/
types/
styles/
main.tsx

Adapte a estrutura se necessário, mas mantenha uma separação clara entre interface, acesso à API, tipos, validação e regras de apresentação.

Evite componentes gigantes, duplicação de código e arquivos com responsabilidades excessivas.

## 11. Integração com a API Go

Centralize a configuração do Axios em um único módulo.

Utilize uma variável de ambiente:

VITE_API_BASE_URL=http://localhost:8080/api/v1

Crie o arquivo .env.example com essa variável e não inclua segredos no frontend.

Organize os serviços HTTP por domínio funcional:

- dashboardService.
- serversService.
- metricsService.
- servicesService.
- alertsService.
- incidentsService.
- settingsService.

Utilize TypeScript para definir os tipos das respostas da API.

Considere inicialmente endpoints como:

GET /dashboard/summary

GET /servers

GET /servers/:id

GET /servers/:id/metrics

GET /servers/:id/services

GET /alerts

GET /incidents

Esses endpoints são propostas de contrato e precisam ser alinhados com o backend real. Não presuma que já existem.

Para operações de cadastro, edição, exclusão, autenticação e reconhecimento de alertas, implemente os serviços somente depois de definir os métodos, payloads e respostas correspondentes.

Configure tratamento centralizado de erros HTTP, timeouts e cancelamento de requisições quando necessário.

Nunca coloque credenciais administrativas ou chaves privadas no código do frontend.

## 12. Atualização de dados

Utilize TanStack Query para buscar e atualizar métricas.

- Configure intervalos de atualização por tipo de dado.
- Evite disparar múltiplas requisições desnecessárias.
- Pause atualizações quando a página não estiver visível, quando apropriado.
- Mostre a data e a hora da última atualização.
- Diferencie falha de comunicação de ausência de alertas.
- Preserve dados anteriores durante atualizações quando isso melhorar a experiência.
- Mostre um indicador de conexão indisponível quando a API não responder.

Prepare a arquitetura para adicionar Server-Sent Events (SSE) futuramente, caso o backend passe a publicar atualizações em tempo real.

Não simule tempo real utilizando apenas animações visuais.

## 13. Gráficos e métricas

Utilize Recharts para gráficos de séries temporais.

Os gráficos deverão oferecer:

- Eixos identificados.
- Unidades adequadas.
- Tooltips.
- Legendas quando houver múltiplas séries.
- Tratamento de valores ausentes.
- Responsividade.
- Filtros de período.
- Estados de carregamento e ausência de dados.

Não misture percentuais com valores absolutos sem identificá-los.

Para memória e armazenamento, diferencie claramente bytes, MB, GB e percentual de ocupação.

Para tráfego de rede, diferencie taxa de transferência de volume acumulado.

## 14. Autenticação e segurança

Prepare a integração com autenticação por meio da API Go.

Não invente um sistema de autenticação no frontend que não tenha suporte do backend.

Se o backend utilizar cookies de sessão, configure as credenciais e a proteção contra CSRF de acordo com o contrato da API.

Se utilizar tokens, siga o mecanismo de autenticação definido pelo backend e não armazene tokens de longa duração em localStorage por conveniência.

Implemente rotas protegidas somente quando existir uma estratégia de autenticação funcional.

Considere CORS, expiração de sessão, tratamento de respostas HTTP 401 e 403 e logout.

A interface nunca deve ser tratada como substituta da autorização aplicada no backend.

## 15. Qualidade e testes

Utilize:

- ESLint para análise estática.
- TypeScript em modo estrito.
- Vitest para testes unitários.
- React Testing Library para testes de componentes.
- Playwright para testes de fluxos críticos, quando adequado.

Teste especialmente:

- Estados de carregamento.
- Falhas da API.
- Listas vazias.
- Formulários inválidos.
- Filtros e paginação.
- Atualização de métricas.
- Rotas protegidas, caso existam.
- Responsividade dos componentes principais.

Garanta que o projeto possa executar os comandos de desenvolvimento, lint, testes e build.

## 16. Regras de desenvolvimento

Siga estas regras durante a implementação:

1. Antes de criar arquivos, inspecione o repositório e identifique o que já existe.
2. Se o projeto já tiver estrutura ou dependências, preserve o que estiver adequado.
3. Não sobrescreva arquivos existentes sem verificar seu conteúdo.
4. Desenvolva em etapas pequenas e verificáveis.
5. Não implemente todo o projeto em um único componente.
6. Não misture dados de demonstração com dados reais sem identificação explícita.
7. Não crie endpoints fictícios como se já estivessem disponíveis no backend.
8. Não instale bibliotecas sem necessidade.
9. Utilize componentes reutilizáveis e padrões consistentes.
10. Mantenha o código tipado, legível e fácil de manter.
11. Explique as decisões arquiteturais relevantes.
12. Execute os testes e o build ao finalizar cada etapa importante.
13. Documente os comandos necessários para instalação e execução.

## 17. Plano de execução

Desenvolva o projeto nesta ordem:

Fase 1 — Fundação:

- Configuração do React, TypeScript e Vite.
- Instalação e configuração do Tailwind CSS e shadcn/ui.
- Configuração do React Router.
- Layout principal com sidebar e header.
- Tema visual e componentes reutilizáveis.

Fase 2 — Dashboard:

- Cards de indicadores.
- Gráficos.
- Lista de servidores.
- Lista de alertas recentes.
- Dados de demonstração identificados.

Fase 3 — Servidores:

- Listagem, pesquisa e filtros.
- Página de detalhes.
- Formulários e validação.
- Integração com serviços HTTP.

Fase 4 — Métricas:

- Gráficos históricos.
- Filtros de período.
- Atualização automática.
- Tratamento de erros e estados vazios.

Fase 5 — Serviços, alertas e incidentes:

- Listagens.
- Filtros.
- Detalhes.
- Ações suportadas pela API.

Fase 6 — Integração e acabamento:

- Alinhamento com o contrato real da API Go.
- Autenticação, caso esteja disponível.
- Testes.
- Acessibilidade.
- Responsividade.
- Otimização do build.
- Documentação.

## 18. Primeira tarefa

Comece somente pela Fase 1.

Primeiro, inspecione o projeto e apresente um breve diagnóstico. Depois, configure a base do frontend e implemente o layout principal, com sidebar, header, rotas iniciais, tema escuro e componentes reutilizáveis.

Não implemente todas as páginas e funcionalidades de uma vez.

Ao concluir a Fase 1:

- Liste os arquivos criados ou modificados.
- Explique as principais decisões técnicas.
- Informe os comandos para instalar e executar o projeto.
- Execute o lint e o build disponíveis.
- Informe os erros encontrados, se houver.
- Indique o próximo passo da Fase 2.

O resultado deve ser um frontend funcional, bem estruturado e preparado para integração futura com a API em Go.
