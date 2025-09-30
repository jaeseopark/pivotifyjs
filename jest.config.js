export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true
      }
    ]
  },
  moduleNameMapper: {
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@testdata/(.*)$": "<rootDir>/test/data/$1"
  },
  setupFiles: ["<rootDir>/jest.setup.js"]
};
