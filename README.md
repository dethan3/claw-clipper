# Claw_Clipper - 网页剪藏技能

智能抓取网页内容并保存为 Markdown 格式，支持飞书文档创建和 Obsidian 集成。

## 🚀 快速开始

### 基础用法
```
/claw https://example.com/article
/claw save https://example.com/article
```

### 指定输出格式
```
/claw https://example.com/article --format obsidian
/claw https://example.com/article -f markdown
```

### 指定保存位置
```
/claw https://example.com/article --output ~/Documents/clippings
/claw https://example.com/article -o /path/to/save
```

### 添加标签
```
/claw https://example.com/article --tags "AI,技术,教程"
/claw https://example.com/article -t "哲学,思考"
```

### 批量处理
```
/claw batch urls.txt
/claw batch --file urls.txt --format obsidian
```

## 📋 完整命令参考

### 保存网页
```
/claw <url> [选项]
/claw save <url> [选项]
/claw clip <url> [选项]
```

**选项：**
- `-f, --format <format>`: 输出格式 (markdown|obsidian)，默认：markdown
- `-o, --output <dir>`: 输出目录
- `-t, --tags <tags>`: 标签，用逗号分隔
- `--obsidian-vault <path>`: Obsidian 仓库路径
- `--to-feedoc`: 保存到飞书文档（默认）

### 批量处理
```
/claw batch <文件路径> [选项]
```

**示例：**
```
/claw batch ~/urls.txt
/claw batch --file ~/urls.txt --format obsidian --tags "收藏,待读"
```

### 配置管理
```
/claw config show          # 显示当前配置
/claw config set <key> <value>  # 设置配置项
/claw config reset         # 重置为默认配置
```

### 帮助信息
```
/claw help
/claw --help
/claw -h
```

## 🎨 使用示例

### 示例 1：保存到飞书文档
```
/claw https://stephango.com/saw --tags "工具安全,哲学"
```
这将：
1. 抓取网页内容
2. 提取元数据（标题、作者、日期等）
3. 转换为 Markdown
4. 创建飞书文档
5. 添加指定的标签

### 示例 2：保存到本地 Obsidian
```
/claw https://example.com/tutorial --format obsidian --obsidian-vault ~/Obsidian
```
这将：
1. 抓取网页内容
2. 生成 Obsidian 格式的 Markdown
3. 保存到指定的 Obsidian 仓库
4. 自动创建双向链接

### 示例 3：批量处理
创建一个 `urls.txt` 文件：
```
https://example.com/article1
https://example.com/article2
https://example.com/article3
```

然后运行：
```
/claw batch urls.txt --tags "技术博客,收藏"
```

## ⚙️ 配置项

### 默认配置
```json
{
  "outputDir": "~/Documents/clippings",
  "defaultFormat": "markdown",
  "autoTags": true,
  "autoSaveToFeishu": true,
  "obsidian": {
    "vaultPath": "~/Obsidian",
    "autoLink": true
  }
}
```

### 配置说明
- **outputDir**: 本地保存目录
- **defaultFormat**: 默认输出格式
- **autoTags**: 是否自动生成标签
- **autoSaveToFeishu**: 是否自动保存到飞书文档
- **obsidian.vaultPath**: Obsidian 仓库路径
- **obsidian.autoLink**: 是否自动创建双向链接

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

### 作为 OpenClaw 技能
```bash
# 1. 复制技能到技能目录
cp -r claw-clipper ~/.openclaw/workspace/skills/

# 2. 在 OpenClaw 中启用技能
# （根据 OpenClaw 的配置方式）

# 3. 初始化配置
/claw config init
```

### 独立使用
```bash
# 1. 安装依赖
cd claw-clipper
npm install

# 2. 运行
node claw-clipper.js https://example.com/article
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