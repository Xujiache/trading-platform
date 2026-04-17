# 黄金/白银/石油交易系统重开发 PRD（1:1 复刻版）

## 1. 文档说明

### 1.1 文档目标
本 PRD 用于指导对现有交易系统进行一次完整的、可交付的、可上线的重新开发，目标不是做概念升级版，也不是做裁剪版，而是以当前系统代码中已经真实存在的页面、接口、业务逻辑、后台能力和运行机制为基准，完成 1:1 能力复刻。

### 1.2 适用范围
本文件覆盖以下三端：

- UniApp 用户端
- Vue3 管理后台
- Node.js 后端 API 与运行服务

### 1.3 重开发原则

- 必须复刻现有系统的全部业务能力、页面入口、操作路径、状态流转和管理能力。
- 不允许以“旧页面不重要”“后端已实现但前端未接入”“功能可以合并”为理由删减能力。
- 允许在技术实现层升级，但不允许改变当前业务边界。
- 对当前代码中已存在、但未在旧需求文档中明确描述的能力，必须纳入本次重开发范围。
- 对当前系统中无前端菜单但后端已实现的运维/批量/导出能力，也必须纳入后端需求范围。

### 1.4 当前系统基线

- 用户端技术：UniApp + Vue3 + ECharts
- 管理后台技术：Vue3 + TypeScript + Vite + Element Plus + TailwindCSS（Art Design Pro 体系）
- 后端技术：Express + MySQL2 + Redis + JWT + WebSocket
- 行情机制：HTTP + WebSocket 实时推送 + K 线数据服务
- 交易引擎：市价单、挂单、止损止盈、移动止损、浮动盈亏、隔夜费、管理员手动干预
- 资金机制：微信、支付宝、USDT-TRC20 人工审核入金/出金 + 收款账户管理

---

## 2. 产品定位与建设目标

### 2.1 产品定位
本系统是面向贵金属与能源 CFD 场景的多端协同交易系统，核心交易标的包括黄金、白银、原油，并支持后台扩展更多可交易品种。系统同时覆盖行情、交易、资金、风控、报表、公告、帮助、工单、客服与后台运营管理。

### 2.2 重开发目标

- 复刻用户完整开户、认证、交易、资金、消息、帮助、客服流程。
- 复刻后台完整的用户管理、交易管理、资金审核、风控、运营、内容、客服、配置、权限能力。
- 复刻后端完整 API 域、交易服务、行情推送、定时任务、文件上传、内容配置、系统运维接口。
- 为后续上线提供完整产品基线，避免二次开发中因需求缺漏导致返工。

### 2.3 非目标

- 本期 PRD 不主动新增现网中不存在的业务模块。
- 本期 PRD 不以“优化体验”为理由改变现有业务路径。
- 本期 PRD 不对当前产品做品牌重塑、业务模式重构或金融产品逻辑重定义。

---

## 3. 系统边界总览

### 3.1 三端结构

#### 3.1.1 用户端
面向终端交易用户，覆盖：

- 开屏广告
- 登录/注册/找回密码
- 首页运营内容
- 行情查看
- 品种详情与 K 线
- 下单与持仓管理
- 资产与出入金
- 收款账户管理
- KYC 实名认证
- 风险测评
- 2FA 两步验证
- 消息中心
- 帮助中心
- 工单系统
- 在线客服
- 交易报表
- 协议/隐私/关于我们等内容页

#### 3.1.2 管理后台
面向运营、财务、风控、客服、管理员，覆盖：

- 工作台
- 交易用户管理
- KYC 审核
- 用户详情
- 品种管理
- 模拟盘费用管理
- 订单管理
- 资金管理
- 风控管理
- 运营报表
- 消息通知与公告管理
- 工单与帮助文档管理
- 活动管理
- 第三方接口管理
- 首页 Banner 管理
- 首页奖励卡片管理
- 在线客服会话管理
- 客服管理员管理
- 角色管理
- 操作日志
- 系统配置
- 邮箱配置
- 个人中心
- 开屏广告配置

#### 3.1.3 后端服务
覆盖：

- 用户认证与账户管理
- KYC 与风控数据处理
- 行情数据获取与推送
- K 线服务
- 交易下单、平仓、挂单、费用估算
- 资金账户、入金、出金、流水
- 风险预警与强平相关能力
- 报表统计
- 通知、公告、内容页
- 帮助文档、工单、活动
- 在线客服会话
- 后台 RBAC、日志、配置
- 文件上传
- 系统健康检查
- 批量处理与导出接口

---

## 4. 角色与权限模型

### 4.1 用户端角色

#### 4.1.1 游客
可访问：

- 首页基础内容
- 行情列表
- 品种详情
- K 线
- 公告详情
- 关于我们/协议/隐私等公开内容
- 登录/注册/找回密码

#### 4.1.2 已注册未实名用户
在游客权限基础上，可访问：

- 资产页
- 交易页
- 个人中心
- 消息中心
- 风险测评
- 工单
- 在线客服

但在涉及资金、风控和部分交易限制时可根据后端规则受控。

#### 4.1.3 KYC 审核中用户
可查看实名状态与审核进度，不可重复提交成功状态资料。

#### 4.1.4 已实名用户
可完整使用：

- 入金/出金
- 收款账户管理
- 完整交易闭环
- 风险测评结果展示
- 报表与通知

#### 4.1.5 实盘/模拟盘用户
系统支持账户类型切换：

- 实盘账户 `real`
- 模拟账户 `demo`

前端真实入口位于个人中心页，通过“切换至模拟体验账户 / 切换至实盘交易账户”切换。交易页、资产页、报表页、下单页和流水页均依赖当前账户类型加载对应数据。

### 4.2 后台角色

#### 4.2.1 超级管理员
拥有全部系统权限，包括：

- 角色管理
- 系统配置
- 邮箱配置
- 管理员管理
- 运营配置
- 风控操作
- 数据导出
- 审计日志

#### 4.2.2 普通管理员/运营管理员
系统已有 `admin` 与可配置角色体系，具体权限由 RBAC 决定。

### 4.3 权限粒度要求
后台需支持：

- 菜单级权限
- 页面级权限
- 操作按钮级权限
- API 权限校验
- 角色可配置
- 系统内置角色与自定义角色并存

现有后端已存在典型权限点：

- `user:manage`
- `trade:manage`
- `fund:manage`
- `risk:manage`
- `admin:manage`
- `data:export`
- `system:audit`
- `system:config`

---

## 5. 总体业务流程

### 5.1 用户完整主流程

- 用户进入开屏页/首页
- 注册账户并通过邮箱验证码完成注册
- 登录系统
- 完成实名认证 KYC
- 完成风险测评
- 视需要开启 2FA
- 绑定或维护收款账户（微信/支付宝/USDT）
- 发起入金申请
- 财务后台审核到账
- 进入交易页或下单页完成交易
- 查看持仓/历史/挂单
- 查看资金流水与交易报表
- 需要帮助时查看帮助文档、提交工单或进入在线客服
- 发起出金申请并等待后台审核打款

### 5.2 后台主流程

- 管理员登录后台
- 查看工作台数据
- 审核 KYC
- 维护交易品种与模拟盘费用
- 审核入金/出金
- 监控订单、持仓、交易流水
- 配置风控参数并处理风险预警
- 维护公告、帮助文档、活动、首页 Banner 和奖励卡片
- 处理在线客服会话与工单
- 配置第三方接口与系统参数
- 查看日志与健康状态，执行导出或批量处理

---

## 6. 用户端详细需求

## 6.1 页面总清单
当前用户端页面共 36 个，必须全部复刻：

- `pages/splash/index`
- `pages/index/index`
- `pages/market/index`
- `pages/trade/index`
- `pages/assets/index`
- `pages/assets/deposit`
- `pages/assets/deposit-records`
- `pages/assets/withdraw`
- `pages/assets/withdraw-records`
- `pages/assets/flows`
- `pages/assets/bank-card`
- `pages/mine/index`
- `pages/auth/login`
- `pages/auth/register`
- `pages/auth/forgot-password`
- `pages/mine/kyc`
- `pages/mine/settings`
- `pages/mine/change-password`
- `pages/mine/risk-assessment`
- `pages/mine/profile-edit`
- `pages/mine/two-factor`
- `pages/market/detail`
- `pages/market/kline`
- `pages/market/alerts`
- `pages/market/alert-add`
- `pages/trade/order`
- `pages/trade/detail`
- `pages/mine/report`
- `pages/mine/messages`
- `pages/mine/help`
- `pages/mine/help-detail`
- `pages/mine/ticket-list`
- `pages/mine/ticket-create`
- `pages/mine/ticket-detail`
- `pages/mine/about`
- `pages/mine/agreement`
- `pages/mine/privacy`
- `pages/mine/announcement-detail`
- `pages/mine/chat`

说明：`pages.json` 中实际注册页面数以当前代码为准，重开发必须按现有注册路由全量恢复。

