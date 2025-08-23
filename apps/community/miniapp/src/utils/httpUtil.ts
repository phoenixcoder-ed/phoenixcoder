import { taroRequest } from './request';

// 使用命名空间包装所有函数以避免重复声明问题
export namespace HttpUtil {
    /**
     * 邮箱登录验证
     * @param username - 用户名
     * @param password - 密码
     * @returns 登录结果
     */
    /**
     * 用户邮箱登录
     * @param username - 用户名
     * @param password - 密码
     * @returns 登录结果
     */
    export const verifyUserLoginWithEmail = (
        username: string,
        password: string,
    ): Promise<{ success: boolean; token?: string; message?: string }> => {
        return taroRequest({
            method: 'GET',
            header: {
                'Content-Type': 'application/json',
            },
            url: `5d106c34300000a5314c9f37`,
            data: {
                username,
                password,
            },
        });
    };

    /**
     * 发送手机验证码
     * @param phone - 手机号码
     * @returns 验证码发送结果
     */
    export const sendPhoneVerificationCode = (phone: string): Promise<{ success: boolean; message?: string }> => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `send-phone-code`,
            data: {
                phone,
            },
        });
    };

    /**
     * 使用手机和验证码登录
     * @param phone - 手机号码
     * @param code - 验证码
     * @returns 登录结果
     */
    export const verifyUserLoginWithPhone = (
        phone: string,
        code: string,
    ): Promise<{ success: boolean; token?: string; message?: string }> => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `phone-login`,
            data: {
                phone,
                code,
            },
        });
    };

    /**
     * 获取任务列表
     * @returns 任务列表
     */
    /**
     * 获取任务列表
     * @returns 任务列表
     */
    export const fetchTasks = (): Promise<{ success: boolean; tasks?: any[]; message?: string }> => {
        return taroRequest({
            method: 'GET',
            header: {
                'Content-Type': 'application/json',
            },
            url: `tasks`,
        });
    };

    /**
     * 接取任务
     * @param taskId - 任务ID
     * @returns 接单结果
     */
    /**
     * 接取任务
     * @param taskId - 任务ID
     * @returns 接单结果
     */
    export const takeTask = (taskId: string): Promise<{ success: boolean; message?: string }> => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `tasks/${taskId}/take`,
        });
    };

    /**
     * 邮箱注册
     * @param email - 邮箱地址
     * @param password - 密码
     * @param userType - 用户类型
     * @returns 注册结果
     */
    export const registerWithEmail = (email: string, password: string, userType: string) => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `register/email`,
            data: {
                email,
                password,
                userType,
            },
        });
    };

    /**
     * 手机注册
     * @param phone - 手机号码
     * @param code - 验证码
     * @param password - 密码
     * @param userType - 用户类型
     * @returns 注册结果
     */
    export const registerWithPhone = (phone: string, code: string, password: string, userType: string) => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `register/phone`,
            data: {
                phone,
                code,
                password,
                userType,
            },
        });
    };

    /**
     * 退出登录
     * @returns 退出登录结果
     */
    export const logout = () => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `logout`,
        });
    };

    /**
     * 获取学习路径
     * @returns 学习路径数据
     */
    export const fetchGrowthPath = () => {
        return taroRequest({
            method: 'GET',
            header: {
                'Content-Type': 'application/json',
            },
            url: `growth-path`,
        });
    };

    /**
     * 更新学习进度
     * @param progress - 进度值(0-100)
     * @returns 更新结果
     */
    export const updateGrowthProgress = (progress: number) => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `growth-path/progress`,
            data: {
                progress,
            },
        });
    };

    /**
     * 获取挑战列表
     * @returns 挑战列表数据
     */
    export const fetchChallenges = () => {
        return taroRequest({
            method: 'GET',
            header: {
                'Content-Type': 'application/json',
            },
            url: `challenges`,
        });
    };

    /**
     * 更新挑战进度
     * @param challengeId - 挑战ID
     * @param progress - 进度值(0-100)
     * @returns 更新结果
     */
    export const updateChallengeProgress = (challengeId: string, progress: number) => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `challenges/${challengeId}/progress`,
            data: {
                progress,
            },
        });
    };

    /**
     * 完成挑战
     * @param challengeId - 挑战ID
     * @returns 完成结果
     */
    export const completeChallenge = (challengeId: string) => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `challenges/${challengeId}/complete`,
        });
    };

    /**
     * 获取技能列表
     * @returns 技能列表数据
     */
    export const fetchSkills = () => {
        return taroRequest({
            method: 'GET',
            header: {
                'Content-Type': 'application/json',
            },
            url: `skills`,
        });
    };

    /**
     * 更新技能等级
     * @param skillId - 技能ID
     * @param level - 技能等级(1-5)
     * @returns 更新结果
     */
    export const updateSkillLevel = (skillId: string, level: number) => {
        return taroRequest({
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            url: `skills/${skillId}/level`,
            data: {
                level,
            },
        });
    };
}

// 刷题功能相关API
/**
 * 获取题目列表
 * @param category - 题目分类
 * @param difficulty - 难度级别
 * @returns 题目列表
 */
