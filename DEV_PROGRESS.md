# Global Dubai Travel App 开发进度文档

> 生成日期：2026-09-04
> 版本：v0.2.0

---

## 一、项目概述

**Global Dubai Travel** 是一个面向迪拜旅游市场的 B2C 在线预订平台，采用前后端分离架构。

| 层级 | 技术栈 | 端口 | 状态 |
|------|--------|------|------|
| 前端 App | Vue 3 + Vite + Tauri | 1421 | ✅ 运行中 |
| 后端 API | go-zero (travel-api) | 9206 | ✅ 已编译 |
| 后端 RPC | go-zero (travel-rpc) | 9205 | ✅ 已编译 |
| 数据库 | MySQL + Ent ORM | - | ✅ 12 个 Schema |

---

## 二、前端页面清单 (travel-app)

| # | 页面 | 文件 | 路由 | 状态 | 说明 |
|---|------|------|------|------|------|
| 1 | 首页 | `Home.vue` | `/` | ✅ 完成 | 商品列表、搜索、分类筛选 |
| 2 | 探索 | `Explore.vue` | `/explore` | ✅ 完成 | 目的地分类浏览 |
| 3 | 产品详情 | `ProductDetail.vue` | `/product/:id` | ✅ 完成 | 携程风格重构（v0.2） |
| 4 | 预订确认 | `Booking.vue` | `/booking` | ✅ 完成 | 步骤条、旅客信息、库存预留 |
| 5 | 支付 | `Payment.vue` | `/payment` | ✅ 完成 | PayPal 支付集成 |
| 6 | 下单成功 | `OrderSuccess.vue` | `/order/success/:orderNo` | ✅ 完成 | 订单确认页 |
| 7 | 我的订单 | `Orders.vue` | `/orders` | ✅ 完成 | 订单列表（本地缓存） |
| 8 | 订单详情 | `OrderDetail.vue` | `/order/:orderNo` | ✅ 完成 | 状态展示、电子凭证 |
| 9 | 收藏 | `Favorites.vue` | `/favorites` | ✅ 完成 | 收藏商品列表 |
| 10 | 个人中心 | `Profile.vue` | `/profile` | ✅ 完成 | 用户信息、设置、编辑资料 |
| 11 | 登录/注册 | `Login.vue` | `/login` | ✅ 完成 | 用户名/密码登录、注册 |

### 公共组件

| 组件 | 文件 | 说明 |
|------|------|------|
| 顶部导航 | `AppHeader.vue` | 全局 Header |
| 底部 TabBar | `TabBar.vue` | 条件显示（详情页隐藏） |

### Composables

| 模块 | 文件 | 说明 |
|------|------|------|
| 用户认证 | `user.js` | 登录状态、Token 管理、Profile 获取 |
| 收藏 | `favorites.js` | localStorage 收藏管理 |

### API 层 (api.js)

| 分类 | 接口数 | 说明 |
|------|--------|------|
| 商品 | 3 | 列表、详情、套餐 |
| 库存 | 2 | 单次查询、批量查询（日历用） |
| 订单 | 2 | 创建、查询 |
| 支付 | 2 | 创建支付、查询支付 |
| 用户 | 7 | 注册、登录、手机登录、Profile、更新、改密、登出 |

---

## 三、后端服务清单

### travel-api (REST 层)

| Handler | 文件 | 说明 |
|---------|------|------|
| ProductHandler | `product.go` | 商品 CRUD 公开接口 |
| InventoryHandler | `inventory.go` | 库存查询 + 批量查询 |
| OrderHandler | `order.go` | 订单创建与查询 |
| PaymentHandler | `payment.go` | 支付创建与查询 |
| UserHandler | `user.go` | 用户认证全套 |
| ManagementHandler | `management.go` | 商户管理接口 |

### travel-rpc (gRPC 层)

| Service | 文件 | 说明 |
|---------|------|------|
| CatalogService | `catalog.go` | 商品目录查询 |
| InventoryService | `inventory.go` | 库存管理 |
| OrderService | `order.go` | 订单处理 |
| PaymentService | `payment.go` | 支付处理 |
| UserService | `user.go` | 用户服务 |
| ManagementService | `management.go` | 商户管理 |

### 数据库 Schema (Ent ORM)

| Schema | 文件 | 说明 |
|--------|------|------|
| Product | `product.go` | 旅游产品 |
| Package | `package.go` | 产品套餐/子产品 |
| Inventory | `inventory.go` | 每日库存与价格 |
| InventoryReservation | `inventory_reservation.go` | 库存预留记录 |
| Order | `order.go` | 订单主表 |
| OrderItem | `order_item.go` | 订单明细 |
| Payment | `payment.go` | 支付记录 |
| Traveler | `traveler.go` | 旅客信息 |
| Voucher | `voucher.go` | 电子凭证 |
| Merchant | `merchant.go` | 商户 |
| Tenant | `tenant.go` | 租户 |
| User | `user.go` | 用户 |
| ItineraryStop | `itinerary_stop.go` | 行程站点 |

---

## 四、核心业务流程

### 4.1 下单流程（已实现）