## 6.2 启动与认证模块

### 6.2.1 开屏页 `pages/splash/index`

#### 页面目标
在 App/H5 启动后展示可配置的开屏广告或默认启动页。

#### 页面元素

- 全屏广告区
- 图片广告展示
- 富文本广告展示
- 默认品牌启动页
- 跳过按钮（显示剩余秒数）

#### 交互要求

- 打开页面后请求开屏配置
- 若配置启用，则按照配置时长倒计时展示
- 若配置未启用或获取失败，则短暂停留后自动进入首页
- 点击广告时：
  - 若为外部链接，跳转外部地址
  - 若为内部页面路径，跳转对应页面
- 用户可点击“跳过”直接进入首页

#### 接口依赖

- `GET /api/mobile/homepage/splash-ad`

#### 配置字段

- `enabled`
- `imageUrl`
- `linkUrl`
- `duration`
- `richText`

### 6.2.2 登录页 `pages/auth/login`

#### 页面目标
完成邮箱 + 密码登录。

#### 页面元素

- 邮箱输入框
- 密码输入框
- 密码显隐切换
- 忘记密码入口
- 登录按钮
- 注册跳转入口

#### 交互要求

- 校验邮箱非空
- 校验密码非空
- 登录成功后保存 token、refreshToken、userInfo
- 登录成功后跳转首页 tab

#### 接口依赖

- `POST /api/mobile/auth/login`

### 6.2.3 注册页 `pages/auth/register`

#### 页面目标
通过邮箱验证码注册交易账户。

#### 页面元素

- 邮箱输入框
- 邮箱验证码输入框
- 获取验证码按钮 + 60 秒倒计时
- 密码输入框
- 确认密码输入框
- 协议勾选框
- 用户协议、隐私政策链接
- 注册按钮

#### 校验规则

- 邮箱格式校验
- 验证码必填
- 密码规则：8-20 位，包含大小写字母和数字
- 两次密码必须一致
- 必须勾选协议

#### 交互要求

- 发送邮箱验证码时指定业务类型 `register`
- 注册成功后：
  - 若后端返回 token，则自动登录并进入首页
  - 否则提示注册成功并返回登录页

#### 接口依赖

- `POST /api/mobile/auth/send-code`
- `POST /api/mobile/auth/register`

### 6.2.4 找回密码页 `pages/auth/forgot-password`

#### 页面目标
通过邮箱验证码重置登录密码。

#### 页面结构
两步式流程：

- 步骤 1：验证邮箱与验证码
- 步骤 2：设置新密码

#### 校验规则

- 邮箱格式正确
- 验证码必填
- 新密码满足 8-20 位且包含大小写字母与数字
- 确认密码一致

#### 接口依赖

- `POST /api/mobile/auth/send-code`（业务类型 `reset_password`）
- `POST /api/mobile/auth/reset-password`

---

## 6.3 首页模块

### 6.3.1 首页 `pages/index/index`

#### 页面定位
用户端首页是运营入口 + 行情入口 + 功能聚合页。

#### 页面模块

- Banner 轮播区
- 热门行情区
- 常用功能宫格
- 奖励卡片区
- 资讯/公告列表
- 信任/品牌说明区
- 自定义底部 TabBar

#### Banner 区要求

- 从后台 Banner 配置动态加载
- 支持图片、标题、排序、状态
- 支持无跳转 / 内部页面 / 外部链接
- 点击后按配置跳转

#### 奖励卡片要求
首页需展示后台可配置奖励卡片，字段包括：

- 显示金额 `label`
- 标题 `title`
- 说明 `description`
- 图标色 `icon_color`
- 奖励金额 `reward_amount`
- 奖励币种 `reward_currency`
- 触发条件 `condition_type`
- 自动发放 `auto_grant`
- 排序 `sort_order`
- 状态 `status`

#### 常用功能宫格
当前代码中包含以下 8 个入口，必须保留：

- 领模拟金（显示 `$10000` 徽标）
- 快速入金
- 帮助中心
- 交易报表
- 我的持仓
- 价格预警
- 实时盯盘
- 账户设置

#### 热门行情区

- 展示热门品种
- 展示价格、涨跌幅
- 通过 WebSocket 实时刷新
- 点击进入品种详情或下单

#### 资讯区

- 展示公告/资讯列表
- 点击进入资讯详情页

#### 接口与数据来源

- `GET /api/mobile/homepage/data`
- WebSocket `/ws/market`
- 公告列表数据

---

## 6.4 行情模块

### 6.4.1 行情页 `pages/market/index`

#### 页面目标
为用户提供可筛选、可搜索、可收藏、可跳详情、可加预警、可直接下单的行情总览。

#### 页面元素

- 搜索框（按代码/名称搜索）
- 榜单板块筛选
- 交易品类筛选
- 全量筛选面板
- 热门品种横向滚动区
- 行情列表
- 每条行情的加入自选 / 预警 / 下单操作

#### 榜单板块
必须保留以下筛选值：

- 全部
- 自选
- 热门
- 涨幅榜
- 跌幅榜
- 高波动

#### 品类筛选
必须保留以下分类：

- 全部
- 贵金属 `precious_metal`
- 能源 `energy`
- 外汇 `forex`

#### 行情项显示内容

- 品种代码
- 品种名称
- 品类标签
- 榜单标签
- 自选状态
- 价格
- 涨跌幅
- 快捷操作

#### 交互要求

- 收藏通过本地存储维护自选列表
- 支持打开新增预警页
- 支持直接进入下单页
- 支持进入品种详情页
- 支持实时行情订阅与刷新

#### 接口依赖

- `GET /api/mobile/market/symbols`
- `GET /api/mobile/market/categories`
- `GET /api/mobile/market/status`
- WebSocket `/ws/market`

### 6.4.2 品种详情页 `pages/market/detail`

#### 页面目标
展示单一品种的实时价格、走势、合约规格和交易时间，并提供快捷下单与预警入口。

#### 页面模块

- 顶部价格头部
- 买卖价格条
- K 线图表区域
- OHLC 信息条
- 快捷操作按钮（买入做多 / 卖出做空）
- 合约规格区
- 交易时间区

#### 合约规格字段
必须支持显示：

- 合约单位 `contract_unit`
- 合约单位标签 `contract_unit_label`
- 最小变动价 `tick_size`
- 每点价值 `tick_value`
- 最小手数 `min_lot`
- 最大手数 `max_lot`
- 杠杆范围 `min_leverage` ~ `max_leverage`
- 交易时间数组 `trading_hours`

#### 说明
当前详情页中存在“点差模式”“手续费”“隔夜费率”等信息位，但 UI 注释为隐藏，重开发时应维持现有前端展示边界，同时保留后端字段能力。

#### 接口依赖

- `GET /api/mobile/market/symbols/:id`
- `GET /api/mobile/market/kline`
- WebSocket `/ws/market`

### 6.4.3 K 线页 `pages/market/kline`

#### 页面目标
提供全屏 K 线分析能力。

#### 周期范围
必须保留：

- 1 分
- 5 分
- 15 分
- 30 分
- 1 时
- 4 时
- 日线
- 周线
- 月线

#### 页面能力

- 渲染 K 线图
- 显示当前价与涨跌幅
- 展示选中蜡烛的 OHLCV 数据
- 支持主动刷新
- 支持 WebSocket 实时价格更新
- 支持异常加载/重试状态

### 6.4.4 我的预警页 `pages/market/alerts`

#### 页面目标
管理当前用户创建的行情预警。

#### 页面能力

- 查看预警列表
- 显示品种名/代码
- 显示条件描述
- 显示状态（监控中/已触发/已停用）
- 删除预警
- 跳转新增预警页

#### 状态值

- `active`
- `triggered`
- `disabled`

#### 接口依赖

- `GET /api/mobile/market/alerts`
- `DELETE /api/mobile/market/alerts/:id`

### 6.4.5 新增预警页 `pages/market/alert-add`

#### 页面目标
为指定品种创建价格预警。

#### 支持的预警类型

- `price_above` 价格高于
- `price_below` 价格低于
- `change_percent` 涨跌幅达到阈值

#### 通知方式
必须支持：

- 推送通知 `push`
- 邮件通知 `email`

#### 创建字段

- `symbolId`
- `alertType`
- `thresholdValue`
- `notifyMethod[]`

#### 接口依赖

- `GET /api/mobile/market/symbols`
- `POST /api/mobile/market/alerts`

---

## 6.5 交易模块

### 6.5.1 交易中心页 `pages/trade/index`

#### 页面目标
整合账户概览、交易品种入口、持仓/历史/挂单工作台。

#### 页面模块

- 顶部标题与当前账户类型标签
- 当前选中品种卡片
- 账户净值区
- 余额/可用保证金/已用保证金/浮动盈亏概览
- 订单工作区
- 工作区 Tab
- 底部做多/做空快捷下单按钮

