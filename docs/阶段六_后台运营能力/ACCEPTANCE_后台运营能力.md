# ACCEPTANCE - 阶段六：后台运营能力、活动、Banner、奖励卡片、接口管理、开屏广告

## 任务完成记录

| 任务ID | 任务名称 | 状态 | 完成时间 | 备注 |
|--------|----------|------|----------|------|
| T6.1 | 数据表创建 | ✅ 已完成 | 2026-04-12 | homepage_banners/reward_cards/activities/demo_fee_config/integrations |
| T6.2 | Banner CRUD | ✅ 已完成 | 2026-04-12 | operationService + admin/mobile 路由 |
| T6.3 | 奖励卡片CRUD | ✅ 已完成 | 2026-04-12 | operationService + admin/mobile 路由 |
| T6.4 | 首页聚合数据 | ✅ 已完成 | 2026-04-12 | /api/mobile/operation/homepage (含中部Banner) |
| T6.5 | 开屏广告配置 | ✅ 已完成 | 2026-04-12 | admin路由 + system_config |
| T6.6 | 活动CRUD | ✅ 已完成 | 2026-04-12 | operationService + admin/mobile 路由 |
| T6.7 | 活动统计 | ✅ 已完成 | 2026-04-12 | /api/admin/activity-stats |
| T6.8 | 用户端活动接口 | ✅ 已完成 | 2026-04-12 | 列表+详情+浏览计数 |
| T6.9 | 模拟盘费用配置 | ✅ 已完成 | 2026-04-12 | 全品种合并/独立配置/恢复默认/同步真实盘 |
| T6.10 | 第三方接口管理 | ✅ 已完成 | 2026-04-12 | CRUD + extra_config + 列表脱敏 + 编辑拉详情 |
| T6.11 | 接口连通性检测 | ✅ 已完成 | 2026-04-12 | HTTP检测+超时处理+状态记录 |
| T6.12 | 用户端首页 | ✅ 已完成 | 2026-04-12 | 8宫格+Banner轮播+中部Banner+公告+热门行情+奖励卡片+活动 |
| T6.13 | 用户端开屏页 | ✅ 已完成 | 2026-04-12 | 已在阶段一实现 |
| T6.14 | 后台Banner管理 | ✅ 已完成 | 2026-04-12 | CRUD+图片上传+URL兜底+状态筛选 |
| T6.15 | 后台奖励卡片管理 | ✅ 已完成 | 2026-04-12 | CRUD+颜色选择+触发条件 |
| T6.16 | 后台活动管理 | ✅ 已完成 | 2026-04-12 | CRUD+统计卡片+上下线+置顶 |
| T6.17 | 后台模拟盘费用 | ✅ 已完成 | 2026-04-12 | 全品种合并/独立配置/恢复默认/全量同步 |
| T6.18 | 后台接口管理 | ✅ 已完成 | 2026-04-12 | CRUD+extra_config动态UI+连通性检测+密钥安全编辑 |
| T6.19 | 后台开屏广告 | ✅ 已完成 | 2026-04-12 | 配置表单+图片上传+手机模拟预览 |
| T6.20 | 后台工作台完善 | ✅ 已完成 | 2026-04-12 | 真实数据驱动(用户/入金/手续费/活动) |

## 审查修复记录

| 编号 | 问题 | 级别 | 修复内容 |
|------|------|------|----------|
| 1 | 文档未闭环 | P0 | 更新全部7份文档+主说明文档 |
| 2 | CREATE 接口返回值解构错误 | P0 | 去掉 INSERT 返回值的数组解构 |
| 3 | 前端响应结构取值错误 | P0 | 统一按 HTTP 封装返回值直接取数据 |
| 4 | 删除 API 方法名错误 | P0 | request.delete → request.del |
| 5 | 接口编辑密钥覆盖风险 | P0 | 编辑先拉详情回填+密钥留空不提交 |
| 6 | 缺少 extra_config 动态配置 UI | P1 | 补充键值对增删改 UI |
| 7 | 模拟盘费用未显示全品种 | P1 | 后端返回全品种合并数据 |
| 8 | 首页仅4个宫格 | P1 | 补齐到文档要求的8个入口 |
| 9 | Banner activity 跳转未处理 | P1 | 用户端补充 activity 类型跳转逻辑 |
| 10 | 中部 Banner 无展示位 | P1 | 后端返回 middleBanners + 用户端补展示位 |
| 11 | 无图片上传组件 | P1 | Banner 和开屏广告接入 ElUpload |
| 12 | 文档路径不一致 | P2 | ALIGNMENT 接口路径统一按真实代码更新 |

## 整体验收检查

- [x] 所有需求已实现
- [x] 验收标准全部满足
- [x] 审查问题全部修复
- [x] 文档闭环一致
- [x] 实现与设计文档一致

## 交付文件清单

### 服务端新增/修改
- `服务端/src/database/init.js` - 新增5张数据表
- `服务端/src/services/operationService.js` - 运营服务层
- `服务端/src/routes/admin/operation.js` - 管理端运营路由
- `服务端/src/routes/mobile/operation.js` - 用户端运营路由
- `服务端/src/app.js` - 注册新路由

### 管理后台新增/修改
- `管理后台/src/api/admin-operation.ts` - 运营管理API
- `管理后台/src/router/modules/operation.ts` - 运营管理路由
- `管理后台/src/router/modules/index.ts` - 注册运营路由模块
- `管理后台/src/views/operation/banners/index.vue` - Banner管理页面
- `管理后台/src/views/operation/reward-cards/index.vue` - 奖励卡片管理页面
- `管理后台/src/views/operation/activities/index.vue` - 活动管理页面
- `管理后台/src/views/operation/demo-fee/index.vue` - 模拟盘费用配置页面
- `管理后台/src/views/operation/integrations/index.vue` - 接口管理页面
- `管理后台/src/views/operation/splash-ad/index.vue` - 开屏广告配置页面
- `管理后台/src/views/dashboard/console/modules/card-list.vue` - 工作台卡片

### 用户端新增/修改
- `app和h5端/pages/index/index.uvue` - 首页完整实现
- `app和h5端/pages/index/activities.uvue` - 活动列表页
- `app和h5端/pages/index/activity-detail.uvue` - 活动详情页
- `app和h5端/pages.json` - 注册活动页面
