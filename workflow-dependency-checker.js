const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 工作流依赖关系检查器
class WorkflowDependencyChecker {
  constructor() {
    this.workflows = new Map();
    this.dependencies = new Map();
    this.issues = [];
  }

  // 加载所有工作流文件
  loadWorkflows(workflowDir) {
    const workflowFiles = fs.readdirSync(workflowDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map(file => path.join(workflowDir, file));

    for (const filePath of workflowFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const workflow = yaml.load(content);
        const fileName = path.basename(filePath);
        
        this.workflows.set(fileName, {
          path: filePath,
          config: workflow,
          name: workflow.name || fileName
        });
      } catch (error) {
        this.issues.push({
          type: 'parse_error',
          file: path.basename(filePath),
          message: `Failed to parse workflow: ${error.message}`
        });
      }
    }
  }

  // 分析工作流依赖关系
  analyzeDependencies() {
    for (const [fileName, workflow] of this.workflows) {
      const deps = this.extractDependencies(workflow.config, fileName);
      this.dependencies.set(fileName, deps);
    }
  }

  // 提取工作流的依赖关系
  extractDependencies(workflow, fileName) {
    const deps = {
      workflow_run: [],
      needs: [],
      uses: [],
      secrets: [],
      env_vars: [],
      actions: []
    };

    // 检查 workflow_run 触发器
    if (workflow.on && workflow.on.workflow_run) {
      const workflowRun = workflow.on.workflow_run;
      if (workflowRun.workflows) {
        deps.workflow_run = workflowRun.workflows;
      }
    }

    // 检查作业依赖 (needs)
    if (workflow.jobs) {
      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        if (job.needs) {
          const needs = Array.isArray(job.needs) ? job.needs : [job.needs];
          deps.needs.push(...needs.map(need => ({ job: jobName, needs: need })));
        }

        // 检查 uses (可重用工作流)
        if (job.uses) {
          deps.uses.push({ job: jobName, uses: job.uses });
        }

        // 检查步骤中的 actions
        if (job.steps) {
          for (const step of job.steps) {
            if (step.uses) {
              deps.actions.push({ job: jobName, action: step.uses });
            }
          }
        }
      }
    }

    // 检查环境变量和密钥
    this.extractEnvAndSecrets(workflow, deps);

