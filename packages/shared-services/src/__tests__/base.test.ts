import { BaseService } from '../base/BaseService';
import { ServiceError, ServiceErrorType } from '../types/ServiceError';
import type { ServiceConfig } from '../types/ServiceConfig';

// Mock implementation for testing
class TestService extends BaseService {
  constructor() {
    const config: ServiceConfig = {
      debug: false
    };
    super(config, 'TestService', '1.0.0');
  }

  async testMethod(): Promise<string> {
    this.ensureInitialized();
    return 'test result';
  }

  async testErrorMethod(): Promise<void> {
    throw new ServiceError({
      message: 'Test error',
      code: 'TEST_ERROR',
      type: ServiceErrorType.BUSINESS_LOGIC
    });
  }
}

describe('BaseService', () => {
  let testService: TestService;

  beforeEach(() => {
    testService = new TestService();
  });

  afterEach(() => {
    testService.destroy();
  });

  describe('initialization', () => {
    it('should initialize with correct config', async () => {
      await testService.initialize();
      const info = testService.getInfo();
      expect(info.name).toBe('TestService');
      expect(info.version).toBe('1.0.0');
      expect(info.initialized).toBe(true);
    });

    it('should have correct initial state', async () => {
      await testService.initialize();
      const info = testService.getInfo();
      expect(info.initialized).toBe(true);
      expect(info.destroyed).toBe(false);
    });
  });

  describe('service methods', () => {
    it('should execute test method successfully', async () => {
      await testService.initialize();
      const result = await testService.testMethod();
      expect(result).toBe('test result');
    });

    it('should handle service errors', async () => {
      await expect(testService.testErrorMethod()).rejects.toThrow('Test error');
    });
  });

  describe('health check', () => {
    it('should return healthy status', async () => {
      await testService.initialize();
      const health = await testService.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.details?.service).toBe('TestService');
    });

    it('should return unhealthy status when not initialized', async () => {
      const health = await testService.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.details?.initialized).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('should destroy service properly', async () => {
      await testService.initialize();
      await testService.destroy();
      const info = testService.getInfo();
      expect(info.destroyed).toBe(true);
      expect(info.initialized).toBe(false);
    });
  });
});