```
用户选日期/套餐 → 库存检查 → 确认下单
    ↓
库存预留 (15min TTL) → 创建订单 (PENDING)
    ↓
跳转支付页 → PayPal 支付
    ↓
支付回调 → 确认预留 → 订单状态更新 (CONFIRMED)
    ↓
生成电子凭证 → 用户可查看
```

### 4.2 产品详情页（携程风格 v0.2）

- ✅ 图片轮播区（封面 + 相册弹窗）
- ✅ 价格行（最低价 + 月销量）
- ✅ 优惠标签（新客/立减/信用购）
- ✅ 产品标题 + 标签行
- ✅ 评分展示
- ✅ 产品亮点卡片（可展开）
- ✅ 横向日期条（未来14天 + 每日价格）
- ✅ 套餐卡片（标签：飙升/低价）
- ✅ 日历弹窗（双月历 + 节假日 + 每日价格）
- ✅ 底部操作栏（店铺/收藏/问客服/立即预订）
- ⚠️ 图片轮播仅显示封面，多图切换待完善
- ️ 月销量/评分/收藏数为模拟数据

---

## 五、待完成 / 优化项

### P0 - 高优先级

| # | 任务 | 说明 |
|---|------|------|
| 1 | 订单列表对接后端 API | 当前 Orders.vue 使用 localStorage 缓存，需改为调用后端 API |
| 2 | 订单详情对接后端 API | OrderDetail.vue 已有 fallback 到 localStorage，需确保 API 正常 |
| 3 | 图片轮播多图切换 | ProductDetail 轮播区仅显示封面，需实现左右滑动切换 |
| 4 | 后端服务联调测试 | travel-rpc + travel-api 同时启动，完整走通下单流程 |

### P1 - 中优先级

| # | 任务 | 说明 |
|---|------|------|
| 5 | 收藏功能后端化 | 当前 favorites 使用 localStorage，需后端 API 支持 |
| 6 | 评价/点评系统 | 详情页评分为模拟数据，需实现真实评价功能 |
| 7 | 搜索功能完善 | 关键词搜索 + 目的地筛选的实际效果验证 |
| 8 | 支付回调处理 | PayPal Webhook 回调 → 自动确认订单 |
| 9 | 库存过期释放 | 预留超时(15min)自动释放库存的定时任务 |

### P2 - 低优先级

| # | 任务 | 说明 |
|---|------|------|
| 10 | 多语言支持 | 阿拉伯语 / 英语切换 |
| 11 | 推送通知 | 订单状态变更通知 |
| 12 | 行程详情展示 | 行程站点地图展示 |
| 13 | 分享功能 | 商品分享链接生成 |
| 14 | 优惠券系统 | 优惠券领取与使用 |

---

## 六、技术架构

```
─────────────────────────────────────────┐
│           travel-app (Vue 3 + Tauri)     │
│  Port: 1421 (Vite Dev)                   │
│  ┌──────┐ ┌────── ┌──────┐ ┌──────   │
│  │ Home │ │Detail│ │Booking│ │Profile│  │
│  └──┬───┘ └──┬───┘ ──┬───┘ └─────┘   │
│     └────────┴────────┴────────┘         │
│              ↓ fetch (vite proxy)         │
└──────────────┼───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│           travel-api (go-zero REST)       │
│  Port: 9206                               │
│  ┌────────┐ ┌──────── ┌────────┐        │
│  │Product │ │ Order  │ │Payment │        │
│  │Handler │ │Handler │ │Handler │        │
│  └───┬────┘ └───┬────┘ └───┬────┘        │
│      └──────────┴──────────┘              │
│              ↓ gRPC                        │
└──────────────┼───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│           travel-rpc (go-zero gRPC)       │
│  Port: 9205                               │
│  ┌────────┐ ┌────────┐ ┌────────┐        │
│  │Catalog │ │ Order  │ │Payment │        │
│  │Service │ │Service │ │Service │        │
│  └───┬────┘ └───┬────┘ └───┬────┘        │
│      └──────────┴──────────┘              │
│              ↓ Ent ORM                     │
└──────────────┼───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│              MySQL Database               │
│  12 Schemas (Ent managed)                 │
└───────────────────────────────────────────
```

---

## 七、启动命令

```powershell
# 1. 启动 travel-rpc (gRPC 服务)
cd D:\go_work\simple-admin\travel\travel-rpc
go run travel.go

# 2. 启动 travel-api (REST 服务)
cd D:\go_work\simple-admin\travel\travel-api
go run travel.go

# 3. 启动前端开发服务器
cd D:\go_work\simple-admin\travel\travel-app
node node_modules/vite/bin/vite.js
```

---

## 八、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1.0 | 2026-09-03 | 基础页面搭建、商品列表、详情页初版、下单流程 |
| v0.2.0 | 2026-09-04 | 携程风格详情页重构、日历弹窗、批量库存API、TabBar条件隐藏、用户认证体系 |
| v0.2.1 | 2026-09-06 | 商户端旅游订单详情页按参考页面重构，接入真实订单详情与出行人数据，补齐资源、结算、退款区块空态 |
