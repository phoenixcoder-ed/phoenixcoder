/**
 * 小程序测试Mock配置
 *
 * 提供Taro小程序测试所需的API模拟和网络请求拦截功能
 */

import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { MiniUserFactory, MiniTaskFactory } from './factories';

// Taro API Mock配置
export const mockTaroAPIs = () => {
    // 模拟Taro全局对象
    global.Taro = {
        // 导航API
        navigateTo: vi.fn().mockResolvedValue({ errMsg: 'navigateTo:ok' }),
        redirectTo: vi.fn().mockResolvedValue({ errMsg: 'redirectTo:ok' }),
        switchTab: vi.fn().mockResolvedValue({ errMsg: 'switchTab:ok' }),
        navigateBack: vi.fn().mockResolvedValue({ errMsg: 'navigateBack:ok' }),
        reLaunch: vi.fn().mockResolvedValue({ errMsg: 'reLaunch:ok' }),

        // 存储API
        setStorage: vi.fn().mockResolvedValue({ errMsg: 'setStorage:ok' }),
        getStorage: vi.fn().mockImplementation(({ key }) => {
            const mockData: Record<string, any> = {
                user_token: 'mock_token_123',
                user_info: {
                    id: 'user_123',
                    nickname: '测试用户',
                    avatar: 'https://example.com/avatar.jpg',
                },
                app_settings: {
                    theme: 'light',
                    notifications: true,
                    language: 'zh-CN',
                },
            };
            return Promise.resolve({
                data: mockData[key],
                errMsg: 'getStorage:ok',
            });
        }),
        removeStorage: vi.fn().mockResolvedValue({ errMsg: 'removeStorage:ok' }),
        clearStorage: vi.fn().mockResolvedValue({ errMsg: 'clearStorage:ok' }),
        setStorageSync: vi.fn(),
        getStorageSync: vi.fn().mockImplementation((key: string) => {
            const mockData: Record<string, any> = {
                user_token: 'mock_token_123',
                user_info: {
                    id: 'user_123',
                    nickname: '测试用户',
                    avatar: 'https://example.com/avatar.jpg',
                },
            };
            return mockData[key];
        }),
        removeStorageSync: vi.fn(),
        clearStorageSync: vi.fn(),

        // 网络请求API
        request: vi.fn().mockImplementation(({ url, method: _method = 'GET', data: _data }) => {
            // 根据URL返回不同的模拟数据
            if (url.includes('/api/users')) {
                return Promise.resolve({
                    data: { code: 200, data: new MiniUserFactory().build(), message: 'success' },
                    statusCode: 200,
                    header: {},
                    errMsg: 'request:ok',
                });
            }
            if (url.includes('/api/tasks')) {
                return Promise.resolve({
                    data: {
                        code: 200,
                        data: {
                            list: new MiniTaskFactory().buildList(10),
                            total: 100,
                            page: 1,
                            pageSize: 10,
                        },
                        message: 'success',
                    },
                    statusCode: 200,
                    header: {},
                    errMsg: 'request:ok',
                });
            }
            return Promise.resolve({
                data: { code: 200, data: null, message: 'success' },
                statusCode: 200,
                header: {},
                errMsg: 'request:ok',
            });
        }),

        // 上传文件API
        uploadFile: vi.fn().mockResolvedValue({
            data: JSON.stringify({
                code: 200,
                data: {
                    url: 'https://example.com/uploaded-file.jpg',
                    filename: 'test-file.jpg',
                    size: 1024000,
                },
                message: 'upload success',
            }),
            statusCode: 200,
            errMsg: 'uploadFile:ok',
        }),

        // 下载文件API
        downloadFile: vi.fn().mockResolvedValue({
            tempFilePath: '/tmp/downloaded-file.jpg',
            statusCode: 200,
            errMsg: 'downloadFile:ok',
        }),

        // 界面API
        showToast: vi.fn().mockResolvedValue({ errMsg: 'showToast:ok' }),
        hideToast: vi.fn().mockResolvedValue({ errMsg: 'hideToast:ok' }),
        showModal: vi
            .fn()
            .mockImplementation(({ title: _title, content: _content, showCancel: _showCancel = true }) => {
                return Promise.resolve({
                    confirm: true,
                    cancel: false,
                    errMsg: 'showModal:ok',
                });
            }),
        showLoading: vi.fn().mockResolvedValue({ errMsg: 'showLoading:ok' }),
        hideLoading: vi.fn().mockResolvedValue({ errMsg: 'hideLoading:ok' }),
        showActionSheet: vi.fn().mockResolvedValue({
            tapIndex: 0,
            errMsg: 'showActionSheet:ok',
        }),

        // 设备信息API
        getSystemInfo: vi.fn().mockResolvedValue({
            brand: 'iPhone',
            model: 'iPhone 13',
            pixelRatio: 3,
            screenWidth: 390,
            screenHeight: 844,
            windowWidth: 390,
            windowHeight: 844,
            statusBarHeight: 44,
            language: 'zh_CN',
            version: '8.0.5',
            system: 'iOS 15.0',
            platform: 'ios',
            fontSizeSetting: 16,
            SDKVersion: '2.19.4',
            benchmarkLevel: 1,
            albumAuthorized: true,
            cameraAuthorized: true,
            locationAuthorized: true,
            microphoneAuthorized: true,
            notificationAuthorized: true,
            bluetoothEnabled: true,
            locationEnabled: true,
            wifiEnabled: true,
            safeArea: {
                left: 0,
                right: 390,
                top: 44,
                bottom: 810,
                width: 390,
                height: 766,
            },
            errMsg: 'getSystemInfo:ok',
        }),

        // 用户信息API
        getUserInfo: vi.fn().mockResolvedValue({
            userInfo: {
                nickName: '测试用户',
                avatarUrl: 'https://example.com/avatar.jpg',
                gender: 1,
                city: '深圳',
                province: '广东',
                country: '中国',
                language: 'zh_CN',
            },
            rawData:
                '{"nickName":"测试用户","gender":1,"language":"zh_CN","city":"深圳","province":"广东","country":"中国","avatarUrl":"https://example.com/avatar.jpg"}',
            signature: 'mock_signature',
            encryptedData: 'mock_encrypted_data',
            iv: 'mock_iv',
            errMsg: 'getUserInfo:ok',
        }),

        getUserProfile: vi.fn().mockResolvedValue({
            userInfo: {
                nickName: '测试用户',
                avatarUrl: 'https://example.com/avatar.jpg',
                gender: 1,
                city: '深圳',
                province: '广东',
                country: '中国',
                language: 'zh_CN',
            },
            rawData:
                '{"nickName":"测试用户","gender":1,"language":"zh_CN","city":"深圳","province":"广东","country":"中国","avatarUrl":"https://example.com/avatar.jpg"}',
            signature: 'mock_signature',
            encryptedData: 'mock_encrypted_data',
            iv: 'mock_iv',
            errMsg: 'getUserProfile:ok',
        }),

        // 登录API
        login: vi.fn().mockResolvedValue({
            code: 'mock_login_code_123',
            errMsg: 'login:ok',
        }),

        checkSession: vi.fn().mockResolvedValue({ errMsg: 'checkSession:ok' }),

        // 支付API
        requestPayment: vi.fn().mockResolvedValue({ errMsg: 'requestPayment:ok' }),

        // 分享API
        showShareMenu: vi.fn().mockResolvedValue({ errMsg: 'showShareMenu:ok' }),
        hideShareMenu: vi.fn().mockResolvedValue({ errMsg: 'hideShareMenu:ok' }),
        updateShareMenu: vi.fn().mockResolvedValue({ errMsg: 'updateShareMenu:ok' }),
        getShareInfo: vi.fn().mockResolvedValue({
            encryptedData: 'mock_encrypted_data',
            iv: 'mock_iv',
            errMsg: 'getShareInfo:ok',
        }),

        // 位置API
        getLocation: vi.fn().mockResolvedValue({
            latitude: 22.5431,
            longitude: 114.0579,
            speed: 0,
            accuracy: 5,
            altitude: 0,
            verticalAccuracy: 5,
            horizontalAccuracy: 5,
            errMsg: 'getLocation:ok',
        }),

        chooseLocation: vi.fn().mockResolvedValue({
            name: '腾讯大厦',
            address: '广东省深圳市南山区科技中一路腾讯大厦',
            latitude: 22.5431,
            longitude: 114.0579,
            errMsg: 'chooseLocation:ok',
        }),

        // 相机和相册API
        chooseImage: vi.fn().mockResolvedValue({
            tempFilePaths: ['temp://image1.jpg', 'temp://image2.jpg'],
            tempFiles: [
                { path: 'temp://image1.jpg', size: 1024000 },
                { path: 'temp://image2.jpg', size: 2048000 },
            ],
            errMsg: 'chooseImage:ok',
        }),

        previewImage: vi.fn().mockResolvedValue({ errMsg: 'previewImage:ok' }),

        // 录音API
        startRecord: vi.fn().mockResolvedValue({ errMsg: 'startRecord:ok' }),
        stopRecord: vi.fn().mockResolvedValue({
            tempFilePath: 'temp://record.mp3',
            errMsg: 'stopRecord:ok',
        }),

        // 音频播放API
        playVoice: vi.fn().mockResolvedValue({ errMsg: 'playVoice:ok' }),
        pauseVoice: vi.fn().mockResolvedValue({ errMsg: 'pauseVoice:ok' }),
        stopVoice: vi.fn().mockResolvedValue({ errMsg: 'stopVoice:ok' }),

        // 背景音频API
        getBackgroundAudioManager: vi.fn().mockReturnValue({
            duration: 0,
            currentTime: 0,
            paused: true,
            src: '',
            startTime: 0,
            buffered: 0,
            title: '',
            epname: '',
            singer: '',
            coverImgUrl: '',
            webUrl: '',
            protocol: 'http',
            play: vi.fn(),
            pause: vi.fn(),
            stop: vi.fn(),
            seek: vi.fn(),
            onCanplay: vi.fn(),
            onPlay: vi.fn(),
            onPause: vi.fn(),
            onStop: vi.fn(),
            onEnded: vi.fn(),
            onTimeUpdate: vi.fn(),
            onPrev: vi.fn(),
            onNext: vi.fn(),
            onError: vi.fn(),
            onWaiting: vi.fn(),
        }),

        // 视频API
        chooseVideo: vi.fn().mockResolvedValue({
            tempFilePath: 'temp://video.mp4',
            duration: 30,
            size: 10240000,
            height: 1920,
            width: 1080,
            errMsg: 'chooseVideo:ok',
        }),

        // 文件API
        saveFile: vi.fn().mockResolvedValue({
            savedFilePath: 'saved://file.jpg',
            errMsg: 'saveFile:ok',
        }),

        getSavedFileList: vi.fn().mockResolvedValue({
            fileList: [
                {
                    filePath: 'saved://file1.jpg',
                    createTime: Date.now(),
                    size: 1024000,
                },
            ],
            errMsg: 'getSavedFileList:ok',
        }),

        getSavedFileInfo: vi.fn().mockResolvedValue({
            size: 1024000,
            createTime: Date.now(),
            errMsg: 'getSavedFileInfo:ok',
        }),

        removeSavedFile: vi.fn().mockResolvedValue({ errMsg: 'removeSavedFile:ok' }),

        // 剪贴板API
        setClipboardData: vi.fn().mockResolvedValue({ errMsg: 'setClipboardData:ok' }),
        getClipboardData: vi.fn().mockResolvedValue({
            data: 'clipboard content',
            errMsg: 'getClipboardData:ok',
        }),

        // 蓝牙API
        openBluetoothAdapter: vi.fn().mockResolvedValue({ errMsg: 'openBluetoothAdapter:ok' }),
        closeBluetoothAdapter: vi.fn().mockResolvedValue({ errMsg: 'closeBluetoothAdapter:ok' }),
        getBluetoothAdapterState: vi.fn().mockResolvedValue({
            discovering: false,
            available: true,
            errMsg: 'getBluetoothAdapterState:ok',
        }),

        // WiFi API
        startWifi: vi.fn().mockResolvedValue({ errMsg: 'startWifi:ok' }),
        stopWifi: vi.fn().mockResolvedValue({ errMsg: 'stopWifi:ok' }),
        getWifiList: vi.fn().mockResolvedValue({
            wifiList: [
                {
                    SSID: 'TestWiFi',
                    BSSID: '00:11:22:33:44:55',
                    secure: true,
                    signalStrength: 80,
                },
            ],
            errMsg: 'getWifiList:ok',
        }),

        // 环境变量
        env: {
            USER_DATA_PATH: '/mock/user/data/path',
        },

        // 事件中心
        eventCenter: {
            on: vi.fn(),
            off: vi.fn(),
            trigger: vi.fn(),
        },

        // 页面生命周期
        getCurrentInstance: vi.fn().mockReturnValue({
            page: {
                route: 'pages/index/index',
                options: {},
            },
            router: {
                params: {},
            },
        }),

        // 小程序生命周期
        getLaunchOptionsSync: vi.fn().mockReturnValue({
            path: 'pages/index/index',
            scene: 1001,
            query: {},
            shareTicket: '',
            referrerInfo: {},
        }),

        getEnterOptionsSync: vi.fn().mockReturnValue({
            path: 'pages/index/index',
            scene: 1001,
            query: {},
            shareTicket: '',
            referrerInfo: {},
        }),
    };

    // 模拟Taro组件
    global.View = 'view';
    global.Text = 'text';
    global.Button = 'button';
    global.Image = 'image';
    global.ScrollView = 'scroll-view';
    global.Swiper = 'swiper';
    global.SwiperItem = 'swiper-item';
    global.Navigator = 'navigator';
    global.Input = 'input';
    global.Textarea = 'textarea';
    global.Picker = 'picker';
    global.PickerView = 'picker-view';
    global.PickerViewColumn = 'picker-view-column';
    global.Slider = 'slider';
    global.Switch = 'switch';
    global.Checkbox = 'checkbox';
    global.CheckboxGroup = 'checkbox-group';
    global.Radio = 'radio';
    global.RadioGroup = 'radio-group';
    global.Form = 'form';
    global.Label = 'label';

    return global.Taro;
};

