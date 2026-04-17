# ALIGNMENT - 阶段五：KYC、风控、消息、公告、帮助、工单、客服

## 1. 原始需求引用

本阶段对应 PRD 以下章节：
- **6.7.2 实名认证页**：KYC 提交与状态展示
- **6.7.5 风险测评页**：风险问卷与等级
- **6.7.7 两步验证页**：Google Authenticator 2FA
- **6.7.9 消息中心页**：系统/交易/资金/公告消息
- **6.7.10-6.7.11 帮助中心**：帮助列表与详情
- **6.7.12-6.7.14 工单系统**：工单列表/创建/详情
- **6.7.15-6.7.18 内容页**：关于我们/协议/隐私/公告详情
- **6.7.19 在线客服页**：即时会话
- **7.3 交易用户管理**：用户列表、KYC审核、用户详情
- **7.4.5 风控管理**：风控参数/预警/强平/高风险/AML
- **7.4.7 消息通知**：消息列表/公告管理
- **7.4.8 工单帮助**：工单管理/帮助文档
- **7.5 在线客服模块**：会话管理/管理员管理
- **8.1.2 用户域**：KYC/密码/2FA 等接口
- **8.1.6 风控域**：`/api/mobile/risk`
- **8.1.8-8.1.12 通知/公告/工单/帮助/活动域**
- **8.1.13 内容域**：CMS 内容页
- **8.1.15 在线客服域**
- **8.2.2 用户管理**：`/api/admin/users`
- **8.2.10 风控管理**：`/api/admin/risk`
- **8.2.12-8.2.13 消息公告/工单帮助**
- **8.2.18-8.2.19 在线客服/管理员管理**
- **9.2 KYC 规则**
- **9.5 风控规则**
- **9.7 内容与通知规则**

## 2. 需求边界

### 2.1 本阶段范围内

#### KYC 与用户管理
- KYC 资料提交（姓名/证件号/正反面/人脸照片）
- KYC 状态查询（none/pending/approved/rejected）
- 后台 KYC 审核（通过/驳回+原因）
- 后台用户列表（查询/冻结/解冻/重置密码）
- 后台用户详情页
- 风险测评问卷提交与结果展示
- 2FA Google Authenticator（查看状态/生成密钥/启用/关闭）

#### 风控模块
- 风控参数配置（预警线/强平线/最大杠杆/最大手数）
- 风险预警列表与处理
- 强平记录查看
- 管理员手动强平
- 高风险账户监控
- AML 大额/可疑交易记录
- 用户端风险预警与保证金状态查询

#### 消息与公告
- 用户端消息中心（全部/系统/交易/资金/公告分类）
- 未读数量/单条已读/全部已读
- 后台发送系统通知
- 后台公告 CRUD（富文本+图片）
- 用户端公告详情页

#### 帮助与工单
- 帮助文档列表（分类：交易规则/费用说明/出入金/FAQ）
- 帮助文档搜索与详情
- 后台帮助文档 CRUD
- 工单列表（状态筛选：待处理/处理中/已解决）
- 工单创建（分类：交易/资金/账户/技术/其他）
- 工单详情与客服回复
- 后台工单管理（查看/回复/关闭）

#### 在线客服
- 用户端获取/创建会话、发消息、拉历史、未读数
- 后台会话列表（待接入/进行中/已关闭）
- 后台接入会话/回复消息/关闭会话
- 后台管理员管理（CRUD/重置密码/删除保护）

#### 内容页
- 关于我们（CMS 富文本）
- 用户协议（CMS 或内置默认）
- 隐私政策（CMS 或内置默认）

#### 用户端页面（本阶段）
- `pages/mine/kyc`
- `pages/mine/risk-assessment`
- `pages/mine/two-factor`
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

#### 后台页面（本阶段）
- `/trading-user/list`
- `/trading-user/kyc-review`
- `/trading-user/detail/:id`
- `/trading/risk`
- `/trading/notification`
- `/trading/ticket`
- `/chat/conversations`
- `/chat/admin-manage`

### 2.2 本阶段范围外
- 活动管理（阶段六）
- Banner/奖励卡片/开屏广告（阶段六）
- 批量处理/导出（阶段七）

## 3. 需求理解

### 3.1 KYC
- 提交材料：姓名、证件号、身份证正反面、人脸照片（face_photo）
- 状态：none → pending → approved / rejected
- 驳回需填写用户可见原因
- 后台可在列表页和详情页双入口完成审核

### 3.2 风控
- 后台配置预警线 `warningLine` 和强平线 `forceCloseLine`
- 风险预警列表：处理/忽略/关闭
- 强平记录：系统/手动，含原因/触发类型/价格/盈亏
- 管理员手动强平指定用户
- 高风险账户监控列表
- AML 大额/可疑交易记录

### 3.3 风险测评
- 等级：none / conservative / moderate / aggressive / professional
- 问卷提交与结果展示

