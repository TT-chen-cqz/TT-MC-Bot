/**
 * Minecraft Bot API - 主入口
 * 启动 bot + API server
 */

const express = require('express');
const path = require('path');
const { createBot, connectBot, disconnectBot, getBot } = require('./bot/connection');
const { initEventListeners } = require('./bot/events');
const { setupRoutes } = require('./api/routes');
const { setupDashboard } = require('./dashboard/server');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
const requestLogger = require('./api/controllers').logRequest;
app.use(requestLogger);

// API 路由
setupRoutes(app);

// Dashboard 静态服务
setupDashboard(app);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: err.message
  });
});

// 启动服务器
async function start() {
  try {
    // 启动 Express 服务器
    app.listen(PORT, () => {
      console.log(`[API] Server running on http://localhost:${PORT}`);
      console.log(`[API] Dashboard: http://localhost:${PORT}/dashboard`);
    });

    // 连接 Minecraft 服务器
    console.log('[Bot] Connecting to Minecraft server...');
    const bot = createBot();
    
    bot.on('login', () => {
      console.log(`[Bot] Logged in as ${bot.username}`);
      initEventListeners(bot);
    });

    bot.on('spawn', () => {
      console.log('[Bot] Spawned in world');
    });

    bot.on('error', (err) => {
      console.error('[Bot] Error:', err.message);
    });

    bot.on('kicked', (reason) => {
      console.log('[Bot] Kicked:', reason);
    });

    bot.on('end', () => {
      console.log('[Bot] Disconnected');
    });

  } catch (error) {
    console.error('[Start] Failed to start:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  const bot = getBot();
  if (bot) {
    bot.quit();
  }
  process.exit(0);
});

start();
