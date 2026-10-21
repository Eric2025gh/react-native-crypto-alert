import { act, renderHook, waitFor } from "@testing-library/react-native";
import { cryptocurrencies as fallbackCryptos } from "@data/cryptoData";
import { useCryptoListScreen } from "@screens/CryptoListScreen/useCryptoListScreen";
import {
  buildApiCoin,
  errorResponse,
  mockCoinGeckoSuccess,
  okResponse,
} from "../helpers/coingecko";

// Item 3 — hook: useCryptoListScreen busca as moedas na API e controla
// o estado da tela (loading → idle | empty | error). Só o fetch é mockado:
// fetchCryptocurrenciesFromApi, que converte a resposta, roda de verdade.

describe("useCryptoListScreen", () => {
  it("começa em 'loading' exibindo a lista estática enquanto a API não responde", async () => {
    jest.mocked(fetch).mockReturnValue(new Promise(() => {})); // resposta que nunca chega

    const { result } = await renderHook(() => useCryptoListScreen());

    expect(result.current.loadingState).toBe("loading");
    expect(result.current.cryptocurrencies).toEqual(fallbackCryptos);
  });

  it("quando a API responde, vai para 'idle' com as moedas convertidas para o formato do app", async () => {
    mockCoinGeckoSuccess([
      buildApiCoin({ id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 70000, price_change_percentage_24h: 1.5, image: "btc.png" }),
      buildApiCoin({ id: "tether", name: "Tether", symbol: "usdt", current_price: 1, price_change_percentage_24h: null, image: "usdt.png" }),
    ]);

    const { result } = await renderHook(() => useCryptoListScreen());

    await waitFor(() => expect(result.current.loadingState).toBe("idle"));
    expect(result.current.cryptocurrencies).toEqual([
      { id: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 70000, change24h: 1.5, image: "btc.png" },
      // variação nula vira 0 e o símbolo vai para maiúsculas
      { id: "tether", name: "Tether", symbol: "USDT", price: 1, change24h: 0, image: "usdt.png" },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd"),
      expect.anything(),
    );
  });

  it("vai para 'empty' e esvazia a lista quando a API não retorna nenhuma moeda", async () => {
    mockCoinGeckoSuccess([]);

    const { result } = await renderHook(() => useCryptoListScreen());

    await waitFor(() => expect(result.current.loadingState).toBe("empty"));
    expect(result.current.cryptocurrencies).toEqual([]);
  });

  it("vai para 'error' e mantém a lista estática quando a API responde com falha", async () => {
    jest.mocked(fetch).mockResolvedValue(errorResponse(500));

    const { result } = await renderHook(() => useCryptoListScreen());

    await waitFor(() => expect(result.current.loadingState).toBe("error"));
    expect(result.current.cryptocurrencies).toEqual(fallbackCryptos);
  });

  it("handleRetry busca de novo e se recupera do erro quando a API volta a responder", async () => {
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(new Error("sem internet"))
      .mockResolvedValueOnce(okResponse([buildApiCoin({ symbol: "sol" })]));
    const { result } = await renderHook(() => useCryptoListScreen());
    await waitFor(() => expect(result.current.loadingState).toBe("error"));

    await act(async () => {
      result.current.handleRetry();
    });

    await waitFor(() => expect(result.current.loadingState).toBe("idle"));
    expect(result.current.cryptocurrencies.map((c) => c.symbol)).toEqual(["SOL"]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
