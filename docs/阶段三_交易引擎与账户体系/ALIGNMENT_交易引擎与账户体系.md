# ALIGNMENT - 阶段三：交易引擎、订单、费用、账户体系

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **6.5 交易模块**：交易中心页、下单页、订单详情页
- **7.4.3 订单管理**：后台订单/持仓/交易流水管理
- **8.1.4 交易域**：`/api/mobile/trade` 全部接口
- **8.2.8 交易管理**：`/api/admin/trade` 全部接口
- **9.4 交易规则**：品种规则、下单规则、挂单类型、平仓规则、费用规则
- **10.3 定时任务**：挂单监控(2s)、移动止损监控(2s)、浮动盈亏更新(3s)、隔夜费结算(05:00)
- **10.4 交易并发控制**：Redis 分布式锁

## 2. 需求边界

### 2.1 本阶段范围内

#### 后端核心
- 交易引擎核心服务
- 市价单下单
- 挂单创建（buy_limit / buy_stop / sell_limit / sell_stop）
- 单笔平仓
- 一键平仓
- 止损止盈设置与修改
- 移动止损
- 费用预估接口
- 费用计算引擎（保证金、点差成本、开仓手续费、平仓手续费、隔夜费、净盈亏）
- 浮动盈亏实时计算
- 交易账户概览（净值/余额/可用保证金/已用保证金/浮动盈亏）
- 实盘/模拟盘账户类型区分
- Redis 分布式锁（按用户加锁防并发）
- 定时任务：挂单监控(2s)、移动止损监控(2s)、浮动盈亏更新(3s)、隔夜费结算(工作日05:00)

#### 后台管理
- 订单列表查询
- 订单详情查看
- 当前持仓列表
- 管理员手动平仓
- 撤销挂单/订单
- 管理员改价
- 交易流水查看
- 交易统计

#### 用户端页面
- 交易中心页（账户概览 + 持仓/历史/挂单 Tab + 快捷下单）
- 下单页（品种选择/方向/手数/杠杆/止损止盈/费用预估）
- 订单详情页（价格/费用/时间/流水）

#### 后台页面
- 订单管理页（全部订单/当前持仓/交易流水 Tab）

### 2.2 本阶段范围外
- 资金入金/出金（阶段四）
- 风控预警与强平（阶段五，但强平接口需预留）
- 模拟盘独立费用配置（阶段六）

## 3. 需求理解

### 3.1 下单规则
- 支持市价单和挂单
- 下单字段：symbolId、direction(buy/sell)、lots、leverage、stopLoss、takeProfit、accountType
- 杠杆预置：10x/20x/50x/100x
- 手数快捷选项：0.01/0.05/0.1/0.5/1
- 下单前校验：手数范围、杠杆范围、止损止盈合法性、保证金充足、品种可交易状态、行情可用

### 3.2 挂单类型
- `buy_limit`：买入限价单
- `buy_stop`：买入止损单
- `sell_limit`：卖出限价单
- `sell_stop`：卖出止损单

### 3.3 平仓规则
- 用户单笔平仓
- 用户一键平仓全部持仓
- 管理员后台手动平仓
- 止损/止盈/移动止损自动触发平仓
- 平仓方式文案：manual、stop_loss、take_profit、admin、trailing_stop

### 3.4 费用计算
- 保证金 `margin` = 合约价值 / 杠杆
- 点差成本 `spread_cost`（后端计算，前端部分页面隐藏展示）
- 开仓手续费 `commission`
- 平仓手续费 `commission_close`
- 隔夜费 `swap_total`（周三3倍、节假日倍率）
- 净盈亏 `net_pnl`

### 3.5 交易账户字段
- 净值 `equity`
- 账户余额 `balance`
- 可用保证金 `availableMargin`
- 已用保证金 `frozen_margin`
- 浮动盈亏 `floating_pnl`

### 3.6 并发控制
- 使用 Redis 分布式锁按用户维度加锁
- 防止并发下单、并发平仓造成账户数据不一致

### 3.7 核心数据实体（本阶段）
- `trade_orders` 交易订单表
- `pending_orders` 挂单表
- `fund_accounts` 资金账户表

## 4. 疑问澄清

- [x] 移动止损的具体触发逻辑和步进值？— 按用户设置的点数距离跟随，买单价格上涨时止损上移，卖单价格下跌时止损下移，触及止损价自动平仓
- [x] 隔夜费结算的具体计算公式？— swap = swap_rate × lots × contractUnit × days × multiplier，周三3倍，每日05:00结算
- [x] 模拟盘初始资金额度（$10000？）？— 确认为$10000，system_config表中demo_initial_balance=10000
- [x] 滑点处理策略（最大滑点配置后如何执行）？— 本阶段市价单直接以ask/bid成交，max_slippage字段已预留，实际滑点处理在风控阶段实现
- [x] 挂单有效期是否有限制？— 支持设置expired_at过期时间，挂单监控会自动将过期挂单标记为expired

## 5. 接口清单

### 用户端交易 `/api/mobile/trade`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /symbols | 交易品种列表 |
| POST | /order | 创建市价单 |
| POST | /pending | 创建挂单 |
| POST | /close/:id | 平仓 |
| POST | /close-all | 一键平仓 |
| PUT | /order/:id/sltp | 修改止损止盈 |
| PUT | /pending/:id | 修改挂单 |
| DELETE | /pending/:id | 撤销挂单 |
| GET | /positions | 当前持仓 |
| GET | /orders | 历史/订单列表 |
| GET | /orders/:id | 订单详情 |
| GET | /pendings | 挂单列表 |
| GET | /account | 交易账户概览 |
| POST | /estimate | 下单费用预估 |

### 后台交易管理 `/api/admin/trade`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /trade/orders | 订单列表 |
| GET | /trade/orders/:id | 订单详情 |
| GET | /trade/positions | 持仓列表 |
| POST | /trade/orders/:id/close | 管理员平仓 |
| POST | /trade/orders/:id/cancel | 撤销订单 |
| PUT | /trade/orders/:id/price | 管理员改价 |
| GET | /trade/flows | 交易流水 |
| GET | /trade/statistics | 交易统计 |
| GET | /trade/stats | 交易统计（兼容旧版） |
