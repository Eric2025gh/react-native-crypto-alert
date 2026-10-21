import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PriceAlert } from "@context/AlertProvider/useAlertProvider";

// Mesma chave usada pelo AlertProvider para salvar os alertas no dispositivo.
export const ALERTS_STORAGE_KEY = "cryptoAlerts";

let nextId = 1;

/** Cria um alerta válido; o teste sobrescreve só o que importa para ele. */
export function buildAlert(overrides: Partial<PriceAlert> = {}): PriceAlert {
  return {
    id: `alert-${nextId++}`,
    cryptocurrency: "Bitcoin",
    symbol: "BTC",
    targetPrice: 70000,
    condition: "above",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Simula alertas que a pessoa usuária salvou numa sessão anterior do app. */
export async function seedSavedAlerts(alerts: PriceAlert[]) {
  await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

/** Lê o que o app gravou no armazenamento (mockado) do dispositivo. */
export async function readSavedAlerts(): Promise<PriceAlert[]> {
  const stored = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as PriceAlert[]) : [];
}
