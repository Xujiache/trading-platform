const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config');

const tables = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) DEFAULT '',
    avatar VARCHAR(500) DEFAULT '',
    real_name VARCHAR(100) DEFAULT '',
    id_card VARCHAR(50) DEFAULT '',
    kyc_status ENUM('none','pending','approved','rejected') DEFAULT 'none',
    kyc_reject_reason VARCHAR(500) DEFAULT '',
    kyc_front_image VARCHAR(500) DEFAULT '',
    kyc_back_image VARCHAR(500) DEFAULT '',
    kyc_face_image VARCHAR(500) DEFAULT '',
    kyc_submitted_at DATETIME DEFAULT NULL,
    kyc_reviewed_at DATETIME DEFAULT NULL,
    risk_level ENUM('none','conservative','moderate','aggressive','professional') DEFAULT 'none',
    account_type ENUM('real','demo') DEFAULT 'real',
    account_status ENUM('active','frozen') DEFAULT 'active',
    freeze_reason VARCHAR(500) DEFAULT '',
    user_level INT DEFAULT 1,
    two_factor_enabled TINYINT(1) DEFAULT 0,
    two_factor_secret VARCHAR(255) DEFAULT '',
    trade_password VARCHAR(255) DEFAULT '',
    fund_password VARCHAR(255) DEFAULT '',
    login_count INT DEFAULT 0,
    last_login_at DATETIME DEFAULT NULL,
    last_login_ip VARCHAR(50) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_kyc_status (kyc_status),
    INDEX idx_account_status (account_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500) DEFAULT '',
    permissions JSON DEFAULT NULL,
    is_system TINYINT(1) DEFAULT 0,
    status TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    avatar VARCHAR(500) DEFAULT '',
    role_id INT UNSIGNED NOT NULL,
    status TINYINT(1) DEFAULT 1,
    last_login_at DATETIME DEFAULT NULL,
    last_login_ip VARCHAR(50) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role_id (role_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED DEFAULT NULL,
    admin_username VARCHAR(100) DEFAULT '',
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    content TEXT DEFAULT NULL,
    ip VARCHAR(50) DEFAULT '',
    user_agent TEXT DEFAULT NULL,
    status ENUM('success','fail') DEFAULT 'success',
    error_message TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS system_config (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT DEFAULT '',
    config_type ENUM('string','number','boolean','text','image') DEFAULT 'string',
    category VARCHAR(50) NOT NULL DEFAULT 'system',
    label VARCHAR(200) DEFAULT '',
    description VARCHAR(500) DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_config_key (config_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS trading_symbols (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '品种代码',
    name VARCHAR(100) NOT NULL COMMENT '品种名称',
    category ENUM('precious_metal','energy','forex') NOT NULL COMMENT '品种分类',
    status ENUM('active','inactive') DEFAULT 'active' COMMENT '品种状态',
    is_hot TINYINT(1) DEFAULT 0 COMMENT '是否热门',
    contract_unit VARCHAR(50) DEFAULT NULL COMMENT '合约单位',
    min_lot DECIMAL(10,4) DEFAULT 0.0100 COMMENT '最小手数',
    max_lot DECIMAL(10,4) DEFAULT 100.0000 COMMENT '最大手数',
    lot_step DECIMAL(10,4) DEFAULT 0.0100 COMMENT '手数步进',
    min_leverage INT DEFAULT 1 COMMENT '最小杠杆',
    max_leverage INT DEFAULT 200 COMMENT '最大杠杆',
    price_decimals INT DEFAULT 2 COMMENT '价格小数位数',
    tick_value DECIMAL(20,8) DEFAULT 0.01000000 COMMENT '每跳价值',
    tick_size DECIMAL(20,8) DEFAULT 0.01000000 COMMENT '最小变动单位',
    spread_mode ENUM('fixed','float') DEFAULT 'fixed' COMMENT '点差模式',
    spread_fixed DECIMAL(10,4) DEFAULT 0.0000 COMMENT '固定点差值',
    spread_min DECIMAL(10,4) DEFAULT 0.0000 COMMENT '最小点差',
    spread_max DECIMAL(10,4) DEFAULT 0.0000 COMMENT '最大点差',
    fee_mode ENUM('one_side','both_side') DEFAULT 'both_side' COMMENT '手续费模式',
    fee_type ENUM('per_lot','percentage') DEFAULT 'per_lot' COMMENT '手续费类型',
    fee_value DECIMAL(10,4) DEFAULT 0.0000 COMMENT '手续费费率',
    swap_long_rate DECIMAL(10,6) DEFAULT 0.000000 COMMENT '多单隔夜费率',
    swap_short_rate DECIMAL(10,6) DEFAULT 0.000000 COMMENT '空单隔夜费率',
    swap_wednesday_multiplier INT DEFAULT 3 COMMENT '周三隔夜费倍数',
    swap_holiday_multiplier INT DEFAULT 1 COMMENT '假日隔夜费倍数',
    max_position DECIMAL(10,2) DEFAULT 1000.00 COMMENT '最大持仓手数',
    max_slippage DECIMAL(10,4) DEFAULT 0.0000 COMMENT '最大滑点',
    trading_hours JSON DEFAULT NULL COMMENT '交易时间配置',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    description TEXT DEFAULT NULL COMMENT '品种描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易品种表'`,

  `CREATE TABLE IF NOT EXISTS kline_data (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL COMMENT '品种代码',
    period ENUM('1m','5m','15m','30m','1h','4h','1d','1w','1M') NOT NULL COMMENT 'K线周期',
    open_time DATETIME NOT NULL COMMENT '开盘时间',
    open_price DECIMAL(20,8) NOT NULL COMMENT '开盘价',
    high_price DECIMAL(20,8) NOT NULL COMMENT '最高价',
    low_price DECIMAL(20,8) NOT NULL COMMENT '最低价',
    close_price DECIMAL(20,8) NOT NULL COMMENT '收盘价',
    volume DECIMAL(20,4) DEFAULT 0.0000 COMMENT '成交量',
    close_time DATETIME DEFAULT NULL COMMENT '收盘时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_symbol_period_time (symbol, period, open_time),
    INDEX idx_symbol (symbol),
    INDEX idx_period (period),
    INDEX idx_open_time (open_time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K线数据表'`,

  `CREATE TABLE IF NOT EXISTS price_alerts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    symbol VARCHAR(20) NOT NULL COMMENT '品种代码',
    alert_type ENUM('price_above','price_below','change_percent') NOT NULL COMMENT '预警类型',
    target_value DECIMAL(20,8) NOT NULL COMMENT '目标值',
    notify_method ENUM('push','email') DEFAULT 'push' COMMENT '通知方式',
    status ENUM('active','triggered','disabled') DEFAULT 'active' COMMENT '预警状态',
    triggered_at DATETIME DEFAULT NULL COMMENT '触发时间',
    triggered_price DECIMAL(20,8) DEFAULT NULL COMMENT '触发时价格',
    note VARCHAR(200) DEFAULT NULL COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='价格预警表'`,

  `CREATE TABLE IF NOT EXISTS fund_accounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    account_type ENUM('real','demo') NOT NULL DEFAULT 'demo' COMMENT '账户类型',
    balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '账户余额',
    frozen_margin DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '已用保证金(冻结)',
    floating_pnl DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '浮动盈亏',
    total_deposit DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '累计入金',
    total_withdraw DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '累计出金',
    total_commission DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '累计手续费',
    total_swap DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '累计隔夜费',
    total_profit DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '累计盈亏',
    status ENUM('active','frozen') DEFAULT 'active' COMMENT '账户状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_type (user_id, account_type),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金账户表'`,

  `CREATE TABLE IF NOT EXISTS trade_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    account_type ENUM('real','demo') NOT NULL DEFAULT 'demo' COMMENT '账户类型',
    symbol VARCHAR(20) NOT NULL COMMENT '品种代码',
    direction ENUM('buy','sell') NOT NULL COMMENT '交易方向',
    lots DECIMAL(10,4) NOT NULL COMMENT '手数',
    leverage INT NOT NULL DEFAULT 100 COMMENT '杠杆倍数',
    open_price DECIMAL(20,8) NOT NULL COMMENT '开仓价格',
    close_price DECIMAL(20,8) DEFAULT NULL COMMENT '平仓价格',
    stop_loss DECIMAL(20,8) DEFAULT NULL COMMENT '止损价',
    take_profit DECIMAL(20,8) DEFAULT NULL COMMENT '止盈价',
    trailing_stop DECIMAL(20,8) DEFAULT NULL COMMENT '移动止损距离(点数)',
    trailing_stop_price DECIMAL(20,8) DEFAULT NULL COMMENT '移动止损触发价',
    margin DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '保证金',
    commission DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '开仓手续费',
    commission_close DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '平仓手续费',
    swap_total DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '累计隔夜费',
    spread_cost DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '点差成本',
    floating_pnl DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '浮动盈亏',
    realized_pnl DECIMAL(20,4) DEFAULT NULL COMMENT '已实现盈亏',
    net_pnl DECIMAL(20,4) DEFAULT NULL COMMENT '净盈亏(扣费后)',
    status ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open' COMMENT '订单状态',
    close_type ENUM('manual','stop_loss','take_profit','admin','trailing_stop','force_close') DEFAULT NULL COMMENT '平仓方式',
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '开仓时间',
    closed_at DATETIME DEFAULT NULL COMMENT '平仓时间',
    comment VARCHAR(500) DEFAULT '' COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_status (status),
    INDEX idx_account_type (account_type),
    INDEX idx_opened_at (opened_at),
    INDEX idx_closed_at (closed_at),
    INDEX idx_user_status (user_id, status),
    INDEX idx_order_no (order_no)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易订单表'`,

  `CREATE TABLE IF NOT EXISTS pending_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '挂单号',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    account_type ENUM('real','demo') NOT NULL DEFAULT 'demo' COMMENT '账户类型',
    symbol VARCHAR(20) NOT NULL COMMENT '品种代码',
    direction ENUM('buy','sell') NOT NULL COMMENT '交易方向',
    pending_type ENUM('buy_limit','buy_stop','sell_limit','sell_stop') NOT NULL COMMENT '挂单类型',
    lots DECIMAL(10,4) NOT NULL COMMENT '手数',
    leverage INT NOT NULL DEFAULT 100 COMMENT '杠杆倍数',
    target_price DECIMAL(20,8) NOT NULL COMMENT '目标触发价格',
    stop_loss DECIMAL(20,8) DEFAULT NULL COMMENT '止损价',
    take_profit DECIMAL(20,8) DEFAULT NULL COMMENT '止盈价',
    trailing_stop DECIMAL(20,8) DEFAULT NULL COMMENT '移动止损距离',
    status ENUM('active','triggered','cancelled','expired') NOT NULL DEFAULT 'active' COMMENT '挂单状态',
    triggered_order_id BIGINT UNSIGNED DEFAULT NULL COMMENT '触发后生成的订单ID',
    triggered_at DATETIME DEFAULT NULL COMMENT '触发时间',
    expired_at DATETIME DEFAULT NULL COMMENT '过期时间',
    comment VARCHAR(500) DEFAULT '' COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_status (status),
    INDEX idx_pending_type (pending_type),
    INDEX idx_user_status (user_id, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挂单表'`,

  `CREATE TABLE IF NOT EXISTS trade_flows (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    account_type ENUM('real','demo') NOT NULL DEFAULT 'demo' COMMENT '账户类型',
    order_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
    flow_type ENUM('open','close','commission','swap','deposit','withdraw','bonus','adjust') NOT NULL COMMENT '流水类型',
    amount DECIMAL(20,4) NOT NULL COMMENT '金额(正入负出)',
    balance_before DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '变动前余额',
    balance_after DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '变动后余额',
    description VARCHAR(500) DEFAULT '' COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_flow_type (flow_type),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易流水表'`,

  `CREATE TABLE IF NOT EXISTS deposits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    deposit_no VARCHAR(32) NOT NULL UNIQUE COMMENT '入金单号',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    amount DECIMAL(20,4) NOT NULL COMMENT '入金金额',
    payment_method ENUM('wechat','alipay','usdt') NOT NULL COMMENT '支付方式',
    payment_ref VARCHAR(200) DEFAULT '' COMMENT '支付流水号/交易哈希',
    remark VARCHAR(500) DEFAULT '' COMMENT '用户备注',
    proof_image VARCHAR(500) DEFAULT '' COMMENT '凭证图片',
    status ENUM('pending','reviewing','completed','failed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
    admin_remark VARCHAR(500) DEFAULT '' COMMENT '审核备注',
    reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='入金申请表'`,

  `CREATE TABLE IF NOT EXISTS withdraws (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    withdraw_no VARCHAR(32) NOT NULL UNIQUE COMMENT '出金单号',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    amount DECIMAL(20,4) NOT NULL COMMENT '出金金额',
    fee DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '手续费',
    actual_amount DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '实际到账金额',
    withdraw_method ENUM('wechat','alipay','usdt') NOT NULL COMMENT '出金方式',
    bank_card_id BIGINT UNSIGNED DEFAULT NULL COMMENT '收款账户ID',
    account_name VARCHAR(200) DEFAULT '' COMMENT '收款账户名',
    account_no VARCHAR(200) DEFAULT '' COMMENT '收款账号/地址',
    qrcode_image VARCHAR(500) DEFAULT '' COMMENT '收款二维码图片',
    remark VARCHAR(500) DEFAULT '' COMMENT '用户备注',
    status ENUM('pending','reviewing','approved','processing','completed','rejected','cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
    admin_remark VARCHAR(500) DEFAULT '' COMMENT '审核/驳回备注',
    reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',
    completed_at DATETIME DEFAULT NULL COMMENT '打款完成时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_withdraw_method (withdraw_method),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出金申请表'`,

  `CREATE TABLE IF NOT EXISTS fund_flows (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    account_type ENUM('real','demo') NOT NULL DEFAULT 'real' COMMENT '账户类型',
    flow_type ENUM('deposit','withdraw','withdraw_fee','trade_pnl','commission','spread','swap','adjust','demo_init','margin_freeze','margin_release') NOT NULL COMMENT '流水类型',
    amount DECIMAL(20,4) NOT NULL COMMENT '金额(正入负出)',
    balance_before DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '变动前余额',
    balance_after DECIMAL(20,4) NOT NULL DEFAULT 0.0000 COMMENT '变动后余额',
    ref_type VARCHAR(50) DEFAULT '' COMMENT '关联类型(deposit/withdraw/order)',
    ref_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联ID',
    description VARCHAR(500) DEFAULT '' COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_flow_type (flow_type),
    INDEX idx_account_type (account_type),
    INDEX idx_ref (ref_type, ref_id),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金流水表'`,

  `CREATE TABLE IF NOT EXISTS bank_cards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    card_type ENUM('wechat','alipay','usdt') NOT NULL COMMENT '账户类型',
    account_name VARCHAR(200) DEFAULT '' COMMENT '账户名称/备注',
    account_no VARCHAR(200) DEFAULT '' COMMENT '账号/钱包地址',
    qrcode_image VARCHAR(500) DEFAULT '' COMMENT '收款二维码图片',
    is_default TINYINT(1) DEFAULT 0 COMMENT '是否默认',
    status TINYINT(1) DEFAULT 1 COMMENT '状态 1正常 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_card_type (card_type),
    INDEX idx_is_default (is_default)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收款账户表'`,

  `CREATE TABLE IF NOT EXISTS risk_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    alert_type ENUM('margin_warning','margin_danger','large_loss','abnormal_trade','large_transaction') NOT NULL COMMENT '预警类型',
    level ENUM('low','medium','high','critical') DEFAULT 'medium' COMMENT '预警级别',
    title VARCHAR(200) NOT NULL COMMENT '预警标题',
    content TEXT DEFAULT NULL COMMENT '预警详情',
    margin_ratio DECIMAL(10,4) DEFAULT NULL COMMENT '触发时保证金比例',
    status ENUM('pending','processed','ignored','closed') DEFAULT 'pending' COMMENT '处理状态',
    processed_by INT UNSIGNED DEFAULT NULL COMMENT '处理人ID',
    processed_at DATETIME DEFAULT NULL COMMENT '处理时间',
    process_remark VARCHAR(500) DEFAULT '' COMMENT '处理备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_status (status),
    INDEX idx_level (level),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风险预警表'`,

  `CREATE TABLE IF NOT EXISTS force_close_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    order_id BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
    trigger_type ENUM('system','manual') NOT NULL COMMENT '触发方式',
    trigger_reason VARCHAR(500) DEFAULT '' COMMENT '触发原因',
    margin_ratio DECIMAL(10,4) DEFAULT NULL COMMENT '触发时保证金比例',
    close_price DECIMAL(20,8) DEFAULT NULL COMMENT '平仓价格',
    realized_pnl DECIMAL(20,4) DEFAULT NULL COMMENT '已实现盈亏',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '操作管理员ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='强平记录表'`,

  `CREATE TABLE IF NOT EXISTS announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容(富文本)',
    cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图',
    status ENUM('draft','published','archived') DEFAULT 'draft' COMMENT '状态',
    is_top TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
    published_at DATETIME DEFAULT NULL COMMENT '发布时间',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_is_top (is_top),
    INDEX idx_published_at (published_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表'`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    type ENUM('system','trade','fund','announcement') DEFAULT 'system' COMMENT '消息类型',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT DEFAULT NULL COMMENT '内容',
    ref_type VARCHAR(50) DEFAULT '' COMMENT '关联类型',
    ref_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联ID',
    is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    read_at DATETIME DEFAULT NULL COMMENT '已读时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_user_read (user_id, is_read)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内消息表'`,

  `CREATE TABLE IF NOT EXISTS help_docs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容(富文本)',
    category ENUM('trading_rules','fee_info','deposit_withdraw','faq') DEFAULT 'faq' COMMENT '分类',
    status ENUM('draft','published') DEFAULT 'published' COMMENT '状态',
    sort_order INT DEFAULT 0 COMMENT '排序',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮助文档表'`,

  `CREATE TABLE IF NOT EXISTS tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(32) NOT NULL UNIQUE COMMENT '工单号',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    category ENUM('trade','fund','account','technical','other') DEFAULT 'other' COMMENT '分类',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '描述内容',
    images JSON DEFAULT NULL COMMENT '附件图片',
    status ENUM('pending','processing','resolved','closed') DEFAULT 'pending' COMMENT '状态',
    priority ENUM('low','normal','high') DEFAULT 'normal' COMMENT '优先级',
    assigned_to INT UNSIGNED DEFAULT NULL COMMENT '指派管理员ID',
    reply_content TEXT DEFAULT NULL COMMENT '回复内容',
    replied_at DATETIME DEFAULT NULL COMMENT '回复时间',
    closed_at DATETIME DEFAULT NULL COMMENT '关闭时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单表'`,

  `CREATE TABLE IF NOT EXISTS chat_conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '接入管理员ID',
    status ENUM('waiting','active','closed') DEFAULT 'waiting' COMMENT '会话状态',
    last_message TEXT DEFAULT NULL COMMENT '最后一条消息',
    last_message_at DATETIME DEFAULT NULL COMMENT '最后消息时间',
    user_unread INT DEFAULT 0 COMMENT '用户未读数',
    admin_unread INT DEFAULT 0 COMMENT '管理员未读数',
    closed_at DATETIME DEFAULT NULL COMMENT '关闭时间',
    closed_by VARCHAR(20) DEFAULT NULL COMMENT '关闭方(user/admin)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_status (status),
    INDEX idx_last_message_at (last_message_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服会话表'`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL COMMENT '会话ID',
    sender_type ENUM('user','admin','system') NOT NULL COMMENT '发送者类型',
    sender_id INT UNSIGNED NOT NULL COMMENT '发送者ID',
    content TEXT NOT NULL COMMENT '消息内容',
    msg_type ENUM('text','image') DEFAULT 'text' COMMENT '消息类型',
    is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender (sender_type, sender_id),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表'`,

  `CREATE TABLE IF NOT EXISTS homepage_banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '标题',
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    link_type ENUM('none','url','page','activity') DEFAULT 'none' COMMENT '跳转类型',
    link_value VARCHAR(500) DEFAULT '' COMMENT '跳转地址/页面路径/活动ID',
    position ENUM('top','middle') DEFAULT 'top' COMMENT '展示位置',
    status ENUM('active','inactive') DEFAULT 'active' COMMENT '状态',
    sort_order INT DEFAULT 0 COMMENT '排序权重(越小越前)',
    start_time DATETIME DEFAULT NULL COMMENT '展示开始时间',
    end_time DATETIME DEFAULT NULL COMMENT '展示结束时间',
    click_count INT DEFAULT 0 COMMENT '点击次数',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_position (position),
    INDEX idx_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='首页Banner表'`,

  `CREATE TABLE IF NOT EXISTS reward_cards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '卡片标题',
    description VARCHAR(500) DEFAULT '' COMMENT '卡片描述',
    icon VARCHAR(500) DEFAULT '' COMMENT '图标URL',
    reward_type ENUM('bonus','coupon','experience') DEFAULT 'bonus' COMMENT '奖励类型',
    reward_amount DECIMAL(20,4) DEFAULT 0.0000 COMMENT '奖励金额/面值',
    trigger_type ENUM('register','first_deposit','deposit_amount','trade_count','invite') DEFAULT 'register' COMMENT '触发条件',
    trigger_value DECIMAL(20,4) DEFAULT 0.0000 COMMENT '触发阈值',
    bg_color VARCHAR(20) DEFAULT '#1890FF' COMMENT '背景色',
    status ENUM('active','inactive') DEFAULT 'active' COMMENT '状态',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    start_time DATETIME DEFAULT NULL COMMENT '生效开始时间',
    end_time DATETIME DEFAULT NULL COMMENT '生效结束时间',
    claim_count INT DEFAULT 0 COMMENT '已领取次数',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_reward_type (reward_type),
    INDEX idx_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='奖励卡片表'`,

  `CREATE TABLE IF NOT EXISTS activities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '活动标题',
    summary VARCHAR(500) DEFAULT '' COMMENT '活动摘要',
    content TEXT DEFAULT NULL COMMENT '活动详情(富文本)',
    cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图片',
    activity_type ENUM('promotion','competition','bonus','other') DEFAULT 'promotion' COMMENT '活动类型',
    status ENUM('draft','active','ended','archived') DEFAULT 'draft' COMMENT '活动状态',
    start_time DATETIME DEFAULT NULL COMMENT '活动开始时间',
    end_time DATETIME DEFAULT NULL COMMENT '活动结束时间',
    rules TEXT DEFAULT NULL COMMENT '活动规则',
    prize_desc VARCHAR(500) DEFAULT '' COMMENT '奖品描述',
    max_participants INT DEFAULT 0 COMMENT '最大参与人数(0=不限)',
    current_participants INT DEFAULT 0 COMMENT '当前参与人数',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    is_top TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_activity_type (activity_type),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_is_top (is_top)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表'`,

  `CREATE TABLE IF NOT EXISTS demo_fee_config (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    symbol_id INT UNSIGNED NOT NULL COMMENT '品种ID',
    symbol VARCHAR(20) NOT NULL COMMENT '品种代码',
    fee_type ENUM('per_lot','percentage') DEFAULT 'per_lot' COMMENT '手续费类型',
    fee_value DECIMAL(10,4) DEFAULT 0.0000 COMMENT '手续费费率',
    spread_mode ENUM('fixed','float') DEFAULT 'fixed' COMMENT '点差模式',
    spread_fixed DECIMAL(10,4) DEFAULT 0.0000 COMMENT '固定点差值',
    spread_min DECIMAL(10,4) DEFAULT 0.0000 COMMENT '最小点差',
    spread_max DECIMAL(10,4) DEFAULT 0.0000 COMMENT '最大点差',
    swap_long_rate DECIMAL(10,6) DEFAULT 0.000000 COMMENT '多单隔夜费率',
    swap_short_rate DECIMAL(10,6) DEFAULT 0.000000 COMMENT '空单隔夜费率',
    is_custom TINYINT(1) DEFAULT 0 COMMENT '是否自定义(0=同步真实盘)',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '操作人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_symbol (symbol),
    INDEX idx_symbol_id (symbol_id),
    INDEX idx_is_custom (is_custom)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模拟盘费用配置表'`,

  `CREATE TABLE IF NOT EXISTS integrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '接口名称',
    type ENUM('market_data','payment','email','push','sms','other') NOT NULL COMMENT '接口类型',
    provider VARCHAR(100) DEFAULT '' COMMENT '服务商',
    api_url VARCHAR(500) DEFAULT '' COMMENT '接口地址',
    api_key VARCHAR(500) DEFAULT '' COMMENT 'API Key',
    api_secret VARCHAR(500) DEFAULT '' COMMENT 'API Secret',
    extra_config JSON DEFAULT NULL COMMENT '额外配置',
    status ENUM('active','inactive') DEFAULT 'active' COMMENT '状态',
    last_check_at DATETIME DEFAULT NULL COMMENT '最后检测时间',
    last_check_status ENUM('success','fail','unknown') DEFAULT 'unknown' COMMENT '最后检测结果',
    last_check_message VARCHAR(500) DEFAULT '' COMMENT '最后检测消息',
    description VARCHAR(500) DEFAULT '' COMMENT '接口描述',
    admin_id INT UNSIGNED DEFAULT NULL COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='第三方接口配置表'`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    operator_type ENUM('admin','system') NOT NULL DEFAULT 'admin' COMMENT '操作人类型',
    operator_id INT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
    operator_name VARCHAR(100) DEFAULT '' COMMENT '操作人名称',
    module VARCHAR(100) NOT NULL COMMENT '操作模块',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) DEFAULT '' COMMENT '目标对象类型',
    target_id VARCHAR(50) DEFAULT '' COMMENT '目标对象ID',
    content TEXT DEFAULT NULL COMMENT '操作内容详情(JSON)',
    before_data TEXT DEFAULT NULL COMMENT '变更前数据(JSON)',
    after_data TEXT DEFAULT NULL COMMENT '变更后数据(JSON)',
    ip VARCHAR(50) DEFAULT '' COMMENT 'IP地址',
    user_agent TEXT DEFAULT NULL COMMENT 'User-Agent',
    status ENUM('success','fail') DEFAULT 'success' COMMENT '操作状态',
    error_message TEXT DEFAULT NULL COMMENT '错误信息',
    duration_ms INT DEFAULT NULL COMMENT '操作耗时(毫秒)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operator (operator_type, operator_id),
    INDEX idx_module (module),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表'`,
];

const seedRoles = [
  {
    name: 'super_admin',
    display_name: '超级管理员',
    description: '拥有全部系统权限',
    permissions: JSON.stringify([
      'user:manage', 'trade:manage', 'fund:manage', 'risk:manage',
      'admin:manage', 'data:export', 'system:audit', 'system:config'
    ]),
    is_system: 1,
    sort_order: 1,
  },
  {
    name: 'admin',
    display_name: '普通管理员',
    description: '拥有基础管理权限',
    permissions: JSON.stringify([
      'user:manage', 'trade:manage', 'fund:manage'
    ]),
    is_system: 1,
    sort_order: 2,
  },
  {
    name: 'operator',
    display_name: '运营管理员',
    description: '拥有运营相关权限',
    permissions: JSON.stringify([
      'user:manage', 'data:export'
    ]),
    is_system: 0,
    sort_order: 3,
  },
];

const seedConfigs = [
  { config_key: 'site_name', config_value: '黄金白银石油交易系统', config_type: 'string', category: 'system', label: '站点名称' },
  { config_key: 'site_description', config_value: '贵金属与能源CFD交易平台', config_type: 'string', category: 'system', label: '站点描述' },
  { config_key: 'maintenance_mode', config_value: 'false', config_type: 'boolean', category: 'system', label: '维护模式' },
  { config_key: 'default_leverage', config_value: '100', config_type: 'number', category: 'trade', label: '默认杠杆' },
  { config_key: 'max_leverage', config_value: '200', config_type: 'number', category: 'trade', label: '最大杠杆' },
  { config_key: 'demo_initial_balance', config_value: '10000', config_type: 'number', category: 'trade', label: '模拟盘初始余额' },
  { config_key: 'min_deposit_amount', config_value: '100', config_type: 'number', category: 'fund', label: '最低入金金额' },
  { config_key: 'min_withdraw_amount', config_value: '50', config_type: 'number', category: 'fund', label: '最低出金金额' },
  { config_key: 'withdraw_fee_rate', config_value: '0.005', config_type: 'number', category: 'fund', label: '出金手续费率' },
  { config_key: 'wechat_pay_qrcode', config_value: '', config_type: 'image', category: 'fund', label: '微信收款码' },
  { config_key: 'alipay_pay_qrcode', config_value: '', config_type: 'image', category: 'fund', label: '支付宝收款码' },
  { config_key: 'usdt_trc20_address', config_value: '', config_type: 'string', category: 'fund', label: 'USDT-TRC20地址' },
  { config_key: 'warning_line', config_value: '50', config_type: 'number', category: 'risk', label: '风控预警线(%)' },
  { config_key: 'force_close_line', config_value: '20', config_type: 'number', category: 'risk', label: '强平线(%)' },
  { config_key: 'max_position_per_symbol', config_value: '100', config_type: 'number', category: 'risk', label: '单品种最大持仓手数' },
  { config_key: 'smtp_host', config_value: '', config_type: 'string', category: 'email', label: 'SMTP服务器' },
  { config_key: 'smtp_port', config_value: '465', config_type: 'number', category: 'email', label: 'SMTP端口' },
  { config_key: 'smtp_secure', config_value: 'true', config_type: 'boolean', category: 'email', label: '是否SSL' },
  { config_key: 'smtp_user', config_value: '', config_type: 'string', category: 'email', label: 'SMTP账号' },
  { config_key: 'smtp_pass', config_value: '', config_type: 'string', category: 'email', label: 'SMTP密码' },
  { config_key: 'smtp_from_address', config_value: '', config_type: 'string', category: 'email', label: '发件人地址' },
  { config_key: 'smtp_from_name', config_value: '交易系统', config_type: 'string', category: 'email', label: '发件人名称' },
  { config_key: 'password_min_length', config_value: '8', config_type: 'number', category: 'security', label: '密码最小长度' },
  { config_key: 'login_max_attempts', config_value: '5', config_type: 'number', category: 'security', label: '最大登录尝试次数' },
  { config_key: 'token_expire_hours', config_value: '2', config_type: 'number', category: 'security', label: 'Token过期时间(小时)' },
  { config_key: 'splash_enabled', config_value: 'false', config_type: 'boolean', category: 'system', label: '开屏广告启用' },
  { config_key: 'splash_duration', config_value: '3', config_type: 'number', category: 'system', label: '开屏广告时长(秒)' },
  { config_key: 'splash_image_url', config_value: '', config_type: 'image', category: 'system', label: '开屏广告图片' },
  { config_key: 'splash_link_url', config_value: '', config_type: 'string', category: 'system', label: '开屏广告跳转链接' },
  { config_key: 'splash_rich_text', config_value: '', config_type: 'text', category: 'system', label: '开屏广告富文本' },
  { config_key: 'about_us', config_value: '', config_type: 'text', category: 'system', label: '关于我们' },
  { config_key: 'user_agreement', config_value: '', config_type: 'text', category: 'system', label: '用户协议' },
  { config_key: 'privacy_policy', config_value: '', config_type: 'text', category: 'system', label: '隐私政策' },
  { config_key: 'risk_warning', config_value: '', config_type: 'text', category: 'system', label: '风险提示' },
];

async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[DB Init] 数据库 ${config.db.database} 创建/确认完成`);

    await connection.query(`USE \`${config.db.database}\``);

    for (const sql of tables) {
      await connection.query(sql);
    }
    console.log('[DB Init] 所有表创建完成');

    for (const role of seedRoles) {
      await connection.query(
        `INSERT IGNORE INTO roles (name, display_name, description, permissions, is_system, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [role.name, role.display_name, role.description, role.permissions, role.is_system, role.sort_order]
      );
    }
    console.log('[DB Init] 角色种子数据写入完成');

    for (const cfg of seedConfigs) {
      await connection.query(
        `INSERT IGNORE INTO system_config (config_key, config_value, config_type, category, label)
         VALUES (?, ?, ?, ?, ?)`,
        [cfg.config_key, cfg.config_value, cfg.config_type, cfg.category, cfg.label]
      );
    }
    console.log('[DB Init] 系统配置种子数据写入完成');

    const [existing] = await connection.query(
      "SELECT id FROM admins WHERE username = 'admin'"
    );
    if (existing.length === 0) {
      const [superRole] = await connection.query(
        "SELECT id FROM roles WHERE name = 'super_admin'"
      );
      if (superRole.length > 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
          `INSERT INTO admins (username, password, real_name, email, role_id)
           VALUES (?, ?, ?, ?, ?)`,
          ['admin', hashedPassword, '超级管理员', 'admin@trading.com', superRole[0].id]
        );
        console.log('[DB Init] 默认管理员创建完成 (admin / admin123)');
      }
    }

    const [existingSymbols] = await connection.query('SELECT COUNT(*) as cnt FROM trading_symbols');
    if (existingSymbols[0].cnt === 0) {
      const defaultSymbols = [
        ['XAUUSD','黄金/美元','precious_metal',1,'100盎司',0.01,100,0.01,1,200,2,0.01,0.01,'fixed',3.5,0,0,'both_side','per_lot',5.0,-0.005,0.002,3,1,1000,0,'{"mon_fri":"01:00-24:00","break":"05:00-06:00"}',1,'国际黄金'],
        ['XAGUSD','白银/美元','precious_metal',1,'5000盎司',0.01,50,0.01,1,100,3,0.001,0.001,'fixed',2.5,0,0,'both_side','per_lot',3.0,-0.004,0.001,3,1,1000,0,'{"mon_fri":"01:00-24:00","break":"05:00-06:00"}',2,'国际白银'],
        ['USOUSD','WTI原油','energy',1,'1000桶',0.01,50,0.01,1,100,2,0.01,0.01,'fixed',4.0,0,0,'both_side','per_lot',5.0,-0.008,0.003,3,1,1000,0,'{"mon_fri":"06:00-05:00"}',3,'WTI美国原油'],
        ['UKOUSD','布伦特原油','energy',0,'1000桶',0.01,50,0.01,1,100,2,0.01,0.01,'fixed',4.5,0,0,'both_side','per_lot',5.0,-0.007,0.002,3,1,1000,0,'{"mon_fri":"03:00-24:00"}',4,'布伦特原油'],
        ['NGAS','天然气','energy',0,'10000MMBtu',0.01,30,0.01,1,50,3,0.001,0.001,'fixed',5.0,0,0,'both_side','per_lot',4.0,-0.01,0.004,3,1,500,0,'{"mon_fri":"06:00-05:00"}',5,'天然气'],
        ['EURUSD','欧元/美元','forex',1,'100000单位',0.01,100,0.01,1,500,5,0.00001,0.00001,'float',0,1.0,3.0,'both_side','per_lot',3.0,-0.006,0.002,3,1,1000,0,'{"mon_fri":"00:00-24:00"}',6,'欧元/美元'],
        ['GBPUSD','英镑/美元','forex',1,'100000单位',0.01,100,0.01,1,500,5,0.00001,0.00001,'float',0,1.5,4.0,'both_side','per_lot',3.5,-0.005,0.001,3,1,1000,0,'{"mon_fri":"00:00-24:00"}',7,'英镑/美元'],
        ['USDJPY','美元/日元','forex',1,'100000单位',0.01,100,0.01,1,500,3,0.001,0.001,'float',0,1.0,3.0,'both_side','per_lot',3.0,0.003,-0.008,3,1,1000,0,'{"mon_fri":"00:00-24:00"}',8,'美元/日元'],
        ['AUDUSD','澳元/美元','forex',0,'100000单位',0.01,100,0.01,1,500,5,0.00001,0.00001,'float',0,1.2,3.5,'both_side','per_lot',3.0,-0.004,0.001,3,1,1000,0,'{"mon_fri":"00:00-24:00"}',9,'澳元/美元'],
        ['USDCAD','美元/加元','forex',0,'100000单位',0.01,100,0.01,1,500,5,0.00001,0.00001,'float',0,1.5,4.0,'both_side','per_lot',3.0,0.002,-0.006,3,1,1000,0,'{"mon_fri":"00:00-24:00"}',10,'美元/加元'],
      ];
      for (const s of defaultSymbols) {
        await connection.query(
          `INSERT IGNORE INTO trading_symbols (symbol,name,category,is_hot,contract_unit,min_lot,max_lot,lot_step,min_leverage,max_leverage,price_decimals,tick_value,tick_size,spread_mode,spread_fixed,spread_min,spread_max,fee_mode,fee_type,fee_value,swap_long_rate,swap_short_rate,swap_wednesday_multiplier,swap_holiday_multiplier,max_position,max_slippage,trading_hours,sort_order,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          s
        );
      }
      console.log('[DB Init] 交易品种种子数据写入完成');
    }

    console.log('[DB Init] 数据库初始化全部完成！');
  } catch (error) {
    console.error('[DB Init] 初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = { initDatabase };
