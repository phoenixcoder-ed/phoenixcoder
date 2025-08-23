import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 模拟Taro API
const mockTaro = {
    request: vi.fn(),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    showToast: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
};

// 设置全局Taro对象
Object.defineProperty(globalThis, 'Taro', {
    value: mockTaro,
    writable: true,
});

// 模拟请求工具类
class RequestUtil {
    private baseURL = 'https://api.phoenixcoder.com';
    private timeout = 10000;

    /**
     * 获取请求头，包含认证信息
     */
    private getHeaders() {
        const token = mockTaro.getStorageSync('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    /**
     * 处理请求响应
     */
    private handleResponse(response: any) {
        const { statusCode, data } = response;

        if (statusCode >= 200 && statusCode < 300) {
            if (data.code === 0) {
                return data.data;
            } else {
                throw new Error(data.message || '请求失败');
            }
        } else if (statusCode === 401) {
            // 清除token并跳转登录
            mockTaro.removeStorageSync('token');
            mockTaro.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
            });
            throw new Error('登录已过期');
        } else {
            throw new Error(`请求失败: ${statusCode}`);
        }
    }

    /**
     * 发送GET请求
     */
    async get(url: string, params?: Record<string, any>) {
        const queryString = params
            ? '?' +
              Object.entries(params)
                  .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                  .join('&')
            : '';

        const response = await mockTaro.request({
            url: this.baseURL + url + queryString,
            method: 'GET',
            header: this.getHeaders(),
            timeout: this.timeout,
        });

        return this.handleResponse(response);
    }

    /**
     * 发送POST请求
     */
    async post(url: string, data?: any) {
        const response = await mockTaro.request({
            url: this.baseURL + url,
            method: 'POST',
            header: this.getHeaders(),
            data: JSON.stringify(data),
            timeout: this.timeout,
        });

        return this.handleResponse(response);
    }

    /**
     * 发送PUT请求
     */
    async put(url: string, data?: any) {
        const response = await mockTaro.request({
            url: this.baseURL + url,
            method: 'PUT',
            header: this.getHeaders(),
            data: JSON.stringify(data),
            timeout: this.timeout,
        });

        return this.handleResponse(response);
    }

    /**
     * 发送DELETE请求
     */
    async delete(url: string) {
        const response = await mockTaro.request({
            url: this.baseURL + url,
            method: 'DELETE',
            header: this.getHeaders(),
            timeout: this.timeout,
        });

        return this.handleResponse(response);
    }

    /**
     * 上传文件
     */
    async upload(url: string, filePath: string, formData?: Record<string, any>) {
        const response = await mockTaro.request({
            url: this.baseURL + url,
            method: 'POST',
            header: {
                ...this.getHeaders(),
                'Content-Type': 'multipart/form-data',
            },
            data: {
                file: filePath,
                ...formData,
            },
            timeout: this.timeout,
        });

        return this.handleResponse(response);
    }
}

const request = new RequestUtil();

