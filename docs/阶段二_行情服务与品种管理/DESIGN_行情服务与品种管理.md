# DESIGN - 阶段二：行情服务、品种管理、K线、WebSocket

## 1. 整体架构图

```
┌──────────────────────────────────────────────────────────┐
│                    客户端（App/H5）                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ 行情列表页  │  │ 品种详情页 │  │  K线全屏页/预警页   │  │
│  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘  │
│        │ WebSocket      │ HTTP              │ HTTP        │
└────────┼───────────────┼──────────────────┼──────────────┘
         │               │                  │
┌────────┼───────────────┼──────────────────┼──────────────┐
│        ▼               ▼                  ▼              │
│  ┌──────────┐   ┌────────────┐   ┌──────────────┐       │
│  │WebSocket │   │ REST API   │   │  REST API    │       │
│  │/ws/market│   │/api/mobile │   │/api/admin    │       │
│  └────┬─────┘   └─────┬──────┘   └──────┬───────┘       │
│       │               │                 │                │
│  ┌────▼─────┐  ┌──────▼──────┐  ┌──────▼───────┐       │
│  │WebSocket │  │MarketData   │  │品种管理CRUD   │       │
│  │Service   │  │Service      │  │(authenticateAdmin)│   │
│  └────┬─────┘  └──────┬──────┘  └──────────────┘       │
│       │               │                                  │
│  ┌────▼───────────────▼──────┐                           │
│  │        priceCache         │                           │
│  └────────────┬──────────────┘                           │
│               │                                          │
│  ┌────────────▼──────────────┐  ┌──────────────────┐    │
│  │    KlineService           │  │  AlertService     │    │
│  │  (实时聚合+持久化)         │  │  (定时扫描+触发)   │    │
│  └────────────┬──────────────┘  └──────────┬───────┘    │
│               │                            │             │
│  ┌────────────▼────────────────────────────▼──────┐     │
│  │              MarketMonitor                      │     │
│  │         (5分钟停滞检测 → 自动恢复)               │     │
│  └─────────────────────────────────────────────────┘     │
│                     服务端                                │
└──────────────────────────────────────────────────────────┘
         │
    ┌────▼────┐
    │  MySQL  │
    │ trading_symbols / kline_data / price_alerts │
    └─────────┘
```

## 2. 分层设计

| 层级 | 组件 | 职责 |
|------|------|------|
| 路由层 | routes/admin/symbols.js, routes/mobile/market.js | 请求路由、参数校验、鉴权 |
| 服务层 | services/marketDataService.js | 行情数据获取与缓存 |
| 服务层 | services/websocketService.js | WebSocket连接管理与推送 |
| 服务层 | services/klineService.js | K线数据聚合与持久化 |
| 服务层 | services/alertService.js | 预警触发扫描与通知 |
| 服务层 | services/marketMonitorService.js | 行情源健康监控 |
| 数据层 | config/database.js | MySQL连接池与查询 |

## 3. 核心组件

- **MarketDataService**: 维护品种缓存(symbolsCache)和价格缓存(priceCache)，每秒模拟价格更新
- **WebSocketService**: 管理客户端连接，支持订阅/取消订阅/心跳，增量推送仅变动品种
- **KlineService**: 基于实时行情聚合K线数据，支持9种周期，自动持久化到数据库
- **AlertService**: 每5秒扫描活跃预警，匹配触发条件后更新状态并执行通知
- **MarketMonitorService**: 每60秒检查行情是否停滞超过5分钟，自动重启行情服务

## 4. 接口契约定义

### WebSocket 消息格式

| 消息类型 | 方向 | 格式 |
|----------|------|------|
| subscribe | C→S | `{ type: "subscribe", data: { symbols: ["XAUUSD"] } }` |
| subscribed | S→C | `{ type: "subscribed", data: { symbols: [...], total: N } }` |
| unsubscribe | C→S | `{ type: "unsubscribe", data: { symbols: ["XAUUSD"] } }` |
| ping | C→S | `{ type: "ping" }` |
| pong | S→C | `{ type: "pong", data: { time: 1234567890 } }` |
| tick | S→C | `{ type: "tick", data: { symbol, bid, ask, ... } }` |
| error | S→C | `{ type: "error", data: { message: "..." } }` |
| warning | S→C | `{ type: "warning", data: { message: "..." } }` |

### REST API 响应格式（统一）

```json
{ "code": 200, "msg": "操作成功", "data": { ... } }
```

## 5. 数据库表结构

- **trading_symbols**: 交易品种表（含基础信息、点差、手续费、隔夜费、交易限制共29个业务字段）
- **kline_data**: K线数据表（symbol + period + open_time 联合唯一键）
- **price_alerts**: 价格预警表（含触发时间、触发价格、通知方式）

## 6. 异常处理策略

| 异常类型 | 处理方式 |
|----------|----------|
| 行情源停滞5分钟 | MarketMonitor 自动重启行情服务，最多3次 |
| WebSocket 连接断开 | 心跳检测(30s) → terminate → 客户端自动重连(3s) |
| 订阅超过上限(50) | 返回 warning 消息，仅订阅前N个 |
| 消息速率超限(10/s) | 返回 warning 消息，忽略多余消息 |
| K线数据缺失 | 返回空数组，前端显示暂无数据 |
| 预警通知发送失败 | 记录日志，不影响状态更新 |
