#!/usr/bin/env node

/**
 * Claw_Clipper - OpenClaw 技能入口
 * 提供 /claw 命令接口
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 加载配置
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.claw-clipper', 'config.json');
const DEFAULT_CONFIG = {
  outputDir: path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', 'clippings'),
  defaultFormat: 'markdown',
  autoTags: true,
  autoSaveToFeishu: true,
  obsidian: {
    vaultPath: path.join(process.env.HOME || process.env.USERPROFILE, 'Obsidian'),
    autoLink: true
  }
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.warn(`无法加载配置文件: ${error.message}`);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`保存配置失败: ${error.message}`);
    return false;
  }
}

/**
 * 处理 /claw 命令
 */
async function handleClawCommand(args) {
  const command = args[0] || 'help';
  
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      return showHelp();
      
    case 'save':
    case 'clip':
      return await handleSaveCommand(args.slice(1));
      
    case 'batch':
      return await handleBatchCommand(args.slice(1));
      
    case 'config':
      return handleConfigCommand(args.slice(1));
      
    case 'list':
      return handleListCommand(args.slice(1));
      
    default:
      // 如果没有指定子命令，假设第一个参数是 URL
      if (args[0] && args[0].startsWith('http')) {
        return await handleSaveCommand(args);
      } else {
        return showHelp();
      }
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  const helpText = `
🎯 Claw_Clipper - 网页剪藏工具

使用方法:
  /claw <url> [选项]           # 保存单个网页
  /claw save <url> [选项]      # 同上
  /claw batch <文件路径>       # 批量处理 URL 列表
  /claw config show           # 显示当前配置
  /claw config set <key> <value> # 设置配置项
  /claw config reset          # 重置配置
  /claw list                  # 查看已保存的文章
  /claw help                  # 显示此帮助信息

选项:
  --format, -f <format>      输出格式: markdown, obsidian (默认: markdown)
  --output, -o <dir>         输出目录
  --tags, -t <tags>          添加标签，用逗号分隔
  --obsidian-vault <path>    指定 Obsidian 仓库路径
  --no-feishu                不保存到飞书文档
  --feishu-title <title>     飞书文档标题（默认使用文章标题）

示例:
  /claw https://example.com/article
  /claw https://example.com/article --format obsidian --tags "技术,AI"
  /claw batch ~/urls.txt --output ~/Documents/clippings
  /claw config set defaultFormat obsidian

配置文件: ~/.claw-clipper/config.json
  `;
  
  return {
    type: 'text',
    content: helpText,
    format: 'markdown'
  };
}

/**
 * 处理保存命令
 */
async function handleSaveCommand(args) {
  if (args.length === 0) {
    return {
      type: 'text',
      content: '❌ 错误: 请提供 URL\n\n用法: /claw save <url> [选项]',
      format: 'markdown'
    };
  }
  
  const url = args[0];
  if (!url.startsWith('http')) {
    return {
      type: 'text',
      content: `❌ 错误: 无效的 URL "${url}"\nURL 必须以 http:// 或 https:// 开头`,
      format: 'markdown'
    };
  }
  
  // 解析选项
  const options = parseOptions(args.slice(1));
  const config = loadConfig();
  
  try {
    console.log(`开始处理: ${url}`);
    
    // 这里调用实际的剪藏逻辑
    // 暂时返回成功消息
    const result = await processUrl(url, { ...config, ...options });
    
    if (result.success) {
      let response = `✅ 剪藏成功!\n\n`;
      response += `**标题**: ${result.metadata.title || '无标题'}\n`;
      response += `**作者**: ${result.metadata.author || '未知'}\n`;
      response += `**保存位置**: ${result.filePath}\n`;
      
      if (options.autoSaveToFeishu !== false && config.autoSaveToFeishu !== false) {
        response += `**飞书文档**: 已创建\n`;
      }
      
      if (options.tags && options.tags.length > 0) {
        response += `**标签**: ${options.tags.join(', ')}\n`;
      }
      
      response += `\n📊 统计:\n`;
      response += `- 内容长度: ${result.contentLength} 字符\n`;
      response += `- 提取时间: ${new Date().toLocaleTimeString()}\n`;
      
      return {
        type: 'text',
        content: response,
        format: 'markdown'
      };
    } else {
      return {
        type: 'text',
        content: `❌ 剪藏失败: ${result.error}`,
        format: 'markdown'
      };
    }
    
  } catch (error) {
    return {
      type: 'text',
      content: `❌ 处理时发生错误: ${error.message}`,
      format: 'markdown'
    };
  }
}

