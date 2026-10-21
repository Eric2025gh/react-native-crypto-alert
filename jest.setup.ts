import AsyncStorage from "@react-native-async-storage/async-storage";

// Limite externo 1: armazenamento local.
// O mock oficial da biblioteca guarda os dados em memória, sem tocar no dispositivo.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  // Cada teste começa com o "disco" vazio.
  await AsyncStorage.clear();

  // Limite externo 2: rede.
  // Nenhum teste pode chamar a API real. Quem precisar de dados da CoinGecko
  // define a resposta com jest.mocked(fetch).mockResolvedValue(...).
  globalThis.fetch = jest.fn(() =>
    Promise.reject(new Error("Chamadas reais de rede não são permitidas nos testes")),
  );
});
