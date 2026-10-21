import { formatChange, formatPrice } from "@utils/index";

// Item 1 — funções puras: mesma entrada sempre gera a mesma saída,
// sem tocar em tela, rede ou armazenamento. Por isso não precisam de mock.

describe("formatPrice", () => {
  it("formata com separador de milhar e duas casas decimais por padrão", () => {
    expect(formatPrice(67999.5)).toBe("67,999.50");
    expect(formatPrice(1234567.891)).toBe("1,234,567.89");
  });

  it("respeita a quantidade de casas decimais informada e arredonda o excedente", () => {
    expect(formatPrice(0.123456, 4)).toBe("0.1235");
    expect(formatPrice(3850.25, 0)).toBe("3,850");
  });

  it("trata os limites: zero, frações menores que um centavo e valores negativos", () => {
    expect(formatPrice(0)).toBe("0.00");
    expect(formatPrice(0.005)).toBe("0.01");
    expect(formatPrice(0.004)).toBe("0.00");
    expect(formatPrice(-1500)).toBe("-1,500.00");
  });
});

describe("formatChange", () => {
  it("prefixa variações positivas e zero com '+' e mantém o '-' nas negativas", () => {
    expect(formatChange(2.45)).toBe("+2.45%");
    expect(formatChange(0)).toBe("+0.00%");
    expect(formatChange(-1.23)).toBe("-1.23%");
    // Limite: uma queda menor que 0,005% arredonda para zero, mas o sinal continua negativo.
    expect(formatChange(-0.004)).toBe("-0.00%");
  });
});

describe("entradas inválidas", () => {
  it("não lança erro com NaN ou Infinity e devolve um texto previsível", () => {
    expect(formatPrice(NaN)).toBe("NaN");
    expect(formatPrice(Infinity)).toBe("∞");
    expect(formatChange(NaN)).toBe("NaN%");
    expect(formatChange(Infinity)).toBe("+Infinity%");
  });
});
