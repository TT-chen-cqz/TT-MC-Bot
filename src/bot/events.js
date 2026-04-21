/**
 * Bot 事件监听
 */

let eventLog = [];

/**
 * 初始化事件监听
 * @param {Object} bot - bot 实例
 */
function initEventListeners(bot) {
  // 生成事件
  bot.on('spawn', () => {
    logEvent('spawn', { position: bot.entity?.position });
    console.log('[Event] Bot spawned');
  });

  // 死亡事件
  bot.on('death', () => {
    logEvent('death', { position: bot.entity?.position });
    console.log('[Event] Bot died');
  });

  // 生命值变化
  bot.on('health', () => {
    logEvent('health', { health: bot.health, food: bot.food });
  });

  // 聊天消息
  bot.on('chat', (username, message) => {
    if (username !== bot.username) {
      logEvent('chat', { username, message });
      console.log(`[Chat] ${username}: ${message}`);
    }
  });

  // 被踢出
  bot.on('kicked', (reason) => {
    logEvent('kicked', { reason });
    console.log('[Event] Kicked:', reason);
  });

  // 断开连接
  bot.on('end', () => {
    logEvent('end', {});
    console.log('[Event] Disconnected');
  });

  // 错误
  bot.on('error', (err) => {
    logEvent('error', { message: err.message });
    console.error('[Event] Error:', err.message);
  });

  // 物品收集
  bot.on('playerCollect', (collector, collected) => {
    if (collector.username === bot.username) {
      logEvent('collect', { item: collected.name });
    }
  });

  // 实体攻击
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
      logEvent('hurt', { health: bot.health });
    }
  });

  // 呼吸道气泡
  bot.on('breath', () => {
    logEvent('breath', { breath: bot.oxygenLevel });
  });

  // 经验值变化
  bot.on('experience', () => {
    logEvent('experience', { 
      level: bot.experience.level,
      points: bot.experience.points,
      progress: bot.experience.progress 
    });
  });

  // 维度变化
  bot.on('game', () => {
    logEvent('dimension', { 
      dimension: bot.game?.dimension,
      gamemode: bot.game?.gameMode 
    });
  });

  console.log('[Events] Event listeners initialized');
}

/**
 * 记录事件
 * @param {string} type - 事件类型
 * @param {Object} data - 事件数据
 */
function logEvent(type, data) {
  eventLog.push({
    timestamp: new Date().toISOString(),
    type,
    data
  });

  // 只保留最近 100 条
  if (eventLog.length > 100) {
    eventLog = eventLog.slice(-100);
  }
}

/**
 * 获取事件日志
 * @returns {Array} 事件日志
 */
function getEventLog() {
  return eventLog;
}

/**
 * 清空事件日志
 */
function clearEventLog() {
  eventLog = [];
}

module.exports = {
  initEventListeners,
  logEvent,
  getEventLog,
  clearEventLog
};
