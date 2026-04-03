#!/usr/bin/env node

/**
 * Claw_Clipper - OpenClaw 技能包装器
 * 提供 OpenClaw 工具集成和交互式界面
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.claw-clipper', 'config.json');
const DEFAULT_CONFIG = {
  outputDir: path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', 'clippings'),
  defaultFormat: 'obsidian',
  autoTags: true,
  extractors: {
    generic: true,
    medium: true,
    zhihu: true,
    github: true,
    blog: true
  },
  obsidian: {
    vaultPath: path.join(process.env.HOME || process.env.USERPROFILE, 'Obsidian'),
    autoLink: true,
    frontmatter: {
      tags: ['clipped'],
      source: true
    }
  }
};

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.warn(`无法加载配置文件: ${error.message}`);
  }
  return DEFAULT_CONFIG;
}

// 保存配置
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

// 初始化配置
function initConfig() {
  const config = loadConfig();
  
  // 确保输出目录存在
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
    console.log(`创建输出目录: ${config.outputDir}`);
  }
  
  // 确保 Obsidian 目录存在（如果启用）
  if (config.defaultFormat === 'obsidian' && config.obsidian?.vaultPath) {
    if (!fs.existsSync(config.obsidian.vaultPath)) {
      console.warn(`警告: Obsidian 仓库目录不存在: ${config.obsidian.vaultPath}`);
    }
  }
  
  return config;
}

/**
 * 使用 OpenClaw 的 web_fetch 工具获取网页内容
 */
async function fetchWithOpenClaw(url) {
  try {
    // 这里需要调用 OpenClaw 的 web_fetch 工具
    // 由于我们是在 OpenClaw 环境中，可以通过 exec 调用
    const result = execSync(`openclaw tools web_fetch --url "${url}" --extractMode markdown`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // 解析结果（假设返回 JSON）
    const data = JSON.parse(result);
    return {
      html: data.content,
      title: data.title || '',
      url: url
    };
  } catch (error) {
    console.error(`使用 OpenClaw 获取网页失败: ${error.message}`);
    
    // 回退到使用 node-fetch
    try {
      const fetch = require('node-fetch');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
      return { html, title: '', url };
    } catch (fetchError) {
      throw new Error(`所有获取方法都失败: ${fetchError.message}`);
    }
  }
}

/**
 * 处理单个 URL
 */
async function processUrl(url, options = {}) {
  const config = loadConfig();
  const mergedOptions = { ...config, ...options };
  
  console.log(`\n🔍 开始处理: ${url}`);
  
  try {
    // 获取网页内容
    console.log('📡 获取网页内容...');
    const { html, title } = await fetchWithOpenClaw(url);
    
    if (!html) {
      throw new Error('无法获取网页内容');
    }
    
    // 调用核心处理逻辑
    const { clipWebpage } = require('./clip.js');
    const result = await clipWebpage(url, mergedOptions);
    
    if (result.success) {
      console.log(`✅ 成功保存: ${result.filePath}`);
      
      // 如果是 Obsidian 格式，尝试创建双向链接
      if (mergedOptions.defaultFormat === 'obsidian' && mergedOptions.obsidian?.autoLink) {
        await createObsidianLinks(result, mergedOptions);
      }
      
      return {
        success: true,
        url,
        title: result.metadata.title,
        filePath: result.filePath,
        metadata: result.metadata
      };
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error(`❌ 处理失败: ${error.message}`);
    return {
      success: false,
      url,
      error: error.message
    };
  }
}

/**
 * 为 Obsidian 创建双向链接
 */
async function createObsidianLinks(result, config) {
  if (!config.obsidian?.vaultPath) {
    return;
  }
  
  try {
    const vaultPath = config.obsidian.vaultPath;
    const notePath = path.join(vaultPath, 'clippings', path.basename(result.filePath));
    
    // 读取现有的笔记，查找相关主题
    const relatedNotes = await findRelatedNotes(result.metadata, vaultPath);
    
    if (relatedNotes.length > 0) {
      const linksSection = `\n## 相关笔记\n${relatedNotes.map(note => `- [[${note.title}]]`).join('\n')}\n`;
      
      // 追加到文件
      fs.appendFileSync(result.filePath, linksSection, 'utf8');
      console.log(`🔗 添加了 ${relatedNotes.length} 个相关链接`);
    }
    
  } catch (error) {
    console.warn(`无法创建 Obsidian 链接: ${error.message}`);
  }
}

/**
 * 查找相关笔记
 */
async function findRelatedNotes(metadata, vaultPath) {
  const relatedNotes = [];
  
  try {
    // 简单的关键词匹配
    const keywords = [...metadata.keywords, ...metadata.title.split(' ')];
    
    // 搜索 vault 中的笔记
    const notes = await searchNotes(vaultPath, keywords.slice(0, 5));
    
    // 返回前 3 个最相关的笔记
    return notes.slice(0, 3);
    
  } catch (error) {
    console.warn(`搜索相关笔记失败: ${error.message}`);
  }
  
  return relatedNotes;
}

/**
 * 搜索笔记
 */
async function searchNotes(vaultPath, keywords) {
  const notes = [];
  
  try {
    // 递归搜索 .md 文件
    function searchDir(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory() && !file.name.startsWith('.')) {
          searchDir(fullPath);
        } else if (file.isFile() && file.name.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : path.basename(file.name, '.md');
            
            // 简单的内容匹配
            const score = keywords.reduce((total, keyword) => {
              if (content.toLowerCase().includes(keyword.toLowerCase())) {
                return total + 1;
              }
              return total;
            }, 0);
            
            if (score > 0) {
              notes.push({
                path: fullPath,
                title: title,
                score: score
              });
            }
          } catch (readError) {
            // 忽略读取错误
          }
        }
      }
    }
    
    searchDir(vaultPath);
    
    // 按相关性排序
    notes.sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.warn(`搜索笔记失败: ${error.message}`);
  }
  
  return notes;
}

