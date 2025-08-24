// Jest setup file for shared-services package

// Global test configuration
jest.setTimeout(10000);

// Setup global test utilities
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Global test helpers
declare global {
  var testHelpers: {
    createMockDate: (dateString: string) => Date;
    createMockId: () => string;
  };
}

global.testHelpers = {
  createMockDate: (dateString: string) => new Date(dateString),
  createMockId: () => 'test-id-' + Math.random().toString(36).substr(2, 9),
};

// Export for use in tests
export {};