# DESIGN - 阶段七：监控、批量、导出、审计、稳定性收尾

## 1. 整体架构图

```
┌──────────────────────────────────────────────────────────┐
│                    管理后台 (Vue3)                        │
│  ┌──────────┬──────────┬──────────┬──────────────────┐   │
│  │ 系统监控 │ 审计日志 │ 数据导出 │ 批量操作         │   │
│  │(自动刷新)│(搜索/详情)│(6种CSV) │(入金/出金/用户)  │   │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────────────┘   │
└───────┼──────────┼──────────┼──────────┼─────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌──────────────────────────────────────────────────────────┐
│                 Express 后端 (Node.js)                    │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            routes/admin/system.js                    │ │
│  │  /system/health  /health  /export/:type              │ │
│  │  /batch/*  /audit-logs  /monitor/connections          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           middleware/auditLog.js                      │ │
│  │  → fund.js (8接口) → risk.js (3接口)                 │ │
│  │  → trade.js (3接口) → users.js (3接口)               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  MySQL   │  │  Redis   │  │  marketMonitorService │   │
│  │  Pool    │  │ ioredis  │  │ (恢复历史/冷却期)    │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 2. 分层设计

| 层 | 内容 |
|------|------|
| 路由层 | `routes/admin/system.js` — 健康检查/导出/批量/审计/监控 |
| 中间件层 | `middleware/auditLog.js` — 审计日志中间件 + 直写函数 |
| 服务层 | `marketMonitorService.js`(增强) — 行情监控 |
| 数据层 | `audit_logs` 表 — 审计日志持久化 |
| 前端API层 | `api/admin-system.ts` — 类型化API封装 |
| 前端路由层 | `router/modules/system.ts` — 新增4个菜单 |
| 前端视图层 | `views/system/{health,audit-log,export,batch}` — 4个页面 |

## 3. 核心组件

- **HealthCheckService**：综合健康检查（内联于 system.js 路由）
- **ExportService**：CSV 数据导出（6种类型配置化，UTF-8 BOM）
- **BatchService**：批量处理（事务逐条执行，返回成功/失败明细）
- **AuditLogService**：审计日志中间件 + 直写函数
- **ConnectionPoolMonitor**：DB连接池状态 + Redis INFO 命令

## 4. 接口契约定义

### 4.1 系统监控

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/admin/system/health | system:config | 综合健康检查 |
| GET | /api/admin/health | admin | 轻量健康检查 |
| GET | /api/admin/monitor/connections | system:config | 连接池监控 |
| GET | /api/mobile/health | 无 | 移动端健康检查 |

### 4.2 数据导出

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/admin/export/:type | data:export | CSV导出(users/orders/fund_flows/deposits/withdraws/trade_flows) |
| GET | /api/admin/export-types | data:export | 获取可用导出类型 |

### 4.3 批量处理

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/admin/batch/deposit-confirm | fund:manage | 批量确认入金 |
| POST | /api/admin/batch/withdraw-audit | fund:manage | 批量审核出金 |
| POST | /api/admin/batch/user-status | user:manage | 批量冻结/解冻 |

### 4.4 审计日志

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/admin/audit-logs | system:audit | 审计日志分页查询 |
| GET | /api/admin/audit-logs/modules | system:audit | 模块/操作类型列表 |
| GET | /api/admin/audit-logs/:id | system:audit | 审计日志详情 |

## 5. 数据流向图

```
管理员操作 → auditLog中间件 → 拦截res.json → 异步写入audit_logs表
                                    ↓
                              原始响应正常返回给客户端
```

```
CSV导出请求 → 构建SQL(带筛选) → 查询DB → 生成CSV(BOM+headers+data) → 设置Content-Type → 返回文件流
                                                                           ↓
前端HTTP工具 → responseType:blob → 跳过JSON拦截器 → 直接返回Blob → 创建下载链接
```

## 6. 异常处理策略

| 异常类型 | 处理方式 |
|----------|----------|
| DB 连接失败 | 健康检查返回 unhealthy，HTTP 503 |
| Redis 连接失败 | 健康检查返回 degraded，HTTP 200 |
| 导出数据量过大 | LIMIT 50000 限制 |
| 批量操作部分失败 | 逐条事务，返回 success/failed 明细 |
| 行情源停滞 | 5分钟阈值→自动恢复→最多3次→等待人工介入 |
| 端口冲突(EADDRINUSE) | uncaughtException 中自动退出 |
| 优雅停机超时 | 15秒后强制退出 |

## 7. 数据库表结构设计

### audit_logs 审计日志表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK | 自增ID |
| operator_type | ENUM('admin','system') | 操作人类型 |
| operator_id | INT UNSIGNED | 操作人ID |
| operator_name | VARCHAR(100) | 操作人名称 |
| module | VARCHAR(100) | 操作模块 |
| action | VARCHAR(100) | 操作类型 |
| target_type | VARCHAR(50) | 目标对象类型 |
| target_id | VARCHAR(50) | 目标对象ID |
| content | TEXT | 操作内容(JSON) |
| before_data | TEXT | 变更前数据(JSON) |
| after_data | TEXT | 变更后数据(JSON) |
| ip | VARCHAR(50) | IP地址 |
| user_agent | TEXT | User-Agent |
| status | ENUM('success','fail') | 状态 |
| error_message | TEXT | 错误信息 |
| duration_ms | INT | 操作耗时(毫秒) |
| created_at | DATETIME | 创建时间 |

索引：operator(type+id)、module、action、target(type+id)、status、created_at
