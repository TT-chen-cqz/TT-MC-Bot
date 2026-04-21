# TT MC Bot

基于 mineflayer 的 Minecraft Bot 服务，提供 OpenClaw SKILL 控制 bot 在 MC 服务器中执行基础生存操作，并配备 Dashboard 用于监控和调试。

## 功能特性

- **RESTful API**: 完整的 HTTP API 接口控制 bot
- **Dashboard**: 实时监控 bot 状态和操作日志
- **生存操作**: 移动、挖掘、战斗、钓鱼等
- **环境扫描**: 检测周围实体、方块、背包
- **事件推送**: WebSocket 实时事件通知

## 快速开始

### 接入 AI

尽情期待！

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务将在 `http://localhost:3001` 启动。

### 配置连接

默认连接配置（可在 `src/bot/connection.js` 中修改）:

```javascript
{
  host: 'localhost',
  port: 25565,
  username: 'TTBot',
  version: '1.20.1',
  auth: 'offline'
}
```

### 使用

可以让 AI 在聊天中使用本技能。

---

## Dashboard

访问 `http://localhost:3001/dashboard` 查看 Dashboard。

### 功能

- 实时状态显示（生命值、饥饿值、位置）
- 操作请求日志
- 快速操作面板
- 事件监控

---

## 项目结构

```
minecraft-bot-api/
├── src/
│   ├── index.js           # 主入口
│   ├── bot/
│   │   ├── connection.js  # Bot 连接管理
│   │   ├── actions.js     # 基础操作封装
│   │   └── events.js      # Bot 事件监听
│   ├── api/
│   │   ├── routes.js      # API 路由定义
│   │   └── controllers.js # 请求处理逻辑
│   └── dashboard/
│       ├── public/
│       │   ├── index.html
│       │   ├── style.css
│       │   └── app.js
│       └── server.js
├── logs/
│   └── requests.json      # 操作日志
├── package.json
└── README.md
```

---

## License

MIT
