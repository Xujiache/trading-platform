# ALIGNMENT - 阶段一：基础设施、鉴权、配置体系、公共组件

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **1.4 当前系统基线**：技术栈定义（Express + MySQL2 + Redis + JWT + WebSocket）
- **4. 角色与权限模型**：用户端角色体系 + 后台 RBAC 权限模型
- **6.2 启动与认证模块**：开屏页、登录、注册、找回密码
- **7.6 系统管理模块**：角色管理、操作日志、系统配置、邮箱配置、个人中心
- **8.2.1 后台认证**：`/api/admin/auth` 域
- **8.1.1 认证域**：`/api/mobile/auth` 域
- **8.2.3 角色管理**：`/api/admin/roles` 域
- **8.2.4 日志管理**：`/api/admin/logs` 域
- **8.2.5 系统配置**：`/api/admin/config` 域
- **9.1 账户与认证规则**
- **10.6 系统稳定性要求**
- **12.2 安全**：JWT 鉴权、权限校验、密码加密

## 2. 需求边界

### 2.1 本阶段范围内
- 项目工程初始化（三端：UniApp用户端、Vue3管理后台、Node.js后端）
- 数据库（MySQL2）连接与基础表结构
- Redis 连接与基础缓存能力
- JWT 鉴权体系（token + refreshToken）
- 用户端：注册、登录、找回密码、发送邮箱验证码
- 后台：管理员登录、获取信息、修改密码
- RBAC 权限体系（菜单级、页面级、按钮级、API级）
- 角色管理 CRUD
- 操作日志记录与查询
- 系统配置 CRUD（含分类：system/trade/fund/risk/email/security）
- 邮箱 SMTP 配置与测试发信
- 后台个人中心
- 公共组件（请求封装、错误处理、路由守卫、权限指令等）
- 全局异常捕获、Promise 拒绝日志、优雅停机
- 文件上传基础能力

### 2.2 本阶段范围外
- 行情服务、WebSocket
- 交易引擎、订单
- 资金模块
- KYC、风控
- 消息、公告、帮助、工单、客服
- 运营管理（活动、Banner、奖励卡片）

## 3. 技术栈约束

| 端 | 技术栈 |
|----|--------|
| 用户端 | UniApp + Vue3 + ECharts |
| 管理后台 | Vue3 + TypeScript + Vite + Element Plus + TailwindCSS（Art Design Pro） |
| 后端 | Express + MySQL2 + Redis + JWT |

## 4. 需求理解

### 4.1 认证体系
- 用户端以邮箱为唯一登录标识
- 注册与找回密码均依赖邮箱验证码（业务类型区分 `register` / `reset_password`）
- 登录成功后保存 token、refreshToken、userInfo、accountType
- 密码规则：8-20位，包含大小写字母和数字
- 后台管理员独立认证体系

### 4.2 权限模型
- 后台需支持菜单级、页面级、操作按钮级、API 权限校验
- 系统内置角色与自定义角色并存
- 已有权限点：`user:manage`、`trade:manage`、`fund:manage`、`risk:manage`、`admin:manage`、`data:export`、`system:audit`、`system:config`

### 4.3 系统配置
- 配置分类：system、trade、fund、risk、email、security
- 支持字符串/数字/布尔/多行文本/二维码图片字段编辑
- 邮箱配置：SMTP服务器/端口/SSL/账号/密码/发件人/测试发信

### 4.4 核心数据实体（本阶段）
- `users` 用户表
- `admins` 管理员表
- `roles` 角色表
- `operation_logs` 操作日志表
- `system_config` 系统配置表

## 5. 疑问澄清

> 以下问题需在开发前确认：

- [ ] Art Design Pro 体系的具体版本与模板来源？
- [ ] 邮箱验证码有效期和发送频率限制？
- [ ] refreshToken 的刷新策略和过期时间？
- [ ] 角色权限点的完整清单是否仅限 PRD 中列出的8个？
- [ ] 文件上传存储方案（本地/OSS）？
- [ ] 数据库字符集与排序规则要求？

## 6. 接口清单

### 用户端认证 `/api/mobile/auth`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /send-code | 发送邮箱验证码 |
| POST | /register | 注册 |
| POST | /login | 登录 |
| POST | /reset-password | 重置密码 |
| GET | /profile | 获取当前用户资料 |

### 后台认证 `/api/admin/auth`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /login | 管理员登录 |
| GET | /info | 获取管理员信息 |
| POST | /change-password | 修改密码 |

### 角色管理 `/api/admin/roles`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /roles | 角色列表 |
| GET | /roles/:id | 角色详情 |
| POST | /roles | 创建角色 |
| PUT | /roles/:id | 更新角色 |
| DELETE | /roles/:id | 删除角色 |

### 日志管理 `/api/admin/logs`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /logs | 日志列表 |
| GET | /logs/modules | 模块列表 |
| GET | /logs/:id | 日志详情 |

### 系统配置 `/api/admin/config`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /config | 配置列表 |
| GET | /config/categories | 配置分类 |
| PUT | /config/batch | 批量更新 |
| GET | /config/email | 邮箱配置 |
| PUT | /config/email | 更新邮箱配置 |
| POST | /config/email/test | 测试发信 |
| PUT | /config/:id | 更新单项配置 |

### 文件上传 `/api/admin/upload`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /upload/image | 通用图片上传 |
| POST | /upload/banner | Banner图片上传 |
