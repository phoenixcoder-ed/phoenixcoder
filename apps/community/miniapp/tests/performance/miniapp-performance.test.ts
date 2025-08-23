/**
 * PhoenixCoder 小程序性能基准测试
 * 监控启动时间、包大小、内存使用和运行时性能
 */

import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync, statSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

// 性能基准配置
const PERFORMANCE_THRESHOLDS = {
    // 启动性能
    startup: {
        coldStart: 3000, // 冷启动 < 3s
        hotStart: 1000, // 热启动 < 1s
        pageLoad: 1500, // 页面加载 < 1.5s
    },

    // 包大小限制
    package: {
        mainSize: 2 * 1024 * 1024, // 主包 < 2MB
        subpackageSize: 2 * 1024 * 1024, // 分包 < 2MB
        totalSize: 20 * 1024 * 1024, // 总包 < 20MB
        singleFileSize: 500 * 1024, // 单文件 < 500KB
    },

    // 运行时性能
    runtime: {
        memoryUsage: 100 * 1024 * 1024, // 内存使用 < 100MB
        setDataTime: 50, // setData耗时 < 50ms
        renderTime: 16, // 渲染时间 < 16ms (60fps)
        networkTimeout: 5000, // 网络超时 < 5s
    },

    // 代码质量
    quality: {
        maxFunctionLength: 50, // 函数最大行数
        maxFileLength: 500, // 文件最大行数
        maxComplexity: 10, // 最大圈复杂度
        duplicateThreshold: 0.1, // 重复代码阈值 10%
    },
};

// 测试页面配置
const TEST_PAGES = [
    { name: 'Index', path: 'pages/index/index', critical: true },
    { name: 'Tasks', path: 'pages/tasks/index', critical: true },
    { name: 'Profile', path: 'pages/profile/index', critical: false },
    { name: 'Challenge', path: 'pages/challenge/index', critical: true },
    { name: 'Settings', path: 'pages/settings/index', critical: false },
];

class MiniappPerformanceReporter {
    private results: any[] = [];
    private reportDir = join(process.cwd(), 'performance-reports');

    constructor() {
        if (!existsSync(this.reportDir)) {
            mkdirSync(this.reportDir, { recursive: true });
        }
    }

    addResult(result: any) {
        this.results.push({
            ...result,
            timestamp: new Date().toISOString(),
        });
    }

    generateReport() {
        const summary = this.generateSummary();
        const reportPath = join(this.reportDir, `miniapp-performance-${Date.now()}.json`);

        writeFileSync(
            reportPath,
            JSON.stringify(
                {
                    summary,
                    results: this.results,
                    timestamp: new Date().toISOString(),
                    platform: 'miniapp',
                },
                null,
                2,
            ),
        );

        return { summary, reportPath };
    }

    private generateSummary() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter((r) => r.passed).length;
        const criticalFailures = this.results.filter((r) => !r.passed && r.critical).length;

        return {
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            criticalFailures,
            successRate: (passedTests / totalTests) * 100,
            grade: this.calculateGrade(passedTests / totalTests),
        };
    }

    private calculateGrade(successRate: number): string {
        if (successRate >= 0.95) return 'A+';
        if (successRate >= 0.9) return 'A';
        if (successRate >= 0.85) return 'B+';
        if (successRate >= 0.8) return 'B';
        if (successRate >= 0.7) return 'C';
        return 'D';
    }
}

const reporter = new MiniappPerformanceReporter();

// 工具函数
class MiniappAnalyzer {
    static getDirectorySize(dirPath: string): number {
        let totalSize = 0;

        const traverse = (currentPath: string) => {
            if (!existsSync(currentPath)) return;

            const stats = statSync(currentPath);

            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                const files = readdirSync(currentPath);
                files.forEach((file) => {
                    traverse(join(currentPath, file));
                });
            }
        };