/**
 * 批量处理 URL
 */
async function processBatch(urls, options = {}) {
  console.log(`📚 批量处理 ${urls.length} 个 URL`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] 处理: ${url}`);
    
    const result = await processUrl(url, options);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n📊 批量处理完成:`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  
  return results;
}

/**
 * 交互式 CLI
 */
async function interactiveCli() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('🎯 Claw_Clipper - 网页剪藏工具');
  console.log('=' .repeat(40));
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  try {
    // 选择模式
    console.log('\n请选择模式:');
    console.log('1. 单个 URL');
    console.log('2. 批量处理（从文件读取）');
    console.log('3. 配置设置');
    console.log('4. 退出');
    
    const mode = await question('\n请输入选项 (1-4): ');
    
    switch (mode) {
      case '1':
        const url = await question('\n请输入 URL: ');
        if (url) {
          const format = await question('输出格式 (markdown/obsidian) [obsidian]: ') || 'obsidian';
          const outputDir = await question(`输出目录 [${DEFAULT_CONFIG.outputDir}]: `) || DEFAULT_CONFIG.outputDir;
          const tags = await question('标签 (用逗号分隔，可选): ');
          
          const options = {
            defaultFormat: format,
            outputDir: outputDir
          };
          
          if (tags) {
            options.tags = tags.split(',').map(t => t.trim());
          }
          
          await processUrl(url, options);
        }
        break;
        
      case '2':
        const filePath = await question('\n请输入包含 URL 的文件路径: ');
        if (filePath && fs.existsSync(filePath)) {
          const urls = fs.readFileSync(filePath, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.startsWith('http'));
          
          if (urls.length > 0) {
            console.log(`找到 ${urls.length} 个 URL`);
            await processBatch(urls, loadConfig());
          } else {
            console.log('文件中没有找到有效的 URL');
          }
        } else {
          console.log('文件不存在');
        }
        break;
        
      case '3':
        console.log('\n当前配置:');
        console.log(JSON.stringify(loadConfig(), null, 2));
        
        const action = await question('\n1. 编辑配置\n2. 重置为默认\n选择: ');
        
        if (action === '1') {
          const newConfig = loadConfig();
          const newOutputDir = await question(`输出目录 [${newConfig.outputDir}]: `);
          if (newOutputDir) newConfig.outputDir = newOutputDir;
          
          const newFormat = await question(`默认格式 (markdown/obsidian) [${newConfig.defaultFormat}]: `);
          if (newFormat) newConfig.defaultFormat = newFormat;
          
          saveConfig(newConfig);
          console.log('配置已保存');
        } else if (action === '2') {
          saveConfig(DEFAULT_CONFIG);
          console.log('已重置为默认配置');
        }
        break;
        
      case '4':
        console.log('再见！');
        break;
        
      default:
        console.log('无效选项');
    }
    
  } catch (error) {
    console.error(`错误: ${error.message}`);
  } finally {
    rl.close();
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 初始化配置
  initConfig();
  
  if (args.length === 0) {
    // 交互式模式
    await interactiveCli();
  } else {
    // 命令行模式
    const command = args[0];
    
    switch (command) {
      case 'clip':
      case 'save':
        if (args.length < 2) {
          console.error('用法: claw-clipper clip <url> [选项]');
          console.error('       claw-clipper save <url> [选项]');
          process.exit(1);
        }
        await processUrl(args[1], parseOptions(args.slice(2)));
        break;
        
      case 'batch':
        if (args.length < 2) {
          console.error('用法: claw-clipper batch <文件路径>');
          process.exit(1);
        }
        const filePath = args[1];
        if (!fs.existsSync(filePath)) {
          console.error(`文件不存在: ${filePath}`);
          process.exit(1);
        }
        const urls = fs.readFileSync(filePath, 'utf8')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.startsWith('http'));
        await processBatch(urls, parseOptions(args.slice(2)));
        break;
        
      case 'config':
        if (args[1] === 'show') {
          console.log(JSON.stringify(loadConfig(), null, 2));
        } else if (args[1] === 'reset') {
          saveConfig(DEFAULT_CONFIG);
          console.log('配置已重置为默认值');
        } else {
          console.error('用法: claw-clipper config [show|reset]');
        }
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        // 如果没有指定命令，假设第一个参数是 URL
        await processUrl(command, parseOptions(args.slice(1)));
        break;
    }
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
      case '--output':
      case '-o':
        if (nextArg) {
          options.outputDir = nextArg;
          i++;
        }
        break;
      case '--format':
      case '-f':
        if (nextArg) {
          options.defaultFormat = nextArg;
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
    }
  }
  
  return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
Claw_Clipper - 网页剪藏工具

用法:
  claw-clipper <url> [选项]           # 保存单个网页
  claw-clipper clip <url> [选项]      # 同上
  claw-clipper batch <文件路径> [选项] # 批量处理 URL 列表
  claw-clipper config show           # 显示当前配置
  claw-clipper config reset          # 重置配置
  claw-clipper help                  # 显示此帮助信息

选项:
  --output, -o <dir>         指定输出目录
  --format, -f <format>      输出格式: markdown, obsidian (默认: obsidian)
  --tags, -t <tags>          添加标签，用逗号分隔
  --obsidian-vault <path>    指定 Obsidian 仓库路径

示例:
  claw-clipper https://example.com/article
  claw-clipper https://example.com/article --output ~/obsidian --format obsidian
  claw-clipper batch urls.txt --tags "技术,AI"
  claw-clipper config show

交互模式:
  直接运行 claw-clipper 进入交互式界面
  `);
}

// 启动
if (require.main === module) {
  main().catch(error => {
    console.error(`程序出错: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  processUrl,
  processBatch,
  loadConfig,
  saveConfig,
  initConfig
};