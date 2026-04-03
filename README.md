# Claw_Clipper - 网页剪藏技能

智能抓取网页内容并保存为 Markdown 格式，支持飞书文档创建和 Obsidian 集成。通过自然语言触发，无需记忆复杂命令！

## 🚀 快速开始

### 自然语言触发
Claw_Clipper 通过关键词识别自动触发，无需固定命令格式：

**基础用法：**
- "剪藏这个网页：https://example.com/article"
- "保存这篇文章到飞书：https://example.com/article"
- "收藏这个链接：https://example.com/article"

**指定格式：**
- "把这个网页保存为 Obsidian 笔记：https://example.com/article"
- "用 markdown 格式保存这篇文章：https://example.com/article"

**指定位置和标签：**
- "保存到我的文档文件夹，标签是AI和技术：https://example.com/article"
- "剪藏这篇文章，标签是哲学思考：https://example.com/article"

**批量处理：**
- "批量保存这些链接：https://example.com/1, https://example.com/2"
- "把这些文章都保存到飞书：urls.txt 里的链接"

### 激活关键词
技能会自动识别以下关键词触发：
- 剪藏、保存、收藏、抓取、存档
- 网页、文章、链接、URL
- 飞书、Obsidian、文档、笔记
- 批量、多个、列表

## 📋 使用示例

### 示例 1：简单剪藏
```
用户：剪藏这个网页：https://stephango.com/saw
Claw_Clipper：✅ 已成功抓取文章并保存到飞书文档！
```

### 示例 2：带标签保存
```
用户：保存这篇文章，标签是工具安全和哲学：https://stephango.com/saw
Claw_Clipper：📄 文章已保存！添加了标签：工具安全, 哲学
```

### 示例 3：保存到 Obsidian
```
用户：把这个网页保存为 Obsidian 笔记：https://example.com/tutorial
Claw_Clipper：🔗 已保存到 Obsidian 仓库，创建了双向链接！
```

### 示例 4：批量处理
```
用户：批量保存这些链接到飞书：
https://example.com/article1
https://example.com/article2
https://example.com/article3

Claw_Clipper：📚 批量处理完成！3篇文章已保存到飞书。
```

## 🎨 详细示例

### 示例 1：简单剪藏到飞书
```
用户：剪藏这个网页：https://stephango.com/saw
```
**处理流程：**
1. 🕷️ 智能抓取网页内容
2. 📊 提取标题、作者、日期等元数据
3. 📝 转换为结构化 Markdown
4. 📱 自动创建飞书文档
5. ✅ 返回文档链接和摘要

### 示例 2：带标签和格式指定
```
用户：保存这篇文章为 Obsidian 笔记，标签是AI和技术：https://example.com/tutorial
```
**处理流程：**
1. 🎯 识别格式要求（Obsidian）
2. 🔖 提取并添加指定标签
3. 🔗 生成 Obsidian 格式的 Markdown（支持双向链接）
4. 💾 保存到默认 Obsidian 仓库
5. 📋 返回文件路径和预览

### 示例 3：批量处理多个链接
```
用户：批量保存这些文章到飞书：
1. https://example.com/article1
2. https://example.com/article2
3. https://example.com/article3
```
**处理流程：**
1. 📋 识别批量处理请求
2. 🔄 依次处理每个链接
3. 📚 批量创建飞书文档
4. 📊 生成处理报告
5. ✅ 返回成功/失败统计

## ⚙️ 配置说明

Claw_Clipper 会自动使用默认配置，但你可以通过自然语言调整设置：

### 配置方式
**询问当前配置：**
```
用户：Claw_Clipper 的当前设置是什么？
Claw_Clipper：当前配置：默认保存到飞书，自动生成标签，本地备份到 ~/Documents/clippings
```

**修改配置：**
```
用户：把默认保存位置改为我的 Obsidian 仓库
Claw_Clipper：✅ 已更新配置！现在默认保存到 Obsidian 仓库。

用户：关闭自动标签功能
Claw_Clipper：✅ 已关闭自动标签生成。
```

**查看支持的配置项：**
```
用户：Claw_Clipper 可以配置哪些选项？
Claw_Clipper：支持配置：保存位置、输出格式、自动标签、飞书集成、Obsidian 路径等。
```

### 默认配置
```json
{
  "outputDir": "~/Documents/clippings",      // 本地备份目录
  "defaultFormat": "markdown",               // 默认格式
  "autoTags": true,                          // 自动生成标签
  "autoSaveToFeishu": true,                  // 自动保存到飞书
  "obsidian": {
    "vaultPath": "~/Obsidian",               // Obsidian 仓库路径
    "autoLink": true                         // 自动创建双向链接
  }
}
```

## 🔧 高级功能

### 自定义提取器
Claw_Clipper 支持针对特定网站的专用提取器：

1. **通用提取器** - 适用于大多数网站
2. **Medium 提取器** - 针对 Medium.com 优化
3. **知乎提取器** - 针对 zhihu.com 优化
4. **GitHub 提取器** - 针对 GitHub README 优化

### 模板系统
支持自定义输出模板：
- `templates/default.md` - 标准 Markdown 模板
- `templates/obsidian.md` - Obsidian 专用模板
- `templates/research.md` - 研究笔记模板

### 定时抓取
```bash
# 设置每天上午9点抓取
/claw schedule "0 9 * * *" https://example.com/feed
```

## 🛠️ 安装和设置

### 作为 OpenClaw 技能安装
Claw_Clipper 是专为 OpenClaw 设计的技能，安装后即可通过自然语言使用：

1. **克隆仓库到技能目录**
   ```bash
   cd ~/.openclaw/workspace/skills/
   git clone https://github.com/dethan3/claw-clipper.git
   ```

2. **安装依赖**
   ```bash
   cd claw-clipper
   npm install
   ```

3. **在 OpenClaw 中启用**
   - 技能会自动注册到 OpenClaw
   - 通过自然语言关键词触发
   - 无需额外配置命令

4. **开始使用**
   ```
   用户：剪藏这个网页：https://example.com/article
   Claw_Clipper：✅ 已处理完成！
   ```

### 独立使用（开发者模式）
如果你只想测试核心功能：
```bash
# 1. 安装依赖
cd claw-clipper
npm install

# 2. 运行测试
node clip.js --url https://example.com/article --format markdown
```

## 📁 文件结构
```
claw-clipper/
├── SKILL.md              # 技能说明文档
├── README.md             # 本文件
├── claw-clipper.js       # 主入口文件
├── clip.js               # 核心处理逻辑
├── extractors/           # 网站专用提取器
│   ├── generic.js       # 通用提取器
│   ├── medium.js        # Medium 专用
│   └── zhihu.js         # 知乎专用
├── templates/            # 输出模板
│   ├── default.md       # 标准模板
│   └── obsidian.md      # Obsidian 模板
├── examples/             # 示例文件
│   ├── urls.txt         # URL 示例
│   └── example-config.json
└── package.json         # 依赖配置
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request：

1. **报告问题**：在 GitHub 提交 Issue
2. **添加提取器**：在 `extractors/` 目录添加新的提取器
3. **改进功能**：修改核心逻辑或添加新功能
4. **更新文档**：改进使用说明或添加示例

## 📄 许可证

MIT License