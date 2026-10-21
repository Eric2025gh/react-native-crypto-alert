# Crypto Alert — Suíte de testes automatizados

Suíte de testes do app [React Native Crypto Alert](https://github.com/rocketseat-education/react-native-crypto-alert) (Rocketseat), feita com **Jest** e **React Native Testing Library**. O objetivo é mostrar que cada parte do app funciona isoladamente e em conjunto: funções puras, componentes, hook e fluxos completos com a navegação real.

**Resultado:** 25 testes passando e **94,51% de cobertura** de statements. O mínimo exigido é 50%.

## Tecnologias

| Ferramenta | Uso |
|---|---|
| Expo SDK 57 / React Native 0.86 | App (atualizado do SDK 55 para rodar no Expo Go atual) |
| Jest 29 + `jest-expo` | Executor de testes e preset do Expo |
| `@testing-library/react-native` 14 | Renderizar componentes e simular a pessoa usuária |
| `expo-router/testing-library` | Renderizar o app inteiro, com rotas, abas e pilha reais |

## Instalação

```bash
npm install
```

Para rodar o app (opcional para os testes):

```bash
cp .env.example .env   # opcional: coloque sua chave da CoinGecko (https://www.coingecko.com/)
npx expo start         # escaneie o QR code com o Expo Go (SDK 57)
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm test` | Roda todos os testes uma vez |
| `npm run test:watch` | Roda os testes de novo a cada alteração no código |
| `npm run test:coverage` | Roda os testes e gera o relatório de cobertura em `coverage/` (abra `coverage/index.html`) |

O comando de cobertura **falha se qualquer métrica ficar abaixo de 50%** (`coverageThreshold` em `jest.config.js`).

## Estrutura

```
__tests__/
├── unit/formatters.test.ts               # 1. funções puras
├── components/AlertCard.test.tsx         # 2. componente visual
├── components/CryptoCard.test.tsx        # 2. componente visual
├── hooks/useCryptoListScreen.test.tsx    # 3. hook
├── integration/appFlows.test.tsx         # 4. fluxos completos
└── helpers/                              # fábricas de dados (não são testes)
    ├── alerts.ts                         #    alertas e armazenamento simulado
    └── coingecko.ts                      #    respostas simuladas da API
jest.config.js                            # preset, cobertura e limite de 50%
jest.setup.ts                             # mocks dos limites externos (item 5)
```

## Testes criados

### 1. Funções puras — `formatPrice` e `formatChange` (5 testes)
Formatadores de `src/utils`. São funções puras, então dispensam mock.
- **Sucesso:** separador de milhar e duas casas decimais (`67999.5 → "67,999.50"`), casas decimais personalizadas com arredondamento.
- **Limites:** zero, frações menores que um centavo (`0.005 → "0.01"`, `0.004 → "0.00"`), valores negativos e variação zero (`"+0.00%"`). Também documenta um caso curioso: `formatChange(-0.004)` vira `"-0.00%"`.
- **Entradas inválidas:** `NaN` e `Infinity` não lançam erro e geram um texto previsível.

### 2. Componentes visuais (5 testes cada)
- **`AlertCard`:** mostra o nome da moeda e o preço-alvo formatado, descreve as condições *above* e *below*, tem um botão acessível "Delete alert" e, ao tocar nele, chama `onDelete` uma única vez com o id do alerta.
- **`CryptoCard`:** usa o `AlertProvider` **real**. Mostra nome, símbolo, preço e variação positiva/negativa; quando a moeda não tem imagem, mostra a inicial do símbolo. Mostra "1 alert" no singular, conta só os alertas da própria moeda (por símbolo ou por nome) e expande/recolhe a lista de alvos ao ser tocado.

### 3. Hook — `useCryptoListScreen` (5 testes)
- **Estado inicial:** `loading`, já com a lista estática.
- **Efeito assíncrono:** a API responde e o estado vira `idle`, com os dados convertidos pelo `fetchCryptocurrenciesFromApi` real (símbolo em maiúsculas, variação `null` vira `0`).
- **Lista vazia:** estado `empty`.
- **Tratamento de erro:** com HTTP 500, o estado vira `error` e a lista estática é mantida.
- **Atualização de estado:** depois de um erro, `handleRetry` busca de novo e o estado volta a `idle`.

### 4. Fluxos completos (5 testes)
`renderRouter("./src/app")` monta o **app de verdade**: layouts, abas, pilha de alertas, `AlertProvider`, telas, hooks e componentes. Os testes interagem como a pessoa usuária, com `userEvent.press` e `userEvent.type`.
1. **Criar alerta:** Alerts → "Create Alert" → escolhe a moeda no seletor, digita o preço, marca "Below" → o botão "Save Alert" sai de desabilitado para habilitado → salva → o alerta aparece na lista e fica gravado no armazenamento.
2. **Excluir alerta:** um alerta salvo aparece → toca em excluir → volta o estado "No alerts yet" e o armazenamento fica vazio.
3. **Integração entre abas:** cria um alerta na aba Alerts → na aba List, o card do Bitcoin mostra "1 alert" e, ao ser expandido, o alvo de $75,000.00.
4. **Erro e recuperação:** a API falha → aparece "Failed to load" → toca em "Retry" → a lista é carregada.
5. **Conversão:** digita 2 BTC → `$135,999.00` → troca para BRL → `R$696,314.88` → digita "abc" → "Invalid amount".

### 5. Política de mocks
Só os **limites externos** são simulados, em `jest.setup.ts`:
- **Armazenamento local:** mock oficial do `@react-native-async-storage/async-storage`, que guarda os dados em memória e é limpo antes de cada teste.
- **Rede:** o `fetch` global é trocado por um `jest.fn()` que **rejeita por padrão**. Assim, nenhum teste chama a CoinGecko de verdade; quem precisa de dados define a resposta (`__tests__/helpers/coingecko.ts`).

Componentes, hooks, `AlertProvider`, `fetchCryptocurrenciesFromApi` e a navegação do expo-router são **reais** em todos os testes.

### Boas práticas seguidas
- Consultas semânticas: `getByRole` (botões, rádios, abas), `getByText` e `getByPlaceholderText`. **Nenhum `testID`.**
- Nada de `setTimeout`: comportamento assíncrono é esperado com `findBy*` e `waitFor`.
- Nomes de teste descritivos, em português, dizendo o comportamento esperado.
- **Os testes acusam defeitos de verdade:** quebrar de propósito a conversão de moeda ou a exclusão de alertas faz os testes falharem.
- Commits progressivos: configuração → item 1 → upgrade do SDK → item 2 → item 3 → item 4 → documentação.

## Relatório de cobertura

![Relatório de cobertura](docs/coverage-report.png)

| Métrica | Cobertura |
|---|---|
| Statements | **94,51%** (224/237) |
| Branches | **84,07%** (132/157) |
| Functions | **96%** (96/100) |
| Lines | **95,81%** (206/215) |

A tabela completa, arquivo por arquivo, está em [`docs/coverage-summary.txt`](docs/coverage-summary.txt). A cobertura mede todo o `src/`, inclusive arquivos que nenhum teste importa; ficam de fora só os arquivos sem lógica (`*.styles.ts`, `src/theme` e `src/constants`).

## Atualização para o Expo SDK 57

O projeto base usava o SDK 55, que não abre no Expo Go atual (SDK 57). A atualização (commit `chore: atualiza para o Expo SDK 57`) foi feita com `npx expo install --fix` e exigiu três ajustes:
- instalar `@expo/vector-icons`, que deixou de vir junto com o `expo`;
- trocar `StyleSheet.absoluteFillObject`, removido no React Native 0.86, por `StyleSheet.absoluteFill`;
- no `tsconfig.json`, remover `baseUrl` e declarar os tipos do Jest (exigências do TypeScript 6).