/**
 * 处理批量命令
 */
async function handleBatchCommand(args) {
  if (args.length === 0) {
    return {
      type: 'text',
      content: '❌ 错误: 请提供文件路径\n\n用法: /claw batch <文件路径> [选项]',
      format: 'markdown'
    };
  }
  
  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    return {
      type: 'text',
      content: `❌ 错误: 文件不存在 "${filePath}"`,
      format: 'markdown'
    };
  }
  
  try {
    const urls = fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('http'));
    
    if (urls.length === 0) {
      return {
        type: 'text',
        content: `❌ 错误: 文件中没有找到有效的 URL`,
        format: 'markdown'
      };
    }
    
    const options = parseOptions(args.slice(1));
    const config = loadConfig();
    
    let response = `📚 开始批量处理 ${urls.length} 个 URL\n\n`;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      response += `[${i + 1}/${urls.length}] 处理: ${url}\n`;
      
      try {
        const result = await processUrl(url, { ...config, ...options });
        if (result.success) {
          response += `  ✅ 成功: ${result.metadata.title || '无标题'}\n`;
        } else {
          response += `  ❌ 失败: ${result.error}\n`;
        }
      } catch (error) {
        response += `  ❌ 错误: ${error.message}\n`;
      }
    }
    
    response += `\n🎉 批量处理完成!`;
    
    return {
      type: 'text',
      content: response,
      format: 'markdown'
    };
    
  } catch (error) {
    return {
      type: 'text',
      content: `❌ 处理文件时发生错误: ${error.message}`,
      format: 'markdown'
    };
  }
}

/**
 * 处理配置命令
 */
