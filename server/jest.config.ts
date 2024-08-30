module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],  // Pattern to find test files,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',  // Adjust this path based on your project structure
    },
};
