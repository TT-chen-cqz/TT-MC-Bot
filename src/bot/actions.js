/**
 * Bot 基础操作封装
 */

const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3').Vec3;
const { getBot, isConnected } = require('./connection');

// 实体类型分类
const HOSTILE_MOBS = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch', 'phantom', 'pillager', 'vindicator', 'ravager'];
const PASSIVE_MOBS = ['cow', 'pig', 'sheep', 'chicken', 'rabbit', 'horse', 'donkey', 'mule', 'llama', 'fox', 'wolf', 'cat', 'villager'];

/**
 * 检查连接状态
 */
function checkConnection() {
  if (!isConnected()) {
    throw {
      error: 'NOT_CONNECTED',
      message: 'Bot is not connected to server'
    };
  }
  return getBot();
}

// ==================== 扫描操作 ====================

/**
 * 扫描周围实体和方块
 * @param {number} radius - 扫描半径
 * @returns {Object} 扫描结果
 */
function scanNearby(radius = 16) {
  const bot = checkConnection();
  
  const entities = Object.values(bot.entities)
    .filter(e => e !== bot.entity && e.position && e.name)
    .map(e => {
      const distance = bot.entity.position.distanceTo(e.position);
      return {
        name: e.name || e.username || 'unknown',
        type: HOSTILE_MOBS.includes(e.name?.toLowerCase()) ? 'hostile' : 
              PASSIVE_MOBS.includes(e.name?.toLowerCase()) ? 'passive' : 'neutral',
        position: {
          x: Math.round(e.position.x),
          y: Math.round(e.position.y),
          z: Math.round(e.position.z)
        },
        distance: Math.round(distance * 10) / 10
      };
    })
    .filter(e => e.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  // 扫描附近方块
  const nearbyBlocks = new Set();
  const pos = bot.entity.position;
  
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -3; dz <= 3; dz++) {
        const block = bot.blockAt(new Vec3(pos.x + dx, pos.y + dy, pos.z + dz));
        if (block && block.name !== 'air') {
          nearbyBlocks.add(block.name);
        }
      }
    }
  }

  // 脚下方块
  const groundBlock = bot.blockAt(new Vec3(pos.x, pos.y - 1, pos.z));

  // 附近玩家
  const players = Object.values(bot.players)
    .filter(p => p.entity && p.entity !== bot.entity)
    .map(p => ({
      name: p.username,
      position: {
        x: Math.round(p.entity.position.x),
        y: Math.round(p.entity.position.y),
        z: Math.round(p.entity.position.z)
      }
    }));

  return {
    entities,
    blocks: {
      ground: groundBlock?.name || 'unknown',
      nearby: Array.from(nearbyBlocks)
    },
    players
  };
}

/**
 * 查看背包
 * @returns {Object} 背包内容
 */
function scanInventory() {
  const bot = checkConnection();
  
  const slots = bot.inventory.slots
    .map((item, index) => {
      if (item) {
        return {
          slot: index,
          item: item.name,
          count: item.count
        };
      }
      return null;
    })
    .filter(s => s !== null);

  const emptySlots = 36 - slots.length; // 36 是玩家背包槽位数

  return {
    slots,
    emptySlots
  };
}

/**
 * 查看指定位置的方块
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns {Object} 方块信息
 */
function scanBlock(x, y, z) {
  const bot = checkConnection();
  
  const block = bot.blockAt(new Vec3(x, y, z));
  
  if (!block || block.name === 'air') {
    return {
      block: 'air',
      position: { x, y, z },
      digTime: 0
    };
  }

  // 计算挖掘时间
  const tool = bot.inventory.items().find(item => 
    block.harvestTool && item.name.includes(block.harvestTool)
  );
  const digTime = bot.digTime(block, false, false, false, tool);

  return {
    block: block.name,
    position: { x, y, z },
    digTime: Math.round(digTime / 1000 * 10) / 10
  };
}

// ==================== 移动操作 ====================

/**
 * 移动到指定位置
 * @param {Object} options - 移动选项
 * @returns {Promise<Object>} 移动结果
 */
