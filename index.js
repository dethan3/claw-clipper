#!/usr/bin/env node

/**
 * Claw_Clipper - OpenClaw 技能入口文件
 * 提供 /claw 命令接口
 */

const { execSync } = require('child_process');
const path = require('path');

// 技能信息
const SKILL_INFO = {
  name: 'claw-clipper',
  version: '0.1.0',
  description: '网页剪藏工具 - 智能抓取网页内容并保存为 Markdown 格式',
  commands: {
    'claw': '剪藏网页内容，用法: /claw <url> [选项]',
    'claw save': '保存网页内容，用法: /claw save <url> [选项]',
    'claw batch': '批量处理 URL 列表，用法: /claw batch <文件路径>',
    'claw config': '管理配置，用法: /claw config [show|set|reset]',
    'claw list': '查看已保存的文章，用法: /claw list',
    'claw help': '显示帮助信息'
  }
};

/**
 * 显示技能信息
 */
function showSkillInfo() {
  console.log(`
🎯 ${SKILL_INFO.name} v${SKILL_INFO.version}
${SKILL_INFO.description}

可用命令:
${Object.entries(SKILL_INFO.commands)
  .map(([cmd, desc]) => `  ${cmd.padEnd(15)} ${desc}`)
  .join('\n')}

示例:
  /claw https://example.com/article
  /claw https://example.com/article --format obsidian --tags "技术,AI"
  /claw batch ~/urls.txt
  /claw config show

更多信息请查看: ~/.openclaw/workspace/skills/claw-clipper/README.md
  `);
}

/**
 * 处理命令
 */
async function handleCommand(args) {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showSkillInfo();
    return;
  }

  const command = args[0];
  
  try {
    // 调用主处理脚本
    const result = execSync(
      `node "${path.join(__dirname, 'claw-clipper.js')}" ${args.join(' ')}`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    console.log(result);
    
  } catch (error) {
    console.error(`❌ 执行命令时出错: ${error.message}`);
    
    if (error.stderr) {
      console.error(`错误输出: ${error.stderr}`);
    }
    
    console.log('\n💡 提示: 请确保已安装依赖:');
    console.log('  cd ~/.openclaw/workspace/skills/claw-clipper');
    console.log('  npm install');
  }
}

// 如果是直接运行
if (require.main === module) {
  const args = process.argv.slice(2);
  handleCommand(args).catch(console.error);
}

module.exports = {
  SKILL_INFO,
  handleCommand
};