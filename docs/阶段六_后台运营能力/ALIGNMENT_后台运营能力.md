# ALIGNMENT - 阶段六：后台运营能力、活动、Banner、奖励卡片、接口管理、开屏广告

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **6.3 首页模块**：Banner轮播、奖励卡片、常用功能宫格(8个)、热门行情、活动推荐
- **6.2.1 开屏页**：可配置开屏广告
- **7.4.2 模拟盘费用**：模拟盘独立费用配置
- **7.4.9 活动管理**：活动 CRUD
- **7.4.10 接口管理**：第三方接口配置与连通性检查
- **7.4.11 Banner 管理**：首页 Banner CRUD
- **7.4.12 奖励卡片管理**：首页奖励卡片 CRUD
- **7.6.6 开屏广告**：开屏广告配置

## 2. 需求边界

### 2.1 本阶段范围内

#### 首页运营
- 首页聚合数据接口（Banner + 中部Banner + 奖励卡片）
- 开屏广告配置接口
- 首页完整页面实现（用户端）

#### Banner 管理
- Banner CRUD（标题/图片/跳转链接/跳转类型/排序/状态/展示位置）
- 跳转类型：none / page / url / activity
- 展示位置：top（顶部轮播）/ middle（中部推荐）
- 图片上传组件 + URL 输入兜底

#### 奖励卡片管理
- 奖励卡片 CRUD
- 字段：title/description/icon/reward_type/reward_amount/trigger_type/trigger_value/bg_color/sort_order/status
- 触发条件：register / first_deposit / deposit_amount / trade_count / invite

#### 活动管理
- 活动统计卡片（总数/进行中/草稿/已结束）
- 活动列表（关键词/状态/类型筛选）
- 活动 CRUD（标题/摘要/详情/封面/规则/时间范围/状态）
- 上下线切换
- 用户端活动列表与详情（含浏览计数）

#### 模拟盘费用管理
- 全品种合并展示（active 品种 + 已有模拟配置）
- 按品种独立配置模拟盘点差、手续费、隔夜费
- 未配置时跟随实盘配置，标记为"同步真实盘"
- 一键同步真实盘值
- 恢复默认（跟随实盘）

#### 第三方接口管理
- 接口列表（分类：行情源/支付/邮件/推送/短信/其他）
- 启用/禁用
- 动态配置字段(extra_config JSON)增删改 UI
- 保存配置（密钥留空不覆盖）
- 连通性检测（HTTP GET 探活，10秒超时）
- 显示最后检测结果

#### 开屏广告配置
- 是否启用
- 展示时长（1-15秒）
- 背景图片上传组件
- 跳转链接
- 富文本内容
- 图片优先展示逻辑
- 手机模拟预览

#### 用户端页面
- 首页 `pages/index/index`（完整实现：8宫格+Banner+中部Banner+公告+行情+奖励+活动）
- 开屏页 `pages/splash/index`（已在阶段一完成）
- 活动列表页 `pages/index/activities`
- 活动详情页 `pages/index/activity-detail`

#### 后台页面
- Banner 管理 `/operation/banners`
- 奖励卡片管理 `/operation/reward-cards`
- 活动管理 `/operation/activities`
- 模拟盘费用 `/operation/demo-fee`
- 接口管理 `/operation/integrations`
- 开屏广告 `/operation/splash-ad`

### 2.2 本阶段范围外
- 批量处理/导出（阶段七）
- 系统监控/审计（阶段七）

## 3. 需求理解

### 3.1 首页常用功能宫格（8个入口）
1. 领模拟金
2. 快速入金
3. 帮助中心
4. 交易报表
5. 我的持仓
6. 价格预警
7. 实时盯盘
8. 账户设置

### 3.2 模拟盘费用配置
- 列表字段：品种ID/代码/名称/分类/手续费/点差/隔夜费/配置来源(自定义/同步真实盘)
- 编辑项：手续费类型与值/点差模式与值/隔夜费率
- 操作：配置 / 恢复默认 / 全部同步真实盘

### 3.3 核心数据实体（本阶段）
- `homepage_banners` 首页 Banner 表
- `reward_cards` 奖励卡片表
- `activities` 活动表
- `demo_fee_config` 模拟盘费用配置表
- `integrations` 第三方接口配置表

## 4. 疑问澄清

- [x] 奖励卡片的自动发放逻辑 → 数据结构预留，触发逻辑后续迭代
- [x] 第三方接口连通性检测策略 → HTTP GET 探活，10秒超时，记录状态
- [x] 活动参与记录追踪 → 暂不追踪，预留 current_participants 字段
- [x] 首页数据聚合缓存策略 → 暂不缓存，直接查询

## 5. 接口清单（真实实现路径）

### 用户端运营 `/api/mobile/operation`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /homepage | 首页聚合数据(Banner+中部Banner+奖励卡片) |
| GET | /banners | Banner 列表 |
| POST | /banners/:id/click | 记录 Banner 点击 |
| GET | /reward-cards | 奖励卡片列表 |
| GET | /activities | 活动列表(分页) |
| GET | /activities/:id | 活动详情 |

### 管理端运营（挂载在 `/api/admin` 下）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /banners | Banner 列表/创建 |
| PUT/DELETE | /banners/:id | 更新/删除 Banner |
| GET/POST | /reward-cards | 奖励卡片列表/创建 |
| PUT/DELETE | /reward-cards/:id | 更新/删除奖励卡片 |
| GET/POST | /activities | 活动列表/创建 |
| GET | /activities/:id | 活动详情 |
| PUT/DELETE | /activities/:id | 更新/删除活动 |
| GET | /activity-stats | 活动统计 |
| GET/POST | /demo-fee | 模拟盘费用列表/保存 |
| POST | /demo-fee/reset/:symbol | 恢复某品种默认 |
| POST | /demo-fee/sync-all | 全量同步真实盘 |
| GET/POST | /integrations | 接口列表/创建 |
| GET | /integrations/:id | 接口详情(含密钥) |
| PUT/DELETE | /integrations/:id | 更新/删除接口 |
| POST | /integrations/:id/check | 连通性检测 |
| GET/POST | /splash-ad | 开屏广告获取/保存 |