#### 账户信息字段
必须支持显示：

- 净值 `equity`
- 账户余额 `balance`
- 可用保证金 `availableMargin`
- 已用保证金 `frozen_margin`
- 浮动盈亏 `floating_pnl`

#### 工作区 Tab
必须保留：

- 持仓 `positions`
- 历史 `history`
- 挂单 `pending`

#### 持仓区能力

- 列表展示当前持仓
- 展示品种、方向、手数、开仓价、现价、盈亏、时间
- 支持单笔平仓
- 支持修改止损止盈
- 多笔持仓时支持“一键平仓”
- 空状态支持直接去下单

#### 历史区能力

- 展示已平仓订单
- 支持查看更多
- 点击进入订单详情页

#### 挂单区能力

- 展示挂单列表
- 显示挂单类型标签
- 显示触发价与时间
- 支持撤销挂单

#### 接口依赖

- `GET /api/mobile/trade/account`
- `GET /api/mobile/trade/positions`
- `GET /api/mobile/trade/orders`
- `GET /api/mobile/trade/pendings`
- `POST /api/mobile/trade/close/:id`
- `POST /api/mobile/trade/close-all`
- `PUT /api/mobile/trade/order/:id/sltp`
- `DELETE /api/mobile/trade/pending/:id`
- `GET /api/mobile/trade/symbols`
- WebSocket `/ws/market`

### 6.5.2 下单页 `pages/trade/order`

#### 页面目标
完成市价单下单，并显示费用预估。

#### 页面模块

- 交易品种选择器
- 买卖报价区
- 做多/做空方向切换
- 下单手数输入与快捷手数
- 杠杆倍数选择
- 止损止盈折叠区
- 费用预估卡
- 下单提示说明
- 提交按钮

#### 下单字段

- `symbolId`
- `direction`：`buy` / `sell`
- `lots`
- `leverage`
- `stopLoss`
- `takeProfit`
- `accountType`

#### 账户类型
下单页必须读取当前全局账户类型，用于决定实盘/模拟盘下单。

#### 杠杆默认选项
当前前端预置：

- 10x
- 20x
- 50x
- 100x

#### 手数快捷选项
当前前端预置：

- 0.01
- 0.05
- 0.1
- 0.5
- 1

#### 费用预估区
当前页面显示：

- 成交价格
- 占用保证金
- 手续费
- 预计总占用

说明：当前代码中后台会计算点差成本，但前台该卡片已隐藏点差成本展示，重开发需保持现有表现。

#### 接口依赖

- `GET /api/mobile/trade/symbols`
- `POST /api/mobile/trade/estimate`
- `POST /api/mobile/trade/order`
- WebSocket `/ws/market`

### 6.5.3 订单详情页 `pages/trade/detail`

#### 页面目标
展示单笔订单的价格、费用、时间与相关流水。

#### 页面模块

- 顶部订单头信息
- 价格信息
- 订单信息
- 费用明细
- 时间信息
- 资金流水

#### 关键字段

- `order_no`
- `symbol_code`
- `direction`
- `open_price`
- `close_price`
- `stop_loss`
- `take_profit`
- `lots`
- `leverage`
- `status`
- `close_type`
- `margin`
- `commission`
- `commission_close`
- `swap_total`
- `closed_pnl`
- `net_pnl`
- `opened_at`
- `closed_at`
- `flows[]`

#### 平仓方式文案
需支持：

- 手动平仓 `manual`
- 止损触发 `stop_loss`
- 止盈触发 `take_profit`
- 管理员操作 `admin`
- 移动止损 `trailing_stop`

#### 接口依赖

- `GET /api/mobile/trade/orders/:id`

---

## 6.6 资产模块

### 6.6.1 资产首页 `pages/assets/index`

#### 页面目标
集中管理资金账户、入金、出金与近期流水。

#### 页面模块

- 顶部账户标题与当前账户类型标签
- 余额、净值、保证金概览
- 入金/出金快捷入口
- 最近流水预览
- 资金相关页面跳转

#### 接口依赖

- `GET /api/mobile/fund/account`
- `GET /api/mobile/fund/flows`

### 6.6.2 入金页 `pages/assets/deposit`

#### 页面目标
支持用户按配置方式发起人工审核入金申请。

#### 当前真实支付方式
必须按现网保留：

- 微信 `wechat`
- 支付宝 `alipay`
- USDT-TRC20 `usdt`

#### 页面模块

- 支付方式切换
- 支付配置加载
- 收款二维码/地址展示
- 用户填写入金金额
- 用户填写付款流水号/备注信息
- 提交申请按钮

#### 关键要求

- 支付配置需由后台动态下发
- 不允许将当前系统误写为“仅银行卡入金”
- USDT 必须明确网络为 `TRC20`
- 入金采用人工审核，不是自动到账

#### 接口依赖

- `GET /api/mobile/fund/payment-config`
- `POST /api/mobile/fund/deposit`

### 6.6.3 入金记录页 `pages/assets/deposit-records`

#### 页面目标
展示用户提交的入金申请及审核状态。

#### 列表字段

- 订单号
- 状态
- 金额
- 支付方式
- 支付通道
- 付款流水号
- 提交备注
- 创建时间

#### 状态值

- `pending`
- `reviewing`
- `completed`
- `failed`
- `cancelled`

#### 接口依赖

- `GET /api/mobile/fund/deposits`

### 6.6.4 出金页 `pages/assets/withdraw`

#### 页面目标
支持用户提交人工审核出金申请。

#### 页面能力

- 选择出金方式
- 选择或维护收款账户
- 填写金额
- 上传二维码图片（当前页面支持）
- 填写账户信息
- 实时估算手续费
- 提交申请

#### 当前出金方式
必须保留：

- 微信
- 支付宝
- USDT

#### 当前行为边界
现有实现中出金可用余额读取实盘账户数据，重开发需按现有资金体系处理，不可擅自把模拟盘接入出金能力。

#### 接口依赖

- `GET /api/mobile/fund/account`
- `GET /api/mobile/fund/withdraw-fee`
- `POST /api/mobile/fund/withdraw`
- `GET /api/mobile/fund/bank-cards`

### 6.6.5 出金记录页 `pages/assets/withdraw-records`

#### 页面目标
展示用户的出金申请、手续费、到账金额和审核结果。

#### 列表字段

- 订单号
- 状态
- 申请金额
- 手续费
- 实际到账金额
- 出金方式
- 收款账号掩码/钱包地址掩码
- 驳回原因
- 申请时间

#### 状态值

- `pending`
- `reviewing`
- `approved`
- `processing`
- `completed`
- `rejected`
- `cancelled`

#### 接口依赖

- `GET /api/mobile/fund/withdraws`

### 6.6.6 资金流水页 `pages/assets/flows`

#### 页面目标
展示当前账户的资金流向与统计摘要。

#### 顶部摘要字段

- 累计入金
- 累计出金
- 累计费用

#### 筛选类型
当前前端必须保留：

- 全部
- 入金
- 出金
- 出金手续费
- 交易盈亏
- 交易手续费

#### 后端支持的流水类型
系统需保留以下至少已有类型：

- `deposit`
- `withdraw`
- `withdraw_fee`
- `trade_pnl`
- `commission`
- `spread`
- `swap`
- `adjust`
- `demo_init`
- `margin_freeze`
- `margin_release`

#### 列表字段

- 流水类型标签
- 关联订单号
- 备注
- 时间
- 金额变化
- 余额变化后值

#### 接口依赖

- `GET /api/mobile/fund/account`
- `GET /api/mobile/fund/flows`

### 6.6.7 收款账户页 `pages/assets/bank-card`

#### 页面目标
管理用户出金收款账户。

#### 重要说明
虽然页面文件名为 `bank-card`，但当前系统真实业务不是传统银行卡管理，而是以下收款账户管理：

- 微信收款账户
- 支付宝收款账户
- USDT 收款地址

#### 页面能力

- 添加收款账户
- 设置默认账户
- 删除收款账户
- USDT 地址格式校验
- 账户掩码展示

#### 接口依赖

- `POST /api/mobile/fund/bank-cards`
- `GET /api/mobile/fund/bank-cards`
- `DELETE /api/mobile/fund/bank-cards/:id`
- `PUT /api/mobile/fund/bank-cards/:id/default`

---

## 6.7 个人中心模块

### 6.7.1 我的页 `pages/mine/index`

#### 页面目标
作为用户个人中心与账户服务总入口。

#### 页面模块

- 用户头像与登录态区域
- KYC 状态标签
- 当前账户类型标签（实盘/模拟）
- 账户切换条
- 快捷功能入口
- 账户管理分组
- 安全设置分组
- 更多服务分组
- 退出登录按钮

#### 快捷功能入口
必须保留：

- 消息中心
- 交易报表
- 我的工单
- 帮助中心

#### 账户管理分组
必须保留：

