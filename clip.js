#!/usr/bin/env node

/**
 * Claw_Clipper - 网页剪藏工具
 * 智能抓取网页内容并保存为 Markdown 格式
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

// 配置
const CONFIG = {
  defaultOutput: path.join(process.env.HOME || process.env.USERPROFILE, '.claw-clipper', 'clippings'),
  defaultFormat: 'markdown',
  autoTags: true,
  dateFormat: 'YYYY-MM-DD',
  fileNameFormat: '{slug}-{date}'
};

// 初始化 Turndown 服务
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full'
});

turndownService.use(gfm);

// 添加自定义规则
turndownService.addRule('remove-ads', {
  filter: (node) => {
    const className = node.className || '';
    const id = node.id || '';
    return (
      node.matches('script, style, aside, form, nav, header, footer') ||
      className.includes('ad') ||
      className.includes('advertisement') ||
      className.includes('sidebar') ||
      id.includes('ad') ||
      id.includes('sidebar')
    );
  },
  replacement: () => ''
});

/**
 * 智能识别文章主要内容区域
 */
function findMainContent(document) {
  // 优先级选择器
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '.post',
    '.article',
    '.blog-post',
    '.story-content',
    '#content',
    '#main'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 100) {
      return element;
    }
  }

  // 如果没有找到明确的内容区域，尝试找到包含最多文本的 div
  const divs = Array.from(document.querySelectorAll('div'));
  let bestDiv = document.body;
  let maxTextLength = 0;

  for (const div of divs) {
    const textLength = div.textContent.trim().length;
    if (textLength > maxTextLength && textLength > 100) {
      maxTextLength = textLength;
      bestDiv = div;
    }
  }

  return bestDiv;
}

/**
 * 提取元数据
 */
function extractMetadata(document, url) {
  const metadata = {
    title: '',
    author: '',
    date: '',
    description: '',
    keywords: [],
    url: url.href,
    domain: url.hostname,
    clipped_at: new Date().toISOString()
  };

  // 提取标题
  metadata.title = document.querySelector('h1')?.textContent?.trim() || 
                   document.title?.replace(/\s*[-|·]\s*.+$/, '').trim() || 
                   'Untitled';

  // 提取作者
  const authorSelectors = [
    'meta[name="author"]',
    '[rel="author"]',
    '.author',
    '.byline',
    '[itemprop="author"]',
    'a[class*="author"]',
    '[class*="author"] a'
  ];

  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      metadata.author = element.getAttribute('content') || element.textContent?.trim();
      if (metadata.author) break;
    }
  }

  // 提取发布日期
  const dateSelectors = [
    'time[datetime]',
    'time',
    '[class*="date"]',
    '[class*="time"]',
    '[itemprop="datePublished"]',
    'meta[property="article:published_time"]',
    'meta[name="published_time"]'
  ];

  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      metadata.date = element.getAttribute('datetime') || 
                     element.getAttribute('content') || 
                     element.textContent?.trim();
      if (metadata.date) break;
    }
  }

  // 提取描述
  const descriptionMeta = document.querySelector('meta[name="description"]') || 
                         document.querySelector('meta[property="og:description"]');
  if (descriptionMeta) {
    metadata.description = descriptionMeta.getAttribute('content')?.trim() || '';
  }

  // 提取关键词
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta) {
    const keywords = keywordsMeta.getAttribute('content')?.split(',').map(k => k.trim()) || [];
    metadata.keywords = keywords.filter(k => k.length > 0);
  }

  return metadata;
}

/**
 * 生成文件 slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
    .substring(0, 100);
}

/**
 * 生成文件路径
 */
function generateFilePath(metadata, options = {}) {
  const {
    outputDir = CONFIG.defaultOutput,
    format = CONFIG.defaultFormat
  } = options;

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const slug = generateSlug(metadata.title);
  const fileName = `${slug}-${year}${month}${String(date.getDate()).padStart(2, '0')}.md`;
  
  const domainDir = metadata.domain.replace(/^www\./, '');
  const filePath = path.join(outputDir, domainDir, `${year}-${month}`, fileName);
  
  return {
    fullPath: filePath,
    dir: path.dirname(filePath),
    fileName: fileName,
    slug: slug
  };
}

/**
 * 生成 Markdown 内容
 */
