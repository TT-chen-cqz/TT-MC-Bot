/**
 * API 请求处理逻辑
 */

const fs = require('fs');
const path = require('path');
const { getBotStatus, connectBot, disconnectBot, isConnected, getBot } = require('../bot/connection');
const { getEventLog, clearEventLog } = require('../bot/events');
const actions = require('../bot/actions');

// 日志文件路径
const LOG_FILE = path.join(__dirname, '../../logs/requests.json');

// 请求日志存储
let requestLog = [];

/**
 * 记录请求
 */
function logRequest(req, res, next) {
  const startTime = Date.now();
  
  // 保存原始 end 方法
  const originalEnd = res.end;
  
  // 重写 end 方法
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      status: res.statusCode,
      duration
    };
    
    // 添加到内存日志
    requestLog.push(logEntry);
    if (requestLog.length > 100) {
      requestLog = requestLog.slice(-100);
    }
    
    // 写入文件（JSON Lines 格式）
    appendToLogFile(logEntry);
    
    originalEnd.apply(res, args);
  };
  
  next();
}

/**
 * 追加到日志文件
 */
function appendToLogFile(entry) {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

/**
 * 获取请求日志
 */
function getRequestLog() {
  return requestLog;
}

/**
 * 统一错误处理
 */
function handleError(res, error) {
  const status = error.error === 'NOT_CONNECTED' ? 503 : 400;
  res.status(status).json({
    success: false,
    error: error.error || 'UNKNOWN_ERROR',
    message: error.message || 'An error occurred',
    details: error.details || null
  });
}

// ==================== 基础端点 ====================

async function getStatus(req, res) {
  try {
    const status = getBotStatus();
    res.json(status);
  } catch (error) {
    handleError(res, error);
  }
}

async function connect(req, res) {
  try {
    const result = await connectBot(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function disconnect(req, res) {
  try {
    const result = await disconnectBot();
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 环境扫描 API ====================

async function scanNearby(req, res) {
  try {
    const radius = parseInt(req.query.radius) || 16;
    const result = actions.scanNearby(radius);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function scanInventory(req, res) {
  try {
    const result = actions.scanInventory();
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function scanBlock(req, res) {
  try {
    const { x, y, z } = req.query;
    if (!x || !y || !z) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_POSITION',
        message: 'Coordinates x, y, z are required'
      });
    }
    const result = actions.scanBlock(parseInt(x), parseInt(y), parseInt(z));
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 移动 API ====================

async function moveWalk(req, res) {
  try {
    const result = await actions.moveTo(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function moveJump(req, res) {
  try {
    const result = actions.jump();
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function moveLook(req, res) {
  try {
    const result = await actions.look(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 操作互动 API ====================

async function interactDig(req, res) {
  try {
    const result = await actions.dig(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function interactPlace(req, res) {
  try {
    const result = await actions.place(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function interactUse(req, res) {
  try {
    const result = await actions.use(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function interactActivate(req, res) {
  try {
    const result = await actions.activate(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 战斗 API ====================

async function combatAttack(req, res) {
  try {
    const result = await actions.attack(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function combatEquip(req, res) {
  try {
    const result = await actions.equip(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 生存 API ====================

async function survivalEat(req, res) {
  try {
    const result = await actions.eat(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function survivalHeal(req, res) {
  try {
    const result = await actions.heal(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function survivalFish(req, res) {
  try {
    const result = await actions.fish(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 物品管理 API ====================

async function inventoryDrop(req, res) {
  try {
    const result = await actions.drop(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function inventoryCraft(req, res) {
  try {
    const result = await actions.craft(req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

// ==================== 事件日志 ====================

async function getEvents(req, res) {
  try {
    const events = getEventLog();
    res.json({ events });
  } catch (error) {
    handleError(res, error);
  }
}

async function clearEvents(req, res) {
  try {
    clearEventLog();
    res.json({ success: true, message: 'Event log cleared' });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  logRequest,
  getRequestLog,
  getStatus,
  connect,
  disconnect,
  scanNearby,
  scanInventory,
  scanBlock,
  moveWalk,
  moveJump,
  moveLook,
  interactDig,
  interactPlace,
  interactUse,
  interactActivate,
  combatAttack,
  combatEquip,
  survivalEat,
  survivalHeal,
  survivalFish,
  inventoryDrop,
  inventoryCraft,
  getEvents,
  clearEvents
};