async function moveTo(options) {
  const bot = checkConnection();
  const { mode, target, distance, direction, timeout = 30000 } = options;

  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      bot.pathfinder.stop();
      reject({
        error: 'TIMEOUT',
        message: 'Movement timed out'
      });
    }, timeout);

    try {
      let goalPosition;

      switch (mode) {
        case 'to':
          goalPosition = target;
          break;
        case 'forward':
          const yaw = bot.entity.yaw;
          const rad = yaw * Math.PI / 180;
          goalPosition = {
            x: bot.entity.position.x - Math.sin(rad) * distance,
            y: bot.entity.position.y,
            z: bot.entity.position.z - Math.cos(rad) * distance
          };
          break;
        case 'direction':
          const dirMap = { north: { x: 0, z: -1 }, south: { x: 0, z: 1 }, east: { x: 1, z: 0 }, west: { x: -1, z: 0 } };
          const dir = dirMap[direction.toLowerCase()] || { x: 0, z: 0 };
          goalPosition = {
            x: bot.entity.position.x + dir.x * distance,
            y: bot.entity.position.y,
            z: bot.entity.position.z + dir.z * distance
          };
          break;
        default:
          throw { error: 'INVALID_MODE', message: `Unknown mode: ${mode}` };
      }

      const startTime = Date.now();
      
      await bot.pathfinder.goto(new goals.GoalBlock(Math.floor(goalPosition.x), Math.floor(goalPosition.y), Math.floor(goalPosition.z)));
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      resolve({
        success: true,
        message: `Walked to (${goalPosition.x}, ${goalPosition.y}, ${goalPosition.z})`,
        duration,
        newPosition: {
          x: Math.round(bot.entity.position.x * 100) / 100,
          y: Math.round(bot.entity.position.y * 100) / 100,
          z: Math.round(bot.entity.position.z * 100) / 100
        }
      });

    } catch (err) {
      clearTimeout(timeoutId);
      reject({
        error: 'BLOCKED',
        message: err.message || 'Path blocked or unreachable'
      });
    }
  });
}

/**
 * 跳跃
 * @returns {Object} 跳跃结果
 */
function jump() {
  const bot = checkConnection();
  
  bot.setControlState('jump', true);
  setTimeout(() => bot.setControlState('jump', false), 250);

  return {
    success: true,
    position: {
      x: Math.round(bot.entity.position.x * 100) / 100,
      y: Math.round(bot.entity.position.y * 100) / 100,
      z: Math.round(bot.entity.position.z * 100) / 100
    }
  };
}

/**
 * 转向/看向
 * @param {Object} options - 转向选项
 * @returns {Object} 结果
 */
function look(options) {
  const bot = checkConnection();
  const { yaw, pitch, target } = options;

  return new Promise((resolve) => {
    if (target) {
      bot.lookAt(new Vec3(target.x, target.y, target.z), true, () => {
        resolve({
          success: true,
          yaw: bot.entity.yaw,
          pitch: bot.entity.pitch
        });
      });
    } else {
      bot.look(yaw * Math.PI / 180, pitch * Math.PI / 180, true, () => {
        resolve({
          success: true,
          yaw: bot.entity.yaw,
          pitch: bot.entity.pitch
        });
      });
    }
  });
}

// ==================== 互动操作 ====================

/**
 * 挖掘方块
 * @param {Object} options - 挖掘选项
 * @returns {Promise<Object>} 挖掘结果
 */
async function dig(options) {
  const bot = checkConnection();
  const { position, timeout = 10000 } = options;

  return new Promise(async (resolve, reject) => {
    const block = bot.blockAt(new Vec3(position.x, position.y, position.z));
    
    if (!block || block.name === 'air') {
      return reject({
        error: 'TARGET_NOT_FOUND',
        message: 'No block at specified position'
      });
    }

    const timeoutId = setTimeout(() => {
      bot.stopDigging();
      reject({
        error: 'TIMEOUT',
        message: 'Digging timed out'
      });
    }, timeout);

    const startTime = Date.now();
    const blockName = block.name;

    try {
      await bot.dig(block);
      clearTimeout(timeoutId);
      
      resolve({
        success: true,
        block: blockName,
        digTime: Date.now() - startTime,
        drops: [] // 实际掉落物需要监听事件获取
      });
    } catch (err) {
      clearTimeout(timeoutId);
      reject({
        error: 'CANNOT_REACH',
        message: 'Cannot reach block or invalid tool'
      });
    }
  });
}

/**
 * 放置方块
 * @param {Object} options - 放置选项
 * @returns {Promise<Object>} 放置结果
 */
