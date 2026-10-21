import { screen, userEvent, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { buildAlert, readSavedAlerts, seedSavedAlerts } from "../helpers/alerts";
import { buildApiCoin, mockCoinGeckoSuccess, okResponse } from "../helpers/coingecko";

// Item 4 — fluxos completos. renderRouter monta o app real a partir de src/app:
// layouts, abas, pilha de alertas, AlertProvider, telas, hooks e componentes.
// Mocks só nos limites externos: rede (fetch) e armazenamento (AsyncStorage).

function renderApp(initialUrl: string) {
  return renderRouter("./src/app", { initialUrl });
}

describe("Fluxos do app", () => {
  it("cria um alerta pelo formulário, volta para a lista e salva no dispositivo", async () => {
    const user = userEvent.setup();
    await renderApp("/alerts");
    expect(screen.getByText("No alerts yet")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Create Alert" }));
    const saveButton = await screen.findByRole("button", { name: "Save Alert" });
    expect(saveButton).toBeDisabled();

    await user.press(screen.getByRole("button", { name: /select cryptocurrency/i }));
    await user.press(screen.getByText("Ethereum"));
    await user.type(screen.getByPlaceholderText("0.00"), "3500");
    await user.press(screen.getByRole("radio", { name: /below target price/i }));
    expect(saveButton).toBeEnabled();
    await user.press(saveButton);

    expect(await screen.findByText("Ethereum")).toBeOnTheScreen();
    expect(screen.getByText("Alert when price goes below")).toBeOnTheScreen();
    expect(screen.getByText("$3,500.00")).toBeOnTheScreen();
    expect(screen.queryByText("No alerts yet")).not.toBeOnTheScreen();
    // O AlertProvider grava no armazenamento num efeito logo após a tela atualizar.
    expect(await readSavedAlerts()).toEqual([
      expect.objectContaining({
        cryptocurrency: "Ethereum",
        symbol: "ETH",
        targetPrice: 3500,
        condition: "below",
      }),
    ]);
  });

  it("exclui um alerta salvo e volta a mostrar o estado vazio", async () => {
    const user = userEvent.setup();
    await seedSavedAlerts([buildAlert({ cryptocurrency: "Bitcoin", targetPrice: 70000 })]);
    await renderApp("/alerts");
    expect(await screen.findByText("$70,000.00")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Delete alert" }));

    expect(await screen.findByText("No alerts yet")).toBeOnTheScreen();
    expect(screen.queryByText("$70,000.00")).not.toBeOnTheScreen();
    expect(await readSavedAlerts()).toEqual([]);
  });

  it("um alerta criado na aba Alerts aparece no card da moeda na aba List", async () => {
    const user = userEvent.setup();
    mockCoinGeckoSuccess([
      buildApiCoin({ id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 68000 }),
      buildApiCoin({ id: "ethereum", name: "Ethereum", symbol: "eth", current_price: 3900 }),
    ]);
    await renderApp("/");
    expect(await screen.findByText("$68,000.00")).toBeOnTheScreen();
    expect(screen.queryByText("1 alert")).not.toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /^Alerts, tab/ }));
    await user.press(await screen.findByRole("button", { name: "Create Alert" }));
    await user.press(await screen.findByRole("button", { name: /select cryptocurrency/i }));
    await user.press(screen.getByText("Bitcoin"));
    await user.type(screen.getByPlaceholderText("0.00"), "75000");
    await user.press(screen.getByRole("button", { name: "Save Alert" }));
    await screen.findByText("$75,000.00");
    await user.press(screen.getByRole("button", { name: /^List, tab/ }));

    const alertsToggle = await screen.findByRole("button", {
      name: "Toggle alerts for this cryptocurrency",
    });
    expect(within(alertsToggle).getByText("1 alert")).toBeOnTheScreen();
    await user.press(alertsToggle);
    expect(screen.getByText("Above target")).toBeOnTheScreen();
    expect(screen.getByText("$75,000.00")).toBeOnTheScreen();
  });

  it("mostra erro quando a API falha e carrega a lista ao tocar em Retry", async () => {
    const user = userEvent.setup();
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(new Error("sem internet"))
      .mockResolvedValueOnce(
        okResponse([buildApiCoin({ name: "Solana", symbol: "sol", current_price: 150, price_change_percentage_24h: -3.2 })]),
      );
    await renderApp("/");

    expect(await screen.findByText("Failed to load")).toBeOnTheScreen();
    expect(screen.getByText("Unable to fetch cryptocurrency data. Please try again.")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Solana")).toBeOnTheScreen();
    expect(screen.getByText("$150.00")).toBeOnTheScreen();
    expect(screen.getByText("-3.20%")).toBeOnTheScreen();
    expect(screen.queryByText("Failed to load")).not.toBeOnTheScreen();
  });

  it("converte um valor de cripto para moeda fiduciária e avisa quando o valor é inválido", async () => {
    const user = userEvent.setup();
    // Sem internet: a tela de conversão usa as cotações estáticas (BTC = $67,999.50).
    jest.mocked(fetch).mockRejectedValue(new Error("sem internet"));
    await renderApp("/convert");
    expect(await screen.findByText("Enter an amount")).toBeOnTheScreen();
    const amountInput = screen.getByPlaceholderText("0.00");

    await user.type(amountInput, "2");
    expect(await screen.findByText("$135,999.00")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /USD/ }));
    await user.press(screen.getByText("BRL"));
    expect(await screen.findByText("R$696,314.88")).toBeOnTheScreen();

    await user.clear(amountInput);
    await user.type(amountInput, "abc");
    expect(await screen.findByText("Invalid amount")).toBeOnTheScreen();
  });
});
