# ALIGNMENT - 阶段七：监控、批量、导出、审计、稳定性收尾

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **7.1.6 非页面型后台能力**：健康状态、导出、批量处理、审计日志
- **8.2.20 系统监控与增强能力**：health、export、batch、audit-logs
- **10.6 系统稳定性要求**：数据库/Redis连接测试、连接池监控、优雅停机、全局异常
- **12.1 性能**：高频刷新、分页加载
- **12.2 安全**：JWT鉴权、权限校验、密码加密、文件控制、并发控制
- **12.3 审计与可追踪性**：操作日志、风险留痕、资金流水可回溯
- **12.4 可运维性**：健康检查、日志记录、批量处理、数据导出
- **12.5 兼容性**：新旧接口兼容、H5/非H5兼容、K线双渲染
- **13. 隐藏能力与边界说明**：全部隐藏能力
- **14. 重开发验收清单**：三端全量验收

## 2. 需求边界

### 2.1 本阶段范围内

#### 系统监控
- [x] 系统健康检查接口（数据库连接、Redis连接、连接池状态、行情源、系统资源）
- [x] 后端健康状态 `GET /api/mobile/health`（增强版：检测DB/Redis/行情源）
- [x] 后台系统健康 `GET /api/admin/system/health`、`GET /api/admin/health`
- [x] 连接池监控 `GET /api/admin/monitor/connections`

#### 数据导出
- [x] CSV 数据导出接口 `GET /api/admin/export/:type`
- [x] 支持导出类型：用户列表、订单列表、资金流水、入金记录、出金记录、交易流水（6种）
- [x] 导出类型列表 `GET /api/admin/export-types`

#### 批量处理
- [x] 批量确认入金 `POST /api/admin/batch/deposit-confirm`
- [x] 批量审核出金 `POST /api/admin/batch/withdraw-audit`
- [x] 批量冻结/解冻用户 `POST /api/admin/batch/user-status`

#### 审计日志
- [x] 审计日志查询 `GET /api/admin/audit-logs`
- [x] 审计日志模块列表 `GET /api/admin/audit-logs/modules`
- [x] 审计日志详情 `GET /api/admin/audit-logs/:id`
- [x] 审计日志中间件挂载到17个关键业务接口（财务/风控/交易/用户）

#### 稳定性收尾
- [x] 数据库连接池监控
- [x] Redis 连接池监控
- [x] 优雅停机完善（HTTP→监控→DB→Redis依次关闭，15s超时）
- [x] 全局异常捕获完善（时间戳+堆栈，端口冲突自动退出）
- [x] Promise 拒绝日志记录
- [x] 行情数据源停滞监控完善（恢复历史/冷却期/自动重置）

#### 兼容性收尾
- [x] 新旧别名接口兼容验证（fund双路径双方法，trade统计双别名）
- [x] H5 与非 H5 场景兼容（UniApp自动处理，index页有#ifdef H5条件编译）
- [x] K线图双渲染方案兼容（Canvas图表+数据列表双展示）

#### 全量验收
- [x] 用户端 41 个页面全量验收
- [x] 后台 10 个路由模块全量验收
- [x] 后端 mobile 16 路由 + admin 17 路由全量验收
- [x] PRD 第14节验收清单逐项检查

### 2.2 本阶段特殊要求
- [x] 本阶段是收尾阶段，已对前六个阶段遗留问题进行清理
- [x] 所有"隐藏能力"（PRD第13节）已纳入

## 3. 需求理解

### 3.1 隐藏能力清单（全部已实现）
- [x] 系统健康状态查询（本阶段）
- [x] CSV 数据导出（本阶段）
- [x] 批量确认入金（本阶段）
- [x] 批量审核出金（本阶段）
- [x] 批量冻结/解冻用户（本阶段）
- [x] 审计日志查询（本阶段）
- [x] 内容页 `risk_warning` 配置能力（阶段五已实现）
- [x] 强平引擎服务层实现（阶段五已实现）
- [x] 行情源停滞自动恢复策略（阶段二已实现，本阶段完善）

### 3.2 审计日志字段
- [x] 操作人类型（admin/system）
- [x] 操作人ID
- [x] 操作人名称
- [x] 操作模块
- [x] 操作类型
- [x] 目标对象类型
- [x] 目标对象ID
- [x] 操作内容详情（JSON）
- [x] 变更前数据（JSON）
- [x] 变更后数据（JSON）
- [x] IP 地址
- [x] User-Agent
- [x] 状态
- [x] 错误信息
- [x] 操作耗时（毫秒）
- [x] 时间

### 3.3 导出类型（6种）
- [x] 用户列表导出（users）
- [x] 订单列表导出（orders）
- [x] 资金流水导出（fund_flows）
- [x] 入金记录导出（deposits）
- [x] 出金记录导出（withdraws）
- [x] 交易流水导出（trade_flows）

### 3.4 核心数据实体（本阶段）
- [x] `audit_logs` 审计日志表（独立于 `operation_logs`）

## 4. 疑问澄清（全部已解决）

- [x] 审计日志与操作日志是否为同一张表还是独立？→ **独立**：audit_logs 用于关键操作留痕，operation_logs 用于日常操作记录
- [x] CSV 导出的最大记录数限制？→ **50000条/次**
- [x] 批量操作的单次最大处理数量？→ **100条/次**
- [x] 健康检查是否需要包含外部服务（如行情源）状态？→ **是**，含行情源状态及恢复历史

## 5. 接口清单

### 系统监控与增强 `/api/admin`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /system/health | 系统健康检查（综合） | system:config |
| GET | /health | 健康检查（轻量） | admin |
| GET | /monitor/connections | 连接池监控 | system:config |
| GET | /export/:type | 数据导出（6种CSV） | data:export |
| GET | /export-types | 导出类型列表 | data:export |
| POST | /batch/deposit-confirm | 批量确认入金 | fund:manage |
| POST | /batch/withdraw-audit | 批量审核出金 | fund:manage |
| POST | /batch/user-status | 批量冻结/解冻 | user:manage |
| GET | /audit-logs | 审计日志查询 | system:audit |
| GET | /audit-logs/modules | 审计日志模块列表 | system:audit |
| GET | /audit-logs/:id | 审计日志详情 | system:audit |

### 用户端健康检查
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/mobile/health | 移动端健康检查（增强版） |

## 6. 全端页面/路由/API 统计

| 端 | 项目 | 数量 |
|------|------|------|
| 用户端 | pages.json 注册页面 | 41 |
| 管理后台 | 路由模块 | 10 |
| 后端 Mobile | 路由文件 | 16 |
| 后端 Admin | 路由文件 | 17 |
