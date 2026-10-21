# Crypto Alert — Suíte de testes automatizados

Suíte de testes automatizados do app [React Native Crypto Alert](https://github.com/rocketseat-education/react-native-crypto-alert) (Rocketseat), feita com **Jest** e **React Native Testing Library**. O objetivo é aplicar na prática as estratégias de teste da disciplina e mostrar que cada parte do app funciona **isoladamente** (funções, componentes, hook) e **em conjunto** (fluxos completos com a navegação real).

| Resultado | |
|---|---|
| Testes | **25 passando**, em 5 arquivos |
| Cobertura | **94,51%** statements · 84,07% branches · 96% functions · 95,81% lines |
| Mínimo exigido | 50% (o comando de cobertura falha abaixo disso) |
| Chamadas reais de rede ou armazenamento | **Nenhuma** |
| `testID` | **Nenhum** (só consultas semânticas) |
| `setTimeout` nos testes | **Nenhum** (só `findBy*` e `waitFor`) |

---

## Sumário

1. [Sobre o app](#1-sobre-o-app)
2. [Como instalar e rodar](#2-como-instalar-e-rodar)
3. [Conceitos usados](#3-conceitos-usados)
4. [Configuração explicada](#4-configuração-explicada)
5. [Testes criados, item por item](#5-testes-criados-item-por-item)
6. [Política de mocks (item 5)](#6-política-de-mocks-item-5)
7. [Como cada regra da atividade foi cumprida](#7-como-cada-regra-da-atividade-foi-cumprida)
8. [Relatório de cobertura (item 6)](#8-relatório-de-cobertura-item-6)
9. [O que os testes revelaram sobre o código](#9-o-que-os-testes-revelaram-sobre-o-código)
10. [Problemas encontrados e como foram resolvidos](#10-problemas-encontrados-e-como-foram-resolvidos)
11. [Histórico de commits](#11-histórico-de-commits)

---

## 1. Sobre o app

O Crypto Alert tem três abas:

| Aba | Tela | O que faz |
|---|---|---|
| **List** | `CryptoListScreen` | Busca as criptomoedas na API da CoinGecko e mostra preço e variação em 24h. Se a moeda tem alertas, o card mostra um contador que expande a lista de alvos. |
| **Convert** | `ConversionScreen` | Converte um valor em cripto para uma moeda fiduciária (USD, BRL, EUR, GBP, JPY). |
| **Alerts** | `PriceAlertsScreen` e `CreateAlertScreen` | Lista, cria e exclui alertas de preço ("avise quando o BTC passar de $70.000"). Os alertas ficam salvos no aparelho com o AsyncStorage. |

Arquitetura relevante para os testes:
- Cada componente e cada tela separa a **aparência** (`Componente.tsx`) da **lógica** (`useComponente.ts`).
- Os alertas são compartilhados entre as telas por um **contexto React** (`AlertProvider`), que lê e grava no AsyncStorage.
- A navegação usa o **expo-router**: as rotas são os arquivos da pasta `src/app`.

---

## 2. Como instalar e rodar

### Pré-requisitos
- Node.js 22.13 ou mais recente (a React Native Testing Library 14 exige isso).
- Para abrir o app no celular: o **Expo Go** na versão do SDK 57.

### Instalar as dependências

```bash
npm install
```

### Rodar os testes

```bash
npm test
```

Saída esperada:

```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
```

### Gerar o relatório de cobertura

```bash
npm run test:coverage
```

Esse comando imprime a tabela de cobertura no terminal e gera o relatório visual em `coverage/index.html`. Abra esse arquivo no navegador para ver, arquivo por arquivo, quais linhas foram executadas pelos testes (verde) e quais não foram (vermelho).

### Outros comandos úteis

| Comando | Para quê |
|---|---|
| `npm run test:watch` | Fica observando os arquivos e roda os testes de novo a cada alteração |
| `npx jest __tests__/components/AlertCard.test.tsx` | Roda um arquivo só |
| `npx jest -t "exclui um alerta"` | Roda só os testes cujo nome contém o texto |
| `npx jest --verbose` | Lista o nome de cada teste com ✓ ou ✕ |

### Rodar o app (opcional; os testes não precisam disso)

```bash
cp .env.example .env   # opcional: cole sua chave da CoinGecko (https://www.coingecko.com/)
npx expo start         # escaneie o QR code com o Expo Go (SDK 57), no mesmo Wi-Fi
```

Sem a chave, o app usa o plano gratuito da CoinGecko, que tem limite de requisições.

---

## 3. Conceitos usados

### Tipos de teste

| Tipo | O que isola | Velocidade | Neste projeto |
|---|---|---|---|
| **Unitário** | Uma função sozinha | Muito rápido | Formatadores de `src/utils` (item 1) |
| **De componente** | Um componente com as suas props | Rápido | `AlertCard` e `CryptoCard` (item 2) |
| **De hook** | A lógica de estado, sem a tela | Rápido | `useCryptoListScreen` (item 3) |
| **De integração** | Várias partes reais juntas | Mais lento | O app inteiro com navegação (item 4) |

A ideia é ter muitos testes pequenos e baratos na base e alguns testes grandes de fluxo no topo (a "pirâmide de testes"). Os testes pequenos apontam exatamente onde está o defeito. Os grandes garantem que as partes funcionam juntas.

### Ferramentas

- **Jest:** executa os testes e oferece o `expect` para comparar o resultado esperado com o real. Também cria funções falsas (`jest.fn()`) e mede a cobertura.
- **React Native Testing Library (RNTL) 14:** desenha os componentes na memória, sem celular nem emulador, e oferece buscas que imitam como a pessoa usuária encontra as coisas na tela (pelo texto, pelo papel do elemento, pelo rótulo).
- **`userEvent`:** simula interações reais (`press` para tocar, `type` para digitar, `clear` para apagar). Dispara a sequência completa de eventos que um toque real dispara.
- **`expo-router/testing-library`:** a função `renderRouter` monta o app inteiro a partir da pasta `src/app`, com as rotas, as abas e a pilha de navegação reais.

### Estrutura de um teste: preparar, agir, verificar

Todo teste segue três passos, conhecidos como padrão **AAA** (*Arrange, Act, Assert*):

```tsx
it("ao tocar em excluir, chama onDelete uma única vez com o id do alerta", async () => {
  // Preparar: cria o cenário
  const user = userEvent.setup();
  const onDelete = jest.fn();
  await render(<AlertCard alert={buildAlert({ id: "alert-123" })} onDelete={onDelete} />);

  // Agir: faz o que a pessoa usuária faria
  await user.press(screen.getByRole("button", { name: "Delete alert" }));

  // Verificar: confere o resultado
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledWith("alert-123");
});
```

- `describe` agrupa os testes de um mesmo assunto.
- `it` descreve **um** comportamento, com um nome que diz o que é esperado.
- `jest.fn()` cria uma função "espiã", que registra se e como foi chamada.

### Como encontrar elementos na tela (consultas)

A atividade pede consultas semânticas antes de `testID`, na ordem de prioridade recomendada pela própria biblioteca:

| Consulta | Encontra por | Exemplo neste projeto |
|---|---|---|
| `getByRole` | Papel de acessibilidade + nome | `getByRole("button", { name: "Delete alert" })`, `getByRole("radio", { name: /below target price/i })` |
| `getByLabelText` | Rótulo de acessibilidade | (os campos do app não têm rótulo ligado ao input) |
| `getByPlaceholderText` | Texto de exemplo do campo | `getByPlaceholderText("0.00")` |
| `getByText` | Texto visível | `getByText("$3,850.50")` |
| `getByTestId` | Atributo `testID` | **não usado** |

Por que evitar `testID`: ele é invisível para a pessoa usuária. Um teste que busca por papel ou texto quebra quando a experiência muda (o botão sumiu, o texto mudou) e continua passando quando só a estrutura interna muda. Como bônus, buscar por papel obriga o app a ser acessível para leitores de tela.

Variações de cada consulta:

| Prefixo | Quando usar | Se não encontrar |
|---|---|---|
| `getBy...` | O elemento já deve estar na tela | Lança erro na hora |
| `queryBy...` | Verificar que algo **não** está na tela | Devolve `null` |
| `findBy...` | O elemento **vai** aparecer depois de algo assíncrono | Espera até 1 segundo, depois lança erro |

### Testes assíncronos

Na RNTL 14, `render`, `renderHook` e as interações com o `userEvent` são assíncronos, então todo teste é `async` e usa `await`. Para esperar algo que acontece depois (uma resposta da API, a leitura do armazenamento), usamos:
- `await screen.findByText("Solana")`: espera o elemento aparecer;
- `await waitFor(() => expect(result.current.loadingState).toBe("idle"))`: repete a verificação até ela passar.

A atividade proíbe `setTimeout` porque uma espera fixa é lenta (sempre espera o tempo todo) e frágil (pode não ser suficiente numa máquina mais lenta). O `waitFor` termina assim que a condição é verdadeira.

### Mocks (simulações)

Um **mock** substitui uma dependência real por uma versão controlada pelo teste. Aqui eles servem para que os testes não dependam da internet nem do armazenamento do aparelho, o que os deixaria lentos, instáveis e sujeitos a dados que mudam. A regra da atividade, seguida à risca, é **mockar só os limites externos** (ver a seção 6).

### Cobertura

A cobertura mede quanto do código foi **executado** durante os testes:

| Métrica | Pergunta que responde |
|---|---|
| **Statements** | Quantas instruções rodaram? |
| **Branches** | Quantos caminhos de cada `if`, `? :`, `??` e `&&` foram percorridos? |
| **Functions** | Quantas funções foram chamadas pelo menos uma vez? |
| **Lines** | Quantas linhas rodaram? |

Cobertura alta **não** garante testes bons: um teste pode executar uma linha sem verificar nada. Por isso, cada teste daqui termina com um `expect` sobre um comportamento visível, e fizemos a verificação da seção 7.

---

## 4. Configuração explicada

### Dependências adicionadas

| Pacote | Para quê |
|---|---|
| `@testing-library/react-native` | Renderizar e consultar componentes |
| `test-renderer` (1.2) | Motor usado pela RNTL 14 para desenhar na memória. A versão 1.2 é a recomendada para o React 19.2. |

O `jest`, o `jest-expo` e o `@types/jest` já vinham no projeto base.

### `package.json`: scripts

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

O script original era `jest --watchAll`, que nunca termina. Ele foi trocado por `jest` (roda uma vez e sai) e o modo de observação ficou em `test:watch`.

### `jest.config.js`

| Opção | Valor | Por quê |
|---|---|---|
| `preset` | `"jest-expo"` | Converte TypeScript e JSX com o Babel, simula os módulos nativos do Expo, traduz os atalhos do `tsconfig` (`@components/...`, `@utils/...`) e define quais pacotes do `node_modules` precisam ser convertidos |
| `testMatch` | `__tests__/**/*.test.ts(x)` | Só arquivos `.test` são testes. Assim, os helpers em `__tests__/helpers` não são executados como teste. |
| `setupFilesAfterEnv` | `jest.setup.ts` | Arquivo que roda antes de cada arquivo de teste, com os mocks globais |
| `clearMocks` | `true` | Zera o histórico de chamadas dos `jest.fn()` entre um teste e outro, para que um teste não enxergue chamadas do anterior |
| `collectCoverageFrom` | `src/**/*.{ts,tsx}` menos estilos, tema e constantes | Mede **todo** o `src/`, inclusive arquivos que nenhum teste importa. Ficam de fora só arquivos sem lógica (`*.styles.ts`, `src/theme`, `src/constants`). |
| `coverageReporters` | `text`, `text-summary`, `html`, `json-summary` | Tabela no terminal, resumo, relatório visual e um JSON com os números |
| `coverageThreshold` | 50% em tudo | Faz `npm run test:coverage` **falhar** se qualquer métrica ficar abaixo do mínimo exigido |

### `jest.setup.ts`

```ts
// Limite externo 1: armazenamento local
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  await AsyncStorage.clear(); // cada teste começa com o "disco" vazio

  // Limite externo 2: rede. Rejeita por padrão; cada teste define a sua resposta.
  globalThis.fetch = jest.fn(() =>
    Promise.reject(new Error("Chamadas reais de rede não são permitidas nos testes")),
  );
});
```

O `fetch` **rejeitar por padrão** é uma rede de segurança: se um teste esquecer de simular a API, ele falha, em vez de chamar a CoinGecko de verdade.

### Helpers (`__tests__/helpers/`)

São "fábricas" de dados de teste. Cada teste monta só o que importa para ele, em uma linha.

| Função | Arquivo | O que faz |
|---|---|---|
| `buildAlert({ ... })` | `alerts.ts` | Cria um alerta válido; o teste sobrescreve só os campos que interessam |
| `seedSavedAlerts([...])` | `alerts.ts` | Coloca alertas no armazenamento simulado, como se a pessoa os tivesse salvado numa sessão anterior |
| `readSavedAlerts()` | `alerts.ts` | Lê o que o app gravou no armazenamento simulado |
| `buildApiCoin({ ... })` | `coingecko.ts` | Cria uma moeda no formato que a API da CoinGecko devolve |
| `okResponse([...])` / `errorResponse(500)` | `coingecko.ts` | Criam respostas HTTP falsas de sucesso ou de erro |
| `mockCoinGeckoSuccess([...])` | `coingecko.ts` | Faz todas as chamadas de `fetch` responderem com sucesso |

---

## 5. Testes criados, item por item

### Item 1 — Funções puras · `__tests__/unit/formatters.test.ts` (5 testes)

**Alvo:** `formatPrice(price, decimals = 2)` e `formatChange(change)`, de `src/utils/index.ts`. São funções **puras**: a mesma entrada sempre gera a mesma saída, sem tela, rede ou armazenamento. Por isso, não precisam de nenhum mock.

| # | Teste | Categoria | O que verifica |
|---|---|---|---|
| 1 | formata com separador de milhar e duas casas decimais por padrão | Sucesso | `67999.5 → "67,999.50"`, `1234567.891 → "1,234,567.89"` |
| 2 | respeita a quantidade de casas decimais informada e arredonda o excedente | Sucesso | `(0.123456, 4) → "0.1235"`, `(3850.25, 0) → "3,850"` |
| 3 | trata os limites: zero, frações menores que um centavo e valores negativos | Limite | `0 → "0.00"`, `0.005 → "0.01"`, `0.004 → "0.00"`, `-1500 → "-1,500.00"` |
| 4 | prefixa variações positivas e zero com '+' e mantém o '-' nas negativas | Sucesso e limite | `2.45 → "+2.45%"`, `0 → "+0.00%"`, `-1.23 → "-1.23%"`, `-0.004 → "-0.00%"` |
| 5 | não lança erro com NaN ou Infinity e devolve um texto previsível | Entrada inválida | `formatPrice(NaN) → "NaN"`, `formatPrice(Infinity) → "∞"`, `formatChange(NaN) → "NaN%"`, `formatChange(Infinity) → "+Infinity%"` |

**Por que esses casos:** valores na fronteira (zero, meio centavo, sinal) são onde os erros de arredondamento costumam aparecer. As entradas inválidas documentam o que a função faz hoje com dados ruins. Se alguém decidir que `NaN` deve virar `"—"`, o teste avisa que o comportamento mudou.

### Item 2 — Componentes visuais

#### `AlertCard` · `__tests__/components/AlertCard.test.tsx` (5 testes)

**Alvo:** o card de um alerta na lista. Recebe por props o alerta (`alert`) e a função de exclusão (`onDelete`).

| # | Teste | Tipo de verificação | Como |
|---|---|---|---|
| 1 | mostra o nome da criptomoeda e o preço-alvo formatado em dólar | Renderização e props | `getByText("Ethereum")`, `getByText("$3,850.50")` |
| 2 | descreve a condição 'above' quando o alerta é para preço acima do alvo | Texto importante | `getByText("Alert when price goes above")` |
| 3 | descreve a condição 'below' quando o alerta é para preço abaixo do alvo | Texto e prop diferente | Mostra "below" e **não** mostra "above" (`queryByText(...).not.toBeOnTheScreen()`) |
| 4 | oferece um botão acessível para excluir o alerta | Acessibilidade | `getByRole("button", { name: "Delete alert" })` e `toBeEnabled()` |
| 5 | ao tocar em excluir, chama onDelete uma única vez com o id do alerta | Interação | `user.press(...)` e depois `toHaveBeenCalledTimes(1)` / `toHaveBeenCalledWith("alert-123")` |

O teste 4 é possível porque o botão de lixeira tem `accessibilityLabel="Delete alert"`. Sem isso, um leitor de tela não saberia o que o ícone faz, e o teste também não o encontraria.

#### `CryptoCard` · `__tests__/components/CryptoCard.test.tsx` (5 testes)

**Alvo:** o card de uma moeda na aba List. Ele lê os alertas pelo hook `useAlerts()`, então precisa estar dentro de um `AlertProvider`. O teste usa o **provider real** como `wrapper` e simula apenas o armazenamento:

```tsx
function renderCard(crypto: Cryptocurrency) {
  return render(<CryptoCard crypto={crypto} />, { wrapper: AlertProvider });
}
```

| # | Teste | Tipo de verificação | Como |
|---|---|---|---|
| 1 | mostra nome, símbolo, preço formatado e variação positiva com '+' | Renderização e props | "Bitcoin", "BTC", "$67,999.50", "+2.45%"; sem alertas, **não** existe o botão de alertas |
| 2 | mostra variação negativa e usa a inicial do símbolo quando a moeda não tem imagem | Prop opcional | Ethereum sem `image` mostra "-1.23%" e a letra "E" como avatar |
| 3 | mostra '1 alert' no singular quando existe um alerta salvo para a moeda | Texto importante e efeito assíncrono | `seedSavedAlerts(...)` antes de renderizar e `await findByText("1 alert")` |
| 4 | conta só os alertas da própria moeda, comparando por símbolo ou por nome | Regra de negócio | 3 alertas salvos (BTC, "bitcoin" com outro símbolo, ETH) mostram "2 alerts" |
| 5 | ao tocar no contador, expande a lista de alvos e, ao tocar de novo, recolhe | Interação | Toca, aparecem "Above target $70,000.00" e "Below target $60,000.00"; toca de novo, somem |

**Por que `findByText` nos testes 3 a 5:** o `AlertProvider` lê o armazenamento num efeito assíncrono, depois da primeira renderização. Num primeiro momento, o card aparece sem alertas; o contador surge logo em seguida. O `findBy` espera isso acontecer.

### Item 3 — Hook · `__tests__/hooks/useCryptoListScreen.test.tsx` (5 testes)

**Alvo:** `useCryptoListScreen`, o hook que controla a aba List. Ele chama a API e passa por estes estados:

```
loading ──► idle    (a API devolveu moedas)
        ├─► empty   (a API devolveu uma lista vazia)
        └─► error   (a API falhou; mantém a lista estática)
error ──handleRetry──► loading ──► ...
```

O `renderHook` executa o hook sem tela, e `result.current` sempre tem o valor mais recente devolvido por ele. Só o `fetch` é simulado. A função `fetchCryptocurrenciesFromApi`, que monta a URL e converte a resposta da API para o formato do app, roda **de verdade**.

| # | Teste | O que a atividade pede | Como |
|---|---|---|---|
| 1 | começa em 'loading' exibindo a lista estática enquanto a API não responde | Estado inicial | `fetch` devolve uma promessa que nunca termina; o estado fica `"loading"` com as 8 moedas estáticas |
| 2 | quando a API responde, vai para 'idle' com as moedas convertidas para o formato do app | Efeito assíncrono | `waitFor` até `"idle"`; confere a conversão (`"btc" → "BTC"`, `current_price → price`, variação `null → 0`) e a URL chamada |
| 3 | vai para 'empty' e esvazia a lista quando a API não retorna nenhuma moeda | Atualização de estado | A API devolve `[]` e o estado vira `"empty"` com a lista vazia |
| 4 | vai para 'error' e mantém a lista estática quando a API responde com falha | Tratamento de erro | Resposta HTTP 500; o estado vira `"error"` e a lista estática continua lá como reserva |
| 5 | handleRetry busca de novo e se recupera do erro quando a API volta a responder | Atualização de estado | 1ª chamada falha (sem internet) e a 2ª funciona; depois de `handleRetry()`, o estado vai para `"idle"`, com 2 chamadas ao `fetch` |

Trecho do teste 5:

```tsx
jest
  .mocked(fetch)
  .mockRejectedValueOnce(new Error("sem internet"))       // 1ª chamada: falha
  .mockResolvedValueOnce(okResponse([buildApiCoin()]));   // 2ª chamada: sucesso

const { result } = await renderHook(() => useCryptoListScreen());
await waitFor(() => expect(result.current.loadingState).toBe("error"));

await act(async () => {
  result.current.handleRetry();
});

await waitFor(() => expect(result.current.loadingState).toBe("idle"));
```

O `act` avisa o React que aquela chamada vai mudar o estado. Assim, todas as atualizações são processadas antes da próxima verificação.

### Item 4 — Fluxos completos · `__tests__/integration/appFlows.test.tsx` (5 testes)

**Alvo:** o app inteiro. `renderRouter("./src/app", { initialUrl })` monta exatamente o que roda no celular:

```
_layout.tsx (SafeAreaProvider + AlertProvider)
└── (tabs)/_layout.tsx (abas List · Convert · Alerts)
    ├── index.tsx          → CryptoListScreen → useCryptoListScreen → CryptoCard
    ├── convert.tsx        → ConversionScreen → useConversionScreen → SelectField
    └── alerts/_layout.tsx (pilha)
        ├── index.tsx      → PriceAlertsScreen → AlertCard / EmptyState
        └── create.tsx     → CreateAlertScreen (modal) → SelectField, ConditionOptionRow, PrimaryButton
```

Nada disso é simulado: layouts, abas, pilha de navegação, contexto, telas, hooks e componentes são reais. A navegação também é real. Tocar em "Create Alert" abre o modal de criação, e "Save Alert" chama `router.replace("/alerts")` de verdade.

| # | Fluxo | Partes reais envolvidas | Resultado visível verificado |
|---|---|---|---|
| 1 | **cria um alerta pelo formulário, volta para a lista e salva no dispositivo** | Lista de alertas, navegação para o modal, `SelectField`, campo de preço, `ConditionOptionRow`, `PrimaryButton`, `AlertProvider`, AsyncStorage | "Save Alert" começa **desabilitado** e fica habilitado depois de preencher; ao salvar, a tela volta para a lista com "Ethereum", "Alert when price goes below" e "$3,500.00"; o alerta fica gravado no armazenamento |
| 2 | **exclui um alerta salvo e volta a mostrar o estado vazio** | AsyncStorage → `AlertProvider` → lista → `AlertCard` → exclusão → `EmptyState` | O alerta salvo aparece; depois da exclusão, aparece "No alerts yet" e o armazenamento fica vazio |
| 3 | **um alerta criado na aba Alerts aparece no card da moeda na aba List** | API (simulada) → lista de moedas; abas; criação de alerta; contexto compartilhado entre abas | Na aba List, o card do Bitcoin mostra "1 alert" e, ao ser expandido, "Above target $75,000.00" |
| 4 | **mostra erro quando a API falha e carrega a lista ao tocar em Retry** | API → hook → `ErrorState` → botão Retry → `CryptoCard` | "Failed to load" e a mensagem de erro; depois do Retry, "Solana", "$150.00" e "-3.20%" |
| 5 | **converte um valor de cripto para moeda fiduciária e avisa quando o valor é inválido** | Aba Convert, campo de valor, dois `SelectField`, cálculo de conversão, formatador | "Enter an amount" → digita 2 → "$135,999.00" → troca para BRL → "R$696,314.88" → digita "abc" → "Invalid amount" |

O fluxo 3 é o que mais mostra o app "funcionando em conjunto": um dado criado numa aba aparece em outra, passando pelo contexto compartilhado. Trecho:

```tsx
await user.press(screen.getByRole("button", { name: /^Alerts, tab/ }));       // vai para a aba Alerts
await user.press(await screen.findByRole("button", { name: "Create Alert" }));
await user.press(await screen.findByRole("button", { name: /select cryptocurrency/i }));
await user.press(screen.getByText("Bitcoin"));                                   // escolhe no seletor
await user.type(screen.getByPlaceholderText("0.00"), "75000");
await user.press(screen.getByRole("button", { name: "Save Alert" }));
await screen.findByText("$75,000.00");
await user.press(screen.getByRole("button", { name: /^List, tab/ }));          // volta para a aba List

const alertsToggle = await screen.findByRole("button", {
  name: "Toggle alerts for this cryptocurrency",
});
expect(within(alertsToggle).getByText("1 alert")).toBeOnTheScreen();
```

As abas são encontradas pelo nome acessível que o React Navigation gera ("List, tab, 1 of 3"). Por isso a busca usa a expressão regular `/^List, tab/`.

---

## 6. Política de mocks (item 5)

| Dependência | Simulada? | Motivo |
|---|---|---|
| `fetch` (API da CoinGecko) | **Sim** | Limite externo: rede. Os testes não podem depender de internet, de limite de requisições nem de preços que mudam a cada minuto. |
| `@react-native-async-storage/async-storage` | **Sim**, com o mock oficial da biblioteca | Limite externo: armazenamento do aparelho. Os dados ficam em memória e são apagados antes de cada teste. |
| Módulos nativos do Expo e do React Native | Pelo preset `jest-expo` | Bibliotecas nativas não existem fora do celular |
| `expo-router` (navegação) | **Não** | O `renderRouter` usa o roteador real em memória |
| `AlertProvider` / `useAlerts` | **Não** | É a regra de negócio dos alertas |
| `fetchCryptocurrenciesFromApi` | **Não** | É a regra que converte a resposta da API; só o `fetch` por baixo dela é simulado |
| Hooks (`useCryptoListScreen`, `useCreateAlertScreen`...) | **Não** | Fazem parte do comportamento testado |
| Componentes (`AlertCard`, `SelectField`...) | **Não** | Fazem parte do comportamento testado |

**Por que simular o `fetch` e não a função `fetchCryptocurrenciesFromApi`?** Se a função inteira fosse simulada, a conversão dos dados (`"btc" → "BTC"`, `null → 0`) nunca seria testada. Simulando só o `fetch`, o código do app roda inteiro e só a resposta da rede é inventada.

---

## 7. Como cada regra da atividade foi cumprida

| Regra | Como foi cumprida |
|---|---|
| Cada teste com finalidade clara e nome descritivo | Cada `it` descreve **um** comportamento em português, no formato "faz X quando Y" |
| Consultas semânticas antes de `testID` | Só `getByRole`, `getByText` e `getByPlaceholderText`; **zero** `testID` no projeto |
| Sem `setTimeout` para esperar | Comportamentos assíncronos usam `findBy*` e `waitFor` |
| Sem chamadas reais de API, banco ou armazenamento | `fetch` rejeita por padrão e o AsyncStorage é o mock em memória (`jest.setup.ts`) |
| Mocks só para limites externos | Ver a seção 6 |
| Commits progressivos | 10 commits, um por etapa (seção 11) |
| Cobertura mínima de 50% | 94,51%, garantida pelo `coverageThreshold` |
| README com instalação, comandos, explicação e cobertura | Este arquivo |

### Os testes pegam defeitos de verdade?

Cobertura alta não prova isso, então fizemos a prova: **quebramos o app de propósito** e rodamos a suíte.

| Defeito introduzido | Resultado |
|---|---|
| Conversão ignorando a taxa da moeda (`amount * price`, sem `* rate`) | O fluxo de conversão **falhou** (esperava R$696,314.88) |
| Exclusão que não remove nada (`prev` em vez de `prev.filter(...)`) | O fluxo de exclusão **falhou** (o alerta continuou na tela) |

As duas alterações foram desfeitas em seguida. Você pode repetir a experiência: mude qualquer regra do app, rode `npm test` e veja qual teste acusa.

---

## 8. Relatório de cobertura (item 6)

![Relatório de cobertura](docs/coverage-report.png)

| Métrica | Cobertura |
|---|---|
| Statements | **94,51%** (224/237) |
| Branches | **84,07%** (132/157) |
| Functions | **96%** (96/100) |
| Lines | **95,81%** (206/215) |

Arquivos do relatório:
- `docs/coverage-report.png`: imagem do relatório HTML (acima);
- [`docs/coverage-summary.txt`](docs/coverage-summary.txt): tabela completa, arquivo por arquivo;
- `coverage/index.html`: relatório navegável, gerado por `npm run test:coverage` (fica fora do git).

### O que ficou sem cobertura e por quê

Nenhum trecho importante ficou de fora. O que falta são caminhos alternativos que o app real nunca percorre, ou percorre só em situações raras:

| Arquivo | Trecho não coberto | Motivo |
|---|---|---|
| `ErrorState`, `LoadingState`, `EmptyState` | Textos padrão e partes opcionais | O app sempre passa título e mensagem próprios, então os valores padrão nunca são usados |
| `useCreateAlertScreen.ts` (linhas 20–26) e `CreateAlertScreen.tsx` (mensagens de erro) | Mensagens de validação | **Inalcançáveis pela interface:** ver a seção 9 |
| `useCreateAlertScreen.ts` (linha 50) e `ScreenHeader` | Botão "Go back" | O fluxo testado sai da tela salvando, não voltando |
| `usePrimaryButton.ts` (linha 10) | Ignorar o toque com o botão desabilitado | O `Pressable` desabilitado já não dispara `onPress` |
| `useAlertProvider.ts` (linha 84) | Erro de `useAlerts` fora do provider | Proteção para quem programa; não acontece no app montado |
| `cryptoData.ts` (linha 95) | Cabeçalho com a chave da API | Só é usado quando existe um `.env` com a chave |
| `useConversionScreen.ts` (linhas 21–22) | Trocar as cotações pelas da API | O teste de conversão usa as cotações estáticas, para ter valores previsíveis |
| `useCryptoCard.ts` (linha 21) | Proteção do `toggleExpanded` sem alertas | O botão só aparece quando há alertas |

---

## 9. O que os testes revelaram sobre o código

Escrever os testes obriga a ler o código com atenção. Estes comportamentos foram encontrados no caminho. Nenhum foi alterado, porque a atividade é testar o app como ele é, mas ficam registrados:

1. **Sinal em variações minúsculas.** `formatChange(-0.004)` devolve `"-0.00%"`: a queda é arredondada para zero, mas o sinal de menos continua. O teste do item 1 documenta esse comportamento.
2. **Mensagens de validação que nunca aparecem.** `useCreateAlertScreen` tem mensagens como "Please select a cryptocurrency" e "Please enter a valid price", mas elas só seriam mostradas ao tocar em "Save Alert" com o formulário inválido, e nesse caso o botão está **desabilitado**. Na prática, quem garante a validação é o botão desabilitado (verificado no fluxo 1).
3. **Conversão com cotação desatualizada** (encontrado lendo o código; não há teste para isso). Em `useConversionScreen`, o efeito que calcula o resultado depende de `[amount, selectedCrypto, selectedFiat]`, mas não da lista de cotações (`cryptos`). Se a pessoa digitar um valor antes de a API responder, o resultado continua calculado com a cotação estática até ela mudar algum campo.
4. **Código acessível facilita o teste.** Os botões com `accessibilityRole` e `accessibilityLabel` ("Delete alert", "Retry", "Toggle alerts for this cryptocurrency") puderam ser encontrados por `getByRole`. Os campos de texto não têm rótulo ligado ao input, então a busca usou `getByPlaceholderText`.

---

## 10. Problemas encontrados e como foram resolvidos

### Atualização para o Expo SDK 57
O projeto base usava o SDK 55, mas o Expo Go instalado nos celulares só abre a versão mais recente (SDK 57). A atualização foi feita com `npm install expo@~57` e `npx expo install --fix`, que alinha todas as bibliotecas, e confirmada com o `npx expo-doctor` (21 de 21 verificações sem problema). Ela exigiu:

| Problema | Correção |
|---|---|
| `@expo/vector-icons` deixou de vir junto com o `expo`; o app quebraria ao carregar os ícones | `npx expo install @expo/vector-icons` |
| `StyleSheet.absoluteFillObject` foi removido no React Native 0.86; o fundo do seletor perderia o posicionamento sem dar erro | Troca por `StyleSheet.absoluteFill` em `SelectField.styles.ts` |
| O TypeScript 6 tornou a opção `baseUrl` obsoleta | Removida do `tsconfig.json` (os `paths` já começam com `./`) |
| O TypeScript 6 parou de carregar automaticamente os tipos de `@types/*`, e `describe`/`it`/`expect` deixaram de ser reconhecidos | `"types": ["jest"]` no `tsconfig.json` |
| `jest-expo` não encontrava o `expo-modules-core`, que ficou numa subpasta herdada do lockfile antigo | Reinstalação limpa (`node_modules` e `package-lock.json` recriados) |

### `standard-navigation` não convertido pelo Babel
O expo-router 57 passou a usar o pacote `standard-navigation`, que vem em formato de módulo ES. A lista `transformIgnorePatterns` herdada do `package.json` original não o incluía, e o Jest falhava com `Cannot use import statement outside a module`. A solução foi apagar a lista personalizada e usar a do preset `jest-expo`, que já é mantida atualizada.

### Testes de fluxo que passavam sozinhos e falhavam juntos
Os fluxos 2 a 5 passavam quando executados um de cada vez, mas falhavam depois do fluxo 1, com o aviso *"overlapping act() calls"*. Causa: o fluxo 1 terminava com `waitFor(async () => ...)`, uma espera com função assíncrona. Combinada com os timers simulados que o `renderRouter` liga, ela deixava uma atualização do React pendente quando o teste acabava. Como o mock do AsyncStorage grava os dados no instante da chamada, e o `AlertProvider` grava num efeito logo depois de a tela atualizar, a espera era desnecessária. A verificação passou a ler o armazenamento direto, logo depois do `findByText`.

### Tipos do `expo-router/testing-library`
Esse módulo reexporta a RNTL, mas as definições de tipo dele declaram o `userEvent` só como tipo, e o TypeScript recusava usá-lo como valor. A solução foi importar o `renderRouter` do expo-router e o resto (`screen`, `userEvent`, `within`) direto de `@testing-library/react-native`.

---

## 11. Histórico de commits

Os testes foram adicionados em etapas, um commit por item:

| Commit | Etapa |
|---|---|
| `chore: configura Jest e React Native Testing Library` | Configuração, mocks globais e scripts |
| `test: cobre formatPrice e formatChange (sucesso, limites e entradas inválidas)` | Item 1 |
| `chore: atualiza para o Expo SDK 57` | Atualização do SDK |
| `test: cobre o componente AlertCard (textos, props e exclusão)` | Item 2 |
| `test: cobre o componente CryptoCard com o AlertProvider real` | Item 2 |
| `test: cobre o hook useCryptoListScreen (estado inicial, sucesso, vazio, erro e retry)` | Item 3 |
| `chore: usa a lista de transformação do preset jest-expo` | Ajuste de configuração para o item 4 |
| `test: cobre fluxos completos do app com o router real` | Item 4 |
| `docs: README da suíte de testes e relatório de cobertura` | Item 6 e entrega |
| `docs: detalha a explicação dos testes no README` | Este README completo |

Para ver o histórico: `git log --oneline`.
