# DESIGN - 阶段一：基础设施、鉴权、配置体系、公共组件

## 1. 整体架构图

```
┌────────────────┐   ┌─────────────────┐   ┌──────────────────┐
│   UniApp 用户端  │   │  Vue3 管理后台    │   │   Express 后端     │
│                │   │ (Art Design Pro) │   │                  │
│ login/register │──▶│ admin login      │──▶│ /api/mobile/auth │
│ forgot-password│   │ role/log/config  │   │ /api/admin/auth  │
│ splash         │   │ email/splash-ad  │   │ /api/admin/roles │
│ agreement      │   │ user-center      │   │ /api/admin/logs  │
│ privacy        │   │                  │   │ /api/admin/config│
└────────────────┘   └─────────────────┘   │ /api/admin/upload│
                                            └────────┬─────────┘
                                                     │
                                            ┌────────▼─────────┐
                                            │     MySQL        │
                                            │  users/admins    │
                                            │  roles/logs      │
                                            │  system_config   │
                                            └────────┬─────────┘
                                                     │
                                            ┌────────▼─────────┐
                                            │     Redis        │
                                            │  验证码/限流       │
                                            └──────────────────┘
```

## 2. 分层设计

```
src/
├── app.js                    # 入口：Express实例、中间件、路由挂载、启动
├── config/
│   ├── index.js              # 环境变量配置
│   ├── database.js           # MySQL连接池
│   └── redis.js              # Redis连接
├── middleware/
│   ├── auth.js               # JWT鉴权（用户/管理员）
│   ├── rbac.js               # RBAC权限校验
│   ├── operationLog.js       # 操作日志记录
│   ├── validate.js           # 参数校验
│   └── errorHandler.js       # 错误处理 + 404
├── routes/
│   ├── mobile/auth.js        # 用户端认证路由
│   ├── mobile/homepage.js    # 首页/开屏配置路由
│   ├── mobile/content.js     # 内容页路由
│   ├── admin/auth.js         # 管理员认证路由
│   ├── admin/roles.js        # 角色管理路由
│   ├── admin/logs.js         # 日志查询路由
│   ├── admin/config.js       # 系统配置路由
│   └── admin/upload.js       # 文件上传路由
├── controllers/
│   ├── mobile/authController.js
│   ├── mobile/homepageController.js
│   ├── admin/authController.js
│   ├── admin/roleController.js
│   ├── admin/logController.js
│   ├── admin/configController.js
│   └── admin/uploadController.js
├── services/
│   └── emailService.js       # 邮件发送+验证码
├── database/
│   └── init.js               # 建表+种子数据
└── utils/
    ├── response.js           # 统一响应封装
    └── AppError.js           # 自定义错误类
```

## 3. 核心中间件说明

| 中间件 | 职责 |
|--------|------|
| `authenticateToken` | 校验用户端JWT，设置 `req.user` |
| `authenticateAdmin` | 校验管理员JWT，检查type=admin，设置 `req.admin` |
| `checkPermission(...)` | 查库获取角色权限，super_admin跳过，其他匹配权限点 |
| `logOperation(module, action)` | 拦截res.json，异步写入operation_logs |
| `validate` | 使用express-validator结果，返回400 |
| `errorHandler` | 统一错误格式，区分业务错误/系统错误/数据库错误 |

## 4. 接口契约定义

### 统一响应格式
```json
{ "code": 200, "msg": "操作成功", "data": {} }
```

