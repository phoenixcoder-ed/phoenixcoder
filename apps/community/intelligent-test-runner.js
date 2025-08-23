#!/usr/bin/env node

/**
 * PhoenixCoder 智能测试运行器
 * 统一管理前端、小程序和后端的测试执行
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

// 项目路径配置
const PROJECTS = {
  backend: {
    name: '后端服务',
    path: './apps/community/server',
    testCommand: 'python run_tests.py',
    packageFile: 'requirements.txt',
    testDir: 'tests'
  },
  admin: {
    name: '管理前端',
    path: './apps/community/admin',
    testCommand: 'pnpm run test',
    packageFile: 'package.json',
    testDir: 'tests'
  },
  miniapp: {
    name: '小程序',
    path: './apps/community/miniapp',
    testCommand: 'pnpm run test',
    packageFile: 'package.json',
    testDir: 'tests'
  }
}

// 测试类型配置
const TEST_TYPES = {
  unit: {
    name: '单元测试',
    description: '快速执行单元测试',
    commands: {
      backend: 'python run_tests.py --level unit',
      admin: 'pnpm run test:unit',
      miniapp: 'pnpm run test:unit'
    }
  },
  integration: {
    name: '集成测试',
    description: '执行集成测试',
    commands: {
      backend: 'python run_tests.py --level integration',
      admin: 'pnpm run test:integration',
      miniapp: 'pnpm run test:integration'
    }
  },
  coverage: {
    name: '覆盖率测试',
    description: '生成测试覆盖率报告',
    commands: {
      backend: 'python run_tests.py --coverage',
      admin: 'pnpm run test:coverage',
      miniapp: 'pnpm run test:coverage'
    }
  },
  changed: {
    name: '变更测试',
    description: '只测试变更相关的代码',
    commands: {
      backend: 'python run_tests.py --changed',
      admin: 'pnpm run test:changed',
      miniapp: 'pnpm run test:changed'
    }
  },
  performance: {
    name: '性能测试',
    description: '执行性能基准测试',
    commands: {
      backend: 'python run_tests.py --level performance',
      admin: 'pnpm run test:performance',
      miniapp: 'pnpm run test:performance'
    }
  },
  all: {
    name: '完整测试',
    description: '执行所有测试套件',
    commands: {
      backend: 'python run_tests.py --level all',
      admin: 'pnpm run test:all',
      miniapp: 'pnpm run test:all'
    }
  }
}

class IntelligentTestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      skipped: []
    }
    this.startTime = Date.now()
  }

  // 显示帮助信息
  showHelp() {
    console.log(`
🧪 PhoenixCoder 智能测试运行器
`)
    console.log('用法: node intelligent-test-runner.js [选项] [项目] [测试类型]\n')
    
    console.log('项目选项:')
    Object.entries(PROJECTS).forEach(([key, project]) => {
      console.log(`  ${key.padEnd(10)} ${project.name}`)
    })
    
    console.log('\n测试类型:')
    Object.entries(TEST_TYPES).forEach(([key, type]) => {
      console.log(`  ${key.padEnd(12)} ${type.name} - ${type.description}`)
    })
    
    console.log('\n选项:')
    console.log('  --parallel     并行执行多个项目的测试')
    console.log('  --watch        监听模式，文件变更时自动运行测试')
    console.log('  --silent       静默模式，减少输出信息')
    console.log('  --report       生成详细的测试报告')
    console.log('  --install      安装测试依赖')
    console.log('  --status       显示测试环境状态')
    console.log('  --help, -h     显示帮助信息')
    
    console.log('\n示例:')
    console.log('  node intelligent-test-runner.js unit                    # 运行所有项目的单元测试')
    console.log('  node intelligent-test-runner.js admin coverage          # 运行管理前端的覆盖率测试')
    console.log('  node intelligent-test-runner.js backend unit --parallel # 并行运行后端单元测试')
    console.log('  node intelligent-test-runner.js --install               # 安装所有项目的测试依赖')
    console.log('  node intelligent-test-runner.js --status                # 显示测试环境状态\n')
  }

  // 检查项目是否存在
  checkProject(projectKey) {
    const project = PROJECTS[projectKey]
    if (!project) return false
    
    const projectPath = path.resolve(project.path)
    return fs.existsSync(projectPath)
  }

  // 检查测试环境
  checkTestEnvironment(projectKey) {
    const project = PROJECTS[projectKey]
    const projectPath = path.resolve(project.path)
    const packagePath = path.join(projectPath, project.packageFile)
    const testDirPath = path.join(projectPath, project.testDir)
    
    return {
      projectExists: fs.existsSync(projectPath),
      packageExists: fs.existsSync(packagePath),
      testDirExists: fs.existsSync(testDirPath),
      path: projectPath
    }
  }

  // 显示测试环境状态
  showStatus() {
    console.log('\n📊 测试环境状态\n')
    
    Object.entries(PROJECTS).forEach(([key, project]) => {
      const status = this.checkTestEnvironment(key)
      const statusIcon = status.projectExists && status.packageExists && status.testDirExists ? '✅' : '❌'
      
      console.log(`${statusIcon} ${project.name} (${key})`)
      console.log(`   路径: ${status.path}`)
      console.log(`   项目: ${status.projectExists ? '存在' : '不存在'}`)
      console.log(`   配置: ${status.packageExists ? '存在' : '不存在'}`)
      console.log(`   测试: ${status.testDirExists ? '存在' : '不存在'}`)
      console.log()
    })
  }

  // 安装测试依赖
  async installDependencies(projectKey = null) {
    const projects = projectKey ? [projectKey] : Object.keys(PROJECTS)
    
    console.log('\n📦 安装测试依赖\n')
    
    for (const key of projects) {
      const project = PROJECTS[key]
      if (!this.checkProject(key)) {
        console.log(`❌ ${project.name}: 项目不存在`)
        continue
      }
      
      console.log(`🔧 ${project.name}: 安装依赖...`)
      
      try {
        const projectPath = path.resolve(project.path)
        
        if (key === 'backend') {
          // Python 项目
          execSync('pip install -r requirements.txt', {
            cwd: projectPath,
            stdio: 'inherit'
          })
        } else {
          // Node.js 项目
          execSync('pnpm install', {
            cwd: projectPath,
            stdio: 'inherit'
          })
        }
        
        console.log(`✅ ${project.name}: 依赖安装完成`)
      } catch (error) {
        console.log(`❌ ${project.name}: 依赖安装失败`)
        console.error(error.message)
      }
    }
  }

  // 执行单个项目的测试
  async runProjectTest(projectKey, testType, options = {}) {
    const project = PROJECTS[projectKey]
    const testConfig = TEST_TYPES[testType]
    
    if (!project || !testConfig) {
      throw new Error(`无效的项目 (${projectKey}) 或测试类型 (${testType})`)
    }
    
    if (!this.checkProject(projectKey)) {
      throw new Error(`项目不存在: ${project.name}`)
    }
    
    const command = testConfig.commands[projectKey]
    if (!command) {
      throw new Error(`项目 ${project.name} 不支持 ${testConfig.name}`)
    }
    
    const projectPath = path.resolve(project.path)
    
    if (!options.silent) {
      console.log(`\n🧪 ${project.name} - ${testConfig.name}`)
      console.log(`📁 路径: ${projectPath}`)
      console.log(`⚡ 命令: ${command}\n`)
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const child = spawn(command.split(' ')[0], command.split(' ').slice(1), {
        cwd: projectPath,
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true
      })
      
      let output = ''
      if (options.silent) {
        child.stdout?.on('data', (data) => {
          output += data.toString()
        })
        child.stderr?.on('data', (data) => {
          output += data.toString()
        })
      }
      
      child.on('close', (code) => {
        const duration = Date.now() - startTime
        const result = {
          project: projectKey,
          testType,
          success: code === 0,
          duration,
          output: options.silent ? output : null
        }
        
        if (code === 0) {
          this.results.passed.push(result)
          if (!options.silent) {
            console.log(`\n✅ ${project.name} - ${testConfig.name} 通过 (${duration}ms)`)
          }
        } else {
          this.results.failed.push(result)
          if (!options.silent) {
            console.log(`\n❌ ${project.name} - ${testConfig.name} 失败 (${duration}ms)`)
          }
        }
        
        resolve(result)
      })
      
      child.on('error', (error) => {
        const result = {
          project: projectKey,
          testType,
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        }
        this.results.failed.push(result)
        reject(error)
      })
    })
  }

  // 并行执行多个测试
  async runParallelTests(projects, testType, options = {}) {
    console.log(`\n🚀 并行执行 ${TEST_TYPES[testType].name}\n`)
    
    const promises = projects.map(project => 
      this.runProjectTest(project, testType, options)
        .catch(error => ({ project, testType, success: false, error: error.message }))
    )
    
    const results = await Promise.all(promises)
    return results
  }

  // 生成测试报告
  generateReport() {
    const totalDuration = Date.now() - this.startTime
    const totalTests = this.results.passed.length + this.results.failed.length + this.results.skipped.length
    
    console.log('\n📊 测试报告\n')
    console.log('=' .repeat(50))
    console.log(`总测试数: ${totalTests}`)
    console.log(`通过: ${this.results.passed.length}`)
    console.log(`失败: ${this.results.failed.length}`)
    console.log(`跳过: ${this.results.skipped.length}`)
    console.log(`总耗时: ${totalDuration}ms`)
    console.log('=' .repeat(50))
    
    if (this.results.passed.length > 0) {
      console.log('\n✅ 通过的测试:')
      this.results.passed.forEach(result => {
        console.log(`  ${PROJECTS[result.project].name} - ${TEST_TYPES[result.testType].name} (${result.duration}ms)`)
      })
    }
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ 失败的测试:')
      this.results.failed.forEach(result => {
        console.log(`  ${PROJECTS[result.project].name} - ${TEST_TYPES[result.testType].name} (${result.duration}ms)`)
        if (result.error) {
          console.log(`    错误: ${result.error}`)
        }
      })
    }
    
    console.log()
    
    // 保存报告到文件
    const reportPath = path.join(process.cwd(), 'test-report.json')
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration,
      results: this.results,
      summary: {
        total: totalTests,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        skipped: this.results.skipped.length
      }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    console.log(`📄 详细报告已保存到: ${reportPath}`)
  }

  // 主执行函数
  async run(args) {
    const options = {
      parallel: args.includes('--parallel'),
      watch: args.includes('--watch'),
      silent: args.includes('--silent'),
      report: args.includes('--report'),
      install: args.includes('--install'),
      status: args.includes('--status'),
      help: args.includes('--help') || args.includes('-h')
    }
    
    // 过滤掉选项参数
    const params = args.filter(arg => !arg.startsWith('--') && arg !== '-h')
    
    if (options.help || args.length === 0) {
      this.showHelp()
      return
    }
    
    if (options.status) {
      this.showStatus()
      return
    }
    
    if (options.install) {
      await this.installDependencies()
      return
    }
    
    // 解析参数
    let targetProjects = Object.keys(PROJECTS)
    let testType = 'unit'
    
    if (params.length === 1) {
      // 只有一个参数，可能是项目名或测试类型
      if (PROJECTS[params[0]]) {
        targetProjects = [params[0]]
      } else if (TEST_TYPES[params[0]]) {
        testType = params[0]
      } else {
        console.error(`❌ 无效的项目或测试类型: ${params[0]}`)
        this.showHelp()
        return
      }
    } else if (params.length === 2) {
      // 两个参数：项目名 + 测试类型
      if (PROJECTS[params[0]] && TEST_TYPES[params[1]]) {
        targetProjects = [params[0]]
        testType = params[1]
      } else {
        console.error(`❌ 无效的参数组合: ${params[0]} ${params[1]}`)
        this.showHelp()
        return
      }
    }
    
    try {
      if (options.parallel && targetProjects.length > 1) {
        await this.runParallelTests(targetProjects, testType, options)
      } else {
        for (const project of targetProjects) {
          await this.runProjectTest(project, testType, options)
        }
      }
      
      if (options.report) {
        this.generateReport()
      }
      
    } catch (error) {
      console.error(`❌ 测试执行失败: ${error.message}`)
      process.exit(1)
    }
  }
}

// 主程序入口
if (require.main === module) {
  const runner = new IntelligentTestRunner()
  const args = process.argv.slice(2)
  
  runner.run(args).catch(error => {
    console.error('❌ 运行器错误:', error.message)
    process.exit(1)
  })
}

module.exports = IntelligentTestRunner