- 实名认证
- 风险测评
- 编辑资料

#### 安全设置分组
必须保留：

- 修改密码
- 账户设置

#### 更多服务分组
必须保留：

- 在线客服
- 关于我们

#### 账户切换
需支持：

- 从实盘切换到模拟盘
- 从模拟盘切换到实盘
- 切换后刷新全局账户类型缓存

#### 接口依赖

- `POST /api/mobile/user/switch-account`
- `GET /api/mobile/notification/unread-count`
- `GET /api/mobile/chat/unread`

### 6.7.2 实名认证页 `pages/mine/kyc`

#### 页面目标
完成用户实名认证资料提交，并展示当前审核状态。

#### 提交字段

- 真实姓名
- 身份证号
- 身份证正面
- 身份证反面
- 人脸照片（后端已支持）

#### 状态要求
必须支持：

- 未提交 `none`
- 待审核 `pending`
- 已通过 `approved`
- 已驳回 `rejected`

#### 页面能力

- 未提交时显示提交表单
- 审核中时显示等待状态
- 驳回时显示驳回原因并支持重新提交
- 通过时显示通过状态

#### 接口依赖

- `POST /api/mobile/user/kyc/upload`
- `POST /api/mobile/user/kyc/submit`
- `GET /api/mobile/user/kyc/status`

### 6.7.3 账户设置页 `pages/mine/settings`

#### 页面目标
统一管理账户与安全设置入口。

#### 页面内容
必须保留以下设置项入口：

- 修改登录密码
- 设置交易密码
- 设置资金密码
- 两步验证 2FA
- 通知设置
- 清理缓存等通用设置

#### 接口依赖

- `POST /api/mobile/user/trade-password`
- `POST /api/mobile/user/fund-password`
- `GET /api/mobile/user/2fa/status`

### 6.7.4 修改登录密码页 `pages/mine/change-password`

#### 页面目标
修改当前登录密码。

#### 字段

- 当前密码
- 新密码
- 确认密码

#### 基础校验

- 当前密码必填
- 新密码至少 8 位（前端当前页校验）
- 确认密码一致

#### 接口依赖

- `POST /api/mobile/user/change-password`

### 6.7.5 风险测评页 `pages/mine/risk-assessment`

#### 页面目标
完成风险问卷并给出风险等级。

#### 页面能力

- 展示问卷题目
- 提交答案
- 展示测评结果
- 给出适配建议

#### 风险等级
至少支持：

- 未测评 `none`
- 保守型 `conservative`
- 稳健型 `moderate`
- 积极型 `aggressive`
- 专业型 `professional`

#### 接口依赖

- `POST /api/mobile/user/risk-assessment`
- `GET /api/mobile/user/risk-assessment`

### 6.7.6 编辑资料页 `pages/mine/profile-edit`

#### 页面目标
编辑昵称和头像。

#### 字段

- 头像
- 昵称
- 邮箱（只读）
- 注册时间（只读）

#### 页面能力

- 选择本地图片上传头像
- 修改昵称
- 提交后更新本地用户信息缓存

#### 接口依赖

- `PUT /api/mobile/user/profile`
- `POST /api/mobile/user/profile`（兼容旧版）

### 6.7.7 两步验证页 `pages/mine/two-factor`

#### 页面目标
启用或关闭 Google Authenticator 两步验证。

#### 页面能力

- 查看 2FA 当前状态
- 获取二维码和密钥
- 扫码绑定
- 输入 6 位验证码启用
- 输入验证码关闭

#### 接口依赖

- `GET /api/mobile/user/2fa/status`
- `POST /api/mobile/user/2fa/generate`
- `POST /api/mobile/user/2fa/enable`
- `POST /api/mobile/user/2fa/disable`

### 6.7.8 交易报表页 `pages/mine/report`

#### 页面目标
从用户视角查看交易数据统计。

#### Tab 必须保留

- 交易报表
- 盈亏报表
- 费用报表

#### 交易报表内容

- 总订单数
- 总手数
- 胜率
- 总盈亏
- 每日交易趋势

#### 盈亏报表内容

- 总盈亏
- 总盈利
- 总亏损
- 平均盈亏
- 按品种统计

#### 费用报表内容

- 总费用
- 点差
- 手续费
- 隔夜费
- 每日费用统计

#### 接口依赖

- `GET /api/mobile/report/trade`
- `GET /api/mobile/report/pnl`
- `GET /api/mobile/report/fees`

### 6.7.9 消息中心页 `pages/mine/messages`

#### 页面目标
查看用户接收到的系统消息、交易消息、资金消息和公告。

#### 分类 Tab
当前页面需支持：

- 全部
- 系统
- 交易
- 资金
- 公告

#### 页面能力

- 消息列表展示
- 未读数显示
- 单条标记已读
- 全部已读
- 公告跳转详情页

#### 接口依赖

- `GET /api/mobile/notification/list`
- `GET /api/mobile/notification/unread-count`
- `POST /api/mobile/notification/:id/read`
- `POST /api/mobile/notification/read-all`
- `GET /api/mobile/announcement/list`

### 6.7.10 帮助中心页 `pages/mine/help`

#### 页面目标
通过搜索和分类浏览帮助文档。

#### 分类要求
必须支持：

- 交易规则 `trading_rules`
- 费用说明 `fee_info`
- 出入金 `deposit_withdraw`
- 常见问题 `faq`

#### 页面能力

- 文档搜索
- 分类筛选
- 热门文章展示
- 点击进入文档详情

#### 接口依赖

- `GET /api/mobile/help/list`
- `GET /api/mobile/help/search`

### 6.7.11 帮助详情页 `pages/mine/help-detail`

#### 页面目标
展示单篇帮助文档富文本内容。

#### 显示内容

- 分类标签
- 标题
- 浏览数
- 创建时间
- 富文本正文

#### 接口依赖

- `GET /api/mobile/help/:id`

### 6.7.12 工单列表页 `pages/mine/ticket-list`

#### 页面目标
查看用户自己提交的工单及处理进度。

#### 状态筛选
必须支持：

- 全部
- 待处理 `pending`
- 处理中 `processing`
- 已解决 `resolved`

#### 列表字段

- 状态
- 标题
- 工单类型
- 工单号
- 提交时间
- 客服回复预览

#### 接口依赖

- `GET /api/mobile/ticket/list`

### 6.7.13 提交工单页 `pages/mine/ticket-create`

#### 页面目标
提交售后/客服/问题工单。

#### 工单分类
必须保留：

- 交易问题 `trade`
- 资金问题 `fund`
- 账户问题 `account`
- 技术问题 `technical`
- 其他 `other`

#### 字段

- 分类
- 标题
- 问题描述

#### 接口依赖

- `POST /api/mobile/ticket/`

### 6.7.14 工单详情页 `pages/mine/ticket-detail`

#### 页面目标
展示工单详情与客服回复。

#### 显示字段

- 工单状态
- 工单号
- 类型
- 提交时间
- 标题
- 问题内容
- 客服回复内容
- 回复时间

#### 接口依赖

- `GET /api/mobile/ticket/:id`

### 6.7.15 关于我们页 `pages/mine/about`

#### 页面目标
展示平台介绍与 CMS 配置的补充内容。

#### 页面模块

- 品牌介绍
- 平台定位
- 核心能力
- 交易覆盖说明
- 服务与支持
- 风险提示
- CMS 富文本补充披露
- 协议与隐私页链接

#### 接口依赖

- `GET /api/mobile/content/about_us`

### 6.7.16 用户协议页 `pages/mine/agreement`

#### 页面目标
展示用户协议内容。

#### 说明

- 优先读取后台配置内容
- 若无配置则展示内置默认协议内容

#### 接口依赖

- `GET /api/mobile/content/user_agreement`

### 6.7.17 隐私政策页 `pages/mine/privacy`

#### 页面目标
展示隐私政策内容。

#### 说明

- 优先读取后台配置内容
- 若无配置则展示内置默认隐私内容

#### 接口依赖

- `GET /api/mobile/content/privacy_policy`

### 6.7.18 公告详情页 `pages/mine/announcement-detail`

#### 页面目标
展示单篇公告/资讯详情。

#### 页面能力

- 显示封面图
- 显示置顶标识
- 显示标题
- 显示发布时间
- 显示富文本正文
- 空状态回退首页

#### 接口依赖

- `GET /api/mobile/announcement/:id`

### 6.7.19 在线客服页 `pages/mine/chat`

#### 页面目标
提供用户与客服的即时会话窗口。

#### 页面能力

- 获取/创建当前会话
- 拉取历史消息
- 发送文本消息
- 轮询或实时刷新未读与会话状态
- 显示消息发送人、时间、状态

#### 接口依赖

- `GET /api/mobile/chat/conversation`
- `GET /api/mobile/chat/messages`
- `POST /api/mobile/chat/send`
- `GET /api/mobile/chat/unread`

