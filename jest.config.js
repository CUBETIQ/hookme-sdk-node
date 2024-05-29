module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy"
  }
};
