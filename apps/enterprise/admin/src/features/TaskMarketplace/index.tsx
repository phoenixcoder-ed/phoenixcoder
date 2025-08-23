import React, { useState, useEffect } from 'react';

import './styles.css';

// 任务类型定义
interface Task {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  reward: number;
  deadline: string;
  publisher: {
    name: string;
    avatar: string;
    rating: number;
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicants: number;
  category: string;
  tags: string[];
  estimatedHours: number;
  createdAt: string;
}

// 筛选选项
interface FilterOptions {
  search: string;
  difficulty: string;
  reward: string;
  skills: string[];
  category: string;
  sortBy: 'newest' | 'reward' | 'deadline' | 'popularity';
}

const TaskMarketplace: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    difficulty: '',
    reward: '',
    skills: [],
    category: '',
    sortBy: 'newest',
  });
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // 可选技能列表
  const availableSkills = [
    'React',
    'Vue',
    'Angular',
    'Node.js',
    'Python',
    'Java',
    'TypeScript',
    'JavaScript',
    'PHP',
    'Go',
    'Rust',
    'Swift',
    'Kotlin',
    'Flutter',
    'React Native',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'Redis',
    'GraphQL',
    'REST API',
  ];

  // 模拟任务数据
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'React电商前端开发',
      description:
        '需要开发一个现代化的电商网站前端，包括商品展示、购物车、用户中心等功能。要求使用React + TypeScript，具备响应式设计能力。',
      skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
      difficulty: 'intermediate',
      reward: 8000,
      deadline: '2024-02-15',
      publisher: {
        name: '科技创新公司',
        avatar: 'https://placehold.co/40x40.png?text=TC',
        rating: 4.8,
      },
      status: 'open',
      applicants: 12,
      category: '前端开发',
      tags: ['电商', '响应式', '用户体验'],
      estimatedHours: 80,
      createdAt: '2024-01-20',
    },
    {
      id: '2',
      title: 'Python数据分析系统',
      description:
        '构建一个数据分析平台，能够处理大量数据并生成可视化报表。需要熟悉Pandas、NumPy、Matplotlib等库。',
      skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
      difficulty: 'advanced',
      reward: 12000,
      deadline: '2024-02-20',
      publisher: {
        name: '数据科技',
        avatar: 'https://placehold.co/40x40.png?text=DS',
        rating: 4.9,
      },
      status: 'open',
      applicants: 8,
      category: '数据分析',
      tags: ['大数据', '可视化', '机器学习'],
      estimatedHours: 120,
      createdAt: '2024-01-18',
    },
    {
      id: '3',
      title: 'Node.js后端API开发',
      description:
        '开发RESTful API服务，包括用户认证、数据管理、文件上传等功能。需要使用Express框架和MongoDB数据库。',
      skills: ['Node.js', 'Express', 'MongoDB', 'JavaScript'],
      difficulty: 'intermediate',
      reward: 6000,
      deadline: '2024-02-10',
      publisher: {
        name: '初创科技',
        avatar: 'https://placehold.co/40x40.png?text=ST',
        rating: 4.5,
      },
      status: 'open',
      applicants: 15,
      category: '后端开发',
      tags: ['API', '数据库', '认证'],
      estimatedHours: 60,
      createdAt: '2024-01-22',
    },
    {
      id: '4',
      title: 'Flutter移动应用开发',
      description:
        '开发跨平台移动应用，包括用户界面设计、数据同步、推送通知等功能。要求有Flutter开发经验。',
      skills: ['Flutter', 'Dart', 'Firebase', 'REST API'],
      difficulty: 'advanced',
      reward: 10000,
      deadline: '2024-02-25',
      publisher: {
        name: '移动互联',
        avatar: 'https://placehold.co/40x40.png?text=MI',
        rating: 4.7,
      },
      status: 'open',
      applicants: 6,
      category: '移动开发',
      tags: ['跨平台', '移动端', 'UI设计'],
      estimatedHours: 100,
      createdAt: '2024-01-19',
    },
    {
      id: '5',
      title: 'Vue.js企业管理系统',
      description:
        '开发企业内部管理系统，包括员工管理、项目跟踪、报表生成等模块。使用Vue 3 + Element Plus。',
      skills: ['Vue', 'JavaScript', 'Element Plus', 'Axios'],
      difficulty: 'intermediate',
      reward: 7500,
      deadline: '2024-02-18',
      publisher: {
        name: '企业服务',
        avatar: 'https://placehold.co/40x40.png?text=ES',
        rating: 4.6,
      },
      status: 'open',
      applicants: 10,
      category: '前端开发',
      tags: ['企业级', '管理系统', '报表'],
      estimatedHours: 90,
      createdAt: '2024-01-21',
    },
  ];

  // 初始化数据
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTasks(mockTasks);
      setFilteredTasks(mockTasks);
      setLoading(false);
    };

    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 筛选和排序任务
  useEffect(() => {
    let filtered = [...tasks];

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          task.skills.some((skill) =>
            skill.toLowerCase().includes(filters.search.toLowerCase())
          )
      );
    }

    // 难度筛选
    if (filters.difficulty) {
      filtered = filtered.filter(
        (task) => task.difficulty === filters.difficulty
      );
    }

    // 报酬筛选
    if (filters.reward) {
      switch (filters.reward) {
        case 'low':
          filtered = filtered.filter((task) => task.reward < 5000);
          break;
        case 'medium':
          filtered = filtered.filter(
            (task) => task.reward >= 5000 && task.reward < 10000
          );
          break;
        case 'high':
          filtered = filtered.filter((task) => task.reward >= 10000);
          break;
      }
    }

    // 技能筛选
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((task) =>
        selectedSkills.some((skill) => task.skills.includes(skill))
      );
    }

    // 分类筛选
    if (filters.category) {
      filtered = filtered.filter((task) => task.category === filters.category);
    }

    // 排序
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'reward':
        filtered.sort((a, b) => b.reward - a.reward);
        break;
      case 'deadline':
        filtered.sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
        break;
      case 'popularity':
        filtered.sort((a, b) => b.applicants - a.applicants);
        break;
    }

    setFilteredTasks(filtered);
  }, [tasks, filters, selectedSkills]);

  // 处理搜索
  const handleSearch = () => {
    // 搜索逻辑已在useEffect中处理
  };

  // 处理技能选择
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // 获取难度标签样式
  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: 'badge-success',
      intermediate: 'badge-warning',
      advanced: 'badge-error',
      expert: 'badge-secondary',
    };
    return styles[difficulty as keyof typeof styles] || 'badge-neutral';
  };

  // 格式化报酬
  const formatReward = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  // 格式化截止日期
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '已过期';
    if (diffDays === 0) return '今天截止';
    if (diffDays === 1) return '明天截止';
    return `${diffDays}天后截止`;
  };

  return (
    <div className="task-marketplace">
      {/* 粒子背景 */}
      <div className="particles-bg"></div>
      <div className="data-flow-bg"></div>

      {/* 页面标题 */}
      <section className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm breadcrumbs mb-2">
              <ul className="text-base-content/70">
                <li>
                  <a href="/dashboard" className="hover:text-accent">
                    工作台
                  </a>
                </li>
                <li>
                  <span className="text-accent">任务广场</span>
                </li>
              </ul>
            </div>
            <h1 className="text-4xl font-heading title-glow">任务广场</h1>
            <p className="text-base-content/70 mt-2">
              发现适合你的技术任务，展示你的专业能力
            </p>
          </div>
        </div>
      </section>

      {/* 筛选和搜索区域 */}
      <section className="smart-glass p-6 rounded-box mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
          {/* 搜索 */}
          <div className="form-control lg:col-span-2">
            <label className="label">
              <span className="label-text">关键词搜索</span>
            </label>
            <div className="join">
              <input
                type="text"
                placeholder="例如：React开发、数据分析..."
                className="input input-bordered join-item w-full focus:border-secondary focus:ring-2 focus:ring-secondary/50"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="btn btn-primary join-item"
                onClick={handleSearch}
              >
                <span
                  className="iconify"
                  data-icon="heroicons:magnifying-glass-20-solid"
                ></span>
              </button>
            </div>
          </div>

          {/* 难度 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">难度等级</span>
            </label>
            <select
              className="select select-bordered focus:border-secondary focus:ring-2 focus:ring-secondary/50"
              value={filters.difficulty}
              onChange={(e) =>
                setFilters({ ...filters, difficulty: e.target.value })
              }
            >
              <option value="">所有难度</option>
              <option value="beginner">入门</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
              <option value="expert">专家</option>
            </select>
          </div>

          {/* 报酬范围 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">报酬范围</span>
            </label>
            <select
              className="select select-bordered focus:border-secondary focus:ring-2 focus:ring-secondary/50"
              value={filters.reward}
              onChange={(e) =>
                setFilters({ ...filters, reward: e.target.value })
              }
            >
              <option value="">所有范围</option>
              <option value="low">¥5,000 以下</option>
              <option value="medium">¥5,000 - ¥10,000</option>
              <option value="high">¥10,000 以上</option>
            </select>
          </div>
        </div>

        {/* 技能筛选 */}
        <div className="mt-6">
          <label className="label">
            <span className="label-text">技能要求 (可多选)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill) => (
              <button
                key={skill}
                className={`btn btn-sm ${
                  selectedSkills.includes(skill) ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* 排序选项 */}
        <div className="mt-6 flex justify-between items-center">
          <div className="form-control">
            <label className="label">
              <span className="label-text">排序方式</span>
            </label>
            <select
              className="select select-bordered focus:border-secondary focus:ring-2 focus:ring-secondary/50"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as FilterOptions['sortBy'],
                })
              }
            >
              <option value="newest">最新发布</option>
              <option value="reward">报酬最高</option>
              <option value="deadline">截止时间</option>
              <option value="popularity">最受欢迎</option>
            </select>
          </div>
          <div className="text-sm text-base-content/70">
            共找到 {filteredTasks.length} 个任务
          </div>
        </div>
      </section>

      {/* 任务列表 */}
      <section>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="card smart-glass hover:shadow-quantum transition-all duration-300"
              >
                <div className="card-body">
                  {/* 任务标题和发布者 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="card-title text-lg mb-2">{task.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <div className="avatar placeholder">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-content text-xs">
                            <span>{task.publisher.name.charAt(0)}</span>
                          </div>
                        </div>
                        <span>{task.publisher.name}</span>
                        <div className="rating rating-xs">
                          {[...Array(5)].map((_, i) => (
                            <input
                              key={i}
                              type="radio"
                              className={`mask mask-star-2 ${
                                i < Math.floor(task.publisher.rating)
                                  ? 'bg-orange-400'
                                  : 'bg-gray-300'
                              }`}
                              disabled
                            />
                          ))}
                        </div>
                        <span>({task.publisher.rating})</span>
                      </div>
                    </div>
                    <div
                      className={`badge ${getDifficultyBadge(task.difficulty)}`}
                    >
                      {task.difficulty === 'beginner' && '入门'}
                      {task.difficulty === 'intermediate' && '中级'}
                      {task.difficulty === 'advanced' && '高级'}
                      {task.difficulty === 'expert' && '专家'}
                    </div>
                  </div>

                  {/* 任务描述 */}
                  <p className="text-sm text-base-content/80 mb-4 line-clamp-3">
                    {task.description}
                  </p>

                  {/* 技能标签 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {task.skills.map((skill) => (
                      <span
                        key={skill}
                        className="badge badge-outline badge-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* 任务信息 */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-base-content/70">报酬：</span>
                      <span className="font-semibold text-success">
                        {formatReward(task.reward)}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/70">预估：</span>
                      <span>{task.estimatedHours}小时</span>
                    </div>
                    <div>
                      <span className="text-base-content/70">截止：</span>
                      <span
                        className={
                          formatDeadline(task.deadline).includes('过期')
                            ? 'text-error'
                            : ''
                        }
                      >
                        {formatDeadline(task.deadline)}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/70">申请：</span>
                      <span>{task.applicants}人</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="card-actions justify-end">
                    <button className="btn btn-ghost btn-sm">
                      <span
                        className="iconify"
                        data-icon="heroicons:eye-20-solid"
                      ></span>
                      查看详情
                    </button>
                    <button className="btn btn-primary btn-sm">
                      <span
                        className="iconify"
                        data-icon="heroicons:paper-airplane-20-solid"
                      ></span>
                      立即申请
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">没有找到匹配的任务</h3>
            <p className="text-base-content/70 mb-4">
              尝试调整筛选条件或搜索关键词
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setFilters({
                  search: '',
                  difficulty: '',
                  reward: '',
                  skills: [],
                  category: '',
                  sortBy: 'newest',
                });
                setSelectedSkills([]);
              }}
            >
              重置筛选
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default TaskMarketplace;