---

## 7. 管理后台详细需求

## 7.1 后台页面总清单
当前后台需复刻的页面/路由入口包括：

### 7.1.1 工作台

- `/dashboard/console`

### 7.1.2 交易用户管理

- `/trading-user/list`
- `/trading-user/kyc-review`
- `/trading-user/detail/:id`

### 7.1.3 交易管理

- `/trading/symbol`
- `/trading/demo-fee`
- `/trading/order`
- `/trading/fund`
- `/trading/risk`
- `/trading/report`
- `/trading/notification`
- `/trading/ticket`
- `/trading/activity`
- `/trading/integration`
- `/trading/homepage-banner`
- `/trading/homepage-rewards`

### 7.1.4 在线客服

- `/chat/conversations`
- `/chat/admin-manage`

### 7.1.5 系统管理

- `/system/role`
- `/system/log`
- `/system/config`
- `/system/email`
- `/system/user-center`
- `/system/splash-ad`

### 7.1.6 非页面型后台能力
虽未在现有菜单中确认到独立可视入口，但后端已实现，必须纳入重开发范围：

- 系统健康状态接口
- 数据导出接口
- 批量确认入金接口
- 批量审核出金接口
- 批量冻结/解冻用户接口
- 审计日志查询接口

## 7.2 工作台 `/dashboard/console`

#### 页面模块

- CardList 概览卡片
- ActiveUser 活跃用户模块
- SalesOverview 销售/运营概览模块
- NewUser 新用户模块
- Dynamic 动态统计模块
- TodoList 事项模块

#### 要求
工作台至少保留现有模块布局与信息块结构，允许在视觉上升级，但不可删除模块占位。

## 7.3 交易用户管理

### 7.3.1 用户列表 `/trading-user/list`

#### 查询条件

- 关键词：邮箱/昵称/真实姓名
- KYC 状态
- 账户状态
- 风险等级
- 分页

#### 列表字段

- 用户 ID
- 邮箱
- 昵称
- 真实姓名
- KYC 状态
- 账户状态
- 风险等级
- 实盘余额
- 用户等级
- 登录次数
- 注册时间

#### 操作按钮

- 详情
- 冻结
- 解冻
- 重置密码

#### 弹窗能力

- 冻结原因输入
- 重置密码输入

### 7.3.2 KYC 审核 `/trading-user/kyc-review`

#### 查询条件

- 审核状态
- 关键词（邮箱/姓名）
- 分页

#### 列表字段

- 用户 ID
- 邮箱
- 真实姓名
- KYC 状态
- 提交时间

#### 操作能力

- 审核通过
- 审核驳回
- 查看详情

#### 详情抽屉内容

- 用户 ID
- 邮箱
- 真实姓名
- 身份证号
- KYC 状态
- 驳回原因
- 提交时间
- 审核时间
- 身份证正面
- 身份证反面
- 人脸照片

### 7.3.3 用户详情 `/trading-user/detail/:id`

#### 模块分区

- 基本信息
- KYC 认证信息
- 资金信息
- 快捷操作

#### 基本信息字段

- 用户 ID
- 邮箱
- 昵称
- 真实姓名
- 用户等级
- 风险等级
- 账户状态
- 当前账户类型
- 2FA 状态
- 登录次数
- 最后登录时间
- 注册时间

#### 资金信息字段

- 实盘余额
- 实盘冻结保证金
- 实盘浮动盈亏
- 模拟余额

#### 快捷操作

- 审核通过 KYC
- 驳回 KYC
- 冻结账户
- 解冻账户
- 重置登录密码

## 7.4 交易管理

### 7.4.1 品种管理 `/trading/symbol`

#### 页面目标
维护交易品种及交易参数。

#### 列表能力

- 品种列表
- 新增品种
- 编辑品种
- 启用/禁用品种

#### 品种配置必须覆盖的参数分组

##### 基础信息

- 品种代码 `symbol`
- 品种名称 `name`
- 分类 `category`
- 合约单位 `contract_unit`
- 最小手数 `min_lot`
- 最大手数 `max_lot`
- 最小杠杆 `min_leverage`
- 最大杠杆 `max_leverage`
- 价格精度 `price_decimals`
- 每点价值 `tick_value`
- 最小变动价 `tick_size`

##### 点差配置

- 固定/浮动点差模式
- 固定点差值
- 最小点差
- 最大点差

##### 手续费配置

- 收费模式 `one_side` / `both_side`
- 计费方式 `per_lot` / `percentage`
- 费率值

##### 隔夜费配置

- 多单隔夜费率 `swap_long_rate`
- 空单隔夜费率 `swap_short_rate`
- 周三倍率 `swap_wednesday_multiplier`
- 节假日倍率 `swap_holiday_multiplier`

##### 交易限制

- 最大持仓
- 最大滑点
- 交易时间

### 7.4.2 模拟盘费用 `/trading/demo-fee`

#### 页面目标
为模拟账户单独配置点差、手续费和隔夜费；未配置时跟随实盘配置。

#### 列表字段

- 品种 ID
- 品种代码
- 名称
- 分类
- 真实盘点差
- 真实盘手续费
- 模拟盘配置状态
- 模拟盘点差
- 模拟盘手续费

#### 编辑项

- 是否启用独立配置
- 模拟盘固定点差
- 模拟盘最小/最大点差
- 模拟盘手续费模式
- 模拟盘手续费类型
- 模拟盘手续费值
- 模拟盘隔夜费配置
- 一键同步真实盘值

#### 操作

- 配置
- 恢复默认（恢复跟随真实盘）

### 7.4.3 订单管理 `/trading/order`

#### Tab 必须保留

- 全部订单
- 当前持仓
- 交易流水

#### 查询条件

- 关键词
- 状态
- 其他列表筛选

#### 订单/持仓操作

- 查看详情
- 手动平仓
- 撤销挂单/订单
- 改价

#### 交易流水

- 展示交易相关资金流动历史

### 7.4.4 资金管理 `/trading/fund`

#### Tab 必须保留

- 入金管理
- 出金管理
- 资金流水
- 财务统计

#### 通用筛选

- 关键词
- 状态
- 日期范围

#### 入金管理能力

- 查看入金申请
- 审核确认入金
- 查看支付凭证/备注

#### 出金管理能力

- 查看出金申请
- 审核通过
- 驳回
- 标记打款完成
- 查看上传二维码和账户信息

#### 财务统计字段

- 累计入金
- 累计出金
- 累计手续费
- 待处理出金等指标

### 7.4.5 风控管理 `/trading/risk`

#### Tab 必须保留

- 风控参数
- 风险预警
- 强平记录
- 高风险监控
- AML

#### 风控参数字段
至少包括：

- 预警线 `warningLine`
- 强平线 `forceCloseLine`
- 最大杠杆
- 最大手数

#### 风险预警能力

- 预警列表
- 处理预警
- 忽略/关闭预警

#### 强平记录能力

- 查看系统/手动强平记录
- 查看原因、触发类型、价格、盈亏

#### 高风险监控能力

- 查看高风险账户
- 手动强平指定用户

#### AML 能力

- 查看大额/可疑交易记录

### 7.4.6 运营报表 `/trading/report`

#### Tab 必须保留

- 运营概览
- 风控报表
- 用户分析

#### 运营概览

- 新增用户
- 总入金
- 总出金
- 佣金收入
- 趋势图表

#### 风控报表

- 预警总量
- 强平总量
- 风险分布图

#### 用户分析

- 盈亏分布
- Top 交易用户
- 用户活跃与资金特征

### 7.4.7 消息通知 `/trading/notification`

#### Tab 必须保留

- 消息列表
- 公告管理

#### 消息管理能力

- 发送系统通知
- 查看通知历史

#### 公告管理能力

- 创建公告
- 编辑公告
- 发布/更新公告
- 删除公告
- 富文本编辑
- 图片上传

### 7.4.8 工单帮助 `/trading/ticket`

#### Tab 必须保留

- 工单管理
- 帮助文档

#### 工单管理能力

- 查看工单列表
- 查看工单详情
- 回复工单
- 关闭工单

#### 帮助文档能力

- 文档列表
- 创建文档
- 编辑文档
- 删除文档
- 分类管理（交易规则/费用说明/出入金/FAQ）

### 7.4.9 活动管理 `/trading/activity`

#### 页面能力

- 活动统计卡片
- 关键词筛选
- 状态筛选
- 活动列表
- 新增活动
- 编辑活动
- 上下线切换
- 删除活动

#### 活动字段

- 标题
- 描述
- 规则
- 时间范围
- 状态

### 7.4.10 接口管理 `/trading/integration`

#### 页面目标
维护第三方接口配置并执行连通性检查。

#### 每个接口配置项必须支持

- 启用/禁用
- 动态配置字段输入
- 保存配置
- 检测接口状态
- 显示最后检测结果
- 显示分类、更新时间

#### 典型接口分类

