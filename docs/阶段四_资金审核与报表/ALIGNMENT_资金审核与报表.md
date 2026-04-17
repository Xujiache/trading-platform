# ALIGNMENT - 阶段四：资金审核、收款账户、流水、报表

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **6.6 资产模块**：资产首页、入金页、入金记录、出金页、出金记录、资金流水、收款账户页
- **6.7.8 交易报表页**：交易报表/盈亏报表/费用报表
- **7.4.4 资金管理**：入金管理、出金管理、资金流水、财务统计
- **7.4.6 运营报表**：运营概览、风控报表、用户分析
- **8.1.5 资金域**：`/api/mobile/fund` 全部接口
- **8.1.7 报表域**：`/api/mobile/report` 全部接口
- **8.2.9 资金管理**：`/api/admin/fund` 全部接口
- **8.2.11 报表管理**：`/api/admin/report` 全部接口
- **9.3 资金规则**：入金规则、出金规则、收款账户规则
- **9.6 报表规则**

## 2. 需求边界

### 2.1 本阶段范围内

#### 资金模块
- 入金申请（微信/支付宝/USDT-TRC20，人工审核模式）
- 入金记录查看
- 出金申请（选择收款账户/填写信息/上传二维码/手续费估算）
- 出金记录查看
- 资金流水查看（含分类筛选和摘要统计）
- 收款账户管理（微信/支付宝/USDT，添加/删除/设置默认）
- 支付配置动态下发
- 资金账户信息接口

#### 后台资金管理
- 入金审核确认
- 出金审核（通过/驳回/标记打款完成）
- 资金流水查看
- 财务统计（累计入金/出金/手续费/待处理出金）

#### 报表模块
- 用户端：交易报表、盈亏报表、费用报表
- 后台：运营概览、风控报表、用户分析

#### 用户端页面
- 资产首页 `pages/assets/index`
- 入金页 `pages/assets/deposit`
- 入金记录页 `pages/assets/deposit-records`
- 出金页 `pages/assets/withdraw`
- 出金记录页 `pages/assets/withdraw-records`
- 资金流水页 `pages/assets/flows`
- 收款账户页 `pages/assets/bank-card`
- 交易报表页 `pages/mine/report`

#### 后台页面
- 资金管理页 `/trading/fund`（入金/出金/流水/财务统计 Tab）
- 运营报表页 `/trading/report`（运营概览/风控报表/用户分析 Tab）

### 2.2 本阶段范围外
- 风控预警与强平（阶段五）
- 活动奖励发放（阶段六）

## 3. 需求理解

### 3.1 入金规则
- **人工审核模式**，非自动支付回调
- 支付方式：微信 `wechat`、支付宝 `alipay`、USDT-TRC20 `usdt`
- 支付配置由后台系统配置动态维护下发
- 入金记录需追踪支付流水号和提交备注
- 入金状态：`pending` → `reviewing` → `completed` / `failed` / `cancelled`

### 3.2 出金规则
- **人工审核模式**
- 出金方式：微信、支付宝、USDT
- 用户需选择收款账户或填写出金信息
- 支持手续费估算
- 支持上传二维码图片
- 出金可用余额读取实盘账户数据，模拟盘不接入出金
- 出金状态：`pending` → `reviewing` → `approved` → `processing` → `completed` / `rejected` / `cancelled`

### 3.3 收款账户规则
- 页面名为 `bank-card`，真实业务为收款账户管理
- 支持微信、支付宝、USDT 三类
- 支持设置默认账户
- USDT 地址需格式校验

### 3.4 资金流水
- 筛选类型：全部、入金、出金、出金手续费、交易盈亏、交易手续费
- 后端支持类型：deposit、withdraw、withdraw_fee、trade_pnl、commission、spread、swap、adjust、demo_init、margin_freeze、margin_release
- 顶部摘要：累计入金、累计出金、累计费用

### 3.5 报表
#### 用户端
- 交易报表：总订单数/总手数/胜率/总盈亏/每日交易趋势
- 盈亏报表：总盈亏/总盈利/总亏损/平均盈亏/按品种统计
- 费用报表：总费用/点差/手续费/隔夜费/每日费用统计
- 按当前账户类型（实盘/模拟）查询

#### 后台
- 运营概览：新增用户/总入金/总出金/佣金收入/趋势图
- 风控报表：预警总量/强平总量/风险分布图
- 用户分析：盈亏分布/Top交易用户/用户活跃与资金特征

### 3.6 核心数据实体（本阶段）
- `deposits` 入金申请表
- `withdraws` 出金申请表
- `fund_flows` 资金流水表
- `bank_cards` 收款账户表

## 4. 疑问澄清

- [x] 出金手续费的计算规则（固定/百分比/阶梯）？— 使用system_config中withdraw_fee_rate百分比费率计算，rate×amount
- [x] 支付配置中二维码图片的存储方式？— multer上传到uploads/qrcode目录，返回URL存库
- [x] 入金审核是否需要关联凭证图片？— 入金申请表有proof_image字段，用户可上传支付凭证
- [x] 报表数据的缓存策略？— 当前直接实时查询MySQL聚合，后续可引入Redis缓存

## 5. 接口清单

### 用户端资金 `/api/mobile/fund`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /deposit | 创建入金申请 |
| GET | /deposits | 入金记录 |
| POST | /withdraw | 创建出金申请 |
| GET | /withdraws | 出金记录 |
| GET | /account | 资金账户信息 |
| GET | /flows | 资金流水 |
| GET | /fees | 费用汇总 |
| GET | /withdraw-fee | 估算出金手续费 |
| POST | /bank-cards | 添加收款账户 |
| GET | /bank-cards | 收款账户列表 |
| DELETE | /bank-cards/:id | 删除收款账户 |
| PUT | /bank-cards/:id/default | 设为默认 |
| GET | /payment-config | 支付配置 |

### 用户端报表 `/api/mobile/report`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /trade | 交易报表 |
| GET | /pnl | 盈亏报表 |
| GET | /fees | 费用报表 |

### 后台资金 `/api/admin/fund`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /fund/deposits | 入金列表 |
| POST | /fund/deposits/:id/confirm | 确认入金 |
| PUT | /fund/deposit/:id/confirm | 确认入金（兼容） |
| GET | /fund/withdraws | 出金列表 |
| POST | /fund/withdraws/:id/approve | 审核通过 |
| POST | /fund/withdraws/:id/reject | 驳回 |
| POST | /fund/withdraws/:id/complete | 标记完成 |
| PUT | /fund/withdraw/:id/audit | 审核（兼容） |
| PUT | /fund/withdraw/:id/pay | 打款（兼容） |
| GET | /fund/flows | 资金流水 |
| GET | /fund/statistics | 财务统计 |
| GET | /fund/stats | 财务统计（兼容） |

### 后台报表 `/api/admin/report`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /report/operations | 运营概览 |
| GET | /report/risk | 风控报表 |
| GET | /report/user-analysis | 用户分析 |
