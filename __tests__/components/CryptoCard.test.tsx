import { render, screen, userEvent } from "@testing-library/react-native";
import { CryptoCard } from "@components/CryptoCard/CryptoCard";
import { AlertProvider } from "@context/AlertProvider/AlertProvider";
import { cryptocurrencies, type Cryptocurrency } from "@data/cryptoData";
import { buildAlert, seedSavedAlerts } from "../helpers/alerts";

// Item 2 — componente visual: o CryptoCard mostra uma moeda e, se houver
// alertas salvos para ela, um contador que expande a lista de alvos.
// O AlertProvider é o real; só o AsyncStorage (limite externo) é mockado.

const bitcoin = cryptocurrencies.find((c) => c.id === "bitcoin") as Cryptocurrency;
const ethereum = cryptocurrencies.find((c) => c.id === "ethereum") as Cryptocurrency;

function renderCard(crypto: Cryptocurrency) {
  return render(<CryptoCard crypto={crypto} />, { wrapper: AlertProvider });
}

describe("CryptoCard", () => {
  it("mostra nome, símbolo, preço formatado e variação positiva com '+'", async () => {
    await renderCard(bitcoin);

    expect(screen.getByText("Bitcoin")).toBeOnTheScreen();
    expect(screen.getByText("BTC")).toBeOnTheScreen();
    expect(screen.getByText("$67,999.50")).toBeOnTheScreen();
    expect(screen.getByText("+2.45%")).toBeOnTheScreen();
    // Sem alertas salvos, não existe o botão de alertas.
    expect(screen.queryByRole("button")).not.toBeOnTheScreen();
  });

  it("mostra variação negativa e usa a inicial do símbolo quando a moeda não tem imagem", async () => {
    await renderCard({ ...ethereum, image: undefined });

    expect(screen.getByText("-1.23%")).toBeOnTheScreen();
    expect(screen.getByText("E")).toBeOnTheScreen();
  });

  it("mostra '1 alert' no singular quando existe um alerta salvo para a moeda", async () => {
    await seedSavedAlerts([buildAlert({ symbol: "BTC" })]);

    await renderCard(bitcoin);

    // findBy espera o AlertProvider terminar de ler o armazenamento (efeito assíncrono).
    expect(await screen.findByText("1 alert")).toBeOnTheScreen();
  });

  it("conta só os alertas da própria moeda, comparando por símbolo ou por nome", async () => {
    await seedSavedAlerts([
      buildAlert({ symbol: "BTC" }),
      buildAlert({ symbol: "XBT", cryptocurrency: "bitcoin" }), // mesmo nome, outro símbolo
      buildAlert({ symbol: "ETH", cryptocurrency: "Ethereum" }), // outra moeda
    ]);

    await renderCard(bitcoin);

    expect(await screen.findByText("2 alerts")).toBeOnTheScreen();
  });

  it("ao tocar no contador, expande a lista de alvos e, ao tocar de novo, recolhe", async () => {
    const user = userEvent.setup();
    await seedSavedAlerts([
      buildAlert({ condition: "above", targetPrice: 70000 }),
      buildAlert({ condition: "below", targetPrice: 60000 }),
    ]);
    await renderCard(bitcoin);
    const toggle = await screen.findByRole("button", {
      name: "Toggle alerts for this cryptocurrency",
    });
    expect(screen.queryByText("Above target")).not.toBeOnTheScreen();

    await user.press(toggle);

    expect(screen.getByText("Above target")).toBeOnTheScreen();
    expect(screen.getByText("$70,000.00")).toBeOnTheScreen();
    expect(screen.getByText("Below target")).toBeOnTheScreen();
    expect(screen.getByText("$60,000.00")).toBeOnTheScreen();

    await user.press(toggle);

    expect(screen.queryByText("Above target")).not.toBeOnTheScreen();
  });
});