### 分页响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "list": [],
    "pagination": { "total": 0, "page": 1, "pageSize": 20, "totalPages": 0 }
  }
}
```

### 用户端认证接口
| 方法 | 路径 | 请求体 | 响应 |
|------|------|--------|------|
| POST | /api/mobile/auth/send-code | `{email, type}` | `{code:200}` |
| POST | /api/mobile/auth/register | `{email, code, password, confirmPassword}` | `{token, refreshToken, userInfo}` |
| POST | /api/mobile/auth/login | `{email, password}` | `{token, refreshToken, userInfo}` |
| POST | /api/mobile/auth/reset-password | `{email, code, newPassword, confirmPassword}` | `{code:200}` |
| GET | /api/mobile/auth/profile | - | `{id, email, ...}` |

### 管理员认证接口
| 方法 | 路径 | 请求体 | 响应 |
|------|------|--------|------|
| POST | /api/admin/auth/login | `{username, password}` | `{token, refreshToken, adminInfo}` |
| GET | /api/admin/auth/info | - | `{id, username, permissions, ...}` |
| POST | /api/admin/auth/change-password | `{oldPassword, newPassword}` | `{code:200}` |

### 角色管理接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/roles | 角色列表（分页+关键词搜索） |
| GET | /api/admin/roles/:id | 角色详情 |
| POST | /api/admin/roles | 创建角色 |
| PUT | /api/admin/roles/:id | 更新角色（含权限） |
| DELETE | /api/admin/roles/:id | 删除角色（系统内置不可删） |

### 其他接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/logs | 操作日志列表 |
| GET | /api/admin/logs/modules | 模块列表 |
| GET | /api/admin/logs/:id | 日志详情 |
| GET | /api/admin/config | 配置列表 |
| GET | /api/admin/config/categories | 配置分类 |
| PUT | /api/admin/config/:id | 更新单项配置 |
| PUT | /api/admin/config/batch | 批量更新 |
| GET/PUT | /api/admin/config/email | 邮箱配置 |
| POST | /api/admin/config/email/test | 测试发信 |
| POST | /api/admin/upload/image | 图片上传 |
| POST | /api/admin/upload/banner | Banner上传 |
| GET | /api/mobile/homepage/splash-ad | 开屏广告配置 |
| GET | /api/mobile/content/:key | 内容页 |
| GET | /api/mobile/health | 健康检查 |

## 5. 数据库表结构设计

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED AUTO_INCREMENT | 主键 |
| email | VARCHAR(255) UNIQUE | 邮箱 |
| password | VARCHAR(255) | bcrypt加密密码 |
| nickname | VARCHAR(100) | 昵称 |
| avatar | VARCHAR(500) | 头像 |
| real_name | VARCHAR(100) | 真实姓名 |
| kyc_status | ENUM | none/pending/approved/rejected |
| risk_level | ENUM | none/conservative/moderate/aggressive/professional |
| account_type | ENUM | real/demo |
| account_status | ENUM | active/frozen |
| two_factor_enabled | TINYINT | 2FA状态 |
| login_count | INT | 登录次数 |
| last_login_at | DATETIME | 最后登录 |
| created_at/updated_at | DATETIME | 时间戳 |

### admins 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| username | VARCHAR(100) UNIQUE | 用户名 |
| password | VARCHAR(255) | 密码 |
| real_name | VARCHAR(100) | 姓名 |
| email | VARCHAR(255) | 邮箱 |
| role_id | INT UNSIGNED | 角色外键 |
| status | TINYINT | 启用/禁用 |

### roles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| name | VARCHAR(50) UNIQUE | 角色标识 |
| display_name | VARCHAR(100) | 显示名称 |
| permissions | JSON | 权限点数组 |
| is_system | TINYINT | 是否系统内置 |
| status | TINYINT | 状态 |

### operation_logs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED | 主键 |
| admin_id | INT UNSIGNED | 操作人 |
| module | VARCHAR(100) | 模块 |
| action | VARCHAR(100) | 操作 |
| content | TEXT | 操作内容JSON |
| ip | VARCHAR(50) | IP地址 |
| status | ENUM | success/fail |

### system_config 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| config_key | VARCHAR(100) UNIQUE | 配置键 |
| config_value | TEXT | 配置值 |
| config_type | ENUM | string/number/boolean/text/image |
| category | VARCHAR(50) | 分类 |
| label | VARCHAR(200) | 显示标签 |

## 6. 异常处理策略

| 异常类型 | 处理方式 |
|----------|----------|
| 参数校验失败 | 返回 400 + 首条错误信息 |
| 认证失败 | 返回 401 |
| 权限不足 | 返回 403 |
| 资源不存在 | 返回 404 |
| 数据库唯一约束冲突 | 返回 400 "数据已存在" |
| 文件大小超限 | 返回 400 |
| 服务器内部错误 | 返回 500，开发模式返回详情 |
| 未捕获异常 | 全局捕获 + 记录日志 + 不崩溃 |
| Promise拒绝 | 全局捕获 + 记录日志 |
