// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Define test patterns
  testMatch: [
    // All tests including unit and integration
    "**/*.test.ts",
  ],
  // Setup for fetch-mock
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Allow for dotenv loading in tests
  setupFilesAfterEnv: ["dotenv/config"],
  // Test configurations for different run modes
  testPathIgnorePatterns: ["node_modules"],
};
