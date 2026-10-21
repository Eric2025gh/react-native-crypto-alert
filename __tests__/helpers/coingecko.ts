// Simula a API da CoinGecko (limite externo). O código do app continua
// chamando fetch normalmente; só a resposta da rede é inventada pelo teste.

/** Formato de uma moeda como a CoinGecko devolve em /coins/markets. */
export interface ApiCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  image: string;
}

export function buildApiCoin(overrides: Partial<ApiCoin> = {}): ApiCoin {
  return {
    id: "solana",
    name: "Solana",
    symbol: "sol",
    current_price: 150,
    price_change_percentage_24h: 3.5,
    image: "https://example.com/solana.png",
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

export function okResponse(coins: ApiCoin[]) {
  return jsonResponse(200, coins);
}

export function errorResponse(status: number) {
  return jsonResponse(status, { error: "erro simulado" });
}

/** Faz toda chamada de fetch responder com sucesso trazendo `coins`. */
export function mockCoinGeckoSuccess(coins: ApiCoin[]) {
  jest.mocked(fetch).mockResolvedValue(okResponse(coins));
}
