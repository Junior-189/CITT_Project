/**
 * Jest configuration for CITT Server
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterSetup: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'repositories/**/*.js',
    'middleware/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  testTimeout: 30000,
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret_32_chars_long',
      JWT_ACCESS_EXPIRY: '15m',
      JWT_REFRESH_EXPIRY: '7d',
    },
  },
};
