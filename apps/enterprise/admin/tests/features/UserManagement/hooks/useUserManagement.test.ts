import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useUserManagement } from '../../../../src/features/UserManagement/hooks/useUserManagement';
import { UserService } from '../../../../src/features/UserManagement/services/userService';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserType,
} from '../../../../src/features/UserManagement/types/index';

// Mock dependencies
vi.mock('../../../../src/features/UserManagement/services/userService');
vi.mock('../../../../src/shared/store/globalStore', () => ({
  useGlobalStore: () => ({
    addNotification: vi.fn(),
  }),
}));

const mockUserService = vi.mocked(UserService);

describe('useUserManagement', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'testuser1',
      email: 'test1@example.com',
      fullName: 'Test User 1',
      userType: 'developer',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      username: 'testuser2',
      email: 'test2@example.com',
      fullName: 'Test User 2',
      userType: 'client',
      isActive: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      // Arrange
      mockUserService.getUsers.mockResolvedValue({
        users: mockUsers,
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      const { result } = renderHook(() => useUserManagement());

      // Act
      await act(async () => {
        await result.current.fetchUsers();
      });

      // Assert
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockUserService.getUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch users error', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch users';
      mockUserService.getUsers.mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useUserManagement());

      // Act
      await act(async () => {
        await result.current.fetchUsers();
      });

      // Assert
      expect(result.current.users).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const newUserData: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        userType: 'developer',
        isActive: true,
      };
      const createdUser: User = {
        id: '3',
        username: 'newuser',
        email: 'newuser@example.com',
        fullName: 'New User',
        userType: 'developer',
        isActive: true,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      };

      mockUserService.createUser.mockResolvedValue(createdUser);
      mockUserService.getUsers.mockResolvedValue({
        users: [...mockUsers, createdUser],
        total: 3,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      const { result } = renderHook(() => useUserManagement());

      // Act
      await act(async () => {
        await result.current.createUser(newUserData);
      });

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(newUserData);
    });

    it('should handle create user error', async () => {
      // Arrange
      const newUserData: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        userType: 'developer',
        isActive: true,
      };
      const errorMessage = 'Failed to create user';
      mockUserService.createUser.mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useUserManagement());

      // Act
      await act(async () => {
        await result.current.createUser(newUserData);
      });

      // Assert
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = '1';
      const updateData: UpdateUserRequest = {
        username: 'updateduser',
        email: 'updated@example.com',
        userType: 'admin',
        isActive: false,
      };
      const updatedUser: User = {
        ...mockUsers[0],
        username: 'updateduser',
        email: 'updated@example.com',
        userType: 'admin',
        isActive: false,
        updatedAt: '2024-01-04T00:00:00Z',
      };

      mockUserService.updateUser.mockResolvedValue(updatedUser);
      mockUserService.getUsers.mockResolvedValue({
        users: [updatedUser, mockUsers[1]],
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      const { result } = renderHook(() => useUserManagement());

      // Act
      await act(async () => {
        await result.current.updateUser(userId, updateData);
      });

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = '1';
      mockUserService.deleteUser.mockResolvedValue();
      mockUserService.getUsers.mockResolvedValue({
        users: [mockUsers[1]],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      const { result } = renderHook(() => useUserManagement());

      // Act
      await act(async () => {
        await result.current.deleteUser(userId);
      });

      // Assert
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('selectUser', () => {
    it('should select user', () => {
      const { result } = renderHook(() => useUserManagement());

      act(() => {
        result.current.selectUser('1');
      });

      expect(result.current.selectedUsers).toContain('1');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useUserManagement());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});