- 行情源
- 支付
- 邮件
- 推送
- 其他第三方服务

### 7.4.11 Banner 管理 `/trading/homepage-banner`

#### 列表字段

- ID
- 标题
- Banner 图片
- 跳转链接
- 跳转类型
- 排序
- 状态
- 创建时间

#### 跳转类型
必须支持：

- 无跳转 `none`
- 内部页面 `page`
- 外部链接 `url`

#### 操作能力

- 新增 Banner
- 编辑 Banner
- 删除 Banner
- 图片上传

### 7.4.12 奖励卡片管理 `/trading/homepage-rewards`

#### 列表字段

- ID
- 显示金额
- 标题
- 说明
- 实际奖励金额
- 触发条件
- 自动发放
- 排序
- 状态

#### 触发条件
必须支持：

- 完成实名认证 `kyc`
- 首笔交易 `first_trade`
- 首次入金 `first_deposit`
- 新用户注册 `register`
- 手动发放 `manual`

#### 操作能力

- 新增
- 编辑
- 删除

## 7.5 在线客服模块

### 7.5.1 会话管理 `/chat/conversations`

#### 页面结构

- 左侧会话列表
- 右侧聊天窗口

#### 会话筛选

- 状态：待接入 / 进行中 / 已关闭
- 用户关键词

#### 会话状态

- `waiting`
- `active`
- `closed`

#### 会话能力

- 查看会话列表
- 查看消息
- 接入会话
- 回复消息
- 关闭会话
- 未读数轮询刷新

### 7.5.2 管理员管理 `/chat/admin-manage`

#### 页面目标
维护客服/管理员账号。

#### 查询条件

- 关键词
- 角色

#### 列表字段

- ID
- 用户名
- 姓名
- 邮箱
- 手机号
- 角色
- 状态
- 最后登录

#### 操作能力

- 新增管理员
- 编辑管理员
- 重置密码
- 删除管理员（保留超级管理员保护）

## 7.6 系统管理模块

### 7.6.1 角色管理 `/system/role`

#### 页面能力

- 按关键词搜索角色
- 查看角色列表
- 新增角色
- 编辑角色
- 删除非系统内置角色

#### 角色字段

- 角色标识 `name`
- 显示名称 `display_name`
- 描述
- 状态
- 排序
- 是否系统内置

### 7.6.2 操作日志 `/system/log`

#### 查询条件

- 操作模块
- 操作人
- 状态
- 日期范围

#### 列表字段

- ID
- 操作人
- 模块
- 操作
- 操作内容
- IP 地址
- 状态
- 时间

#### 详情弹窗字段

- User-Agent
- 错误信息
- 全量日志详情

### 7.6.3 系统配置 `/system/config`

#### 页面目标
维护系统参数与业务配置项。

#### 查询条件

- 配置分类
- 关键词

#### 分类范围
当前代码已明确至少包含：

- system
- trade
- fund
- risk
- email
- security

#### 配置能力

- 查看配置项列表
- 编辑字符串/数字/布尔/多行文本
- 上传二维码图片字段
- 保存单项配置

#### 特殊配置场景
需支持资金类二维码配置，如：

- 微信收款码
- 支付宝收款码
- 其他 `_qrcode` 结尾配置项

### 7.6.4 邮箱配置 `/system/email`

#### 页面目标
维护 SMTP 配置并支持测试发信。

#### 配置字段

- SMTP 服务器地址
- SMTP 端口
- 是否 SSL
- SMTP 账号
- SMTP 密码/授权码
- 发件人地址
- 发件人名称

#### 页面能力

- 保存邮箱配置
- 输入测试邮箱发送测试邮件

### 7.6.5 个人中心 `/system/user-center`

#### 页面能力

- 展示当前管理员基本资料
- 展示角色名称
- 展示权限标签
- 显示邮箱/用户名
- 修改管理员密码

### 7.6.6 开屏广告 `/system/splash-ad`

#### 页面目标
维护 App/H5 启动广告。

#### 配置字段

- 是否启用
- 展示时长（1-10 秒）
- 背景图片
- 跳转链接
- 富文本内容

#### 页面规则

- 若配置图片，则优先展示图片
- 若无图片，则可展示富文本内容
- 支持图片上传和删除
- 支持保存到系统配置

---

## 8. 后端 API 需求

## 8.1 移动端 API 域

### 8.1.1 认证域 `/api/mobile/auth`

- `POST /send-code` 发送邮箱验证码
- `POST /register` 注册
- `POST /login` 登录
- `POST /reset-password` 重置密码
- `GET /profile` 获取当前用户资料

### 8.1.2 用户域 `/api/mobile/user`

- `POST /kyc/upload` 上传 KYC 图片
- `POST /kyc/submit` 提交 KYC
- `GET /kyc/status` 查询 KYC 状态
- `POST /change-password` 修改登录密码
- `POST /trade-password` 设置交易密码
- `POST /set-trade-password` 兼容旧版设置交易密码
- `POST /fund-password` 设置资金密码
- `POST /set-fund-password` 兼容旧版设置资金密码
- `PUT /profile` 更新个人资料
- `POST /profile` 兼容旧版更新资料
- `POST /switch-account` 切换实盘/模拟盘
- `POST /risk-assessment` 提交风险测评
- `GET /risk-assessment` 获取风险测评结果
- `GET /2fa/status` 获取 2FA 状态
- `POST /2fa/generate` 生成 2FA 密钥
- `POST /2fa/enable` 启用 2FA
- `POST /2fa/disable` 关闭 2FA

### 8.1.3 行情域 `/api/mobile/market`

- `GET /symbols` 品种列表
- `GET /symbols/:id` 品种详情
- `GET /kline` K 线数据
- `GET /status` 市场状态
- `GET /categories` 品类列表
- `GET /alerts` 预警列表
- `POST /alerts` 创建预警
- `PUT /alerts/:id` 修改预警
- `DELETE /alerts/:id` 删除预警

### 8.1.4 交易域 `/api/mobile/trade`

- `GET /symbols` 交易品种列表
- `POST /order` 创建市价单
- `POST /pending` 创建挂单
- `POST /close/:id` 平仓
- `POST /close-all` 一键平仓
- `PUT /order/:id/sltp` 修改止损止盈
- `PUT /pending/:id` 修改挂单
- `DELETE /pending/:id` 撤销挂单
- `GET /positions` 当前持仓
- `GET /orders` 历史/订单列表
- `GET /orders/:id` 订单详情
- `GET /pendings` 挂单列表
- `GET /account` 交易账户概览
- `POST /estimate` 下单费用预估

### 8.1.5 资金域 `/api/mobile/fund`

- `POST /deposit` 创建入金申请
- `GET /deposits` 入金记录
- `POST /withdraw` 创建出金申请（支持上传二维码）
- `GET /withdraws` 出金记录
- `GET /account` 资金账户信息
- `GET /flows` 资金流水
- `GET /fees` 费用汇总
- `GET /withdraw-fee` 估算出金手续费
- `POST /bank-cards` 添加收款账户
- `GET /bank-cards` 收款账户列表
- `DELETE /bank-cards/:id` 删除收款账户
- `PUT /bank-cards/:id/default` 设为默认账户
- `GET /payment-config` 获取支付配置

### 8.1.6 风控域 `/api/mobile/risk`

- `GET /alerts` 获取我的风险预警
- `GET /margin-status` 获取保证金状态

### 8.1.7 报表域 `/api/mobile/report`

- `GET /trade` 交易报表
- `GET /pnl` 盈亏报表
- `GET /fees` 费用报表

### 8.1.8 通知域 `/api/mobile/notification`

- `GET /list` 消息列表
- `GET /unread-count` 未读数量
- `POST /:id/read` 标记单条已读
- `POST /read-all` 全部已读

### 8.1.9 公告域 `/api/mobile/announcement`

- `GET /list` 公告列表
- `GET /:id` 公告详情

### 8.1.10 工单域 `/api/mobile/ticket`

- `POST /` 创建工单
- `GET /list` 工单列表
- `GET /:id` 工单详情

### 8.1.11 帮助域 `/api/mobile/help`

- `GET /list` 帮助文档列表
- `GET /search` 搜索帮助文档
- `GET /:id` 帮助详情

### 8.1.12 活动域 `/api/mobile/activity`

- `GET /list` 活动列表
- `GET /:id` 活动详情

### 8.1.13 内容域 `/api/mobile/content`

必须支持以下内容键：

- `about_us`
- `user_agreement`
- `privacy_policy`
- `risk_warning`

接口：

- `GET /:key`

### 8.1.14 首页域 `/api/mobile/homepage`

- `GET /data` 首页聚合数据
- `GET /splash-ad` 开屏广告配置

### 8.1.15 在线客服域 `/api/mobile/chat`

- `GET /conversation` 获取或创建当前会话
- `GET /messages` 获取消息列表
- `POST /send` 发送消息
- `GET /unread` 获取未读数量

