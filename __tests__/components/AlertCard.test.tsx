import { render, screen, userEvent } from "@testing-library/react-native";
import { AlertCard } from "@components/AlertCard/AlertCard";
import { buildAlert } from "../helpers/alerts";

// Item 2 — componente visual: o AlertCard recebe um alerta por props
// e um callback onDelete. Testamos o que a pessoa usuária vê e pode fazer.

describe("AlertCard", () => {
  it("mostra o nome da criptomoeda e o preço-alvo formatado em dólar", async () => {
    await render(
      <AlertCard alert={buildAlert({ cryptocurrency: "Ethereum", targetPrice: 3850.5 })} onDelete={jest.fn()} />,
    );

    expect(screen.getByText("Ethereum")).toBeOnTheScreen();
    expect(screen.getByText("$3,850.50")).toBeOnTheScreen();
  });

  it("descreve a condição 'above' quando o alerta é para preço acima do alvo", async () => {
    await render(<AlertCard alert={buildAlert({ condition: "above" })} onDelete={jest.fn()} />);

    expect(screen.getByText("Alert when price goes above")).toBeOnTheScreen();
  });

  it("descreve a condição 'below' quando o alerta é para preço abaixo do alvo", async () => {
    await render(<AlertCard alert={buildAlert({ condition: "below" })} onDelete={jest.fn()} />);

    expect(screen.getByText("Alert when price goes below")).toBeOnTheScreen();
    expect(screen.queryByText("Alert when price goes above")).not.toBeOnTheScreen();
  });

  it("oferece um botão acessível para excluir o alerta", async () => {
    await render(<AlertCard alert={buildAlert()} onDelete={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Delete alert" })).toBeEnabled();
  });

  it("ao tocar em excluir, chama onDelete uma única vez com o id do alerta", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    await render(<AlertCard alert={buildAlert({ id: "alert-123" })} onDelete={onDelete} />);

    await user.press(screen.getByRole("button", { name: "Delete alert" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("alert-123");
  });
});
