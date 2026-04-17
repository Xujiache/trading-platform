# 黄金白银石油交易系统

面向贵金属与能源 CFD 场景的多端协同交易系统。核心交易标的：黄金（XAUUSD）、白银（XAGUSD）、原油（USOUSD / UKOUSD），并支持外汇品种扩展。

项目覆盖行情、交易、资金、风控、报表、公告、帮助、工单、在线客服与后台运营管理的完整业务闭环，是一次严格对齐现网能力、可上线交付的 1:1 复刻实现。

---

## 技术栈

| 端 | 技术栈 |
|----|--------|
| 用户端（UniApp App + H5） | UniApp + Vue3 + ECharts |
| 管理后台 | Vue3 + TypeScript + Vite + Element Plus + TailwindCSS（Art Design Pro） |
| 后端 | Express + MySQL2 + Redis(ioredis) + JWT + WebSocket |
| 行情 | HTTP + WebSocket 实时推送 + K 线聚合服务 + 可切换行情源（真实 API / 自控模拟 / 混合） |
| 交易引擎 | 市价单、挂单、止损止盈、移动止损、浮动盈亏、隔夜费、强平，Redis 分布式锁 + MySQL 事务 |

---

## 目录结构

```
trading-platform/
├── 服务端/              正式使用的后端 (Express)
├── 管理后台/            Vue3 管理后台 (Art Design Pro)
├── app和h5端/           UniApp / uvue 源码 (App 原生)
├── h5-build/           H5 构建工程 (uni-h5)
├── docs/                7 个阶段开发文档 (ALIGNMENT / CONSENSUS / DESIGN / TASK / ACCEPTANCE / FINAL / TODO)
├── .cursor/             Cursor 规则与 MCP 本地配置
├── 说明文档.md           项目总说明
├── 重开发PRD-*.md        完整重开发 PRD (1:1 复刻基准)
└── README.md            本文件
```

---

## 快速启动

### 环境要求
- Node.js >= 16（推荐 20+）
- MySQL 5.7+ / 8.0+
- Redis 5+

### 后端（服务端/）

```bash
cd 服务端
npm install
cp .env.example .env           # 按本地环境修改 DB / Redis / JWT / SMTP
npm run db:init                # 初始化表结构 + 种子数据（幂等）
npm run generate-kline         # 可选：生成 10 个默认品种的历史 K 线
npm start                      # 或 npm run dev（nodemon）
```

默认端口 `3002`（可在 `.env` 修改），提供：
- HTTP API: `http://localhost:3002/api/mobile/*` 和 `/api/admin/*`
- WebSocket 行情: `ws://localhost:3002/ws/market`

默认管理员账号：`admin / admin123`（**生产环境请立即修改**）。

### 管理后台（管理后台/）

```bash
cd 管理后台
pnpm install        # 或 npm install
pnpm dev            # 开发模式 (带 Vite 代理到后端)
pnpm build          # 构建产物到 dist/
```

开发模式下通过 `vite.config.ts` 的代理把 `/api/*` 转发到后端。生产部署用 Nginx 反向代理。

### H5（h5-build/）

```bash
cd h5-build
npm install
npm run dev:h5      # 开发模式
npm run build:h5    # 构建到 dist/build/h5
```

### App（app和h5端/）

使用 HBuilderX 打开 `app和h5端/` 目录，按标准 UniApp 打包 APK / IPA。

---

## 核心模块

- **行情服务**（[服务端/src/services/marketDataService.js](服务端/src/services/marketDataService.js)）：每品种可切换 `real` 外部真实行情 / `custom` 自控模拟 / `hybrid` 混合模式，由 `price_source` 字段决定数据源
- **自定义价格模拟引擎**（[服务端/src/services/customPriceEngine.js](服务端/src/services/customPriceEngine.js)）：Ornstein-Uhlenbeck + 趋势漂移 + 软边界反弹，支持中枢、区间、趋势、波动、tick 间隔的管理后台实时热加载
- **交易引擎**（[服务端/src/services/tradeEngine.js](服务端/src/services/tradeEngine.js)）：市价 / 挂单 / 平仓 / 改价，Redis 分布式锁保证并发安全
- **费用计算**（[服务端/src/services/feeCalculator.js](服务端/src/services/feeCalculator.js)）：保证金、点差成本、按手 / 按比例手续费、隔夜费（含周三倍数 / 假日倍数）、浮动盈亏 / 净盈亏
- **风控**（[服务端/src/services/floatingPnlUpdater.js](服务端/src/services/floatingPnlUpdater.js)）：3 秒更新浮盈 + 预警线 / 强平线自动生成预警和系统强平
- **资金审核**（[服务端/src/services/fundService.js](服务端/src/services/fundService.js)）：入金 / 出金人工审核、手续费扣减、资金流水、多种收款方式（微信 / 支付宝 / USDT-TRC20）
- **KYC / 工单 / 客服**：完整的身份认证流程、工单往返、在线客服会话
- **审计日志** + **系统监控** + **CSV 导出** + **批量操作**

---

## 开发文档

每个阶段都有 7 份标准工作流文档在 [docs/](docs) 下，详见：
- ALIGNMENT — 需求对齐
- CONSENSUS — 验收共识
- DESIGN — 架构/接口设计
- TASK — 原子任务拆分
- ACCEPTANCE — 验收记录
- FINAL — 阶段总结
- TODO — 遗留事项

完整产品需求见根目录 [重开发PRD-黄金白银石油交易系统（1比1复刻版）.md](重开发PRD-黄金白银石油交易系统（1比1复刻版）.md)，开发进度记录见 [说明文档.md](说明文档.md)。

---

## 安全与部署备注

- **绝不要** 把 `服务端/.env` 提交到仓库（已在 `.gitignore`）
- JWT Secret、SMTP 密码、DB 密码生产环境必须用强值
- 首次部署后立即修改 `admin/admin123` 默认密码
- 管理后台应放在管理员专用域名 / IP 白名单后面
- 行情外部 API Key 如需收费服务，请填在 `integrations` 表而非代码