function handleConfigCommand(args) {
  const subcommand = args[0] || 'show';
  
  switch (subcommand) {
    case 'show':
      const config = loadConfig();
      return {
        type: 'text',
        content: `📋 当前配置:\n\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``,
        format: 'markdown'
      };
      
    case 'set':
      if (args.length < 3) {
        return {
          type: 'text',
          content: '❌ 错误: 用法: /claw config set <key> <value>',
          format: 'markdown'
        };
      }
      const key = args[1];
      const value = args[2];
      const currentConfig = loadConfig();
      
      // 简单的配置设置逻辑
      if (key.includes('.')) {
        const keys = key.split('.');
        let obj = currentConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      } else {
        currentConfig[key] = value;
      }
      
      saveConfig(currentConfig);
      return {
        type: 'text',
        content: `✅ 配置已更新: ${key} = ${value}`,
        format: 'markdown'
      };
      
    case 'reset':
      saveConfig(DEFAULT_CONFIG);
      return {
        type: 'text',
        content: '✅ 配置已重置为默认值',
        format: 'markdown'
      };
      
    default:
      return {
        type: 'text',
        content: `❌ 未知的配置命令: ${subcommand}\n可用命令: show, set, reset`,
        format: 'markdown'
      };
  }
}

/**
 * 处理列表命令
 */
function handleListCommand(args) {
  const config = loadConfig();
  const outputDir = config.outputDir || DEFAULT_CONFIG.outputDir;
  
  if (!fs.existsSync(outputDir)) {
    return {
      type: 'text',
      content: `📁 输出目录不存在: ${outputDir}\n请先使用 /claw save 命令保存一些文章。`,
      format: 'markdown'
    };
  }
  
  try {
    const files = [];
    function scanDir(dir, prefix = '') {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          scanDir(path.join(dir, item.name), `${prefix}${item.name}/`);
        } else if (item.name.endsWith('.md')) {
          files.push({
            path: path.join(dir, item.name),
            relativePath: `${prefix}${item.name}`,
            name: item.name
          });
        }
      }
    }
    
    scanDir(outputDir);
    
    if (files.length === 0) {
      return {
        type: 'text',
        content: `📁 输出目录为空: ${outputDir}\n请先使用 /claw save 命令保存一些文章。`,
        format: 'markdown'
      };
    }
    
    let response = `📚 已保存的文章 (${files.length} 篇):\n\n`;
    
    // 按域名分组
    const byDomain = {};
    files.forEach(file => {
      const domain = file.relativePath.split('/')[0] || '未知';
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(file);
    });
    
    Object.keys(byDomain).sort().forEach(domain => {
      response += `**${domain}** (${byDomain[domain].length} 篇)\n`;
      byDomain[domain].slice(0, 5).forEach(file => {
        response += `  • ${file.name}\n`;
      });
      if (byDomain[domain].length > 5) {
        response += `  ... 还有 ${byDomain[domain].length - 5} 篇\n`;
      }
      response += '\n';
    });
    
    response += `\n📁 总目录: ${outputDir}`;
    
    return {
      type: 'text',
      content: response,
      format: 'markdown'
    };
    
  } catch (error) {
    return {
      type: 'text',
      content: `❌ 读取文件列表时发生错误: ${error.message}`,
      format: 'markdown'
    };
  }
}

/**
 * 解析命令行选项
 */
function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--format':
      case '-f':
        if (nextArg) {
          options.defaultFormat = nextArg;
          i++;
        }
        break;
      case '--output':
      case '-o':
        if (nextArg) {
          options.outputDir = nextArg;
          i++;
        }
        break;
      case '--tags':
      case '-t':
        if (nextArg) {
          options.tags = nextArg.split(',').map(tag => tag.trim());
          i++;
        }
        break;
      case '--obsidian-vault':
        if (nextArg) {
          options.obsidian = options.obsidian || {};
          options.obsidian.vaultPath = nextArg;
          i++;
        }
        break;
      case '--no-feishu':
        options.autoSaveToFeishu = false;
        break;
      case '--feishu-title':
        if (nextArg) {
          options.feishuTitle = nextArg;
          i++;
        }
        break;
    }
  }
  
  return options;
}

/**
 * 处理 URL（模拟函数，实际需要调用 clip.js）
 */
async function processUrl(url, options) {
  // 这里应该调用实际的剪藏逻辑
  // 为了演示，返回一个模拟结果
  
  const metadata = {
    title: '示例文章标题',
    author: '示例作者',
    date: new Date().toISOString().split('T')[0],
    description: '这是一个示例文章的描述',
    keywords: ['示例', '测试'],
    url: url,
    domain: new URL(url).hostname
  };
  
  const fileName = `clipped-${Date.now()}.md`;
  const filePath = path.join(
    options.outputDir || DEFAULT_CONFIG.outputDir,
    metadata.domain,
    fileName
  );
  
  // 模拟保存文件
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = `# ${metadata.title}\n\n> 来源: ${url}\n> 作者: ${metadata.author}\n> 日期: ${metadata.date}\n\n这是从 ${url} 抓取的内容示例。`;
  
  fs.writeFileSync(filePath, content, 'utf8');
  
  // 模拟保存到飞书文档
  if (options.autoSaveToFeishu !== false) {
    // 这里应该调用 feish- create_doc
    console.log(`模拟保存到飞书文档: ${metadata.title}`);
  }
  // 实际实现中，这里 应该调用 feish (...)

  return {
    zodat: true,
  metadata,
  file责任编辑: filePath-,
  contentLength-: content  .length
  };
  }

  /**
  * Open  Claw 技能入口点
- */
  module. exports = {
  name:  'claw或多个',
  description: '网页剪藏工具，智能抓取网页内容并保存为 Mark- down 格式',
  commands:  {
  claw:  {
  description: '剪藏网页内容',
  handler: async (args) => {
  return await handleClaw  Command(args);
 -
  }
  ，
  'claw save-': {
  description: '保存网页内容（同 /claw）',
  handler: async (args) => {
  return await handleSaveCommand(args);
  }
  }，
  'claw batch': {
  description: '批量处理 URL 列表',
  handler: async (args) => {
  return await handleBatchCommand(args);
  }
  }，
  'claw config': {
  description: '管理配置',
  handler: async (args) => {
  return handleConfigCommand(args);
  }
  }，
  'claw list': {
  description: '查看已保存的文章',
  handler: async (args) => {
  return handleListCommand(args);
  }
  }
  }，
  help: () => {
  return showHelp();
  }
  };