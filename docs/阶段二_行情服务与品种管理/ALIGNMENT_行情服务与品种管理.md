# ALIGNMENT - 阶段二：行情服务、品种管理、K线、WebSocket

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **6.4 行情模块**：行情页、品种详情页、K线页、预警页、新增预警页
- **7.4.1 品种管理**：后台品种配置与参数维护
- **8.1.3 行情域**：`/api/mobile/market` 全部接口
- **8.2.6 品种管理**：`/api/admin/symbols` 全部接口
- **10.1 行情服务**：行情初始化、品种运行时配置、K线服务、行情源监控
- **10.2 WebSocket 行情推送**：`/ws/market` 推送机制与消息类型
- **10.3 定时任务**（部分）：与行情相关的服务

## 2. 需求边界

### 2.1 本阶段范围内
- [x] 后台品种管理 CRUD+删除（基础信息、点差、手续费、隔夜费、交易限制）
- [x] 品种启用/禁用
- [x] 行情数据获取服务（模拟行情，AKShare接口预留）
- [x] WebSocket 行情推送服务（`/ws/market`）
- [x] K线数据服务（多周期：1分/5分/15分/30分/1时/4时/日/周/月）
- [x] 历史K线模拟数据生成
- [x] 行情源停滞监控与自动恢复
- [x] 预警触发扫描服务（定时检查→状态更新→通知执行）
- [x] 用户端行情页（搜索/筛选/榜单/品类/自选/WebSocket实时推送）
- [x] 用户端品种详情页（价格/买卖价/Canvas K线/合约规格/交易时间）
- [x] 用户端K线全屏页（Canvas绘制蜡烛图）
- [x] 用户端预警管理页（列表/删除）
- [x] 用户端新增预警页（价格高于/低于/涨跌幅）
- [x] 后台品种管理页面

### 2.2 本阶段范围外
- 交易下单（仅品种展示，不含下单逻辑）
- 资金模块
- 模拟盘费用管理（阶段六）
- KYC、风控

## 3. 技术栈约束

- 行情推送：WebSocket（ws库）
- K线图表：Canvas 2D API（用户端）
- 行情数据源：模拟行情（随机游走算法），AKShare接口预留
- 行情源监控：5分钟停滞检测 → 自动重启

## 4. 需求理解

### 4.1 品种管理
品种配置覆盖以下参数分组：
- **基础信息**：symbol、name、category、contract_unit、min_lot、max_lot、min_leverage、max_leverage、price_decimals、tick_value、tick_size
- **点差配置**：固定/浮动模式、固定值、最小/最大点差
- **手续费配置**：one_side/both_side、per_lot/percentage、费率值
- **隔夜费配置**：swap_long_rate、swap_short_rate、swap_wednesday_multiplier、swap_holiday_multiplier
- **交易限制**：最大持仓、最大滑点、交易时间

### 4.2 WebSocket 机制
- 路径：`/ws/market`
- 单客户端最大订阅数：50
- 心跳：30秒
- 推送频率：每秒
- 增量推送：仅 bid/ask 变动品种
- 客户端消息速率限制：每秒最多10条
- 消息类型：connected、subscribe、subscribed、unsubscribe、unsubscribed、ping、pong、tick、error、warning

### 4.3 行情页筛选
- 榜单板块：全部、自选、热门、涨幅榜、跌幅榜、高波动
- 品类筛选：全部、贵金属(precious_metal)、能源(energy)、外汇(forex)
- 自选通过本地存储维护

### 4.4 K线周期
1分、5分、15分、30分、1时、4时、日线、周线、月线

### 4.5 预警系统
- 类型：price_above、price_below、change_percent
- 通知方式：push、email
- 状态：active、triggered、disabled
- 触发闭环：定时扫描 → 条件匹配 → 状态更新 → 通知执行

### 4.6 核心数据实体（本阶段）
- `trading_symbols` 交易品种表
- `kline_data` K线数据表
- `price_alerts` 价格预警表

## 5. 疑问澄清

- [x] AKShare 行情源：当前使用模拟行情，AKShare接口位置已预留（marketDataService.js），正式上线前替换
- [x] K线历史数据：模拟生成365天日线+各周期500条左右
- [x] 预警触发后的推送：push记录日志，email调用emailService
- [x] 行情数据持久化：K线数据持久化到kline_data表，实时行情在内存缓存

## 6. 接口清单

### 用户端行情 `/api/mobile/market`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /symbols | 品种列表（含实时价格） |
| GET | /symbols/:id | 品种详情 |
| GET | /kline | K线数据 |
| GET | /status | 市场状态 |
| GET | /categories | 品类列表 |
| GET | /alerts | 预警列表（需登录） |
| POST | /alerts | 创建预警（需登录） |
| PUT | /alerts/:id | 修改预警（需登录） |
| DELETE | /alerts/:id | 删除预警（需登录） |

### 后台品种管理 `/api/admin`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /symbols | 品种列表（需管理员） |
| POST | /symbols | 新增品种（需管理员） |
| GET | /symbols/:id | 品种详情（需管理员） |
| PUT | /symbols/:id | 编辑品种（需管理员） |
| PUT | /symbols/:id/status | 启用/禁用（需管理员） |
| DELETE | /symbols/:id | 删除品种（需管理员） |

### WebSocket
| 路径 | 说明 |
|------|------|
| /ws/market | 行情实时推送 |
