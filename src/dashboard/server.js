/**
 * Dashboard 静态服务
 */

const path = require('path');

/**
 * 设置 Dashboard
 * @param {Object} app - Express app
 */
function setupDashboard(app) {
  const publicPath = path.join(__dirname, 'public');
  
  // Dashboard 静态文件
  app.use('/dashboard', require('express').static(publicPath));
  
  // Dashboard 根路径重定向
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // API 请求日志端点
  app.get('/api/logs', (req, res) => {
    const { getRequestLog } = require('../api/controllers');
    res.json(getRequestLog());
  });

  console.log('[Dashboard] Dashboard initialized at /dashboard');
}

module.exports = { setupDashboard };
