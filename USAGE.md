# Claw_Clipper 使用指南

## 🚀 快速开始

### 安装依赖
```bash
cd ~/.openclaw/workspace/skills/claw-clipper
npm install
```

### 基本用法
在 OpenClaw 聊天中直接使用：

```
/claw https://stephango.com/saw
```

### 带选项的用法
```
/claw https://example.com/article --format obsidian --tags "技术,AI,教程"
```

## 📋 命令参考

### 保存单个网页
```
/claw <url> [选项]
/claw save <url> [选项]
```

**示例：**
```
/claw https://stephango.com/saw
/claw save https://example.com/tutorial --format obsidian
/claw https://github.com/openclaw/openclaw --tags "开源,工具"
```

### 批量处理
```
/claw batch <文件路径> [选项]
```

**示例：**
1. 创建 URL 列表文件 `urls.txt`：
```
https://stephango.com/saw
https://example.com/article1
https://example.com/article2
```

2. 运行批量处理：
```
/claw batch ~/urls.txt --output ~/Documents/clippings
```

### 配置管理
```
/claw config show          # 显示当前配置
/claw config set outputDir ~/obsidian/clippings  # 设置输出目录
/claw config set defaultFormat obsidian          # 设置默认格式
/claw config reset         # 重置为默认配置
```

### 查看已保存的文章
```
/claw list
```

## 🎨 使用场景示例

### 场景1：保存技术文章到 Obsidian
```
/claw https://blog.example.com/tech-article --format obsidian --obsidian-vault ~/Obsidian
```

### 场景2：保存多篇文章并添加标签
```
/claw https://example.com/article1 --tags "编程,JavaScript,教程"
/claw https://example.com/article2 --tags "设计,UI,用户体验"
/claw https://example.com/article3 --tags "产品,管理,方法论"
```

### 场景3：批量保存阅读列表
1. 创建 `reading-list.txt`：
```
https://stephango.com/saw
https://example.com/ai-trends
https://example.com/tech-news
```

2. 运行批量保存：
```
/claw batch ~/reading-list.txt --tags "待读,收藏"
```

## ⚙️ 配置说明

### 配置文件位置
`~/.claw-clipper/config.json`

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

### 配置项说明
- **outputDir**: 本地保存目录（默认：`~/Documents/clippings`）
- **defaultFormat**: 默认输出格式（`markdown` 或 `obsidian`）
- **autoTags**: 是否自动从内容中提取标签
- **autoSaveToFeishu**: 是否自动保存到飞书文档
- **obsidian.vaultPath**: Obsidian 仓库路径
- **obsidian.autoLink**: 是否自动创建双向链接

## 🗂️ 文件组织

### 保存位置结构
```
~/Documents/clippings/
├── stephango.com/
│   └── 2026-04-03/
│       └── use-the-saw-fear-the-saw.md
├── example.com/
│   └── 2026-04-03/
│       ├── article-1.md
│       └── article-2.md
└── github.com/
    └── 2026-04-02/
        └── openclaw-readme.md
```

### 文件名规则
- 基于文章标题生成 slug
- 格式：`{slug}-{日期}.md`
- 示例：`use-the-saw-fear-the-saw-20260403.md`

## 🔧 高级用法

### 自定义提取器
如果需要针对特定网站优化提取效果，可以创建自定义提取器：

1. 在 `extractors/` 目录创建新文件，如 `custom-site.js`
2. 实现 `match()` 和 `extract()` 方法
3. 在配置中启用该提取器

### 自定义模板
可以修改 `templates/` 目录下的模板文件来自定义输出格式：

- `templates/default.md` - 标准 Markdown 模板
- `templates/obsidian.md` - Obsidian 专用模板

### 集成到工作流
可以将 Claw_Clipper 集成到其他自动化流程中：

```bash
# 每日自动抓取 RSS 更新
0 9 * * * /path/to/claw-clipper batch ~/daily-feeds.txt

# 保存到特定目录并发送通知
/claw https://example.com/article --output ~/project/research --tags "研究,重要"
```

## 🐛 故障排除

### 常见问题

**1. 无法抓取某些网站**
```
错误：无法获取网页内容
```
- 检查网络连接
- 网站可能需要 JavaScript 渲染
- 尝试使用 `--no-feishu` 选项只保存到本地

**2. 内容提取不准确**
```
提取的内容包含导航栏或广告
```
- 该网站可能需要专用提取器
- 可以手动指定 CSS 选择器（开发中）

**3. 飞书文档创建失败**
```
无法创建飞书文档
```
- 检查飞书授权状态
- 确保有创建文档的权限
- 使用 `--no-feishu` 选项先保存到本地

**4. 文件保存失败**
```
无法保存文件
```
- 检查输出目录权限
- 确保磁盘空间充足
- 检查文件名是否包含非法字符

### 调试模式
```bash
# 查看详细日志
DEBUG=claw-clipper* /claw https://example.com/article
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request：

1. **报告问题**：在 GitHub 提交 Issue
2. **添加提取器**：在 `extractors/` 目录添加新的提取器
3. **改进功能**：修改核心逻辑或添加新功能
4. **更新文档**：改进使用说明或添加示例

## 📞 支持

如有问题或建议，请：
1. 查看 [README.md](./README.md)
2. 查看本文档
3. 提交 GitHub Issue
4. 在 OpenClaw 社区讨论