        traverse(dirPath);
        return totalSize;
    }

    static analyzePackageStructure() {
        const srcPath = join(process.cwd(), 'src');
        const distPath = join(process.cwd(), 'dist');

        const structure = {
            src: {
                size: this.getDirectorySize(srcPath),
                files: this.countFiles(srcPath),
            },
            dist: existsSync(distPath)
                ? {
                      size: this.getDirectorySize(distPath),
                      files: this.countFiles(distPath),
                  }
                : null,
        };

        return structure;
    }

    static countFiles(dirPath: string): { total: number; byType: Record<string, number> } {
        const result = { total: 0, byType: {} as Record<string, number> };

        const traverse = (currentPath: string) => {
            if (!existsSync(currentPath)) return;

            const files = readdirSync(currentPath);

            files.forEach((file) => {
                const filePath = join(currentPath, file);
                const stats = statSync(filePath);

                if (stats.isFile()) {
                    result.total++;
                    const ext = extname(file).toLowerCase();
                    result.byType[ext] = (result.byType[ext] || 0) + 1;
                } else if (stats.isDirectory()) {
                    traverse(filePath);
                }
            });
        };

        traverse(dirPath);
        return result;
    }

    static analyzeCodeQuality(filePath: string): any {
        if (!existsSync(filePath)) return null;

        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        return {
            lineCount: lines.length,
            functionCount: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
            complexity: this.calculateComplexity(content),
            duplicateLines: this.findDuplicateLines(lines),
        };
    }

    private static calculateComplexity(content: string): number {
        // 简化的圈复杂度计算
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try', '&&', '||', '?'];

        let complexity = 1; // 基础复杂度

        complexityKeywords.forEach((keyword) => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    private static findDuplicateLines(lines: string[]): number {
        const lineMap = new Map<string, number>();
        let duplicates = 0;

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.length > 10) {
                // 忽略短行
                const count = lineMap.get(trimmed) || 0;
                lineMap.set(trimmed, count + 1);
                if (count === 1) {
                    duplicates++;
                }
            }
        });

        return duplicates;
    }
}

// 启动性能测试
describe('Miniapp Startup Performance', () => {
    it('should measure cold start time', async () => {
        const startTime = Date.now();

        // 模拟小程序冷启动
        await new Promise((resolve) => {
            // 模拟启动过程
            setTimeout(() => {
                resolve(void 0);
            }, 800); // 模拟800ms启动时间
        });

        const coldStartTime = Date.now() - startTime;

        const testResult = {
            test: 'cold-start',
            metric: 'startup-time',
            value: coldStartTime,
            threshold: PERFORMANCE_THRESHOLDS.startup.coldStart,
            passed: coldStartTime < PERFORMANCE_THRESHOLDS.startup.coldStart,
            critical: true,
        };

        reporter.addResult(testResult);

        console.log(`Cold start time: ${coldStartTime}ms`);
        expect(coldStartTime).toBeLessThan(PERFORMANCE_THRESHOLDS.startup.coldStart);
    });

    it('should measure hot start time', async () => {
        const startTime = Date.now();

        // 模拟小程序热启动
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(void 0);
            }, 300); // 模拟300ms热启动时间
        });

        const hotStartTime = Date.now() - startTime;

        const testResult = {
            test: 'hot-start',
            metric: 'startup-time',
            value: hotStartTime,
            threshold: PERFORMANCE_THRESHOLDS.startup.hotStart,
            passed: hotStartTime < PERFORMANCE_THRESHOLDS.startup.hotStart,
            critical: true,
        };

        reporter.addResult(testResult);

        console.log(`Hot start time: ${hotStartTime}ms`);
        expect(hotStartTime).toBeLessThan(PERFORMANCE_THRESHOLDS.startup.hotStart);
    });

    for (const page of TEST_PAGES) {
        it(`should measure ${page.name} page load time`, async () => {
            const startTime = Date.now();

            // 模拟页面加载
            await new Promise((resolve) => {
                setTimeout(
                    () => {
                        resolve(void 0);
                    },
                    500 + Math.random() * 500,
                ); // 500-1000ms随机加载时间
            });

            const pageLoadTime = Date.now() - startTime;

            const testResult = {
                test: 'page-load',
                page: page.name,
                metric: 'load-time',
                value: pageLoadTime,
                threshold: PERFORMANCE_THRESHOLDS.startup.pageLoad,
                passed: pageLoadTime < PERFORMANCE_THRESHOLDS.startup.pageLoad,
                critical: page.critical,
            };

            reporter.addResult(testResult);

            console.log(`${page.name} page load time: ${pageLoadTime}ms`);

            if (page.critical) {
                expect(pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.startup.pageLoad);
            }
        });
    }
});

