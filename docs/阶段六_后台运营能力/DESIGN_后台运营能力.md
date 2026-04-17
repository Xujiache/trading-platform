# DESIGN - 阶段六：后台运营能力、活动、Banner、奖励卡片、接口管理、开屏广告

## 1. 分层设计

```
用户端(uvue)  →  /api/mobile/operation/*  →  operationService  →  MySQL
管理后台(vue) →  /api/admin/*             →  operationService  →  MySQL
```

## 2. 核心组件

| 服务 | 文件 | 职责 |
|------|------|------|
| 运营服务 | `services/operationService.js` | Banner/奖励卡片/活动/模拟盘费用/第三方接口/首页聚合 |
| 管理端路由 | `routes/admin/operation.js` | 管理端全部运营 API |
| 用户端路由 | `routes/mobile/operation.js` | 用户端首页聚合/Banner/活动 |

## 3. 接口契约定义

### 管理端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/banners` | Banner 列表(分页) |
| POST | `/api/admin/banners` | 创建 Banner |
| PUT | `/api/admin/banners/:id` | 更新 Banner |
| DELETE | `/api/admin/banners/:id` | 删除 Banner |
| GET | `/api/admin/reward-cards` | 奖励卡片列表(分页) |
| POST | `/api/admin/reward-cards` | 创建奖励卡片 |
| PUT | `/api/admin/reward-cards/:id` | 更新奖励卡片 |
| DELETE | `/api/admin/reward-cards/:id` | 删除奖励卡片 |
| GET | `/api/admin/activities` | 活动列表(分页) |
| GET | `/api/admin/activities/:id` | 活动详情 |
| GET | `/api/admin/activity-stats` | 活动统计 |
| POST | `/api/admin/activities` | 创建活动 |
| PUT | `/api/admin/activities/:id` | 更新活动 |
| DELETE | `/api/admin/activities/:id` | 删除活动 |
| GET | `/api/admin/demo-fee` | 模拟盘费用配置(全品种合并) |
| POST | `/api/admin/demo-fee` | 保存单品种模拟盘费用 |
| POST | `/api/admin/demo-fee/reset/:symbol` | 恢复某品种为真实盘 |
| POST | `/api/admin/demo-fee/sync-all` | 全量同步真实盘 |
| GET | `/api/admin/integrations` | 第三方接口列表(脱敏) |
| GET | `/api/admin/integrations/:id` | 接口详情(含密钥) |
| POST | `/api/admin/integrations` | 创建接口配置 |
| PUT | `/api/admin/integrations/:id` | 更新接口配置 |
| DELETE | `/api/admin/integrations/:id` | 删除接口配置 |
| POST | `/api/admin/integrations/:id/check` | 检测连通性 |
| GET | `/api/admin/splash-ad` | 获取开屏广告配置 |
| POST | `/api/admin/splash-ad` | 保存开屏广告配置 |

### 用户端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/mobile/operation/homepage` | 首页聚合(Banner+中部Banner+奖励卡片) |
| GET | `/api/mobile/operation/banners` | Banner 列表 |
| POST | `/api/mobile/operation/banners/:id/click` | 记录 Banner 点击 |
| GET | `/api/mobile/operation/reward-cards` | 奖励卡片列表 |
| GET | `/api/mobile/operation/activities` | 活动列表(分页) |
| GET | `/api/mobile/operation/activities/:id` | 活动详情 |

## 4. 数据库表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `homepage_banners` | 首页 Banner | title/image_url/link_type/link_value/position(top/middle)/sort_order/status |
| `reward_cards` | 奖励卡片 | title/reward_type/reward_amount/trigger_type/trigger_value/bg_color/sort_order/status |
| `activities` | 活动 | title/summary/content/activity_type/status(draft/active/ended/archived)/start_time/end_time |
| `demo_fee_config` | 模拟盘费用 | symbol/fee_type/fee_value/spread_mode/spread_fixed/is_custom |
| `integrations` | 第三方接口 | name/type/api_url/api_key/api_secret/extra_config(JSON)/last_check_status |

## 5. 异常处理策略

| 异常类型 | 处理方式 |
|----------|----------|
| 接口连通性检测超时 | 10秒超时，记录 fail 状态和错误消息 |
| Banner 图片上传失败 | 前端提示错误，支持 URL 手动输入兜底 |
| 模拟盘费用配置冲突 | UPSERT 语义，symbol 唯一键保证幂等 |
| 接口密钥编辑安全 | 编辑先拉详情回填，留空不覆盖 |

## 6. 后台管理页面

| 页面 | 路由 | 组件路径 |
|------|------|----------|
| Banner 管理 | `/operation/banners` | `views/operation/banners/index.vue` |
| 奖励卡片管理 | `/operation/reward-cards` | `views/operation/reward-cards/index.vue` |
| 活动管理 | `/operation/activities` | `views/operation/activities/index.vue` |
| 模拟盘费用 | `/operation/demo-fee` | `views/operation/demo-fee/index.vue` |
| 接口管理 | `/operation/integrations` | `views/operation/integrations/index.vue` |
| 开屏广告 | `/operation/splash-ad` | `views/operation/splash-ad/index.vue` |
