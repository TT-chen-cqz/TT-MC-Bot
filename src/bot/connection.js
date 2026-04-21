/**
 * Bot 连接管理
 */

const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const pvp = require('mineflayer-pvp').plugin;

// 默认配置
const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 25565,
  username: 'TTBot',
  version: '1.20.1',
  auth: 'offline'
};

let bot = null;

/**
 * 创建 bot 实例
 * @param {Object} config - 连接配置
 * @returns {Object} bot 实例
 */
function createBot(config = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (bot) {
    console.log('[Connection] Bot already exists, destroying old instance...');
    destroyBot();
  }

  bot = mineflayer.createBot(finalConfig);
  
  // 加载插件
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  
  console.log(`[Connection] Bot created with config:`, {
    host: finalConfig.host,
    port: finalConfig.port,
    username: finalConfig.username,
    version: finalConfig.version
  });
  
  return bot;
}

/**
 * 获取当前 bot 实例
 * @returns {Object|null} bot 实例
 */
function getBot() {
  return bot;
}

/**
 * 检查 bot 是否已连接
 * @returns {boolean}
 */
function isConnected() {
  return bot !== null && bot.entity !== undefined;
}

/**
 * 连接到服务器
 * @param {Object} config - 连接配置
 * @returns {Promise<Object>} 连接结果
 */
function connectBot(config = {}) {
  return new Promise((resolve, reject) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (isConnected()) {
      return resolve({
        success: true,
        message: 'Already connected',
        username: bot.username
      });
    }

    const newBot = createBot(finalConfig);
    
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 30000);

    newBot.once('login', () => {
      clearTimeout(timeout);
      bot = newBot;
      resolve({
        success: true,
        message: `Connected to ${finalConfig.host}:${finalConfig.port} as ${finalConfig.username}`,
        username: newBot.username
      });
    });

    newBot.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    newBot.once('kicked', (reason) => {
      clearTimeout(timeout);
      reject(new Error(`Kicked: ${reason}`));
    });
  });
}

/**
 * 断开连接
 * @returns {Promise<Object>} 断开结果
 */
function disconnectBot() {
  return new Promise((resolve) => {
    if (!bot) {
      return resolve({
        success: true,
        message: 'Already disconnected'
      });
    }

    bot.once('end', () => {
      bot = null;
      resolve({
        success: true,
        message: 'Disconnected successfully'
      });
    });

    bot.quit();
  });
}

/**
 * 销毁 bot 实例
 */
function destroyBot() {
  if (bot) {
    try {
      bot.quit();
    } catch (e) {
      // 忽略错误
    }
    bot = null;
  }
}

/**
 * 获取 bot 状态
 * @returns {Object} bot 状态
 */
function getBotStatus() {
  if (!isConnected()) {
    return {
      connected: false,
      username: null,
      health: 0,
      food: 0,
      position: null,
      gamemode: null,
      dimension: null
    };
  }

  return {
    connected: true,
    username: bot.username,
    health: bot.health || 0,
    food: bot.food || 0,
    position: bot.entity ? {
      x: Math.round(bot.entity.position.x * 100) / 100,
      y: Math.round(bot.entity.position.y * 100) / 100,
      z: Math.round(bot.entity.position.z * 100) / 100
    } : null,
    gamemode: bot.game?.gameMode || 'unknown',
    dimension: bot.game?.dimension || 'unknown'
  };
}

module.exports = {
  createBot,
  getBot,
  isConnected,
  connectBot,
  disconnectBot,
  destroyBot,
  getBotStatus,
  DEFAULT_CONFIG
};