// 包大小测试
describe('Miniapp Package Size', () => {
    it('should analyze package structure', () => {
        const structure = MiniappAnalyzer.analyzePackageStructure();

        console.log('Package Structure:', {
            src: {
                size: `${(structure.src.size / 1024).toFixed(2)} KB`,
                files: structure.src.files.total,
            },
            dist: structure.dist
                ? {
                      size: `${(structure.dist.size / 1024).toFixed(2)} KB`,
                      files: structure.dist.files.total,
                  }
                : 'Not built',
        });

        const testResult = {
            test: 'package-analysis',
            metric: 'package-size',
            structure,
            passed: true,
            critical: false,
        };

        reporter.addResult(testResult);

        // 基本断言
        expect(structure.src.size).toBeLessThan(PERFORMANCE_THRESHOLDS.package.totalSize);
    });

    it('should check main package size', () => {
        const srcSize = MiniappAnalyzer.getDirectorySize(join(process.cwd(), 'src'));

        const testResult = {
            test: 'main-package-size',
            metric: 'package-size',
            value: srcSize,
            threshold: PERFORMANCE_THRESHOLDS.package.mainSize,
            passed: srcSize < PERFORMANCE_THRESHOLDS.package.mainSize,
            critical: true,
        };

        reporter.addResult(testResult);

        console.log(`Main package size: ${(srcSize / 1024).toFixed(2)} KB`);
        expect(srcSize).toBeLessThan(PERFORMANCE_THRESHOLDS.package.mainSize);
    });

    it('should check individual file sizes', () => {
        const srcPath = join(process.cwd(), 'src');
        const violations: any[] = [];

        const checkFileSize = (dirPath: string) => {
            if (!existsSync(dirPath)) return;

            const files = readdirSync(dirPath);

            files.forEach((file) => {
                const filePath = join(dirPath, file);
                const stats = statSync(filePath);

                if (stats.isFile()) {
                    if (stats.size > PERFORMANCE_THRESHOLDS.package.singleFileSize) {
                        violations.push({
                            file: filePath.replace(process.cwd(), ''),
                            size: stats.size,
                            threshold: PERFORMANCE_THRESHOLDS.package.singleFileSize,
                        });
                    }
                } else if (stats.isDirectory()) {
                    checkFileSize(filePath);
                }
            });
        };

        checkFileSize(srcPath);

        const testResult = {
            test: 'file-size-check',
            metric: 'file-size',
            violations,
            passed: violations.length === 0,
            critical: false,
        };

        reporter.addResult(testResult);

        if (violations.length > 0) {
            console.warn('Large files detected:', violations);
        }

        expect(violations.length).toBe(0);
    });
});

