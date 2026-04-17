# CONSENSUS - 阶段六：后台运营能力、活动、Banner、奖励卡片、接口管理、开屏广告

## 1. 明确的需求描述

### 1.1 功能需求清单

- [x] 首页聚合数据接口（Banner + 中部Banner + 奖励卡片）
- [x] 开屏广告配置接口（system_config 存储）
- [x] Banner CRUD + 图片上传组件
- [x] 奖励卡片 CRUD + 颜色选择 + 触发条件
- [x] 活动 CRUD + 统计 + 上下线
- [x] 模拟盘费用独立配置（全品种合并展示）
- [x] 第三方接口管理（配置/检测/extra_config 动态字段）
- [x] 开屏广告管理（图片上传/富文本/时长/链接/手机模拟预览）
- [x] 用户端首页完整实现（8宫格 + Banner + 行情 + 奖励 + 活动）
- [x] 用户端开屏页完整实现（已在阶段一完成）
- [x] 用户端活动列表与详情
- [x] 后台 6 个管理页面 + 工作台数据增强

## 2. 验收标准

| 编号 | 验收项 | 标准 | 状态 |
|------|--------|------|------|
| AC-6.1 | 首页 | Banner轮播/8宫格/公告/行情/中部Banner/奖励卡片/活动完整展示 | ✅ |
| AC-6.2 | 开屏页 | 配置启用后正常展示，倒计时/跳过/跳转可用 | ✅ |
| AC-6.3 | Banner管理 | CRUD + 图片上传 + 跳转类型(none/url/page/activity)正常 | ✅ |
| AC-6.4 | 奖励卡片 | CRUD + 触发条件 + 排序正常 | ✅ |
| AC-6.5 | 活动管理 | CRUD + 上下线 + 统计正常 | ✅ |
| AC-6.6 | 模拟盘费用 | 全品种展示/独立配置/恢复默认/同步真实盘正常 | ✅ |
| AC-6.7 | 接口管理 | 配置保存/连通性检测/extra_config动态字段/密钥安全编辑 | ✅ |
| AC-6.8 | 开屏广告 | 配置保存/图片上传/预览正常 | ✅ |

## 3. 技术实现方案

- 运营服务统一封装在 `operationService.js`，涵盖 Banner/奖励卡片/活动/模拟盘费用/第三方接口/首页聚合
- 管理端路由：`/api/admin/banners`、`/api/admin/reward-cards`、`/api/admin/activities`、`/api/admin/demo-fee`、`/api/admin/integrations`、`/api/admin/splash-ad`
- 用户端路由：`/api/mobile/operation/homepage`、`/api/mobile/operation/banners`、`/api/mobile/operation/activities`
- 前端响应封装已由 HTTP 工具层统一解析为 `res.data.data`，页面直接取返回值
- 删除操作使用 `request.del()`
- 接口管理编辑时先拉详情接口，密钥留空则不覆盖
- 模拟盘费用列表以全品种为基础合并已有配置，未自定义品种标记为"同步真实盘"

## 4. 技术约束与集成方案

- 首页数据聚合接口整合多模块数据（Banner + 中部Banner + 奖励卡片）
- 接口连通性检测使用 HTTP/HTTPS GET 探活，10秒超时
- 图片上传复用已有 `/api/admin/upload/image` 接口

## 5. 任务边界限制

- 奖励自动发放的事件触发机制为简化实现（数据结构预留，触发逻辑待后续完善）
- 工作台页面改用真实后端数据驱动

## 6. 不确定性解决记录

| 问题 | 结论 | 确认时间 |
|------|------|----------|
| INSERT 返回值解构 | mysql2 query INSERT 返回 ResultSetHeader，不可解构为数组 | 2026-04-12 |
| 前端响应取值 | HTTP 封装返回 res.data.data，页面不需要再取 .code | 2026-04-12 |
| 删除方法名 | 项目 HTTP 封装方法为 request.del()，不是 request.delete() | 2026-04-12 |
| 密钥编辑安全 | 编辑接口时必须先拉详情，密钥留空则不提交 | 2026-04-12 |