// MSW服务器配置
const testData = generateMiniTestData('default', 'medium');

export const handlers = [
    // 用户相关API
    http.get('/api/users/profile', () => {
        return HttpResponse.json({
            code: 200,
            data: testData.users[0],
            message: 'success',
        });
    }),

    http.put('/api/users/profile', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            code: 200,
            data: { ...testData.users[0], ...body },
            message: 'success',
        });
    }),

    http.post('/api/users/login', async ({ request: _request }) => {
        // const _body = await request.json();
        return HttpResponse.json({
            code: 200,
            data: {
                token: 'mock_jwt_token_123',
                user: testData.users[0],
                expiresIn: 7200,
            },
            message: 'success',
        });
    }),

    http.post('/api/users/logout', () => {
        return HttpResponse.json({
            code: 200,
            data: null,
            message: 'success',
        });
    }),

    // 任务相关API
    http.get('/api/tasks', ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
        const category = url.searchParams.get('category');
        const difficulty = url.searchParams.get('difficulty');
        const status = url.searchParams.get('status');

        let filteredTasks = testData.tasks;

        if (category) {
            filteredTasks = filteredTasks.filter((task) => task.category === category);
        }
        if (difficulty) {
            filteredTasks = filteredTasks.filter((task) => task.difficulty === difficulty);
        }
        if (status) {
            filteredTasks = filteredTasks.filter((task) => task.status === status);
        }

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedTasks = filteredTasks.slice(start, end);

        return HttpResponse.json({
            code: 200,
            data: {
                list: paginatedTasks,
                total: filteredTasks.length,
                page,
                pageSize,
                totalPages: Math.ceil(filteredTasks.length / pageSize),
            },
            message: 'success',
        });
    }),

    http.get('/api/tasks/:id', ({ params: _params }) => {
        const task = testData.tasks.find((t) => t.id === _params.id);
        if (!task) {
            return HttpResponse.json({ code: 404, data: null, message: 'Task not found' }, { status: 404 });
        }
        return HttpResponse.json({
            code: 200,
            data: task,
            message: 'success',
        });
    }),

    http.post('/api/tasks', async ({ request: _request }) => {
        // const _body = await _request.json();
        // const newTask = new MiniTaskFactory().build(_body);
        return HttpResponse.json({
            code: 200,
            data: newTask,
            message: 'success',
        });
    }),

    http.put('/api/tasks/:id', async ({ params: _params, request }) => {
        const _body = await request.json();
        const task = testData.tasks.find((t) => t.id === _params.id);
        if (!task) {
            return HttpResponse.json({ code: 404, data: null, message: 'Task not found' }, { status: 404 });
        }
        const updatedTask = { ...task, ..._body, updatedAt: new Date().toISOString() };
        return HttpResponse.json({
            code: 200,
            data: updatedTask,
            message: 'success',
        });
    }),

    http.delete('/api/tasks/:id', ({ params }) => {
        const taskIndex = testData.tasks.findIndex((t) => t.id === params.id);
        if (taskIndex === -1) {
            return HttpResponse.json({ code: 404, data: null, message: 'Task not found' }, { status: 404 });
        }
        testData.tasks.splice(taskIndex, 1);
        return HttpResponse.json({
            code: 200,
            data: null,
            message: 'success',
        });
    }),

    // 申请相关API
    http.get('/api/applications', ({ request }) => {
        const url = new URL(request.url);
        const taskId = url.searchParams.get('taskId');
        const userId = url.searchParams.get('userId');

        let filteredApplications = testData.applications || [];

        if (taskId) {
            filteredApplications = filteredApplications.filter((app) => app.taskId === taskId);
        }
        if (userId) {
            filteredApplications = filteredApplications.filter((app) => app.applicant.id === userId);
        }

        return HttpResponse.json({
            code: 200,
            data: {
                list: filteredApplications,
                total: filteredApplications.length,
            },
            message: 'success',
        });
    }),

    http.post('/api/applications', async ({ request }) => {
        const body = await request.json();
        const newApplication = new MiniApplicationFactory().build(body);
        return HttpResponse.json({
            code: 200,
            data: newApplication,
            message: 'success',
        });
    }),

    http.put('/api/applications/:id', async ({ params, request }) => {
        const body = await request.json();
        const application = (testData.applications || []).find((app) => app.id === params.id);
        if (!application) {
            return HttpResponse.json({ code: 404, data: null, message: 'Application not found' }, { status: 404 });
        }
        const updatedApplication = { ...application, ...body, updatedAt: new Date().toISOString() };
        return HttpResponse.json({
            code: 200,
            data: updatedApplication,
            message: 'success',
        });
    }),

    // 挑战相关API
    http.get('/api/challenges', ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const status = url.searchParams.get('status');

        let filteredChallenges = testData.challenges;

        if (type) {
            filteredChallenges = filteredChallenges.filter((challenge) => challenge.type === type);
        }
        if (status) {
            filteredChallenges = filteredChallenges.filter((challenge) => challenge.status === status);
        }

        return HttpResponse.json({
            code: 200,
            data: {
                list: filteredChallenges,
                total: filteredChallenges.length,
            },
            message: 'success',
        });
    }),

    http.get('/api/challenges/:id', ({ params }) => {
        const challenge = testData.challenges.find((c) => c.id === params.id);
        if (!challenge) {
            return HttpResponse.json({ code: 404, data: null, message: 'Challenge not found' }, { status: 404 });
        }
        return HttpResponse.json({
            code: 200,
            data: challenge,
            message: 'success',
        });
    }),

    http.post('/api/challenges/:id/join', ({ params: _params }) => {
        return HttpResponse.json({
            code: 200,
            data: { joined: true },
            message: 'success',
        });
    }),

    http.post('/api/challenges/:id/complete', async ({ params: _params, request: _request }) => {
        // const _body = await request.json();
        return HttpResponse.json({
            code: 200,
            data: {
                completed: true,
                rewards: {
                    experience: 100,
                    coins: 50,
                    badges: ['挑战完成者'],
                },
            },
            message: 'success',
        });
    }),

    // 徽章相关API
    http.get('/api/badges', () => {
        return HttpResponse.json({
            code: 200,
            data: {
                list: testData.badges,
                total: testData.badges.length,
            },
            message: 'success',
        });
    }),

    http.get('/api/users/:userId/badges', ({ params: _params }) => {
        const userBadges = testData.badges.filter((badge) => badge.unlockedAt);
        return HttpResponse.json({
            code: 200,
            data: {
                list: userBadges,
                total: userBadges.length,
            },
            message: 'success',
        });
    }),

    // 通知相关API
    http.get('/api/notifications', ({ request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const isRead = url.searchParams.get('isRead');

        let filteredNotifications = testData.notifications;

        if (userId) {
            filteredNotifications = filteredNotifications.filter((notif) => notif.userId === userId);
        }
        if (isRead !== null) {
            filteredNotifications = filteredNotifications.filter((notif) => notif.isRead === (isRead === 'true'));
        }

        return HttpResponse.json({
            code: 200,
            data: {
                list: filteredNotifications,
                total: filteredNotifications.length,
                unreadCount: filteredNotifications.filter((n) => !n.isRead).length,
            },
            message: 'success',
        });
    }),

    http.put('/api/notifications/:id/read', ({ params: _params }) => {
        return HttpResponse.json({
            code: 200,
            data: { read: true },
            message: 'success',
        });
    }),

    http.put('/api/notifications/read-all', () => {
        return HttpResponse.json({
            code: 200,
            data: { readCount: 10 },
            message: 'success',
        });
    }),

    // 消息相关API
    http.get('/api/messages', ({ request }) => {
        const url = new URL(request.url);
        const conversationId = url.searchParams.get('conversationId');

        let filteredMessages = testData.messages || [];

        if (conversationId) {
            filteredMessages = filteredMessages.filter((msg) => msg.conversationId === conversationId);
        }

        return HttpResponse.json({
            code: 200,
            data: {
                list: filteredMessages,
                total: filteredMessages.length,
            },
            message: 'success',
        });
    }),

    http.post('/api/messages', async ({ request }) => {
        const _body = await request.json();
        const newMessage = new MiniMessageFactory().build(_body);
        return HttpResponse.json({
            code: 200,
            data: newMessage,
            message: 'success',
        });
    }),

    // 文件上传API
    http.post('/api/upload', async ({ request: _request }) => {
        // 模拟文件上传
        return HttpResponse.json({
            code: 200,
            data: {
                url: 'https://example.com/uploaded-file.jpg',
                filename: 'uploaded-file.jpg',
                size: 1024000,
                type: 'image/jpeg',
            },
            message: 'success',
        });
    }),

    // 统计相关API
    http.get('/api/stats/overview', () => {
        return HttpResponse.json({
            code: 200,
            data: {
                totalTasks: testData.tasks.length,
                completedTasks: testData.tasks.filter((t) => t.status === 'completed').length,
                totalUsers: testData.users.length,
                totalApplications: (testData.applications || []).length,
                activeChallenges: testData.challenges.filter((c) => c.status === 'active').length,
            },
            message: 'success',
        });
    }),

    // 搜索API
    http.get('/api/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q') || '';
        const type = url.searchParams.get('type') || 'all';

        const results: any = {};

        if (type === 'all' || type === 'tasks') {
            results.tasks = testData.tasks
                .filter(
                    (task) =>
                        task.title.toLowerCase().includes(query.toLowerCase()) ||
                        task.description.toLowerCase().includes(query.toLowerCase()),
                )
                .slice(0, 10);
        }

        if (type === 'all' || type === 'users') {
            results.users = testData.users
                .filter((user) => user.nickname.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 10);
        }

        if (type === 'all' || type === 'challenges') {
            results.challenges = testData.challenges
                .filter((challenge) => challenge.title.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 10);
        }

        return HttpResponse.json({
            code: 200,
            data: results,
            message: 'success',
        });
    }),

    // 错误处理示例
    http.get('/api/error/500', () => {
        return HttpResponse.json({ code: 500, data: null, message: 'Internal Server Error' }, { status: 500 });
    }),

    http.get('/api/error/timeout', () => {
        return new Promise(() => {
            // 永不resolve，模拟超时
        });
    }),
];

