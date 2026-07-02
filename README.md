<p align="center">
  <img src="doc/logo.png" alt="Web TTYd Hub Logo" width="200" />
</p>

# 🚀 Web TTYd Hub

[English](./README_EN.md)

> 🌌 把终端搬进浏览器，随时随地，打开即用。

<p align="center">
  <img src="assets/72643b69-16e1-44ab-841f-cc1dee1b1c0b.png" alt="Web TTYd Hub Screenshot" width="800" />
</p>

Web TTYd Hub 是一个基于 ttyd + tmux 的 Web 终端会话管理器。它让你在浏览器中创建、管理和切换多个终端会话，无论你在电脑前还是躺在沙发上用手机，都能拥有完整的命令行体验。

> 本仓库基于 [sosopop/web-ttyd-hub](https://github.com/sosopop/web-ttyd-hub) fork。

### 与上游差异

| 特性 | 说明 |
|------|------|
| **子路径部署** | 支持 `/web-terminal-xxx/` 等前缀，前端 + API + WebSocket 全路径适配 |
| **增大字体** | ttyd `-s 16` + `--client-option fontSize=16` |
| **增大滚动缓冲** | `--client-option scrollback=50000`，匹配 tmux history-limit |
| **Ctrl+C 智能复制** | 选中文本时复制到剪贴板，未选中时发送 SIGINT |
| **tmux 配置建议** | mouse off + alternate screen 关闭，保证滚动条正常 |

## 💡 为什么需要它

你是否有过这样的场景：

- 🏢 在公司电脑上跑着一个长任务，回到家想看看进度？
- 🛌 躺在床上突然想到一个 bug 的修复思路，想立刻打开终端验证？
- ☕️ 出门在外，只有一部手机，却想连上家里的开发机写代码？

**Web TTYd Hub** 就是为此而生。它把你的终端变成一个 Web 服务，打开浏览器就能用，会话永不丢失。

## ✨ 特性

- **🧩 多会话管理** — 创建多个独立的终端会话，自由切换，互不干扰
- **💾 会话持久化** — 基于 tmux，关闭浏览器会话依然存活，随时重新连接
- **👥 多人协作** — 多个浏览器可同时连接同一会话，实时共享终端画面
- **🐚 多 Shell 支持** — 支持 Bash、Zsh、Fish 等，创建会话时自由选择
- **📱 移动端友好** — 响应式界面，手机平板均可流畅操作
- **🎨 深色科技感 UI** — 精致的 Slate 深色主题、毛玻璃效果、流畅动画，赏心悦目
- **⚡️ 零配置启动** — 安装依赖后一条命令启动，开箱即用

## 🔮 Vibe Coding：从移动端开始编程

Web TTYd Hub 天然适合 **Vibe Coding** 工作流。

搭配 Claude Code、Cursor 等 AI 编程工具，你可以在手机上通过终端与 AI 对话式编程——描述需求、审查代码、运行测试，整个开发流程都可以在移动端完成。通勤路上、咖啡馆里、甚至排队等餐时，灵感来了随时开工。

tmux 会话保证了连续性：手机上开始的工作，回到电脑前无缝继续，不丢失任何上下文。

## 🌐 搭配 Asterism 实现内网穿透

如果你的开发机在家庭或公司内网中，可以搭配 [Asterism](https://github.com/sosopop/asterism) 实现内网穿透，从任何地方访问你的终端。

Asterism 是一个轻量级的内网穿透工具，纯 C 实现，单文件可执行，跨平台支持（Windows / Linux / macOS / Android / iOS），性能优异，资源占用极低。

**典型部署方式：**

```
手机/平板浏览器 📱
    ↓
公网服务器 (Asterism Server) ☁️
    ↓ 内网穿透隧道 🚇
内网开发机 (Web TTYd Hub + Asterism Client) 💻
```

这样你就拥有了一个随身携带的云开发环境——只要有网络，就能连上你的终端。

## 🛠 环境要求

- **Node.js** >= 18
- **ttyd** — Web 终端模拟器
- **tmux** — 终端复用器

### macOS 安装依赖

```bash
brew install ttyd tmux
```

## 🚀 快速开始

```bash
# 安装依赖
npm install
cd frontend && npm install && cd ..

# 构建前端
npm run build

# 启动服务
npm start
```

浏览器打开 `http://localhost:3000` 即可使用。

## 👨‍💻 开发模式

```bash
npm run dev
```

同时启动后端（端口 3000）和 Vite 开发服务器（端口 5173）。

## ⚙️ 配置项

通过环境变量或 `.env` 文件设置：

| 变量                    | 说明              | 默认值    |
| ----------------------- | ----------------- | --------- |
| `PORT`                  | 服务监听端口      | `3000`    |
| `HOST`                  | 监听地址          | `0.0.0.0` |
| `TTYD_PORT_RANGE_START` | ttyd 端口范围起始 | `7681`    |
| `TTYD_PORT_RANGE_END`   | ttyd 端口范围结束 | `7780`    |

## 🖱 tmux 鼠标滚动与滚动条配置

由于 tmux 默认使用 alternate screen，会导致浏览器端滚动条无法正常同步。推荐在 `~/.tmux.conf` 中添加以下配置：

```tmux
# 关闭鼠标模式（让 xterm.js 原生处理滚动，滚动条正常工作）
set -g mouse off

# 历史缓冲区行数（通过 Ctrl+b [ 进入 copy mode 查看）
set -g history-limit 50000

# 禁用 alternate screen（关键：让 xterm.js 滚动条正常工作）
set -ga terminal-overrides ",*:smcup@:rmcup@"
```

- `mouse off` — 关闭 tmux 鼠标截获，让 xterm.js 原生处理滚轮和滚动条拖拽
- `terminal-overrides` — 禁止 tmux 使用 alternate screen，使 xterm.js 能正常积累 scrollback
- 键盘翻历史：`Ctrl+b` `[` 进入 copy mode，方向键 / PgUp / PgDn 滚动

> 配置后需执行 `tmux kill-server` 再新建会话生效。副作用：vim/less/man 退出后不会恢复之前的屏幕（按 `Ctrl+L` 清除即可）。

## ⌨ Ctrl+C 智能复制

选中文本时 `Ctrl+C` → 复制，无选中时 → 发送 SIGINT。通过代理层注入脚本，调用 xterm.js 的 `attachCustomKeyEventHandler` 实现。

## 📄 License

MIT
