---
name: claw-clipper
description: |
  网页剪藏工具，智能抓取网页内容并保存为 Markdown 格式，支持 Obsidian 集成和知识图谱构建。

  **当以下情况时使用此 Skill**：
  (1) 用户想要保存网页内容
  (2) 用户提到"剪藏"、"保存网页"、"收藏文章"
  (3) 用户提供 URL 并希望保存内容
  (4) 用户需要将网页内容整理到飞书文档或本地文件
  (5) 用户需要批量处理多个网页链接

  **激活关键词**：
  - 剪藏、保存网页、收藏文章、网页存档
  - claw clip、web clipper、save webpage
  - 保存到飞书、保存到 Obsidian
  - 批量保存、批量处理链接
---

# Claw_Clipper - 网页剪藏工具

OpenClaw 的网页剪藏技能，智能抓取网页文章内容并保存为干净的 Markdown 格式，支持 Obsidian 集成和知识图谱构建。

## 功能特性

### 核心功能
- **智能内容提取** - 自动识别文章主体内容，去除广告、导航等噪音
- **Markdown 转换** - 将 HTML 转换为干净的 Markdown 格式
- **元数据提取** - 自动提取标题、作者、发布日期、描述等元数据
- **多网站支持** - 内置通用提取器，支持常见网站（Medium、知乎、博客园等）
- **文件组织** - 按域名和日期自动分类保存

### 高级功能
- **Obsidian 集成** - 生成正确的 frontmatter 和双向链接
- **知识图谱** - 自动建立文章间的关联关系
- **定时抓取** - 支持监控特定网站，自动抓取新内容
- **批量处理** - 支持多个 URL 批量处理

## 使用方法

### 基础用法
```bash
# 保存单个网页
claw-clipper https://example.com/article

# 指定保存目录
claw-clipper https://example.com/article --output ~/obsidian/clippings/

# 添加自定义标签
claw-clipper https://example.com/article --tags "AI,技术,教程"
```

### 高级用法
```bash
# 批量处理 URL 列表
claw-clipper --batch urls.txt

# 使用特定提取器
claw-clipper https://zhihu.com/question/123 --extractor zhihu

# 生成 Obsidian 格式
claw-clipper https://example.com/article --format obsidian

# 定时抓取（cron 任务）
claw-clipper --schedule "0 9 * * *" --url https://example.com/feed
```

## 配置

创建配置文件 `~/.claw-clipper/config.json`：

```json
{
  "defaultOutput": "~/obsidian/clippings",
  "defaultFormat": "obsidian",
  "autoTags": true,
  "extractors": {
    "medium": true,
    "zhihu": true,
    "github": true
  },
  "obsidian": {
    "vaultPath": "~/obsidian",
    "autoLink": true,
    "frontmatter": {
      "tags": ["clipped"],
      "source": true
    }
  }
}
```

## 提取器系统

Claw_Clipper 使用智能提取器系统：

1. **通用提取器** - 适用于大多数网站
2. **专用提取器** - 针对特定网站优化
3. **自定义提取器** - 用户可自定义 CSS 选择器

### 内置提取器
- `generic` - 通用网页提取器
- `medium` - Medium 文章提取器
- `zhihu` - 知乎文章/回答提取器
- `github` - GitHub README/文档提取器
- `blog` - 常见博客平台提取器

## 文件结构

```
clippings/
├── example.com/              # 按域名分类
│   ├── 2024-03/
│   │   ├── article-title.md
│   │   └── another-article.md
│   └── 2024-04/
├── zhihu.com/
│   └── 2024-03/
├── inbox/                    # 待处理文章
└── archive/                  # 归档文章
```

## Markdown 输出格式

### 标准格式
```markdown
---
title: "文章标题"
source: "https://example.com/article"
author: "作者名"
date: "2024-01-01"
description: "文章描述"
tags: ["标签1", "标签2"]
clipped_at: "2024-01-01T12:00:00Z"
---

# 文章标题

> 来源: [原文链接](https://example.com/article)
> 作者: 作者名
> 发布日期: 2024-01-01

<!-- 正文内容 -->
```

### Obsidian 格式
```markdown
---
aliases: []
tags: [clipped, 技术, AI]
source: "https://example.com/article"
author: "作者名"
date: 2024-01-01
clipped_at: 2024-01-01T12:00:00
---

# 文章标题

> 来源: [[原文链接|https://example.com/article]]
> 作者: [[作者名]]
> 发布日期: 2024-01-01

<!-- 正文内容 -->

## 相关笔记
- [[相关主题1]]
- [[相关主题2]]
```

## 安装和设置

### 作为 OpenClaw 技能安装
```bash
# 将技能目录复制到技能文件夹
cp -r claw-clipper ~/.openclaw/workspace/skills/

# 在 OpenClaw 中启用技能
```

### 独立使用（Node.js）
```bash
npm install claw-clipper
# 或
npx claw-clipper https://example.com/article
```

## 开发指南

### 添加新的提取器
在 `extractors/` 目录下创建新的提取器文件：

```javascript
// extractors/custom.js
module.exports = {
  name: 'custom',
  match: (url) => url.hostname.includes('custom.com'),
  extract: async (document, url) => {
    // 自定义提取逻辑
    return {
      title: document.querySelector('h1').textContent,
      content: document.querySelector('.article-content').innerHTML,
      author: document.querySelector('.author-name').textContent,
      date: document.querySelector('time').getAttribute('datetime')
    };
  }
};
```

### 贡献
欢迎提交 Pull Request 或 Issue：
1. 添加新的网站提取器
2. 改进现有提取算法
3. 添加新功能
4. 修复 bug

## 许可证
MIT