function generateMarkdown(content, metadata, options = {}) {
  const { format = 'markdown' } = options;
  
  let frontmatter = {};
  
  if (format === 'obsidian') {
    frontmatter = {
      aliases: [],
      tags: ['clipped', ...metadata.keywords],
      source: metadata.url,
      author: metadata.author,
      date: metadata.date ? new Date(metadata.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      clipped_at: metadata.clipped_at,
      title: metadata.title
    };
  } else {
    frontmatter = {
      title: metadata.title,
      source: metadata.url,
      author: metadata.author,
      date: metadata.date,
      description: metadata.description,
      tags: metadata.keywords,
      clipped_at: metadata.clipped_at,
      domain: metadata.domain
    };
  }
  
  // 清理 frontmatter，移除空值
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined || frontmatter[key] === null || frontmatter[key] === '') {
      delete frontmatter[key];
    }
  });
  
  const frontmatterYaml = `---\n${Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      return `${key}: "${value}"`;
    })
    .join('\n')}\n---\n\n`;
  
  const header = `# ${metadata.title}\n\n`;
  
  const sourceInfo = [];
  if (metadata.url) {
    sourceInfo.push(`> 来源: [原文链接](${metadata.url})`);
  }
  if (metadata.author) {
    sourceInfo.push(`> 作者: ${metadata.author}`);
  }
  if (metadata.date) {
    sourceInfo.push(`> 发布日期: ${metadata.date}`);
  }
  
  const sourceBlock = sourceInfo.length > 0 ? `${sourceInfo.join('\n')}\n\n` : '';
  
  return frontmatterYaml + header + sourceBlock + content;
}

/**
 * 主处理函数
 */
async function clipWebpage(url, options = {}) {
  try {
    console.log(`📄 正在处理: ${url}`);
    
    // 解析 URL
    const urlObj = new URL(url);
    
    // 获取网页内容（这里需要替换为实际的网页获取逻辑）
    // 在 OpenClaw 中，我们会使用 web_fetch 工具
    // 这里先模拟一个简单的实现
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 提取元数据
    const metadata = extractMetadata(document, urlObj);
    console.log(`📋 提取到元数据: ${metadata.title}`);
    
    // 找到主要内容
    const mainContent = findMainContent(document);
    if (!mainContent) {
      throw new Error('无法找到文章主要内容');
    }
    
    // 转换为 Markdown
    const markdownContent = turndownService.turndown(mainContent.innerHTML);
    console.log(`✅ 转换为 Markdown，长度: ${markdownContent.length} 字符`);
    
    // 生成文件路径
    const fileInfo = generateFilePath(metadata, options);
    
    // 确保目录存在
    fs.mkdirSync(fileInfo.dir, { recursive: true });
    
    // 生成完整的 Markdown
    const fullMarkdown = generateMarkdown(markdownContent, metadata, options);
    
    // 保存文件
    fs.writeFileSync(fileInfo.fullPath, fullMarkdown, 'utf8');
    console.log(`💾 已保存到: ${fileInfo.fullPath}`);
    
    return {
      success: true,
      metadata,
      filePath: fileInfo.fullPath,
      contentLength: markdownContent.length
    };
    
  } catch (error) {
    console.error(`❌ 处理失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 命令行接口
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Claw_Clipper - 网页剪藏工具

用法:
  node clip.js <url> [选项]

选项:
  --output, -o <dir>    指定输出目录 (默认: ~/.claw-clipper/clippings)
  --format, -f <format>  输出格式: markdown, obsidian (默认: markdown)
  --tags, -t <tags>      添加标签，用逗号分隔
  --help, -h             显示帮助信息

示例:
  node clip.js https://example.com/article
  node clip.js https://example.com/article --output ~/obsidian --format obsidian
  node clip.js https://example.com/article --tags "技术,AI,教程"
    `);
    process.exit(0);
  }
  
  const url = args[0];
  if (!url || !url.startsWith('http')) {
    console.error('错误: 请提供有效的 URL');
    process.exit(1);
  }
  
  // 解析选项
  const options = {};
  for (let i = 1; i < args.length; i++) {
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
          options.format = nextArg;
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
    }
  }
  
  const result = await clipWebpage(url, options);
  
  if (result.success) {
    console.log('\n🎉 剪藏成功！');
    console.log(`标题: ${result.metadata.title}`);
    console.log(`作者: ${result.metadata.author || '未知'}`);
    console.log(`文件: ${result.filePath}`);
    console.log(`大小: ${result.contentLength} 字符`);
  } else {
    console.error(`\n❌ 剪藏失败: ${result.error}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  clipWebpage,
  extractMetadata,
  findMainContent,
  generateMarkdown,
  generateFilePath
};