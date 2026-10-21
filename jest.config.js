/** @type {import('jest').Config} */
module.exports = {
  // Preset do Expo: transforma TS/JSX com Babel, simula os módulos nativos,
  // já converte os aliases do tsconfig (@components/*, @utils/*...) e define
  // quais pacotes de node_modules precisam passar pelo Babel.
  preset: "jest-expo",

  // Só arquivos *.test.ts(x) dentro de __tests__ são testes.
  // Assim podemos ter helpers em __tests__/helpers sem o Jest tentar rodá-los.
  testMatch: ["<rootDir>/__tests__/**/*.test.[jt]s?(x)"],

  // Roda antes de cada arquivo de teste (mocks globais de limites externos).
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Zera o histórico de chamadas dos mocks entre um teste e outro.
  clearMocks: true,

  // Mede a cobertura de todo o src, inclusive arquivos que nenhum teste importa.
  // Ficam de fora só arquivos sem lógica (estilos e tokens de tema).
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.styles.ts",
    "!src/theme/**",
    "!src/constants/**",
  ],
  coverageReporters: ["text", "text-summary", "html", "json-summary"],

  // A atividade exige no mínimo 50%: abaixo disso, `npm run test:coverage` falha.
  coverageThreshold: {
    global: { statements: 50, branches: 50, functions: 50, lines: 50 },
  },
};