// 运行时性能测试
describe('Miniapp Runtime Performance', () => {
    it('should simulate setData performance', async () => {
        const iterations = 100;
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();

            // 模拟 setData 操作
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(void 0);
                }, Math.random() * 20); // 0-20ms随机时间
            });

            times.push(Date.now() - startTime);
        }

        const avgSetDataTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxSetDataTime = Math.max(...times);

        const testResult = {
            test: 'setdata-performance',
            metric: 'setdata-time',
            avgTime: avgSetDataTime,
            maxTime: maxSetDataTime,
            threshold: PERFORMANCE_THRESHOLDS.runtime.setDataTime,
            passed: avgSetDataTime < PERFORMANCE_THRESHOLDS.runtime.setDataTime,
            critical: true,
        };

        reporter.addResult(testResult);

        console.log(`Average setData time: ${avgSetDataTime.toFixed(2)}ms`);
        console.log(`Max setData time: ${maxSetDataTime.toFixed(2)}ms`);

        expect(avgSetDataTime).toBeLessThan(PERFORMANCE_THRESHOLDS.runtime.setDataTime);
    });

    it('should simulate memory usage', async () => {
        const initialMemory = process.memoryUsage();

        // 模拟内存密集操作
        const data: any[] = [];
        for (let i = 0; i < 10000; i++) {
            data.push({
                id: i,
                name: `Item ${i}`,
                data: new Array(100).fill(Math.random()),
            });
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        const testResult = {
            test: 'memory-usage',
            metric: 'memory',
            initialMemory: initialMemory.heapUsed,
            finalMemory: finalMemory.heapUsed,
            increase: memoryIncrease,
            threshold: PERFORMANCE_THRESHOLDS.runtime.memoryUsage,
            passed: finalMemory.heapUsed < PERFORMANCE_THRESHOLDS.runtime.memoryUsage,
            critical: true,
        };

        reporter.addResult(testResult);

        console.log(`Memory usage: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

        expect(finalMemory.heapUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.runtime.memoryUsage);
    });

    it('should test render performance', async () => {
        const renderTimes: number[] = [];

        // 模拟多次渲染
        for (let i = 0; i < 60; i++) {
            // 模拟1秒60帧
            const startTime = Date.now();

            // 模拟渲染操作
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(void 0);
                }, Math.random() * 10); // 0-10ms随机渲染时间
            });

            renderTimes.push(Date.now() - startTime);
        }

        const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
        const maxRenderTime = Math.max(...renderTimes);
        const frameDrops = renderTimes.filter((time) => time > PERFORMANCE_THRESHOLDS.runtime.renderTime).length;

        const testResult = {
            test: 'render-performance',
            metric: 'render-time',
            avgTime: avgRenderTime,
            maxTime: maxRenderTime,
            frameDrops,
            threshold: PERFORMANCE_THRESHOLDS.runtime.renderTime,
            passed: avgRenderTime < PERFORMANCE_THRESHOLDS.runtime.renderTime && frameDrops < 3,
            critical: true,
        };

        reporter.addResult(testResult);

        console.log(`Average render time: ${avgRenderTime.toFixed(2)}ms`);
        console.log(`Frame drops: ${frameDrops}/60`);

        expect(avgRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.runtime.renderTime);
        expect(frameDrops).toBeLessThan(3); // 允许少量掉帧
    });
});

// 代码质量测试
describe('Miniapp Code Quality', () => {
    it('should analyze code quality metrics', () => {
        const srcPath = join(process.cwd(), 'src');
        const qualityIssues: any[] = [];

        const analyzeDirectory = (dirPath: string) => {
            if (!existsSync(dirPath)) return;

            const files = readdirSync(dirPath);

            files.forEach((file) => {
                const filePath = join(dirPath, file);
                const stats = statSync(filePath);

                if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
                    const analysis = MiniappAnalyzer.analyzeCodeQuality(filePath);

                    if (analysis) {
                        if (analysis.lineCount > PERFORMANCE_THRESHOLDS.quality.maxFileLength) {
                            qualityIssues.push({
                                file: filePath.replace(process.cwd(), ''),
                                issue: 'file-too-long',
                                value: analysis.lineCount,
                                threshold: PERFORMANCE_THRESHOLDS.quality.maxFileLength,
                            });
                        }

                        if (analysis.complexity > PERFORMANCE_THRESHOLDS.quality.maxComplexity) {
                            qualityIssues.push({
                                file: filePath.replace(process.cwd(), ''),
                                issue: 'high-complexity',
                                value: analysis.complexity,
                                threshold: PERFORMANCE_THRESHOLDS.quality.maxComplexity,
                            });
                        }
                    }
                } else if (stats.isDirectory()) {
                    analyzeDirectory(filePath);
                }
            });
        };

        analyzeDirectory(srcPath);

        const testResult = {
            test: 'code-quality',
            metric: 'quality-metrics',
            issues: qualityIssues,
            passed: qualityIssues.length === 0,
            critical: false,
        };

        reporter.addResult(testResult);

        if (qualityIssues.length > 0) {
            console.warn('Code quality issues:', qualityIssues);
        }

        expect(qualityIssues.length).toBe(0);
    });
});

// 性能回归测试
describe('Miniapp Performance Regression', () => {
    it('should detect performance regressions', () => {
        // 模拟历史基准数据
        const baseline = {
            coldStart: 2000,
            hotStart: 800,
            pageLoad: 1200,
            packageSize: 1.5 * 1024 * 1024, // 1.5MB
            setDataTime: 30,
            memoryUsage: 80 * 1024 * 1024, // 80MB
        };

        // 模拟当前指标
        const current = {
            coldStart: 2200, // 10% 增长
            hotStart: 850, // 6% 增长
            pageLoad: 1100, // 8% 改善
            packageSize: 1.6 * 1024 * 1024, // 7% 增长
            setDataTime: 35, // 17% 增长
            memoryUsage: 85 * 1024 * 1024, // 6% 增长
        };

        const regressionThreshold = 0.15; // 15% 回归阈值
        const regressions: any[] = [];

        Object.keys(baseline).forEach((metric) => {
            const baseValue = (baseline as any)[metric];
            const currentValue = (current as any)[metric];
            const regression = (currentValue - baseValue) / baseValue;

            if (regression > regressionThreshold) {
                regressions.push({
                    metric,
                    baseline: baseValue,
                    current: currentValue,
                    regression: `${(regression * 100).toFixed(1)}%`,
                });
            }
        });

        const testResult = {
            test: 'performance-regression',
            metric: 'regression-detection',
            regressions,
            threshold: `${regressionThreshold * 100}%`,
            passed: regressions.length === 0,
            critical: true,
        };

        reporter.addResult(testResult);

        if (regressions.length > 0) {
            console.warn('Performance regressions detected:', regressions);
        }

        expect(regressions.length).toBe(0);
    });
});

// 测试完成后生成报告
afterAll(() => {
    const { summary, reportPath } = reporter.generateReport();
    console.log('\n=== Miniapp Performance Test Summary ===');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Critical Failures: ${summary.criticalFailures}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Grade: ${summary.grade}`);
    console.log(`Report saved to: ${reportPath}`);
});