async function place(options) {
  const bot = checkConnection();
  const { position, item, face = 'top' } = options;

  const referenceBlock = bot.blockAt(new Vec3(position.x, position.y, position.z));
  if (!referenceBlock) {
    throw {
      error: 'INVALID_POSITION',
      message: 'Invalid reference position'
    };
  }

  // 面的方向映射
  const faceMap = {
    top: { x: 0, y: 1, z: 0 },
    bottom: { x: 0, y: -1, z: 0 },
    north: { x: 0, y: 0, z: -1 },
    south: { x: 0, y: 0, z: 1 },
    east: { x: 1, y: 0, z: 0 },
    west: { x: -1, y: 0, z: 0 }
  };

  const faceVec = faceMap[face.toLowerCase()] || faceMap.top;

  // 找物品
  let itemToPlace;
  if (item) {
    itemToPlace = bot.inventory.items().find(i => i.name === item);
    if (!itemToPlace) {
      throw {
        error: 'NO_ITEM',
        message: `No ${item} in inventory`
      };
    }
    await bot.equip(itemToPlace, 'hand');
  } else {
    itemToPlace = bot.heldItem;
  }

  try {
    await bot.placeBlock(referenceBlock, faceVec);
    return {
      success: true,
      item: itemToPlace?.name,
      position
    };
  } catch (err) {
    throw {
      error: 'CANNOT_REACH',
      message: 'Cannot place block at position'
    };
  }
}

/**
 * 使用/右键互动
 * @param {Object} options - 互动选项
 * @returns {Promise<Object>} 互动结果
 */
async function use(options) {
  const bot = checkConnection();
  const { target, position } = options;

  if (position) {
    const block = bot.blockAt(new Vec3(position.x, position.y, position.z));
    if (!block) {
      throw {
        error: 'TARGET_NOT_FOUND',
        message: 'No block at specified position'
      };
    }

    // 打开容器
    if (['chest', 'furnace', 'anvil', 'crafting_table', 'enchanting_table'].includes(block.name)) {
      const container = await bot.openContainer(block);
      return {
        success: true,
        type: 'container',
        name: block.name,
        slots: container.slots.length
      };
    }

    // 普通右键
    await bot.activateBlock(block);
    return {
      success: true,
      type: 'block',
      name: block.name
    };
  }

  throw {
    error: 'INVALID_POSITION',
    message: 'Position required'
  };
}

/**
 * 激活方块
 * @param {Object} options - 激活选项
 * @returns {Promise<Object>} 激活结果
 */
async function activate(options) {
  const bot = checkConnection();
  const { position } = options;

  const block = bot.blockAt(new Vec3(position.x, position.y, position.z));
  if (!block) {
    throw {
      error: 'TARGET_NOT_FOUND',
      message: 'No block at specified position'
    };
  }

  await bot.activateBlock(block);
  return {
    success: true,
    block: block.name
  };
}

// ==================== 战斗操作 ====================

/**
 * 攻击实体
 * @param {Object} options - 攻击选项
 * @returns {Promise<Object>} 攻击结果
 */
async function attack(options) {
  const bot = checkConnection();
  const { target, count = 1, weapon } = options;

  // 找目标实体
  const entity = Object.values(bot.entities)
    .filter(e => e !== bot.entity && e.name?.toLowerCase() === target.toLowerCase())
    .sort((a, b) => 
      bot.entity.position.distanceTo(a.position) - bot.entity.position.distanceTo(b.position)
    )[0];

  if (!entity) {
    throw {
      error: 'TARGET_NOT_FOUND',
      message: `No ${target} found within range`,
      details: {
        nearbyEntities: Object.values(bot.entities)
          .filter(e => e !== bot.entity && e.name)
          .map(e => e.name)
      }
    };
  }

  // 装备武器
  if (weapon) {
    const weaponItem = bot.inventory.items().find(i => i.name === weapon);
    if (weaponItem) {
      await bot.equip(weaponItem, 'hand');
    }
  }

  // 攻击
  let totalDamage = 0;
  for (let i = 0; i < count; i++) {
    await bot.attack(entity);
    totalDamage += 1; // 实际伤害需要根据武器计算
    await new Promise(r => setTimeout(r, 500)); // 攻击间隔
  }

  return {
    success: true,
    target: entity.name,
    damage: totalDamage,
    killed: entity.health <= 0,
    drops: []
  };
}

/**
 * 装备物品
 * @param {Object} options - 装备选项
 * @returns {Promise<Object>} 装备结果
 */
async function equip(options) {
  const bot = checkConnection();
  const { item, destination = 'hand' } = options;

  const itemToEquip = bot.inventory.items().find(i => i.name === item);
  
  if (!itemToEquip) {
    throw {
      error: 'NO_ITEM',
      message: `No ${item} in inventory`
    };
  }

  // 目标槽位映射
  const destMap = {
    hand: 'hand',
    'off-hand': 'off-hand',
    head: 'head',
    chest: 'torso',
    legs: 'legs',
    feet: 'feet'
  };

  await bot.equip(itemToEquip, destMap[destination.toLowerCase()] || 'hand');

  return {
    success: true,
    item,
    destination
  };
}

