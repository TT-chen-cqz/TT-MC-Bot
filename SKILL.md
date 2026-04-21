# TT MC Bot

你可以使用如下 `PowerShell` 指令接入 MC。

## 基础状态查询
```powershell
# 获取 Bot 状态
curl http://localhost:3001/status | ConvertFrom-Json | ConvertTo-Json -Depth 10

# 扫描周围环境
curl "http://localhost:3001/scan/nearby?radius=10" | ConvertFrom-Json | ConvertTo-Json -Depth 10

# 查看背包
curl http://localhost:3001/scan/inventory | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 移动控制
```powershell
# 移动到坐标
curl -Method POST -ContentType "application/json" -Body '{"mode":"to","target":{"x":100,"y":64,"z":-200}}' http://localhost:3001/move/walk

# 向前走 5 步
curl -Method POST -ContentType "application/json" -Body '{"mode":"forward","distance":5}' http://localhost:3001/move/walk

# 跳跃
curl -Method POST http://localhost:3001/move/jump

# 转向看向目标
curl -Method POST -ContentType "application/json" -Body '{"target":{"x":105,"y":64,"z":-195}}' http://localhost:3001/move/look
```

## 操作互动
```powershell
# 挖掘方块
curl -Method POST -ContentType "application/json" -Body '{"position":{"x":100,"y":63,"z":-200}}' http://localhost:3001/interact/dig

# 放置方块
curl -Method POST -ContentType "application/json" -Body '{"position":{"x":100,"y":64,"z":-200},"item":"cobblestone"}' http://localhost:3001/interact/place

# 使用箱子
curl -Method POST -ContentType "application/json" -Body '{"target":"chest","position":{"x":100,"y":64,"z":-200}}' http://localhost:3001/interact/use
```

## 战斗系统
```powershell
# 攻击僵尸
curl -Method POST -ContentType "application/json" -Body '{"target":"zombie","count":3}' http://localhost:3001/combat/attack

# 装备钻石剑
curl -Method POST -ContentType "application/json" -Body '{"item":"diamond_sword","destination":"hand"}' http://localhost:3001/combat/equip
```

## 生存操作
```powershell
# 吃东西
curl -Method POST -ContentType "application/json" -Body '{"item":"cooked_beef"}' http://localhost:3001/survival/eat

# 钓鱼 30 秒
curl -Method POST -ContentType "application/json" -Body '{"duration":30000,"autoReel":true}' http://localhost:3001/survival/fish

# 治疗
curl -Method POST -ContentType "application/json" -Body '{"item":"golden_apple"}' http://localhost:3001/survival/heal
```

## 物品管理
```powershell
# 丢弃泥土
curl -Method POST -ContentType "application/json" -Body '{"item":"dirt","count":64}' http://localhost:3001/inventory/drop

# 合成橡木木板
curl -Method POST -ContentType "application/json" -Body '{"recipe":"oak_planks","count":4}' http://localhost:3001/inventory/craft
```

## 连接控制
```powershell
# 连接服务器
curl -Method POST http://localhost:3001/connect

# 断开连接
curl -Method POST http://localhost:3001/disconnect
```

## 错误码定义

| 错误码 | 说明 |
|--------|------|
| `NOT_CONNECTED` | Bot 未连接服务器 |
| `TARGET_NOT_FOUND` | 目标实体/方块不存在 |
| `INVALID_POSITION` | 无效坐标 |
| `TIMEOUT` | 操作超时 |
| `NO_ITEM` | 背包中无该物品 |
| `INVENTORY_FULL` | 背包已满 |
| `CANNOT_REACH` | 目标太远无法操作 |
| `BLOCKED` | 路径被阻挡 |