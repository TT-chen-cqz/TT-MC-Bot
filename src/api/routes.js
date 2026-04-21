/**
 * API 路由定义
 */

const controllers = require('./controllers');

/**
 * 设置路由
 * @param {Object} app - Express app
 */
function setupRoutes(app) {
  // ==================== 基础端点 ====================
  
  // 状态查询
  app.get('/status', controllers.getStatus);
  
  // 连接管理
  app.post('/connect', controllers.connect);
  app.post('/disconnect', controllers.disconnect);

  // ==================== 环境扫描 API ====================
  
  app.get('/scan/nearby', controllers.scanNearby);
  app.get('/scan/inventory', controllers.scanInventory);
  app.get('/scan/block', controllers.scanBlock);

  // ==================== 移动 API ====================
  
  app.post('/move/walk', controllers.moveWalk);
  app.post('/move/jump', controllers.moveJump);
  app.post('/move/look', controllers.moveLook);

  // ==================== 操作互动 API ====================
  
  app.post('/interact/dig', controllers.interactDig);
  app.post('/interact/place', controllers.interactPlace);
  app.post('/interact/use', controllers.interactUse);
  app.post('/interact/activate', controllers.interactActivate);

  // ==================== 战斗 API ====================
  
  app.post('/combat/attack', controllers.combatAttack);
  app.post('/combat/equip', controllers.combatEquip);

  // ==================== 生存 API ====================
  
  app.post('/survival/eat', controllers.survivalEat);
  app.post('/survival/heal', controllers.survivalHeal);
  app.post('/survival/fish', controllers.survivalFish);

  // ==================== 物品管理 API ====================
  
  app.post('/inventory/drop', controllers.inventoryDrop);
  app.post('/inventory/craft', controllers.inventoryCraft);

  // ==================== 事件日志 ====================
  
  app.get('/events', controllers.getEvents);
  app.delete('/events', controllers.clearEvents);

  console.log('[Routes] API routes initialized');
}

module.exports = { setupRoutes };