// ==================== 生存操作 ====================

/**
 * 吃食物
 * @param {Object} options - 食物选项
 * @returns {Promise<Object>} 吃食物结果
 */
async function eat(options = {}) {
  const bot = checkConnection();
  const { item } = options;

  let foodItem;
  if (item) {
    foodItem = bot.inventory.items().find(i => i.name === item);
  } else {
    // 自动选择食物
    const foods = ['cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'bread', 'apple', 'golden_apple'];
    foodItem = bot.inventory.items().find(i => foods.includes(i.name));
  }

  if (!foodItem) {
    throw {
      error: 'NO_ITEM',
      message: 'No food in inventory'
    };
  }

  const prevFood = bot.food;
  await bot.equip(foodItem, 'hand');
  await bot.consume();

  return {
    success: true,
    item: foodItem.name,
    foodRestored: bot.food - prevFood,
    currentFood: bot.food
  };
}

/**
 * 使用治疗物品
 * @param {Object} options - 治疗选项
 * @returns {Promise<Object>} 治疗结果
 */
async function heal(options = {}) {
  const bot = checkConnection();
  const { item } = options;

  let healItem;
  if (item) {
    healItem = bot.inventory.items().find(i => i.name === item);
  } else {
    // 自动选择治疗物品
    const healItems = ['golden_apple', 'enchanted_golden_apple', 'potion'];
    healItem = bot.inventory.items().find(i => healItems.includes(i.name));
  }

  if (!healItem) {
    throw {
      error: 'NO_ITEM',
      message: 'No healing item in inventory'
    };
  }

  const prevHealth = bot.health;
  await bot.equip(healItem, 'hand');
  await bot.consume();

  return {
    success: true,
    item: healItem.name,
    healthRestored: bot.health - prevHealth,
    currentHealth: bot.health
  };
}

/**
 * 钓鱼
 * @param {Object} options - 钓鱼选项
 * @returns {Promise<Object>} 钓鱼结果
 */
async function fish(options = {}) {
  const bot = checkConnection();
  const { duration = 30000, autoReel = true } = options;

  const rod = bot.inventory.items().find(i => i.name === 'fishing_rod');
  if (!rod) {
    throw {
      error: 'NO_ITEM',
      message: 'No fishing rod in inventory'
    };
  }

  await bot.equip(rod, 'hand');
  
  // 开始钓鱼
  await bot.fish();

  const startTime = Date.now();
  let catches = 0;

  // 等待钓鱼时长
  await new Promise(resolve => setTimeout(resolve, duration));
  
  bot.deactivateItem();

  return {
    success: true,
    duration: Date.now() - startTime,
    catches: catches // 需要监听事件来统计
  };
}

// ==================== 物品管理 ====================

/**
 * 丢弃物品
 * @param {Object} options - 丢弃选项
 * @returns {Promise<Object>} 丢弃结果
 */
async function drop(options) {
  const bot = checkConnection();
  const { item, count } = options;

  const items = bot.inventory.items().filter(i => i.name === item);
  
  if (items.length === 0) {
    throw {
      error: 'NO_ITEM',
      message: `No ${item} in inventory`
    };
  }

  let dropped = 0;
  for (const itemStack of items) {
    const toDrop = count ? Math.min(count - dropped, itemStack.count) : itemStack.count;
    await bot.toss(itemStack.type, null, toDrop);
    dropped += toDrop;
    if (count && dropped >= count) break;
  }

  return {
    success: true,
    item,
    count: dropped
  };
}

/**
 * 合成物品
 * @param {Object} options - 合成选项
 * @returns {Promise<Object>} 合成结果
 */
async function craft(options) {
  const bot = checkConnection();
  const { recipe: recipeName, count = 1 } = options;

  const recipes = bot.recipesAll(null, null, bot.inventory);
  const recipe = recipes.find(r => r.result?.name === recipeName);

  if (!recipe) {
    throw {
      error: 'NO_ITEM',
      message: `No recipe for ${recipeName} or missing materials`
    };
  }

  await bot.craft(recipe, count);

  return {
    success: true,
    recipe: recipeName,
    count
  };
}

module.exports = {
  // 扫描
  scanNearby,
  scanInventory,
  scanBlock,
  // 移动
  moveTo,
  jump,
  look,
  // 互动
  dig,
  place,
  use,
  activate,
  // 战斗
  attack,
  equip,
  // 生存
  eat,
  heal,
  fish,
  // 物品
  drop,
  craft
};
