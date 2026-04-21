/**
 * TTBot Dashboard - 前端逻辑
 */

const API_BASE = window.location.origin;

// 状态更新定时器
let statusInterval;

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', () => {
  refreshStatus();
  loadRequestLog();
  
  // 定时刷新状态
  statusInterval = setInterval(refreshStatus, 5000);
  
  // 定时刷新日志
  setInterval(loadRequestLog, 3000);
  
  // 设置方法选择器事件
  document.getElementById('apiMethod').addEventListener('change', updateEndpointPlaceholder);
  updateEndpointPlaceholder();
});

/**
 * 更新端点输入框占位符
 */
function updateEndpointPlaceholder() {
  const method = document.getElementById('apiMethod').value;
  const endpointInput = document.getElementById('apiEndpoint');
  
  const placeholders = {
    'GET': '/status',
    'POST': '/move/walk'
  };
  
  endpointInput.placeholder = `端点路径 (如 ${placeholders[method]})`;
}

/**
 * 刷新 Bot 状态
 */
async function refreshStatus() {
  try {
    const response = await fetch(`${API_BASE}/status`);
    const data = await response.json();
    updateStatusDisplay(data);
  } catch (error) {
    console.error('Failed to fetch status:', error);
    updateConnectionStatus('disconnected');
  }
}

/**
 * 更新状态显示
 */
function updateStatusDisplay(data) {
  // 连接状态
  updateConnectionStatus(data.connected ? 'connected' : 'disconnected');
  
  // 用户名
  document.getElementById('username').textContent = data.username || '-';
  
  // 生命值
  const health = data.health || 0;
  document.getElementById('health').textContent = `${health}/20`;
  document.getElementById('healthFill').style.width = `${(health / 20) * 100}%`;
  
  // 饥饿值
  const food = data.food || 0;
  document.getElementById('food').textContent = `${food}/20`;
  document.getElementById('foodFill').style.width = `${(food / 20) * 100}%`;
  
  // 位置
  if (data.position) {
    document.getElementById('position').textContent = 
      `(${data.position.x}, ${data.position.y}, ${data.position.z})`;
  } else {
    document.getElementById('position').textContent = '(-, -, -)';
  }
  
  // 维度
  document.getElementById('dimension').textContent = data.dimension || '-';
  
  // 游戏模式
  document.getElementById('gamemode').textContent = data.gamemode || '-';
}

/**
 * 更新连接状态显示
 */
function updateConnectionStatus(status) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  
  dot.className = 'status-dot ' + status;
  
  const statusTexts = {
    'connected': '已连接',
    'disconnected': '未连接',
    'connecting': '连接中...'
  };
  
  text.textContent = statusTexts[status] || '未知';
}

/**
 * 连接 Bot
 */
async function connectBot() {
  try {
    updateConnectionStatus('connecting');
    const response = await fetch(`${API_BASE}/connect`, { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      addLogEntry('SYSTEM', 'connect', 200, 'Connected to server');
      setTimeout(refreshStatus, 1000);
    } else {
      addLogEntry('SYSTEM', 'connect', 400, data.message);
    }
  } catch (error) {
    addLogEntry('SYSTEM', 'connect', 500, error.message);
    updateConnectionStatus('disconnected');
  }
}

/**
 * 断开 Bot
 */
async function disconnectBot() {
  try {
    const response = await fetch(`${API_BASE}/disconnect`, { method: 'POST' });
    const data = await response.json();
    addLogEntry('SYSTEM', 'disconnect', 200, 'Disconnected');
    refreshStatus();
  } catch (error) {
    addLogEntry('SYSTEM', 'disconnect', 500, error.message);
  }
}

/**
 * 清空日志
 */
async function clearLogs() {
  try {
    const response = await fetch(`${API_BASE}/events`, { method: 'DELETE' });
    const data = await response.json();
    document.getElementById('logContainer').innerHTML = '<div class="log-placeholder">等待日志...</div>';
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
}

/**
 * 加载请求日志
 */
async function loadRequestLog() {
  try {
    const response = await fetch(`${API_BASE}/api/logs`);
    const logs = await response.json();
    renderRequestTable(logs);
  } catch (error) {
    console.error('Failed to load request log:', error);
  }
}

/**
 * 渲染请求表格
 */
function renderRequestTable(logs) {
  const tbody = document.getElementById('requestTable');
  
  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">暂无数据</td></tr>';
    return;
  }
  
  // 显示最近 20 条
  const recentLogs = logs.slice(-20).reverse();
  
  tbody.innerHTML = recentLogs.map(log => `
    <tr>
      <td>${formatTime(log.timestamp)}</td>
      <td><span class="method ${log.method}">${log.method}</span></td>
      <td>${log.path}</td>
      <td class="status-${Math.floor(log.status / 100) * 100}">${log.status}</td>
      <td>${log.duration}ms</td>
    </tr>
  `).join('');
}

/**
 * 格式化时间
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}

/**
 * 添加日志条目
 */
function addLogEntry(method, endpoint, status, message) {
  const container = document.getElementById('logContainer');
  
  // 移除占位符
  const placeholder = container.querySelector('.log-placeholder');
  if (placeholder) {
    placeholder.remove();
  }
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="time">${new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span>
    <span class="method ${method}">${method}</span>
    <span class="endpoint">${endpoint}</span>
    <span class="status status-${Math.floor(status / 100) * 100}">${status}</span>
    <span class="message">${message}</span>
  `;
  
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
  
  // 限制日志条数
  while (container.children.length > 50) {
    container.removeChild(container.firstChild);
  }
}

/**
 * 发送 API 请求
 */
async function sendApiRequest() {
  const method = document.getElementById('apiMethod').value;
  let endpoint = document.getElementById('apiEndpoint').value;
  const bodyText = document.getElementById('apiBody').value;
  const responseArea = document.getElementById('apiResponse');
  
  if (!endpoint) {
    responseArea.textContent = '请输入端点路径';
    return;
  }
  
  // 确保端点以 / 开头
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (method === 'POST' && bodyText) {
    try {
      options.body = bodyText;
    } catch (e) {
      responseArea.textContent = 'JSON 格式错误: ' + e.message;
      return;
    }
  }
  
  try {
    responseArea.textContent = '请求中...';
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    responseArea.textContent = JSON.stringify(data, null, 2);
    
    // 添加到日志
    addLogEntry(method, endpoint, response.status, JSON.stringify(data).substring(0, 50));
    
    // 刷新请求表格
    loadRequestLog();
    
  } catch (error) {
    responseArea.textContent = '请求失败: ' + error.message;
    addLogEntry(method, endpoint, 500, error.message);
  }
}

/**
 * 快速 API 调用
 */
function quickApi(method, endpoint, body = null) {
  document.getElementById('apiMethod').value = method;
  document.getElementById('apiEndpoint').value = endpoint;
  document.getElementById('apiBody').value = body ? JSON.stringify(body, null, 2) : '';
  sendApiRequest();
}
