# 备品备件库存中心 (SparePartHub)

面向设备维修部门和仓库管理员的备品备件管理系统，解决轴承、皮带、电机、传感器等备件品种多、用量散、库存不准的问题。

## 功能特性

| 模块 | 功能说明 |
|------|----------|
| 📊 数据看板 | 库存概览、出入库趋势、请购建议分布、设备消耗 TOP10 |
| 📦 备件管理 | 备件档案（规格/分类/货位/安全库存/常用标记），多对多关联适用设备 |
| 🏭 设备管理 | 设备台账（车间/工位/状态），维护记录和消耗统计 |
| 📈 库存管理 | 实时库存，三色标签（缺货/低库存/正常），支持盘点调整 |
| ➕ 采购入库 | 采购到货入库，单号自动生成，记录库存前后快照 |
| ➖ 维修领料 | 出库登记关联设备和维修工单，扫码出库支持 PDA 操作 |
| 📋 出入库流水 | 每一笔可追溯，按单号/备件/时间筛选，统计汇总 |
| 🚨 请购建议 | 自动扫描库存低于安全下限，计算缺口紧急度，推送给采购 |
| 🔧 维修工单 | 维修工单登记，停机时长、人工+备件费用自动汇总 |
| 📐 统计分析 | 趋势图、分类占比、设备 TOP15、备件 TOP20、消耗占比表 |

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│ 前端 Angular 17 + ng-zorro-antd + ECharts (端口 4200)    │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP /api
┌────────────────────────────▼────────────────────────────┐
│ 后端 NestJS 10 + TypeORM + Swagger (端口 3000)           │
│  ├─ 并发扣减: Redis 分布式锁 (SET NX EX + Lua 释放)       │
│  ├─ 数据一致性: DB 悲观锁 (pessimistic_write) + 事务      │
│  └─ 性能加速: 热数据库存 & 安全阈值缓存 Redis             │
└─────────────┬───────────────────────────┬────────────────┘
              │                           │
    ┌─────────▼─────────┐       ┌─────────▼─────────┐
    │   MySQL 8.0+      │       │     Redis 6+      │
    │   (端口 3306)     │       │   (端口 6379)     │
    └───────────────────┘       └───────────────────┘
```

## 快速启动

### 环境要求

- Node.js >= 18.17.0
- MySQL >= 8.0
- Redis >= 6.0

### 步骤一：准备数据库

```bash
# 1. 登录 MySQL 创建数据库
mysql -u root -p
CREATE DATABASE spare_part_hub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. 导入初始化脚本（含示例数据）
mysql -u root -p spare_part_hub < backend/sql/init.sql
```

默认数据库配置在 [backend/.env](backend/.env)，可根据实际修改：
- DB_HOST=localhost
- DB_PORT=3306
- DB_USER=root
- DB_PASS=your_password

### 步骤二：启动后端

方式一（推荐）：双击 `start-backend.bat`

方式二（命令行）：
```bash
cd backend
npm install          # 首次启动安装依赖
npm run start:dev    # 开发模式热重载
```

启动成功后：
- **API 地址**: http://localhost:3000/api
- **Swagger 文档**: http://localhost:3000/api/docs

### 步骤三：启动前端

方式一（推荐）：双击 `start-frontend.bat`

方式二（命令行）：
```bash
cd frontend
npm install          # 首次启动安装依赖
npm start            # 开发模式，已配置代理 /api -> 3000
```

启动成功后访问 **http://localhost:4200**

## 核心难点实现

### 1. 并发库存扣减 (Redis 分布式锁 + DB 悲观锁 + 事务)

```typescript
// 1. 外层: Redis 分布式锁 (防止多实例并发)
await this.redisLockService.withLock(`inventory:${sparePartId}`, async () => {
  // 2. 中层: 数据库事务 (保证操作原子性)
  return this.dataSource.transaction(async manager => {
    // 3. 内层: 悲观锁查询 (同 DB 多连接并发)
    const inventory = await manager.findOne(Inventory, {
      where: { sparePartId },
      lock: { mode: 'pessimistic_write' },
    });
    // 扣减校验 → 写流水 → 更新库存 → 累加费用 → 更新 Redis
  });
});
```

锁释放使用 Lua 脚本，避免 value 不匹配误删：
```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else return 0 end
```

### 2. Redis 热数据缓存

```
Key 设计:
  inventory:stock:{sparePartId}  → 当前库存数量
  inventory:safety:{sparePartId} → 安全库存阈值
  inventory:hot_parts            → 常用备件集合 (Set)