describe('RequestUtil 请求工具类测试', () => {
    beforeEach(() => {
        // 重置所有mock
        vi.clearAllMocks();

        // 设置默认的成功响应
        mockTaro.request.mockResolvedValue({
            statusCode: 200,
            data: {
                code: 0,
                message: 'success',
                data: { result: 'test data' },
            },
        });
    });

    afterEach(() => {
        // 清理存储
        mockTaro.removeStorageSync('token');
    });

    describe('请求头处理测试', () => {
        it('应该包含基本的Content-Type头', async () => {
            await request.get('/test');

            expect(mockTaro.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    header: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                }),
            );
        });

        it('应该在有token时包含Authorization头', async () => {
            const testToken = 'test-token-123';
            mockTaro.getStorageSync.mockReturnValue(testToken);

            await request.get('/test');

            expect(mockTaro.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    header: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${testToken}`,
                    }),
                }),
            );
        });

        it('应该在没有token时不包含Authorization头', async () => {
            mockTaro.getStorageSync.mockReturnValue('');

            await request.get('/test');

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.header).not.toHaveProperty('Authorization');
        });
    });

    describe('GET请求测试', () => {
        it('应该正确发送GET请求', async () => {
            const url = '/api/users';
            await request.get(url);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/users',
                method: 'GET',
                header: expect.any(Object),
                timeout: 10000,
            });
        });

        it('应该正确处理查询参数', async () => {
            const url = '/api/users';
            const params = { page: 1, size: 10, name: 'test user' };

            await request.get(url, params);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/users?page=1&size=10&name=test%20user',
                method: 'GET',
                header: expect.any(Object),
                timeout: 10000,
            });
        });

        it('应该正确返回响应数据', async () => {
            const expectedData = { users: [{ id: 1, name: 'test' }] };
            mockTaro.request.mockResolvedValue({
                statusCode: 200,
                data: {
                    code: 0,
                    message: 'success',
                    data: expectedData,
                },
            });

            const result = await request.get('/api/users');
            expect(result).toEqual(expectedData);
        });
    });

    describe('POST请求测试', () => {
        it('应该正确发送POST请求', async () => {
            const url = '/api/users';
            const data = { name: 'test user', email: 'test@example.com' };

            await request.post(url, data);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/users',
                method: 'POST',
                header: expect.any(Object),
                data: JSON.stringify(data),
                timeout: 10000,
            });
        });

        it('应该处理空数据的POST请求', async () => {
            const url = '/api/logout';

            await request.post(url);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/logout',
                method: 'POST',
                header: expect.any(Object),
                data: undefined, // 当没有数据时应该是 undefined
                timeout: 10000,
            });
        });
    });

    describe('PUT请求测试', () => {
        it('应该正确发送PUT请求', async () => {
            const url = '/api/users/1';
            const data = { name: 'updated user' };

            await request.put(url, data);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/users/1',
                method: 'PUT',
                header: expect.any(Object),
                data: JSON.stringify(data),
                timeout: 10000,
            });
        });
    });

    describe('DELETE请求测试', () => {
        it('应该正确发送DELETE请求', async () => {
            const url = '/api/users/1';

            await request.delete(url);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/users/1',
                method: 'DELETE',
                header: expect.any(Object),
                timeout: 10000,
            });
        });
    });

    describe('文件上传测试', () => {
        it('应该正确发送文件上传请求', async () => {
            const url = '/api/upload';
            const filePath = '/tmp/test.jpg';
            const formData = { type: 'avatar' };

            await request.upload(url, filePath, formData);

            expect(mockTaro.request).toHaveBeenCalledWith({
                url: 'https://api.phoenixcoder.com/api/upload',
                method: 'POST',
                header: expect.objectContaining({
                    'Content-Type': 'multipart/form-data',
                }),
                data: {
                    file: filePath,
                    type: 'avatar',
                },
                timeout: 10000,
            });
        });

        it('应该处理没有额外表单数据的文件上传', async () => {
            const url = '/api/upload';
            const filePath = '/tmp/test.jpg';

            await request.upload(url, filePath);

            expect(mockTaro.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        file: filePath,
                    },
                }),
            );
        });
    });

    describe('错误处理测试', () => {
        it('应该处理HTTP错误状态码', async () => {
            mockTaro.request.mockResolvedValue({
                statusCode: 500,
                data: { message: 'Internal Server Error' },
            });

            await expect(request.get('/api/test')).rejects.toThrow('请求失败: 500');
        });

        it('应该处理业务错误码', async () => {
            const errorMessage = '用户不存在';
            mockTaro.request.mockResolvedValue({
                statusCode: 200,
                data: {
                    code: 1001,
                    message: errorMessage,
                    data: null,
                },
            });

            await expect(request.get('/api/test')).rejects.toThrow(errorMessage);
        });

        it('应该处理401未授权错误', async () => {
            mockTaro.request.mockResolvedValue({
                statusCode: 401,
                data: { message: 'Unauthorized' },
            });

            await expect(request.get('/api/test')).rejects.toThrow('登录已过期');

            // 验证清除token和显示提示
            expect(mockTaro.removeStorageSync).toHaveBeenCalledWith('token');
            expect(mockTaro.showToast).toHaveBeenCalledWith({
                title: '登录已过期，请重新登录',
                icon: 'none',
            });
        });

        it('应该处理网络请求失败', async () => {
            const networkError = new Error('Network Error');
            mockTaro.request.mockRejectedValue(networkError);

            await expect(request.get('/api/test')).rejects.toThrow('Network Error');
        });

        it('应该处理没有错误消息的业务错误', async () => {
            mockTaro.request.mockResolvedValue({
                statusCode: 200,
                data: {
                    code: 1001,
                    data: null,
                },
            });

            await expect(request.get('/api/test')).rejects.toThrow('请求失败');
        });
    });

    describe('请求配置测试', () => {
        it('应该使用正确的baseURL', async () => {
            await request.get('/test');

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.url).toBe('https://api.phoenixcoder.com/test');
        });

        it('应该设置正确的超时时间', async () => {
            await request.get('/test');

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.timeout).toBe(10000);
        });

        it('应该正确设置请求方法', async () => {
            await request.get('/test');
            expect(mockTaro.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET' }));

            await request.post('/test');
            expect(mockTaro.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));

            await request.put('/test');
            expect(mockTaro.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }));

            await request.delete('/test');
            expect(mockTaro.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE' }));
        });
    });

    describe('数据序列化测试', () => {
        it('应该正确序列化POST数据', async () => {
            const data = { name: 'test', age: 25, active: true };
            await request.post('/test', data);

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.data).toBe(JSON.stringify(data));
        });

        it('应该正确序列化复杂对象', async () => {
            const data = {
                user: { name: 'test', profile: { age: 25 } },
                tags: ['tag1', 'tag2'],
                metadata: { created: new Date('2024-01-01') },
            };
            await request.post('/test', data);

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.data).toBe(JSON.stringify(data));
        });

        it('应该正确编码URL参数', async () => {
            const params = {
                search: 'hello world',
                filter: 'type=user&status=active',
                chinese: '中文测试',
            };
            await request.get('/test', params);

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.url).toContain('search=hello%20world');
            expect(callArgs.url).toContain('filter=type%3Duser%26status%3Dactive');
            expect(callArgs.url).toContain('chinese=%E4%B8%AD%E6%96%87%E6%B5%8B%E8%AF%95');
        });
    });

    describe('边界情况测试', () => {
        it('应该处理空URL', async () => {
            await request.get('');

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.url).toBe('https://api.phoenixcoder.com');
        });

        it('应该处理空参数对象', async () => {
            await request.get('/test', {});

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.url).toBe('https://api.phoenixcoder.com/test?');
        });

        it('应该处理null和undefined参数', async () => {
            const params = { a: null, b: undefined, c: 'valid' };
            await request.get('/test', params);

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.url).toContain('a=null');
            expect(callArgs.url).toContain('b=undefined');
            expect(callArgs.url).toContain('c=valid');
        });

        it('应该处理特殊字符的参数值', async () => {
            const params = { special: '!@#$%^&*()' };
            await request.get('/test', params);

            const callArgs = mockTaro.request.mock.calls[0][0];
            expect(callArgs.url).toContain('special=!%40%23%24%25%5E%26*()');
        });
    });
});
