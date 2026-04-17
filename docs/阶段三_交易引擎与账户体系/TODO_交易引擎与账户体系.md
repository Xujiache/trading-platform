# TODO - 阶段三：交易引擎、订单、费用、账户体系

## 待办事项

| 编号 | 事项 | 优先级 | 负责方 | 状态 |
|------|------|--------|--------|------|
| 1 | 数据表创建 | P0 | 开发 | ✅ 已完成 |
| 2 | Redis分布式锁 | P0 | 开发 | ✅ 已完成 |
| 3 | 费用计算引擎 | P0 | 开发 | ✅ 已完成 |
| 4 | 交易账户服务 | P0 | 开发 | ✅ 已完成 |
| 5 | 交易引擎核心 | P0 | 开发 | ✅ 已完成 |
| 6 | 定时任务服务 | P0 | 开发 | ✅ 已完成 |
| 7 | 用户端API | P0 | 开发 | ✅ 已完成 |
| 8 | 后台API | P0 | 开发 | ✅ 已完成 |
| 9 | 用户端页面 | P0 | 开发 | ✅ 已完成 |
| 10 | 后台页面 | P0 | 开发 | ✅ 已完成 |
| 11 | 文档更新 | P0 | 开发 | ✅ 已完成 |

## 已确认的配置

| 配置项 | 说明 | 值 |
|--------|------|-----|
| 模拟盘初始资金 | 新用户模拟账户初始金额 | $10,000 |
| 隔夜费结算时区 | Asia/Shanghai 05:00 | 已实现 |
| 挂单监控间隔 | 2秒 | 已实现 |
| 移动止损监控间隔 | 2秒 | 已实现 |
| 浮动盈亏更新间隔 | 3秒 | 已实现 |
| 隔夜费周三倍数 | 3倍 | 已实现 |

## 操作指引

### 启动服务
```bash
cd 服务端
npm run dev
```

### 初始化数据库
```bash
npm run db:init
```
会自动创建fund_accounts、trade_orders、pending_orders、trade_flows等表。

### 新增文件清单
- `服务端/src/utils/distributedLock.js` — Redis分布式锁
- `服务端/src/services/feeCalculator.js` — 费用计算引擎
- `服务端/src/services/accountService.js` — 交易账户服务
- `服务端/src/services/tradeEngine.js` — 交易引擎核心
- `服务端/src/services/pendingOrderMonitor.js` — 挂单监控
- `服务端/src/services/trailingStopMonitor.js` — 移动止损监控
- `服务端/src/services/floatingPnlUpdater.js` — 浮动盈亏更新
- `服务端/src/services/swapSettlement.js` — 隔夜费结算
- `服务端/src/routes/mobile/trade.js` — 用户端交易路由
- `服务端/src/routes/admin/trade.js` — 后台交易路由
- `app和h5端/pages/trade/place-order.uvue` — 下单页
- `app和h5端/pages/trade/order-detail.uvue` — 订单详情页
- `管理后台/src/api/admin-trade.ts` — 后台交易API
- `管理后台/src/router/modules/trade.ts` — 后台交易路由
- `管理后台/src/views/trade/orders/index.vue` — 后台订单管理页
- `管理后台/src/views/trade/positions/index.vue` — 后台持仓页
- `管理后台/src/views/trade/flows/index.vue` — 后台流水页

### 修改文件清单
- `服务端/src/database/init.js` — 新增4张表
- `服务端/src/app.js` — 注册路由+启动定时任务
- `app和h5端/pages/trade/index.uvue` — 交易中心页(替换占位)
- `app和h5端/pages.json` — 注册新页面
- `管理后台/src/router/modules/index.ts` — 注册交易路由
