// jest.setup.js
const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

// Make sure we can load environment variables
require("dotenv").config();

// Setup global fetch mock but keep real fetch available
global.realFetch = global.fetch;

// Jest functions are available in test files, not in setup files
// We'll just make sure the mock is enabled
