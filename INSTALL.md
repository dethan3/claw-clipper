# Claw_Clipper 安装指南

## 📦 安装步骤

### 1. 确保技能目录存在
```bash
mkdir -p ~/.openclaw/workspace/skills
```

### 2. 复制技能文件
如果已经在 `~/.openclaw/workspace/skills/claw-clipper/` 目录，可以跳过此步。

### 3. 安装依赖
```bash
cd ~/.openclaw/workspace/skills/claw-clipper
npm install
```

### 4. 测试安装
```bash
# 测试基本功能
node claw-clipper.js --help

# 测试网页抓取
node claw-clipper.js https://stephango.com/saw --output /tmp/test
```

### 5. 配置 OpenClaw（如果需要）
根据你的 OpenClaw 配置，可能需要将技能添加到技能列表中。

## 🔧 配置

### 基本配置
首次使用时，Claw_Clipper 会自动创建默认配置文件：
- `~/.claw-clipper/config.json`

### 自定义配置
```bash
# 查看当前配置
/claw config show

# 修改输出目录
/claw config set outputDir ~/obsidian/clippings

# 修改默认格式为 Obsidian
/claw config set defaultFormat obsidian

# 禁用自动保存到飞书
/claw config set autoSaveToFeishu false
```

### 飞书集成配置
要启用飞书文档自动保存，需要：
1. 确保 OpenClaw 已配置飞书集成
2. 确保有创建文档的权限

## 🚀 快速测试

### 测试1：保存网页到本地
```bash
/claw https://stephango.com/saw --output ~/test-clippings
```

### 测试2：保存到飞书文档
```bash
/claw https://stephango.com/saw --tags "测试,工具安全"
```

### 测试3：批量处理
1. 创建测试文件 `test-urls.txt`：
```
https://stephango.com/saw
https://example.com/about
```

2. 运行批量处理：
```bash
/claw batch test-urls.txt --format obsidian
```

## 📁 文件结构

安装后的目录结构：
```
~/.openclaw/workspace/skills/claw-clipper/
├── index.js              # 技能入口
├── claw-clipper.js      # 主处理脚本
├── clip.js              # 核心处理逻辑
├── extractors/          # 网站专用提取器
├── templates/           # 输出模板
├── examples/            # 示例文件
├── package.json         # 依赖配置
├── README.md           # 使用说明
├── USAGE.md            # 详细使用指南
└── INSTALL.md          # 本文件
```

## 🔍 验证安装

### 检查依赖
```bash
cd ~/.openclaw/workspace/skills/claw-clipper
npm list
```

应该看到以下依赖：
- jsdom
- turndown
- turndown-plugin-gfm
- node-fetch

### 测试技能命令
在 OpenClaw 中运行：
```
/claw help
```

应该看到帮助信息。

### 测试网页抓取
```bash
node claw-clipper.js https://stephango.com/saw --output /tmp/claw-test
```

检查 `/tmp/claw-test/` 目录是否生成了 Markdown 文件。

## 🐛 常见安装问题

### 问题1：npm install 失败
**症状**：安装依赖时出现错误
**解决**：
```bash
# 清除 npm 缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题2：权限错误
**症状**：无法创建文件或目录
**解决**：
```bash
# 检查目录权限
ls -la ~/.openclaw/workspace/skills/

# 修复权限
chmod 755 ~/.openclaw/workspace/skills/claw-clipper
```

### 问题3：OpenClaw 无法识别技能
**症状**：`/claw` 命令无效
**解决**：
1. 确保技能在正确的目录
2. 重启 OpenClaw 服务
3. 检查 OpenClaw 技能配置

### 问题4：网页抓取失败
**症状**：无法获取网页内容
**解决**：
1. 检查网络连接
2. 尝试其他网站
3. 使用 `--no-feishu` 选项只保存到本地测试

## 🔄 更新

### 手动更新
```bash
cd ~/.openclaw/workspace/skills/claw-clipper
git pull  # 如果使用 git
npm install  # 更新依赖
```

### 配置迁移
更新后，如果需要迁移配置：
```bash
# 备份旧配置
cp ~/.claw-clipper/config.json ~/.claw-clipper/config.json.backup

# 查看更新日志中的配置变更
```

## 📞 获取帮助

如果遇到问题：

1. **查看日志**：
   ```bash
   # 查看 OpenClaw 日志
   openclaw logs
   ```

2. **调试模式**：
   ```bash
   DEBUG=claw-clipper* node claw-clipper.js https://example.com
   ```

3. **提交 Issue**：
   - 描述问题现象
   - 提供错误信息
   - 说明复现步骤

4. **社区支持**：
   - OpenClaw Discord 社区
   - GitHub Discussions

## 🎉 安装完成

安装完成后，你可以：
1. 使用 `/claw` 命令剪藏网页
2. 配置自动保存到飞书文档
3. 批量处理阅读列表
4. 自定义输出格式和模板

开始使用吧！
```
/claw https://stephango.com/saw --tags "第一个测试"
```