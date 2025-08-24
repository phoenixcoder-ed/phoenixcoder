import { AuthUser, LoginRequest, RegisterRequest } from '../src/auth';
import { NotificationConfig, NotificationTemplate } from '../src/notification';

describe('Shared Types', () => {
  describe('Auth Types', () => {
    it('should create valid AuthUser object', () => {
      const user: AuthUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
    });

    it('should create valid LoginRequest object', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      expect(loginRequest.email).toBe('test@example.com');
      expect(loginRequest.password).toBe('password123');
    });

    it('should create valid RegisterRequest object', () => {
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };

      expect(registerRequest.email).toBe('test@example.com');
      expect(registerRequest.username).toBe('testuser');
    });
  });

  describe('Notification Types', () => {
    it('should create valid NotificationConfig object', () => {
      const config: NotificationConfig = {
        id: 'config-1',
        name: 'Test Config',
        type: 'email',
        isEnabled: true,
        settings: {
          smtpHost: 'smtp.example.com',
          smtpPort: 587
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(config.id).toBe('config-1');
      expect(config.type).toBe('email');
      expect(config.isEnabled).toBe(true);
    });

    it('should create valid NotificationTemplate object', () => {
      const template: NotificationTemplate = {
        id: 'template-1',
        name: 'Welcome Email',
        type: 'email',
        subject: 'Welcome!',
        content: 'Welcome to our platform!',
        variables: ['username', 'email'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(template.id).toBe('template-1');
      expect(template.name).toBe('Welcome Email');
      expect(template.type).toBe('email');
      expect(template.variables).toContain('username');
    });
  });
});