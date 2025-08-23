#!/usr/bin/env node

/**
 * Admin 前端服务优雅退出处理脚本
 * 用于处理开发服务器的优雅关闭
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  pidFile: path.join(__dirname, 'admin.pid'),
  logFile: path.join(__dirname, 'admin.log'),
  shutdownTimeout: 10000, // 10秒超时
  healthCheckInterval: 1000, // 1秒检查间隔
};

// 全局状态
let devProcess = null;
let shutdownRequested = false;
let shutdownTimer = null;

/**
 * 日志记录函数
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);

  // 写入日志文件
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  } catch (error) {
    console.error('写入日志文件失败:', error.message);
  }
}

/**
 * 保存进程 PID
 */
function savePid(pid) {
  try {
    fs.writeFileSync(CONFIG.pidFile, pid.toString());
    log(`进程 PID ${pid} 已保存到 ${CONFIG.pidFile}`);
  } catch (error) {
    log(`保存 PID 失败: ${error.message}`, 'ERROR');
  }
}

/**
 * 清理 PID 文件
 */
function cleanupPidFile() {
  try {
    if (fs.existsSync(CONFIG.pidFile)) {
      fs.unlinkSync(CONFIG.pidFile);
      log('PID 文件已清理');
    }
  } catch (error) {
    log(`清理 PID 文件失败: ${error.message}`, 'ERROR');
  }
}

/**
 * 优雅关闭开发服务器
 */
function gracefulShutdown(signal = 'SIGTERM') {
  if (shutdownRequested) {
    log('优雅关闭已在进行中...');
    return;
  }

  shutdownRequested = true;
  log(`收到 ${signal} 信号，开始优雅关闭...`);

  if (!devProcess) {
    log('没有运行的开发服务器进程');
    process.exit(0);
    return;
  }

  // 设置强制退出定时器
  shutdownTimer = setTimeout(() => {
    log('优雅关闭超时，强制终止进程', 'WARN');
    if (devProcess && !devProcess.killed) {
      devProcess.kill('SIGKILL');
    }
    cleanupPidFile();
    process.exit(1);
  }, CONFIG.shutdownTimeout);

  // 发送终止信号给开发服务器
  try {
    log('向开发服务器发送 SIGTERM 信号...');
    devProcess.kill('SIGTERM');

    // 等待进程正常退出
    devProcess.on('exit', (code, signal) => {
      clearTimeout(shutdownTimer);
      log(`开发服务器已退出，退出码: ${code}, 信号: ${signal}`);
      cleanupPidFile();
      process.exit(code || 0);
    });
  } catch (error) {
    log(`发送终止信号失败: ${error.message}`, 'ERROR');
    clearTimeout(shutdownTimer);
    cleanupPidFile();
    process.exit(1);
  }
}

/**
 * 启动开发服务器
 */
function startDevServer() {
  log('启动 Admin 开发服务器...');

  // 清理旧的 PID 文件
  cleanupPidFile();

  // 启动 Vite 开发服务器
  devProcess = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  // 保存 PID
  savePid(devProcess.pid);

  // 处理标准输出
  devProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(output);
      try {
        fs.appendFileSync(CONFIG.logFile, output + '\n');
      } catch {
        // 忽略日志写入错误
      }
    }
  });

  // 处理标准错误
  devProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(output);
      try {
        fs.appendFileSync(CONFIG.logFile, `[ERROR] ${output}\n`);
      } catch {
        // 忽略日志写入错误
      }
    }
  });

  // 处理进程错误
  devProcess.on('error', (error) => {
    log(`开发服务器启动失败: ${error.message}`, 'ERROR');
    cleanupPidFile();
    process.exit(1);
  });

  // 处理进程退出
  devProcess.on('exit', (code, signal) => {
    if (!shutdownRequested) {
      log(`开发服务器意外退出，退出码: ${code}, 信号: ${signal}`, 'ERROR');
      cleanupPidFile();
      process.exit(code || 1);
    }
  });

  log(`Admin 开发服务器已启动，PID: ${devProcess.pid}`);
}

/**
 * 设置信号处理器
 */
function setupSignalHandlers() {
  // 处理 SIGTERM 信号
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // 处理 SIGINT 信号 (Ctrl+C)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 处理 SIGHUP 信号
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    log(`未捕获的异常: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason) => {
    log(`未处理的 Promise 拒绝: ${reason}`, 'ERROR');
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

/**
 * 主函数
 */
function main() {
  log('Admin 优雅启动脚本开始运行...');

  // 设置信号处理器
  setupSignalHandlers();

  // 启动开发服务器
  startDevServer();

  log('Admin 服务已启动，等待连接...');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  startDevServer,
  gracefulShutdown,
  CONFIG,
};
