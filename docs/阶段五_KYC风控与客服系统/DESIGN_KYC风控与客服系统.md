# DESIGN - 阶段五：KYC、风控、消息、公告、帮助、工单、客服

## 1. 整体架构图

```
用户端(App/H5)                    管理后台(Vue3)
    │                                  │
    ├── KYC提交/查询                    ├── 用户列表/详情/KYC审核
    ├── 2FA管理                        ├── 风控中心(5个Tab)
    ├── 风险测评                        ├── 消息公告管理
    ├── 消息中心                        ├── 工单帮助管理
    ├── 帮助中心                        ├── 在线客服会话
    ├── 工单系统                        └── 管理员管理
    ├── 在线客服
    └── 个人中心
           │
    ───────┼───────
           │
    服务端(Node.js/Express)
    ├── /api/mobile/user     (KYC/2FA/密码/资料)
    ├── /api/mobile/risk     (预警/保证金)
    ├── /api/mobile/notification  (消息)
    ├── /api/mobile/announcement  (公告)
    ├── /api/mobile/help     (帮助)
    ├── /api/mobile/ticket   (工单)
    ├── /api/mobile/chat     (客服)
    ├── /api/admin/users     (用户管理)
    ├── /api/admin/risk      (风控管理)
    ├── /api/admin/notification   (消息公告)
    ├── /api/admin/ticket    (工单帮助)
    ├── /api/admin/chat      (客服)
    └── /api/admin/admins    (管理员)
           │
    ───────┼───────
           │
    MySQL (8张新表)
    ├── risk_alerts          (风险预警)
    ├── force_close_records  (强平记录)
    ├── announcements        (公告)
    ├── notifications        (站内消息)
    ├── help_docs            (帮助文档)
    ├── tickets              (工单)
    ├── chat_conversations   (客服会话)
    └── chat_messages        (聊天消息)
```

## 2. 分层设计

- **路由层**：Express Router 直接处理请求，简单逻辑在路由内完成
- **服务层**：复杂业务（交易/强平）通过 tradeEngine、floatingPnlUpdater 等服务处理
- **数据层**：MySQL 直接 SQL 查询，无 ORM

## 3. 核心组件

- **floatingPnlUpdater** - 集成保证金预警检测和系统自动强平
- **tradeEngine** - 集成风控参数校验（最大杠杆、单品种最大持仓）
- **mobile/user.js** - KYC/2FA/密码/资料/风险测评等用户域接口
- **admin/risk.js** - 风控参数配置/预警管理/强平操作/监控/AML
- **admin/notification.js** - 消息通知+公告CRUD（发布自动通知用户）
- **admin/ticket.js** - 工单管理+帮助文档CRUD

## 4. 模块依赖关系

- 风控预警生成 → floatingPnlUpdater → risk_alerts + force_close_records
- 风控参数校验 → tradeEngine → system_config(category=risk)
- 公告发布 → admin/notification.js → announcements + notifications
- 在线客服 → chat_conversations + chat_messages (HTTP轮询)

## 5. 接口契约定义

详见 ALIGNMENT 文档的接口清单

## 6. 异常处理策略

| 异常类型 | 处理方式 |
|----------|----------|
| KYC 重复提交 | approved 状态不可重新提交，pending 状态提示等待 |
| 2FA 验证码错误 | 返回错误，window=2 容错 |
| 工单已关闭 | 不可再回复 |
| 会话已关闭 | 不可再发消息 |
| 强平失败 | 记录日志，逐单处理，单单独立 |
| 超管保护 | 不可删除/禁用超级管理员 |

## 7. 数据库表结构设计

已在 `服务端/src/database/init.js` 中实现，共8张新表：
- `risk_alerts` 风险预警表（alert_type/level/status/margin_ratio等）
- `force_close_records` 强平记录表（trigger_type/margin_ratio/close_price/realized_pnl等）
- `announcements` 公告表（title/content/cover_image/status/is_top等）
- `notifications` 站内消息表（type/title/content/is_read/ref_type/ref_id等）
- `help_docs` 帮助文档表（category/status/sort_order等）
- `tickets` 工单表（ticket_no/category/status/priority/reply_content等）
- `chat_conversations` 客服会话表（status/last_message/user_unread/admin_unread等）
- `chat_messages` 聊天消息表（sender_type/content/msg_type/is_read等）
