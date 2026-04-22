# TT MC Bot

你可以使用如下 API 接入 MC。

### 基础端点

#### GET /status
获取 bot 当前状态

**响应示例**:
```json
{
  "connected": true,
  "username": "TTBot",
  "health": 20,
  "food": 18,
  "position": { "x": 123.5, "y": 64, "z": -456.2 },
  "gamemode": "survival",
  "dimension": "overworld"
}
```

#### POST /connect
手动连接服务器

**响应示例**:
```json
{
  "success": true,
  "message": "Connected to localhost:25565 as TTBot"
}
```

#### POST /disconnect
断开连接

---

### 环境扫描 API

#### GET /scan/nearby
扫描周围实体和方块

**查询参数**:
- `radius` (可选，默认 16): 扫描半径

**响应示例**:
```json
{
  "entities": [
    { "name": "Zombie", "type": "hostile", "position": {"x": 10, "y": 64, "z": 5}, "distance": 11.2 },
    { "name": "Cow", "type": "passive", "position": {"x": -3, "y": 63, "z": 8}, "distance": 8.5 }
  ],
  "blocks": {
    "ground": "grass_block",
    "nearby": ["stone", "dirt", "oak_log"]
  },
  "players": []
}
```

#### GET /scan/inventory
查看 bot 背包

**响应示例**:
```json
{
  "slots": [
    { "slot": 0, "item": "diamond_sword", "count": 1 },
    { "slot": 1, "item": "cooked_beef", "count": 32 }
  ],
  "emptySlots": 34
}
```

#### GET /scan/block
查看指定位置的方块

**查询参数**:
- `x`, `y`, `z`: 坐标

---

### 移动 API

#### POST /move/walk
移动到指定位置或方向

**请求体**:
```json
{
  "mode": "to",
  "target": { "x": 100, "y": 64, "z": -200 },
  "timeout": 30000
}
```

**模式说明**:
- `to`: 移动到指定坐标
- `forward`: 向前走指定距离
- `direction`: 指定方向移动 (north/south/east/west)

#### POST /move/jump
跳跃

#### POST /move/look
转向/看向指定方向

**请求体**:
```json
{
  "yaw": 90,
  "pitch": 0,
  "target": { "x": 105, "y": 64, "z": -195 }
}
```

---

### 操作互动 API

#### POST /interact/dig
挖掘方块

**请求体**:
```json
{
  "position": { "x": 100, "y": 63, "z": -200 },
  "timeout": 10000
}
```

#### POST /interact/place
放置方块

**请求体**:
```json
{
  "position": { "x": 100, "y": 64, "z": -200 },
  "item": "cobblestone",
  "face": "top"
}
```

#### POST /interact/use
使用/右键互动

**请求体**:
```json
{
  "target": "chest",
  "position": { "x": 100, "y": 64, "z": -200 }
}
```

#### POST /interact/activate
激活方块（拉杆、按钮等）

---

### 战斗 API

#### POST /combat/attack
攻击实体

**请求体**:
```json
{
  "target": "zombie",
  "count": 3,
  "weapon": "diamond_sword"
}
```

**响应示例**:
```json
{
  "success": true,
  "target": "Zombie",
  "damage": 12,
  "killed": true,
  "drops": ["rotten_flesh", "iron_ingot"]
}
```

#### POST /combat/equip
装备物品

**请求体**:
```json
{
  "item": "diamond_sword",
  "destination": "hand"
}
```

---

### 生存 API

#### POST /survival/eat
吃食物

**请求体**:
```json
{
  "item": "cooked_beef"
}
```

#### POST /survival/heal
使用治疗物品

**请求体**:
```json
{
  "item": "golden_apple"
}
```

#### POST /survival/fish
钓鱼

**请求体**:
```json
{
  "duration": 30000,
  "autoReel": true
}
```

---

### 物品管理 API

#### POST /inventory/drop
丢弃物品

**请求体**:
```json
{
  "item": "dirt",
  "count": 64
}
```

#### POST /inventory/craft
合成物品

**请求体**:
```json
{
  "recipe": "oak_planks",
  "count": 4
}
```

---

## 错误处理

所有 API 统一错误响应格式:

```json
{
  "success": false,
  "error": "TARGET_NOT_FOUND",
  "message": "No zombie found within 16 blocks",
  "details": {
    "scanRadius": 16,
    "nearbyEntities": ["cow", "pig"]
  }
}
```

### 错误码定义

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