// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Define test patterns
  testMatch: [
    // Unit tests
    "**/*.test.ts",
    // Do not include integration tests when running regular tests
    "!**/*.integration.test.ts"
  ],
};