### 3.4 消息通知
- 分类：全部/系统/交易/资金/公告
- 支持未读数、单条已读、全部已读
- 公告跳转详情页

### 3.5 在线客服
- 会话状态：waiting / active / closed
- 用户端：获取/创建会话 → 拉历史 → 发消息 → 轮询未读
- 后台：会话列表 → 接入 → 回复 → 关闭

### 3.6 核心数据实体（本阶段）
- `risk_alerts` 风险预警表
- `force_close_records` 强平记录表
- `announcements` 公告表
- `notifications` 站内消息表
- `help_docs` 帮助文档表
- `tickets` 工单表
- `chat_conversations` 客服会话表
- `chat_messages` 聊天消息表

## 4. 疑问澄清

- [x] 风险测评问卷题目内容是固定还是后台可配？ → **固定5道题，前端内置**
- [x] 强平引擎自动巡检定时任务是否在本阶段实现？ → **是，集成在 floatingPnlUpdater 中**
- [x] 在线客服是否需要 WebSocket 实时推送还是轮询？ → **采用 HTTP 轮询（3秒间隔）**
- [x] 帮助文档是否支持多语言？ → **本阶段不支持**

## 5. 接口清单

### 用户域 `/api/mobile/user`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /kyc/upload | 上传KYC图片 |
| POST | /kyc/submit | 提交KYC |
| GET | /kyc/status | KYC状态 |
| POST | /change-password | 修改登录密码 |
| POST | /trade-password | 设置交易密码 |
| POST | /fund-password | 设置资金密码 |
| PUT | /profile | 更新资料 |
| POST | /switch-account | 切换账户类型 |
| POST | /risk-assessment | 提交风险测评 |
| GET | /risk-assessment | 获取测评结果 |
| GET | /2fa/status | 2FA状态 |
| POST | /2fa/generate | 生成2FA密钥 |
| POST | /2fa/enable | 启用2FA |
| POST | /2fa/disable | 关闭2FA |

### 风控域 `/api/mobile/risk`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /alerts | 我的风险预警 |
| GET | /margin-status | 保证金状态 |

### 通知域 `/api/mobile/notification`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /list | 消息列表 |
| GET | /unread-count | 未读数量 |
| POST | /:id/read | 标记已读 |
| POST | /read-all | 全部已读 |

### 公告域 `/api/mobile/announcement`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /list | 公告列表 |
| GET | /:id | 公告详情 |

### 工单域 `/api/mobile/ticket`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | / | 创建工单 |
| GET | /list | 工单列表 |
| GET | /:id | 工单详情 |

### 帮助域 `/api/mobile/help`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /list | 帮助列表 |
| GET | /search | 搜索 |
| GET | /:id | 帮助详情 |

### 内容域 `/api/mobile/content`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /:key | 获取内容（about_us/user_agreement/privacy_policy/risk_warning） |

### 在线客服 `/api/mobile/chat`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /conversation | 获取/创建会话 |
| GET | /messages | 消息列表 |
| POST | /send | 发送消息 |
| GET | /unread | 未读数 |

### 后台用户管理 `/api/admin/users`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 用户列表 |
| GET | /users/:id | 用户详情 |
| POST | /users/:id/kyc-review | KYC审核 |
| POST | /users/:id/toggle-status | 冻结/解冻 |
| POST | /users/:id/reset-password | 重置密码 |

### 后台风控 `/api/admin/risk`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /risk/config | 风控参数 |
| PUT | /risk/config | 更新参数 |
| GET | /risk/alerts | 预警列表 |
| POST | /risk/alerts/:id/process | 处理预警 |
| GET | /risk/force-close | 强平记录 |
| POST | /risk/force-close/:userId | 手动强平 |
| GET | /risk/monitor | 高风险监控 |
| GET | /risk/aml | AML记录 |

### 后台消息公告
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /notification/list | 通知列表 |
| POST | /notification/send | 发送通知 |
| GET | /announcement/list | 公告列表 |
| POST | /announcement | 创建公告 |
| PUT | /announcement/:id | 编辑公告 |
| DELETE | /announcement/:id | 删除公告 |

### 后台工单帮助
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /ticket/list | 工单列表 |
| GET | /ticket/:id | 工单详情 |
| POST | /ticket/:id/reply | 回复工单 |
| PUT | /ticket/:id/close | 关闭工单 |
| GET | /help/list | 帮助列表 |
| POST | /help | 创建帮助 |
| PUT | /help/:id | 编辑帮助 |
| DELETE | /help/:id | 删除帮助 |

### 后台在线客服
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /chat/conversations | 会话列表 |
| GET | /chat/messages/:id | 消息列表 |
| POST | /chat/send | 发送消息 |
| POST | /chat/assign | 接入会话 |
| POST | /chat/close | 关闭会话 |
| GET | /chat/unread | 未读数 |

### 后台管理员管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admins | 管理员列表 |
| POST | /admins | 新增管理员 |
| PUT | /admins/:id | 编辑管理员 |
| DELETE | /admins/:id | 删除管理员 |