    return deps;
  }

  // 提取环境变量和密钥
  extractEnvAndSecrets(workflow, deps) {
    const extractFromObject = (obj, path = '') => {
      if (typeof obj === 'string') {
        // 检查 secrets 引用
        const secretMatches = obj.match(/\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g);
        if (secretMatches) {
          secretMatches.forEach(match => {
            const secret = match.match(/secrets\.([A-Z_]+)/)[1];
            deps.secrets.push(secret);
          });
        }

        // 检查环境变量引用
        const envMatches = obj.match(/\$\{\{\s*env\.([A-Z_]+)\s*\}\}/g);
        if (envMatches) {
          envMatches.forEach(match => {
            const envVar = match.match(/env\.([A-Z_]+)/)[1];
            deps.env_vars.push(envVar);
          });
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          extractFromObject(value, path ? `${path}.${key}` : key);
        }
      }
    };

    extractFromObject(workflow);

    // 去重
    deps.secrets = [...new Set(deps.secrets)];
    deps.env_vars = [...new Set(deps.env_vars)];
  }

  // 验证依赖关系
  validateDependencies() {
    for (const [fileName, deps] of this.dependencies) {
      this.validateWorkflowRunDependencies(fileName, deps.workflow_run);
      this.validateJobDependencies(fileName, deps.needs);
      this.validateActionVersions(fileName, deps.actions);
      this.validateReusableWorkflows(fileName, deps.uses);
    }
  }

  // 验证 workflow_run 依赖
  validateWorkflowRunDependencies(fileName, workflowRuns) {
    for (const workflowName of workflowRuns) {
      const exists = Array.from(this.workflows.values())
        .some(w => w.name === workflowName);
      
      if (!exists) {
        this.issues.push({
          type: 'missing_workflow_dependency',
          file: fileName,
          message: `Referenced workflow "${workflowName}" not found`
        });
      }
    }
  }

  // 验证作业依赖
  validateJobDependencies(fileName, needs) {
    const workflow = this.workflows.get(fileName);
    if (!workflow || !workflow.config.jobs) return;

    const jobNames = Object.keys(workflow.config.jobs);
    
    for (const { job, needs: neededJob } of needs) {
      if (!jobNames.includes(neededJob)) {
        this.issues.push({
          type: 'missing_job_dependency',
          file: fileName,
          message: `Job "${job}" depends on non-existent job "${neededJob}"`
        });
      }
    }
  }

  // 验证 Action 版本
  validateActionVersions(fileName, actions) {
    const outdatedActions = {
      'actions/checkout': { current: 'v4', outdated: ['v1', 'v2', 'v3'] },
      'actions/setup-node': { current: 'v4', outdated: ['v1', 'v2', 'v3'] },
      'actions/setup-python': { current: 'v5', outdated: ['v1', 'v2', 'v3', 'v4'] },
      'actions/cache': { current: 'v4', outdated: ['v1', 'v2', 'v3'] },
      'actions/upload-artifact': { current: 'v4', outdated: ['v1', 'v2', 'v3'] },
      'actions/download-artifact': { current: 'v4', outdated: ['v1', 'v2', 'v3'] }
    };

    for (const { job, action } of actions) {
      const [actionName, version] = action.split('@');
      
      if (outdatedActions[actionName]) {
        const { current, outdated } = outdatedActions[actionName];
        if (outdated.includes(version)) {
          this.issues.push({
            type: 'outdated_action',
            file: fileName,
            message: `Job "${job}" uses outdated action ${actionName}@${version}, consider upgrading to @${current}`
          });
        }
      }
    }
  }

  // 验证可重用工作流
  validateReusableWorkflows(fileName, uses) {
    for (const { job, uses: usedWorkflow } of uses) {
      // 检查本地可重用工作流
      if (usedWorkflow.startsWith('./')) {
        const workflowPath = path.resolve(path.dirname(this.workflows.get(fileName).path), usedWorkflow);
        if (!fs.existsSync(workflowPath)) {
          this.issues.push({
            type: 'missing_reusable_workflow',
            file: fileName,
            message: `Job "${job}" references non-existent reusable workflow: ${usedWorkflow}`
          });
        }
      }
    }
  }

  // 生成报告
  generateReport() {
    const report = {
      summary: {
        total_workflows: this.workflows.size,
        total_issues: this.issues.length,
        timestamp: new Date().toISOString()
      },
      workflows: {},
      issues: this.issues,
      recommendations: []
    };

    // 添加工作流信息
    for (const [fileName, workflow] of this.workflows) {
      const deps = this.dependencies.get(fileName);
      report.workflows[fileName] = {
        name: workflow.name,
        dependencies: deps,
        issues: this.issues.filter(issue => issue.file === fileName)
      };
    }

    // 生成建议
    this.generateRecommendations(report);

    return report;
  }

  // 生成建议
  generateRecommendations(report) {
    const issueTypes = {};
    for (const issue of this.issues) {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    }

    if (issueTypes.outdated_action > 0) {
      report.recommendations.push(
        `发现 ${issueTypes.outdated_action} 个过时的 GitHub Action，建议升级到最新版本以获得更好的性能和安全性。`
      );
    }

    if (issueTypes.missing_workflow_dependency > 0) {
      report.recommendations.push(
        `发现 ${issueTypes.missing_workflow_dependency} 个缺失的工作流依赖，请检查工作流名称是否正确。`
      );
    }

    if (issueTypes.missing_job_dependency > 0) {
      report.recommendations.push(
        `发现 ${issueTypes.missing_job_dependency} 个缺失的作业依赖，请检查作业名称是否正确。`
      );
    }

    if (this.issues.length === 0) {
      report.recommendations.push('所有工作流依赖关系检查通过，配置正确！');
    }
  }
}

// 主函数
function main() {
  console.log('🔍 开始检查工作流依赖关系...');
  
  const workflowDir = path.join(process.cwd(), '.github/workflows');
  
  if (!fs.existsSync(workflowDir)) {
    console.log('❌ 未找到 .github/workflows 目录');
    process.exit(1);
  }

  const checker = new WorkflowDependencyChecker();
  
  // 加载工作流
  checker.loadWorkflows(workflowDir);
  console.log(`📁 加载了 ${checker.workflows.size} 个工作流文件`);
  
  // 分析依赖关系
  checker.analyzeDependencies();
  console.log('🔗 分析依赖关系完成');
  
  // 验证依赖关系
  checker.validateDependencies();
  console.log('✅ 依赖关系验证完成');
  
  // 生成报告
  const report = checker.generateReport();
  
  console.log('\n📊 检查结果汇总:');
  console.log(`工作流总数: ${report.summary.total_workflows}`);
  console.log(`发现问题: ${report.summary.total_issues}`);
  
  if (report.summary.total_issues > 0) {
    console.log('\n❌ 发现的问题:');
    for (const issue of report.issues) {
      console.log(`  - [${issue.type}] ${issue.file}: ${issue.message}`);
    }
  }
  
  console.log('\n💡 建议:');
  for (const recommendation of report.recommendations) {
    console.log(`  - ${recommendation}`);
  }
  
  // 保存报告
  const reportPath = path.join(process.cwd(), 'workflow-dependency-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  
  if (report.summary.total_issues > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 所有工作流依赖关系检查通过!');
    process.exit(0);
  }
}

main();