### 8.1.16 健康检查

- `GET /api/mobile/health`

## 8.2 后台 API 域

### 8.2.1 后台认证 `/api/admin/auth`

- `POST /login`
- `GET /info`
- `POST /change-password`

### 8.2.2 用户管理 `/api/admin/users`

- `GET /users`
- `GET /users/:id`
- `POST /users/:id/kyc-review`
- `POST /users/:id/toggle-status`
- `POST /users/:id/reset-password`

### 8.2.3 角色管理 `/api/admin/roles`

- `GET /roles`
- `GET /roles/:id`
- `POST /roles`
- `PUT /roles/:id`
- `DELETE /roles/:id`

### 8.2.4 日志管理 `/api/admin/logs`

- `GET /logs`
- `GET /logs/modules`
- `GET /logs/:id`

### 8.2.5 系统配置 `/api/admin/config`

- `GET /config`
- `GET /config/categories`
- `PUT /config/batch`
- `GET /config/email`
- `PUT /config/email`
- `POST /config/email/test`
- `PUT /config/:id`

### 8.2.6 品种管理 `/api/admin/symbols`

- `GET /symbols`
- `POST /symbols`
- `GET /symbols/:id`
- `PUT /symbols/:id/status`
- `PUT /symbols/:id`

### 8.2.7 模拟盘费用 `/api/admin/demo-fee`

- `GET /demo-fee/symbols`
- `GET /demo-fee/list`
- `GET /demo-fee/:symbolId`
- `PUT /demo-fee/:symbolId`
- `POST /demo-fee/batch`
- `DELETE /demo-fee/:symbolId`

### 8.2.8 交易管理 `/api/admin/trade`

- `GET /trade/orders`
- `GET /trade/orders/:id`
- `GET /trade/positions`
- `POST /trade/orders/:id/close`
- `POST /trade/orders/:id/cancel`
- `PUT /trade/orders/:id/price`
- `GET /trade/flows`
- `GET /trade/statistics`
- `GET /trade/stats`（兼容旧版）

### 8.2.9 资金管理 `/api/admin/fund`

- `GET /fund/deposits`
- `POST /fund/deposits/:id/confirm`
- `PUT /fund/deposit/:id/confirm`（兼容旧版）
- `GET /fund/withdraws`
- `POST /fund/withdraws/:id/approve`
- `POST /fund/withdraws/:id/reject`
- `POST /fund/withdraws/:id/complete`
- `PUT /fund/withdraw/:id/audit`（兼容旧版）
- `PUT /fund/withdraw/:id/pay`（兼容旧版）
- `GET /fund/flows`
- `GET /fund/statistics`
- `GET /fund/stats`（兼容旧版）

### 8.2.10 风控管理 `/api/admin/risk`

- `GET /risk/config`
- `PUT /risk/config`
- `POST /risk/config`（兼容旧版）
- `GET /risk/alerts`
- `POST /risk/alerts/:id/process`
- `PUT /risk/alerts/:id`（兼容旧版）
- `GET /risk/force-close`
- `POST /risk/force-close/:userId`
- `POST /risk/force-close`（兼容旧版）
- `GET /risk/monitor`
- `GET /risk/high-risk`（兼容旧版）
- `GET /risk/aml`

### 8.2.11 报表管理 `/api/admin/report`

- `GET /report/operations`
- `GET /report/risk`
- `GET /report/user-analysis`

### 8.2.12 消息公告 `/api/admin/notification` 与 `/api/admin/announcement`

- `GET /notification/list`
- `POST /notification/send`
- `GET /announcement/list`
- `POST /announcement`
- `PUT /announcement/:id`
- `DELETE /announcement/:id`

### 8.2.13 工单与帮助 `/api/admin/ticket` 与 `/api/admin/help`

- `GET /ticket/list`
- `GET /ticket/:id`
- `POST /ticket/:id/reply`
- `PUT /ticket/:id/close`
- `GET /help/list`
- `POST /help`
- `PUT /help/:id`
- `DELETE /help/:id`

### 8.2.14 活动管理 `/api/admin/activity`

- `GET /activity/stats`
- `GET /activity/list`
- `GET /activity/:id`
- `POST /activity`
- `PUT /activity/:id`
- `DELETE /activity/:id`

### 8.2.15 第三方接口 `/api/admin/integration`

- `GET /integration/list`
- `PUT /integration/:key`
- `GET /integration/:key/status`

### 8.2.16 首页运营 `/api/admin/homepage`

- `GET /homepage/banners`
- `POST /homepage/banners`
- `PUT /homepage/banners/:id`
- `DELETE /homepage/banners/:id`
- `GET /homepage/rewards`
- `POST /homepage/rewards`
- `PUT /homepage/rewards/:id`
- `DELETE /homepage/rewards/:id`

### 8.2.17 文件上传 `/api/admin/upload`

- `POST /upload/image`
- `POST /upload/banner`

### 8.2.18 在线客服 `/api/admin/chat`

- `GET /chat/conversations`
- `GET /chat/messages/:conversationId`
- `POST /chat/send`
- `POST /chat/assign`
- `POST /chat/close`
- `GET /chat/unread`

### 8.2.19 管理员管理 `/api/admin/admins`

- `GET /admins`
- `POST /admins`
- `PUT /admins/:id`
- `DELETE /admins/:id`

### 8.2.20 系统监控与增强能力

- `GET /system/health`
- `GET /export/:type`
- `POST /batch/deposit-confirm`
- `POST /batch/withdraw-audit`
- `POST /batch/user-status`
- `GET /audit-logs`
- `GET /health`

---

## 9. 核心业务规则

## 9.1 账户与认证规则

- 用户以邮箱为主要注册与登录标识。
- 注册与找回密码均依赖邮箱验证码。
- 登录成功后需保存 token、refreshToken、userInfo 和 accountType。
- 用户支持实盘与模拟盘两种账户上下文切换。
- 2FA 基于 Google Authenticator 方案实现。

## 9.2 KYC 规则

- KYC 提交材料至少包含姓名、证件号、身份证正反面。
- 后端路由已支持 `face_photo`，重开发需保留。
- 状态必须保留 `none / pending / approved / rejected`。
- 驳回必须支持填写用户可见原因。
- 管理后台必须可在列表页和详情页双入口完成审核。

## 9.3 资金规则

### 9.3.1 入金规则

- 入金不是自动支付回调模式，而是用户提交申请 + 人工审核模式。
- 实际支付方式为：微信、支付宝、USDT-TRC20。
- 支付配置由后台系统配置动态维护并下发。
- 入金记录必须可追踪支付流水号和提交备注。

### 9.3.2 出金规则

- 出金为人工审核模式。
- 用户需选择收款账户或填写对应出金信息。
- 必须支持手续费估算。
- 后台审核过程至少包括：待审核、通过、处理中、完成、驳回。
- 驳回必须支持填写驳回原因。

### 9.3.3 收款账户规则

- 当前系统文件名虽为 `bank-card`，但真实业务为收款账户管理。
- 必须支持微信、支付宝、USDT 三类账户。
- 必须支持设置默认账户。
- USDT 地址需校验格式。

## 9.4 交易规则

### 9.4.1 交易品种规则

- 仅状态启用的品种可交易。
- 品种交易参数来自后台配置。
- 实盘和模拟盘可使用不同费用配置。

### 9.4.2 下单规则

- 支持市价单。
- 支持挂单。
- 支持止损止盈。
- 支持移动止损。
- 下单前可进行费用预估。
- 下单时需校验手数、杠杆、止损止盈合法性、保证金占用与行情可用性。

### 9.4.3 挂单类型
必须支持：

- `buy_limit`
- `buy_stop`
- `sell_limit`
- `sell_stop`

### 9.4.4 平仓规则

- 用户可单笔平仓。
- 用户在交易页可一键平仓全部持仓。
- 管理员可后台手动平仓。
- 止损、止盈、移动止损可自动触发平仓。

### 9.4.5 费用规则
当前后端费用计算能力必须保留：

- 保证金 `margin`
- 点差成本 `spread_cost`
- 开仓手续费 `commission`
- 平仓手续费 `commission_close`
- 隔夜费 `swap_total`
- 净盈亏 `net_pnl`

说明：前台部分页面已隐藏点差成本展示，但后端真实存在此费用计算，重开发时必须保留业务能力。

## 9.5 风控规则

- 后台可配置预警线与强平线。
- 系统支持风险预警列表管理。
- 管理员可手动强平用户。
- 后端已实现强平引擎服务与强平记录。
- 高风险账户监控和 AML 列表为既有后台能力。

边界说明：当前代码中已确认手动强平接口与强平引擎服务存在，但未在已检代码中确认自动强平巡检定时任务的显式接入点。重开发时应优先保证当前已确认能力一致，并在实施阶段进一步核实生产启用方式。

## 9.6 报表规则