// 创建MSW服务器
export const server = setupServer(...handlers);

// 测试工具函数
export const testUtils = {
    /**
     * 等待异步操作完成
     */
    async waitFor(callback: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const result = await callback();
                if (result) {
                    return;
                }
            } catch {
                // 继续等待
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        throw new Error(`Timeout after ${timeout}ms`);
    },

    /**
     * 模拟用户输入
     */
    async simulateInput(element: HTMLElement, value: string): Promise<void> {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    },

    /**
     * 模拟用户点击
     */
    async simulateClick(element: HTMLElement): Promise<void> {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },

    /**
     * 模拟触摸事件
     */
    async simulateTouch(element: HTMLElement, type: 'touchstart' | 'touchend' | 'touchmove'): Promise<void> {
        element.dispatchEvent(new TouchEvent(type, { bubbles: true }));
    },

    /**
     * 模拟滑动事件
     */
    async simulateSwipe(element: HTMLElement, _direction: 'left' | 'right' | 'up' | 'down'): Promise<void> {
        const startEvent = new TouchEvent('touchstart', { bubbles: true });
        const endEvent = new TouchEvent('touchend', { bubbles: true });

        element.dispatchEvent(startEvent);
        await new Promise((resolve) => setTimeout(resolve, 100));
        element.dispatchEvent(endEvent);
    },

    /**
     * 重置所有Mock
     */
    resetMocks(): void {
        vi.clearAllMocks();
        server.resetHandlers();
    },

    /**
     * 模拟网络延迟
     */
    async simulateNetworkDelay(ms: number = 1000): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, ms));
    },

    /**
     * 模拟网络错误
     */
    simulateNetworkError(url: string, status: number = 500): void {
        server.use(
            http.get(url, () => {
                return HttpResponse.json({ code: status, data: null, message: 'Network Error' }, { status });
            }),
        );
    },

    /**
     * 创建模拟组件
     */
    createMockComponent(name: string, props: any = {}): any {
        return vi.fn().mockImplementation((componentProps) => {
            return {
                type: name,
                props: { ...props, ...componentProps },
                children: [],
            };
        });
    },

    /**
     * 模拟页面路由
     */
    mockPageRoute(route: string, params: any = {}): void {
        if (global.Taro && global.Taro.getCurrentInstance) {
            global.Taro.getCurrentInstance.mockReturnValue({
                page: {
                    route,
                    options: params,
                },
                router: {
                    params,
                },
            });
        }
    },

    /**
     * 模拟小程序启动参数
     */
    mockLaunchOptions(options: any): void {
        if (global.Taro && global.Taro.getLaunchOptionsSync) {
            global.Taro.getLaunchOptionsSync.mockReturnValue(options);
        }
    },

    /**
     * 模拟系统信息
     */
    mockSystemInfo(info: any): void {
        if (global.Taro && global.Taro.getSystemInfo) {
            global.Taro.getSystemInfo.mockResolvedValue({
                errMsg: 'getSystemInfo:ok',
                ...info,
            });
        }
    },
};

// 导出Mock配置
export { mockTaroAPIs, server, handlers, testUtils };

// 默认导出
export default {
    mockTaroAPIs,
    server,
    handlers,
    testUtils,
    testData,
};
