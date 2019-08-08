module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.stories.*',
    '!**/types.tsx',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 45,
      lines: 55,
      statements: 55,
    },
  },
};