### 9.6.1 用户端报表

- 必须区分交易报表、盈亏报表、费用报表。
- 必须按当前账户类型（实盘/模拟）查询。

### 9.6.2 后台报表

- 必须提供运营概览、风控报表、用户分析三类报表。
- 必须支持日期范围筛选。

## 9.7 内容与通知规则

- 消息通知与公告管理分离。
- 公告支持富文本内容和封面图。
- 内容页支持 CMS 化配置。
- 帮助中心支持分类管理和搜索。
- 工单支持用户提交、后台回复与关闭。
- 在线客服支持会话接入、消息收发和关闭会话。

## 9.8 首页运营规则

- Banner 必须支持排序、状态、跳转类型。
- 奖励卡片必须支持触发条件与自动发放开关。
- 开屏广告必须支持图片与富文本双模式。

---

## 10. 运行服务与系统能力

## 10.1 行情服务

- 启动时初始化行情服务
- 初始化交易品种运行时配置
- 初始化 WebSocket 行情推送
- 初始化 K 线服务
- 首次运行生成历史 K 线模拟数据
- 监控行情源是否停滞，停滞超过 5 分钟时尝试重启本地 AKShare 服务

## 10.2 WebSocket 行情推送

### 10.2.1 路径

- `/ws/market`

### 10.2.2 已确认机制

- 客户端订阅品种
- 单客户端最大订阅数 50
- 30 秒心跳检测
- 每秒推送行情
- 增量推送（仅推送 bid/ask 变动品种）
- 消息速率限制：每秒最多 10 条客户端消息

### 10.2.3 消息类型
需支持：

- `connected`
- `subscribe`
- `subscribed`
- `unsubscribe`
- `unsubscribed`
- `ping`
- `pong`
- `tick`
- `error`
- `warning`

## 10.3 定时任务

当前代码已确认以下交易相关定时任务：

- 挂单监控：每 2 秒
- 移动止损监控：每 2 秒
- 浮动盈亏更新：每 3 秒
- 隔夜费结算：工作日 05:00（Asia/Shanghai）

## 10.4 交易并发控制

- 交易操作使用 Redis 分布式锁按用户加锁。
- 锁前缀为用户维度。
- 需避免并发下单、并发平仓造成账户数据不一致。

## 10.5 文件上传能力

必须支持：

- Banner 图片上传
- 通用图片上传
- KYC 图片上传
- 出金二维码上传
- 富文本内嵌图片上传

## 10.6 系统稳定性要求

当前系统后端已有：

- 数据库连接测试
- Redis 连接测试
- 连接池监控
- 优雅停机
- 全局异常捕获
- Promise 拒绝日志记录
- 市场数据源停滞监控

重开发必须保留同等级别稳定性保障。

---

## 11. 核心数据实体建议

以下为重开发必须覆盖的核心实体：

- 用户 `users`
- 管理员 `admins`
- 角色 `roles`
- 操作日志 `operation_logs`
- 审计日志 `audit_logs`
- 系统配置 `system_config`
- 交易品种 `trading_symbols`
- 模拟盘费用配置 `demo_fee_config`
- 交易订单 `trade_orders`
- 挂单 `pending_orders`
- 资金账户 `fund_accounts`
- 收款账户/出金账户 `bank_cards`（真实语义为收款账户）
- 入金申请 `deposits`
- 出金申请 `withdraws`
- 资金流水 `fund_flows`
- 风险预警 `risk_alerts`
- 强平记录 `force_close_records`
- 公告 `announcements`
- 站内消息 `notifications`
- 帮助文档 `help_docs`
- 工单 `tickets`
- 活动 `activities`
- 第三方接口配置 `integrations`
- 首页 Banner `homepage_banners`
- 奖励卡片 `reward_cards`
- 客服会话 `chat_conversations`
- 聊天消息 `chat_messages`
- K 线数据 `kline_*`

---

## 12. 非功能需求

## 12.1 性能

- 行情页、交易页必须支持高频实时刷新。
- WebSocket 推送延迟需控制在可接受范围内。
- 后台列表页需支持分页，不允许一次性全量加载大数据列表。

## 12.2 安全

- 用户端与后台均需基于 JWT 鉴权。
- 管理后台需有权限校验中间件。
- 密码必须加密存储。
- 涉及上传文件的接口需做类型与大小控制。
- 交易接口必须具备并发控制与参数校验。

## 12.3 审计与可追踪性

- 后台关键操作必须记录操作日志。
- 风险处理、财务审核、管理员干预交易必须留痕。
- 资金流水必须可回溯到订单号或业务动作。

## 12.4 可运维性

- 后端必须提供健康检查接口。
- 后端必须提供日志记录与异常输出。
- 后端必须支持批量处理与数据导出能力。

## 12.5 兼容性

- 需兼容当前后端已存在的新旧别名接口。
- 需兼容 H5 与非 H5 场景。
- K 线图在 H5 与小程序/APP 场景下需保持当前双渲染方案兼容能力。

---

## 13. 隐藏能力与边界说明

以下能力在当前系统中真实存在，但不一定有显式后台菜单入口，重开发时不得遗漏：

- 系统健康状态查询
- CSV 数据导出
- 批量确认入金
- 批量审核出金
- 批量冻结/解冻用户
- 审计日志查询
- 内容页 `risk_warning` 配置能力
- 强平引擎服务层实现
- 行情源停滞自动恢复策略

以下为当前系统重要边界，必须在 PRD 中明确：

- 资金模块真实支付方式是微信、支付宝、USDT-TRC20，不是单纯银行卡模式。
- `bank-card` 页面真实语义是收款账户管理。
- 用户端确实支持在线客服、工单、帮助中心、公告详情、交易报表、行情预警、2FA、风险测评、KYC。
- 管理后台确实支持模拟盘费用、活动管理、第三方接口管理、首页 Banner、奖励卡片、开屏广告、在线客服、管理员管理。
- 交易费用中点差成本在后端存在，但用户端部分页面已隐藏展示。

---

## 14. 重开发验收清单

### 14.1 用户端验收

- 所有页面与现网一一对应，不缺页。
- 首页 Banner、奖励卡片、公告、常用功能完整可用。
- 行情、详情、K 线、预警完整可用。
- 下单、持仓、历史、挂单完整可用。
- 入金、出金、记录、流水、收款账户完整可用。
- KYC、风险测评、2FA、资料编辑、密码修改完整可用。
- 消息、帮助、工单、客服、报表、内容页完整可用。
- 实盘/模拟盘切换完整可用。

### 14.2 管理后台验收

- 工作台、交易用户、交易管理、运营、客服、系统管理页面全部恢复。
- 品种参数配置项齐全。
- 模拟盘费用可独立维护并支持恢复跟随实盘。
- 财务审核流程完整。
- 风控参数、预警、强平记录、高风险监控、AML 可用。
- 公告、帮助文档、活动、Banner、奖励卡片、开屏广告可配置。
- 在线客服接入、回复、关闭流程可用。
- 角色、日志、系统配置、邮箱配置可用。

### 14.3 后端验收

- 移动端 API 域完整。
- 后台 API 域完整。
- 行情推送与 K 线服务可用。
- 下单/平仓/挂单/费用估算可用。
- 入金/出金/流水/账户管理可用。
- 通知/公告/工单/帮助/客服/活动 API 可用。
- 文件上传可用。
- 健康检查、导出、批量处理、审计日志接口可用。

---

## 15. 实施建议

### 15.1 开发顺序建议

- 第一阶段：基础设施、鉴权、配置体系、公共组件
- 第二阶段：行情服务、品种管理、K 线、WebSocket
- 第三阶段：交易引擎、订单、费用、账户体系
- 第四阶段：资金审核、收款账户、流水、报表
- 第五阶段：KYC、风控、消息、公告、帮助、工单、客服
- 第六阶段：后台运营能力、活动、Banner、奖励卡片、接口管理、开屏广告
- 第七阶段：监控、批量、导出、审计、稳定性收尾

### 15.2 重开发注意事项

- 必须先以本 PRD 为蓝本建立功能矩阵后再进入设计。
- 对“旧需求文档有、代码没有”的内容，不能直接视为当前必做功能；应以现有代码边界为准。
- 对“代码已有、旧需求文档未写”的内容，必须纳入范围。
- 交易、资金、风控三大模块禁止先做 UI 再补逻辑，必须以后端业务规则为先。

---

## 16. 结论

本 PRD 的目标是确保重开发后的系统，在用户端页面数量、后台管理能力、后端 API 范围、交易/资金/风控核心逻辑、运营与客服模块上，均与当前系统代码保持一致，不缺失任何一个真实存在的功能入口、状态流转和支撑能力。

如需进入下一阶段，建议直接基于本 PRD 拆分为：

- 用户端详细交互稿需求
- 管理后台详细交互稿需求
- 后端接口与数据表设计说明
- 开发排期与测试验收用例
