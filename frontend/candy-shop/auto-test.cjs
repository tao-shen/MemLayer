#!/usr/bin/env node
/**
 * 完全自动化测试脚本
 * 功能：构建 → Git Push → 启动服务器 → Playwright 测试 → 验证功能
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_DIR = '/Users/tao.shen/Tacits/frontend/candy-shop';
const DEV_PORT = 5173;
const TEST_URL = `http://localhost:${DEV_PORT}`;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}🚀 ${msg}${colors.reset}`);
}

function runCommand(cmd, cwd = PROJECT_DIR) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, shell: '/bin/zsh' }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function gitPush() {
  log('📤 正在 Git Push...', 'cyan');
  try {
    await runCommand('git push origin main');
    log('✅ Git Push 成功', 'green');
  } catch (error) {
    log('⚠️ Git Push 需要认证或无更改', 'yellow');
  }
}

async function build() {
  log('🔨 正在构建项目...', 'cyan');
  const result = await runCommand('pnpm build');
  if (result.stdout.includes('built') || result.stdout.includes('✓ built')) {
    log('✅ 构建成功', 'green');
    return true;
  } else {
    log('❌ 构建失败', 'red');
    console.log(result.stdout);
    console.log(result.stderr);
    return false;
  }
}

async function startDevServer() {
  log('🌐 正在启动开发服务器...', 'cyan');

  return new Promise((resolve) => {
    const child = spawn('pnpm', ['dev', '--port', DEV_PORT.toString()], {
      cwd: PROJECT_DIR,
      shell: '/bin/zsh',
      stdio: 'pipe',
    });

    let started = false;

    child.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost') || output.includes('ready')) {
        if (!started) {
          started = true;
          log(`✅ 开发服务器已启动: ${TEST_URL}`, 'green');
          resolve(child);
        }
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost') || output.includes('ready')) {
        if (!started) {
          started = true;
          log(`✅ 开发服务器已启动: ${TEST_URL}`, 'green');
          resolve(child);
        }
      }
    });

    // 超时保护
    setTimeout(() => {
      if (!started) {
        log('⚠️ 服务器启动超时，尝试继续...', 'yellow');
        resolve(child);
      }
    }, 15000);
  });
}

async function runPlaywrightTest(serverProcess) {
  log('🧪 正在运行 Playwright 测试...', 'cyan');

  // 写入临时测试文件
  const testFile = '/tmp/playwright-test.mjs';
  const playwrightTestScript = `
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const results = {
  pageLoaded: false,
  consoleErrors: [],
  likeButtonFound: false,
  runButtonFound: false,
  openCodeConnected: false,
  testPassed: false
};

// 监听控制台
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('[OpenCode] Connected')) {
    results.openCodeConnected = true;
    console.log('✅ OpenCode 连接成功');
  }
  if (text.includes('[Like]')) {
    console.log('📝 Like 事件:', text);
  }
});

// 监听错误
page.on('pageerror', error => {
  results.consoleErrors.push(error.message);
  console.log('❌ 页面错误:', error.message);
});

try {
  // 1. 加载页面
  console.log('📄 加载页面...');
  await page.goto('${TEST_URL}', { waitUntil: 'networkidle', timeout: 30000 });
  results.pageLoaded = true;
  console.log('✅ 页面加载成功');

  // 2. 查找 Run 按钮
  console.log('🔍 查找 Run 按钮...');
  const runButton = await page.$('button[title="Run skill"]');
  if (runButton) {
    results.runButtonFound = true;
    console.log('✅ Run 按钮找到');
  } else {
    console.log('⚠️ Run 按钮未找到');
  }

  // 查找 heart 图标按钮
  const heartButtons = await page.$$('svg[class*="lucide-heart"]');
  if (heartButtons.length > 0) {
    results.likeButtonFound = true;
    console.log('✅ Like 按钮找到:', heartButtons.length, '个');
    
    // 3. 测试点击 Like
    console.log('🖱️ 测试点击 Like...');
    await heartButtons[0].click();
    await page.waitForTimeout(500);
    console.log('✅ Like 点击完成');
  }

  // 4. 测试点击 Run
  console.log('🖱️ 测试点击 Run...');
  if (runButton) {
    await runButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Run 点击完成');
  }

  // 5. 检查结果
  await page.waitForTimeout(2000);
  
  results.testPassed = results.pageLoaded && 
                       results.likeButtonFound && 
                       results.runButtonFound &&
                       results.consoleErrors.length === 0;

  console.log('\\n📊 测试结果:');
  console.log('  页面加载:', results.pageLoaded ? '✅' : '❌');
  console.log('  Like 按钮:', results.likeButtonFound ? '✅' : '❌');
  console.log('  Run 按钮:', results.runButtonFound ? '✅' : '❌');
  console.log('  控制台错误:', results.consoleErrors.length === 0 ? '✅ 无' : '❌ ' + results.consoleErrors.length + '个');
  console.log('  OpenCode 连接:', results.openCodeConnected ? '✅' : '⚠️ 未检测到');
  console.log('  综合结果:', results.testPassed ? '✅ 通过' : '❌ 失败');

} catch (error) {
  console.log('❌ 测试错误:', error.message);
  results.testPassed = false;
} finally {
  await browser.close();
}

process.exit(results.testPassed ? 0 : 1);
  `;

  fs.writeFileSync(testFile, playwrightTestScript);

  return new Promise((resolve) => {
    // 使用 npx 直接运行，设置正确的 NODE_PATH
    const child = spawn('/opt/homebrew/bin/node', [testFile], {
      cwd: PROJECT_DIR,
      shell: '/bin/zsh',
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_PATH: '/opt/homebrew/anaconda3/lib/node_modules',
      },
    });

    let stdout = '';
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      // 清理测试文件
      try {
        fs.unlinkSync(testFile);
      } catch (e) {}

      if (code === 0) {
        log('✅ Playwright 测试完成', 'green');
        resolve({ success: true });
      } else {
        log('❌ Playwright 测试失败', 'red');
        resolve({ success: false, error: `Exit code: ${code}` });
      }
    });
  });
}

async function main() {
  console.log('\\n');
  log('═══════════════════════════════════════════', 'blue');
  log('  完全自动化测试流程', 'blue');
  log('═══════════════════════════════════════════', 'blue');
  console.log('\\n');

  let serverProcess = null;
  let testSuccess = false;

  try {
    // 步骤 1: Git Push
    await gitPush();

    // 步骤 2: 构建
    const buildSuccess = await build();
    if (!buildSuccess) {
      throw new Error('构建失败');
    }

    // 步骤 3: 启动开发服务器
    serverProcess = await startDevServer();

    // 步骤 4: Playwright 测试
    const testResult = await runPlaywrightTest(serverProcess);
    testSuccess = testResult.success;

    // 步骤 5: 如果测试成功，Git Push
    if (testSuccess) {
      await gitPush();
      log('✅ 所有测试通过！已自动 Push 到远程', 'green');
    } else {
      log('⚠️ 测试失败，请检查问题', 'yellow');
    }
  } catch (error) {
    log('❌ 流程错误: ' + error.message, 'red');
  } finally {
    // 清理：关闭服务器
    if (serverProcess) {
      log('🛑 关闭开发服务器...', 'yellow');
      serverProcess.kill();
    }
  }

  console.log('\\n');
  log('═══════════════════════════════════════════', 'blue');
  log(testSuccess ? '  🎉 全部完成！' : '  ⚠️ 需要手动检查问题', 'blue');
  log('═══════════════════════════════════════════', 'blue');
  console.log('\\n');

  process.exit(testSuccess ? 0 : 1);
}

main();