策略:
  - 启动时自动同步所有 isHot=true 的备件
  - 出入库成功后才更新 Redis (保证最终一致)
  - 请购建议先扫 Redis 快速发现缺口
```

### 3. 出入库可追溯

每次出入库操作 `stock_movements` 表记录完整快照：
- **stockBefore**: 操作前库存
- **stockAfter**: 操作后库存
- **movementNo**: 唯一单号 (RK/CK/TZ + 日期 + 随机)
- **operator, remark, 关联设备/维修单 ID**

## 项目目录结构

```
SparePartHub/
├── backend/                          # NestJS 后端
│   ├── src/
│   │   ├── modules/                  # 8 个业务模块
│   │   │   ├── spare-part/           # 备件 + 多对多关联
│   │   │   ├── equipment/            # 设备台账
│   │   │   ├── inventory/            # 实时库存 + 出入库核心
│   │   │   ├── stock-movement/       # 流水追溯
│   │   │   ├── maintenance/          # 维修工单
│   │   │   ├── purchase-suggestion/  # 请购建议
│   │   │   └── statistics/           # 统计分析
│   │   ├── redis/                    # Redis 服务 + 分布式锁 + 缓存
│   │   ├── common/                   # 响应封装 / 工具
│   │   └── database/                 # TypeORM 配置
│   └── sql/init.sql                  # 数据库脚本 + 测试数据
│
├── frontend/                         # Angular 前端
│   └── src/app/
│       ├── pages/                    # 8 个页面 15+ 组件
│       ├── core/                     # HTTP 拦截器 / API 服务
│       ├── layout/                   # 侧边栏菜单布局
│       └── shared/                   # ng-zorro 汇总模块
│
├── start-backend.bat                 # Windows 一键启动后端
├── start-frontend.bat                # Windows 一键启动前端
└── README.md
```

## 测试数据说明

`backend/sql/init.sql` 包含完整示例数据：

| 类型 | 数量 | 示例 |
|------|------|------|
| 设备 | 6 台 | 数控车床CNC-001 / 注塑机IM-002 / 空压机AC-003 ... |
| 备件 | 15 种 | 深沟球轴承 / 同步皮带 / 三相异步电机 / 温度传感器 ... |
| 库存 | 15 条 | 部分故意低于安全库存，触发预警效果 |
| 设备-备件关联 | 14 条 | 每个备件关联可用设备 |
| 出入库流水 | 13 条 | 覆盖入库/出库/调整 |
| 维修工单 | 5 条 | 含 1 条维修中工单演示 |

## 常用命令速查

### 后端

```bash
cd backend
npm install              # 安装依赖
npm run start:dev        # 开发模式 (热重载)
npm run build            # 编译生产版本
npx nest build           # 仅 TypeScript 编译检查
npm run start:prod       # 生产模式
```

### 前端

```bash
cd frontend
npm install              # 安装依赖
npm start                # 开发模式 (代理 /api -> 3000)
npm run build            # 生产构建 (输出 dist/)
npx ng serve             # 同上
npx ng build --configuration development  # 开发构建 (跳过 AOT 模板检查)
```

---

> 提示：首次启动如遇模板编译警告，可使用开发模式构建 (AOT=false)。生产部署请使用默认 AOT=true 的 `npm run build` 命令。