export const fetchProblems = (_category?: string, _difficulty?: number) => {
    return taroRequest({
        method: 'GET',
        header: {
            'Content-Type': 'application/json',
        },
        url: `problems`,
        data: {
            category: _category,
            difficulty: _difficulty,
        },
    });
};

/**
 * 获取题目详情
 * @param problemId - 题目ID
 * @returns 题目详情
 */
export const fetchProblemDetail = (_problemId: string) => {
    return taroRequest({
        method: 'GET',
        header: {
            'Content-Type': 'application/json',
        },
        url: `problems/${_problemId}`,
    });
};

/**
 * 提交答案
 * @param problemId - 题目ID
 * @param code - 代码
 * @param language - 编程语言
 * @returns 提交结果
 */
export const submitAnswer = (_problemId: string, _code: string, _language: string) => {
    return taroRequest({
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        url: `problems/${_problemId}/submit`,
        data: {
            code: _code,
            language: _language,
        },
    });
};

/**
 * 获取答题记录
 * @returns 答题记录列表
 */
export const fetchAnswerRecords = () => {
    return taroRequest({
        method: 'GET',
        header: {
            'Content-Type': 'application/json',
        },
        url: `answer-records`,
    });
};

/**
 * 获取错题集
 * @returns 错题集列表
 */
export const fetchWrongProblems = () => {
    return taroRequest({
        method: 'GET',
        header: {
            'Content-Type': 'application/json',
        },
        url: `wrong-problems`,
    });
};

// 社区发帖功能相关API
/**
 * 获取帖子列表
 * @param category - 帖子分类
 * @param page - 页码
 * @param pageSize - 每页数量
 * @returns 帖子列表
 */
export const fetchPosts = (category?: string, page: number = 1, pageSize: number = 10) => {
    return taroRequest({
        method: 'GET',
        header: {
            'Content-Type': 'application/json',
        },
        url: `posts`,
        data: {
            category,
            page,
            pageSize,
        },
    });
};

/**
 * 获取帖子详情
 * @param postId - 帖子ID
 * @returns 帖子详情
 */
export const fetchPostDetail = (postId: string) => {
    return taroRequest({
        method: 'GET',
        header: {
            'Content-Type': 'application/json',
        },
        url: `posts/${postId}`,
    });
};

/**
 * 发布帖子
 * @param title - 标题
 * @param content - 内容
 * @param tags - 标签
 * @param category - 分类
 * @returns 发布结果
 */
export const publishPost = (title: string, content: string, tags: string[], category: string) => {
    return taroRequest({
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        url: `posts`,
        data: {
            title,
            content,
            tags,
            category,
        },
    });
};

/**
 * 评论帖子
 * @param postId - 帖子ID
 * @param content - 评论内容
 * @param parentId - 父评论ID(可选)
 * @returns 评论结果
 */
export const commentPost = (postId: string, content: string, parentId?: string) => {
    return taroRequest({
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        url: `posts/${postId}/comments`,
        data: {
            content,
            parentId,
        },
    });
};

/**
 * 点赞帖子
 * @param postId - 帖子ID
 * @returns 点赞结果
 */
export const likePost = (postId: string) => {
    return taroRequest({
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        url: `posts/${postId}/like`,
    });
};

/**
 * 收藏帖子
 * @param postId - 帖子ID
 * @returns 收藏结果
 */
export const favoritePost = (postId: string) => {
    return taroRequest({
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        url: `posts/${postId}/favorite`,
    });
};

// 为了兼容模拟数据，我们导出一个带延迟的版本
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchTasksWithDelay = async () => {
    await delay(500); // 模拟网络延迟
    // 实际项目中应该调用真实API
    return {
        code: 200,
        data: [
            {
                id: '1',
                title: '开发小程序首页',
                description: '使用Taro框架开发小程序首页，实现轮播图和推荐列表功能。',
                reward: 500,
                tags: ['前端', '紧急'],
                deadline: '2023-10-30',
                skills: ['Taro', 'React', '小程序'],
                status: 'available',
            },
            {
                id: '2',
                title: '修复后端API bug',
                description: '修复用户登录接口在特定情况下返回500错误的问题。',
                reward: 300,
                tags: ['后端', 'bug修复'],
                deadline: '2023-10-25',
                skills: ['Node.js', 'Express', 'MongoDB'],
                status: 'available',
            },
            {
                id: '3',
                title: '编写技术文档',
                description: '为新开发的SDK编写详细的技术文档和使用示例。',
                reward: 200,
                tags: ['文档'],
                deadline: '2023-11-05',
                skills: ['Markdown', '技术写作'],
                status: 'taken',
            },
        ],
    };
};

export const takeTaskWithDelay = async (taskId: string) => {
    await delay(500); // 模拟网络延迟
    // 实际项目中应该调用真实API
    console.log('Taking task:', taskId);
    return {
        code: 200,
        data: { success: true },
    };
};

// 替换原始函数以使用模拟数据
// 实际项目中应该注释掉这些替换
// const originalFetchTasks = fetchTasks;
// const originalTakeTask = takeTask;
// fetchTasks = fetchTasksWithDelay;
// takeTask = takeTaskWithDelay;
