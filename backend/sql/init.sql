-- ========================================================
-- 备品备件库存中心 - 数据库初始化脚本
-- Database: spare_part_hub
-- ========================================================

DROP DATABASE IF EXISTS spare_part_hub;
CREATE DATABASE spare_part_hub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE spare_part_hub;

-- ========================================================
-- 1. 备件表
-- ========================================================
CREATE TABLE IF NOT EXISTS spare_parts (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键UUID',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '备件编码',
  name VARCHAR(100) NOT NULL COMMENT '备件名称',
  category ENUM('bearing','belt','motor','sensor','seal','gear','other') DEFAULT 'other' COMMENT '分类:轴承/皮带/电机/传感器/密封件/齿轮/其他',
  specification VARCHAR(200) NOT NULL COMMENT '规格型号',
  brand VARCHAR(50) DEFAULT NULL COMMENT '品牌',
  manufacturer VARCHAR(50) DEFAULT NULL COMMENT '生产厂商',
  unit_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '单价(元)',
  unit VARCHAR(20) DEFAULT '件' COMMENT '计量单位',
  storage_location VARCHAR(50) NOT NULL COMMENT '存放货位',
  safety_stock INT DEFAULT 0 COMMENT '安全库存下限',
  purchase_quantity INT DEFAULT 10 COMMENT '请购推荐数量',
  technical_params VARCHAR(500) DEFAULT NULL COMMENT '技术参数',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  is_hot TINYINT(1) DEFAULT 0 COMMENT '是否常用备件(1:是,0:否,开启后缓存到Redis)',
  barcode VARCHAR(200) DEFAULT NULL COMMENT '条码/二维码内容',
  status ENUM('active','inactive','obsolete') DEFAULT 'active' COMMENT '状态:启用/停用/淘汰',
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件档案表';

-- ========================================================
-- 2. 设备表
-- ========================================================
CREATE TABLE IF NOT EXISTS equipments (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键UUID',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '设备编号',
  name VARCHAR(100) NOT NULL COMMENT '设备名称',
  model VARCHAR(100) DEFAULT NULL COMMENT '设备型号',
  category VARCHAR(50) DEFAULT NULL COMMENT '设备类别',
  workshop VARCHAR(50) DEFAULT NULL COMMENT '所属车间/产线',
  location VARCHAR(100) DEFAULT NULL COMMENT '安装位置',
  commission_date DATE DEFAULT NULL COMMENT '投产日期',
  maintenance_count INT DEFAULT 0 COMMENT '累计维修次数',
  total_spare_part_cost DECIMAL(14,2) DEFAULT 0.00 COMMENT '累计备件消耗金额',
  status ENUM('running','standby','maintenance','fault','scrapped') DEFAULT 'running' COMMENT '状态:运行/待机/维修/故障/报废',
  responsible_person VARCHAR(50) DEFAULT NULL COMMENT '负责人',
  contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  remark VARCHAR(500) DEFAULT NULL,
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_workshop (workshop)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备台账表';

-- ========================================================
-- 3. 备件-设备关联表 (一个备件可用于多台设备)
-- ========================================================
CREATE TABLE IF NOT EXISTS spare_part_equipment (
  id VARCHAR(36) PRIMARY KEY,
  spare_part_id VARCHAR(36) NOT NULL COMMENT '备件ID',
  equipment_id VARCHAR(36) NOT NULL COMMENT '设备ID',
  install_position VARCHAR(100) DEFAULT NULL COMMENT '安装位置描述',
  usage_per_equipment INT DEFAULT 1 COMMENT '单台设备用量',
  replace_instruction VARCHAR(500) DEFAULT NULL COMMENT '更换说明',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_spare_equipment (spare_part_id, equipment_id),
  INDEX idx_spare_part_id (spare_part_id),
  INDEX idx_equipment_id (equipment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件适用设备关联表';

-- ========================================================
-- 4. 库存表 (1:1关联备件)
-- ========================================================
CREATE TABLE IF NOT EXISTS inventories (
  id VARCHAR(36) PRIMARY KEY,
  spare_part_id VARCHAR(36) NOT NULL UNIQUE COMMENT '备件ID',
  current_stock INT DEFAULT 0 COMMENT '当前库存数量',
  allocated_stock INT DEFAULT 0 COMMENT '已分配数量(待出库)',
  in_transit_stock INT DEFAULT 0 COMMENT '在途数量(采购中)',
  monthly_consumption INT DEFAULT 0 COMMENT '月平均消耗量',
  total_inbound INT DEFAULT 0 COMMENT '累计入库数量',
  total_outbound INT DEFAULT 0 COMMENT '累计出库数量',
  inventory_value DECIMAL(14,2) DEFAULT 0.00 COMMENT '库存金额',
  last_inbound_at DATETIME DEFAULT NULL COMMENT '最后入库时间',
  last_outbound_at DATETIME DEFAULT NULL COMMENT '最后出库时间',
  last_stocktake_at DATETIME DEFAULT NULL COMMENT '最后盘点时间',
  updated_by VARCHAR(50) DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_spare_part_id (spare_part_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存实时表';

-- ========================================================
-- 5. 出入库流水表 (每一笔变动都有记录)
-- ========================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(30) NOT NULL UNIQUE COMMENT '流水单号',
  spare_part_id VARCHAR(36) NOT NULL COMMENT '备件ID',
  movement_type ENUM('inbound','outbound','adjustment_plus','adjustment_minus','stocktake','return') NOT NULL COMMENT '类型:入库/出库/盘盈/盘亏/盘点/退库',
  quantity INT NOT NULL COMMENT '变动数量(正数入库/负数出库)',
  stock_before INT DEFAULT 0 COMMENT '变动前库存',
  stock_after INT DEFAULT 0 COMMENT '变动后库存',
  unit_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '单价',
  total_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '总金额',
  related_order_no VARCHAR(100) DEFAULT NULL COMMENT '关联采购单号/单号',
  maintenance_record_id VARCHAR(36) DEFAULT NULL COMMENT '关联维修记录ID',
  equipment_id VARCHAR(36) DEFAULT NULL COMMENT '关联设备ID',
  supplier_name VARCHAR(50) DEFAULT NULL COMMENT '供应商名称',
  operator VARCHAR(50) DEFAULT NULL COMMENT '经办人/领料人',
  department VARCHAR(50) DEFAULT NULL COMMENT '领用部门',
  status ENUM('pending','completed','cancelled') DEFAULT 'completed' COMMENT '状态',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  created_by VARCHAR(50) DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_no (order_no),
  INDEX idx_spare_part_id (spare_part_id),
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_movement_type (movement_type),
  INDEX idx_created_at (created_at),
  INDEX idx_maintenance_id (maintenance_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出入库流水表';

-- ========================================================
-- 6. 维修记录表
-- ========================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(30) NOT NULL UNIQUE COMMENT '维修单号',
  equipment_id VARCHAR(36) NOT NULL COMMENT '设备ID',
  maintenance_type ENUM('preventive','corrective','breakdown','overhaul') DEFAULT 'corrective' COMMENT '预防性/故障维修/突发抢修/大修',
  status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending' COMMENT '待处理/维修中/已完成/已取消',
  fault_time DATETIME DEFAULT NULL COMMENT '故障发生时间',
  start_time DATETIME DEFAULT NULL COMMENT '维修开始时间',
  end_time DATETIME DEFAULT NULL COMMENT '维修完成时间',
  downtime_minutes INT DEFAULT 0 COMMENT '停机时长(分钟)',
  fault_description VARCHAR(500) DEFAULT NULL COMMENT '故障描述',
  maintenance_content VARCHAR(1000) DEFAULT NULL COMMENT '维修内容',
  cause_analysis VARCHAR(500) DEFAULT NULL COMMENT '原因分析',
  preventive_measures VARCHAR(500) DEFAULT NULL COMMENT '预防措施',
  spare_part_cost DECIMAL(14,2) DEFAULT 0.00 COMMENT '备件费用',
  labor_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '人工费用',
  total_cost DECIMAL(14,2) DEFAULT 0.00 COMMENT '总费用',
  reporter VARCHAR(50) DEFAULT NULL COMMENT '报修人',
  maintainer VARCHAR(50) DEFAULT NULL COMMENT '维修负责人',
  remark VARCHAR(500) DEFAULT NULL,
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_no (order_no),
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修记录表';

-- ========================================================
-- 7. 请购建议表 (库存低于安全库存自动生成)
-- ========================================================
CREATE TABLE IF NOT EXISTS purchase_suggestions (
  id VARCHAR(36) PRIMARY KEY,
  suggestion_no VARCHAR(30) NOT NULL UNIQUE COMMENT '请购单号',
  spare_part_id VARCHAR(36) NOT NULL COMMENT '备件ID',
  current_stock INT NOT NULL COMMENT '当前库存',
  safety_stock INT NOT NULL COMMENT '安全库存',
  suggested_quantity INT NOT NULL COMMENT '建议采购数量',
  ordered_quantity INT DEFAULT 0 COMMENT '已采购数量',
  gap_quantity INT NOT NULL COMMENT '缺口数量',
  monthly_consumption INT DEFAULT NULL COMMENT '月均消耗量',
  estimated_days_left INT DEFAULT NULL COMMENT '预计可用天数',
  is_urgent TINYINT(1) DEFAULT 0 COMMENT '是否紧急采购',
  status ENUM('pending','approved','rejected','ordered','completed') DEFAULT 'pending' COMMENT '待审批/已批准/已驳回/采购中/已完成',
  expected_delivery_date DATE DEFAULT NULL COMMENT '预计到库时间',
  purchase_order_no VARCHAR(100) DEFAULT NULL COMMENT '采购单号',
  approver VARCHAR(50) DEFAULT NULL COMMENT '审批人',
  approval_time DATETIME DEFAULT NULL COMMENT '审批时间',
  approval_remark VARCHAR(500) DEFAULT NULL COMMENT '审批意见',
  remark VARCHAR(500) DEFAULT NULL,
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suggestion_no (suggestion_no),
  INDEX idx_spare_part_id (spare_part_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请购建议表';

-- ========================================================
-- 测试数据
-- ========================================================

-- 插入示例设备
INSERT INTO equipments (id, code, name, model, category, workshop, location, status, responsible_person, contact_phone, remark) VALUES
('eq-001', 'EQ-202401001', '1号螺杆空压机', 'GA-75', '空压机', '动力车间', '厂房东侧-A区', 'running', '张工', '13800138001', '75kW螺杆空压机，供气系统核心设备'),
('eq-002', 'EQ-202401002', '2号螺杆空压机', 'GA-75', '空压机', '动力车间', '厂房东侧-B区', 'running', '张工', '13800138001', '备用空压机'),
('eq-003', 'EQ-202401003', '主输送线电机', 'Y2-160M-4 11kW', '电机组', '一车间', '生产线-北段', 'running', '李工', '13800138002', '主输送线驱动电机'),
('eq-004', 'EQ-202401004', '1号减速机', 'BWD3-29-5.5', '减速机', '一车间', '搅拌罐-1#', 'maintenance', '王工', '13800138003', '摆线针轮减速机，月度检修中'),
('eq-005', 'EQ-202401005', '冷却塔风机', 'LF30-4 30kW', '风机', '动力车间', '循环水塔顶', 'running', '赵工', '13800138004', '循环水冷却塔风机'),
('eq-006', 'EQ-202401006', '包装线传动滚筒', 'Φ110×1400', '输送机', '二车间', '包装线-B区', 'running', '刘工', '13800138005', '尾部改向滚筒');

-- 插入示例备件
INSERT INTO spare_parts (id, code, name, category, specification, brand, manufacturer, unit_price, unit, storage_location, safety_stock, purchase_quantity, is_hot, barcode, status, remark) VALUES
('sp-001', 'BR240600001', '深沟球轴承', 'bearing', '6205-2RS 内径25mm外径52mm', 'SKF', '瑞典斯凯孚', 85.00, '个', 'A-01-03', 20, 50, 1, 'BR240600001', 'active', '通用标准轴承，空压机/电机常用'),
('sp-002', 'BR240600002', '圆柱滚子轴承', 'bearing', 'NU210ECP 内径50mm', 'NSK', '日本精工', 260.00, '个', 'A-01-05', 10, 20, 1, 'BR240600002', 'active', '减速机主轴承'),
('sp-003', 'BR240600003', '角接触球轴承', 'bearing', '7210AC 50×90×20', 'FAG', '德国舍弗勒', 145.00, '个', 'A-01-07', 8, 16, 0, 'BR240600003', 'active', '主轴支撑轴承'),
('sp-004', 'BT240600004', '同步齿形带', 'belt', 'HTD-5M-1250-50', 'GATES', '美国盖茨', 320.00, '条', 'B-02-01', 6, 12, 1, 'BT240600004', 'active', '主输送线传动带'),
('sp-005', 'BT240600005', 'V型三角带', 'belt', 'SPA1800LW', 'OPTIBELT', '德国欧皮特', 120.00, '条', 'B-02-03', 15, 30, 1, 'BT240600005', 'active', '电机-FAN风机传动'),
('sp-006', 'MT240600006', '三相异步电机', 'motor', 'Y2-160M-4 11kW B3', '西门子', '西门子电机', 4800.00, '台', 'C-03-01', 2, 5, 1, 'MT240600006', 'active', '输送线主驱动电机'),
('sp-007', 'MT240600007', '制动电机', 'motor', 'YEJ-100L1-4 2.2kW', 'ABB', 'ABB电机', 2200.00, '台', 'C-03-02', 1, 3, 0, 'MT240600007', 'active', '升降机构刹车电机'),
('sp-008', 'SR240600008', '接近传感器', 'sensor', 'M18 NPN常开 检测8mm', 'OMRON', '欧姆龙', 85.00, '只', 'D-04-01', 30, 60, 1, 'SR240600008', 'active', '包装线计数传感器'),
('sp-009', 'SR240600009', '光电开关', 'sensor', 'E3Z-LS63 漫反射 2m', 'KEYENCE', '基恩士', 360.00, '只', 'D-04-03', 12, 24, 0, 'SR240600009', 'active', '高精度位置检测'),
('sp-010', 'SR240600010', '温度传感器', 'sensor', 'PT100 A级 -50~200℃', '国产', '上海仪表厂', 45.00, '只', 'D-04-05', 25, 50, 1, 'SR240600010', 'active', '油温/水温监测'),
('sp-011', 'SL240600011', '骨架油封', 'seal', 'TC 55×80×10 丁腈橡胶', 'NAK', '台湾NAK', 28.00, '只', 'E-05-01', 50, 100, 1, 'SL240600011', 'active', '减速机轴密封'),
('sp-012', 'SL240600012', 'O型密封圈', 'seal', '内径60×5.3mm 氟橡胶', '国产', '深圳密封件厂', 3.50, '个', 'E-05-03', 200, 500, 0, 'SL240600012', 'active', '液压气动密封'),
('sp-013', 'GR240600013', '减速机齿轮', 'gear', 'Z=40 M=3 45钢调质', '国产', '浙江齿轮厂', 420.00, '个', 'F-06-01', 5, 10, 0, 'GR240600013', 'active', 'BWD3减速机二级齿轮'),
('sp-014', 'OT240600014', '螺杆空压机三滤套装', 'other', '油滤+空滤+油分 GA75', '原厂配套', '阿特拉斯', 1280.00, '套', 'G-07-01', 4, 8, 1, 'OT240600014', 'active', 'GA75空压机保养套件，每2000H更换'),
('sp-015', 'OT240600015', '润滑脂', 'other', '锂基脂2号 15kg装', '长城', '中石化长城', 280.00, '桶', 'G-07-03', 10, 20, 0, 'OT240600015', 'active', '通用轴承润滑脂');

-- 插入库存记录 (同步spare_parts创建库存)
INSERT INTO inventories (id, spare_part_id, current_stock, total_inbound, total_outbound, inventory_value, monthly_consumption, last_inbound_at, last_outbound_at) VALUES
(UUID(), 'sp-001', 35, 100, 65, 2975.00, 8, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY),
(UUID(), 'sp-002', 12, 20, 8, 3120.00, 3, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 2 DAY),
(UUID(), 'sp-003', 5, 10, 5, 725.00, 2, NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 5 DAY),
(UUID(), 'sp-004', 3, 10, 7, 960.00, 2, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 1 DAY),
(UUID(), 'sp-005', 8, 30, 22, 960.00, 5, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 2 DAY),
(UUID(), 'sp-006', 1, 5, 4, 4800.00, 1, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 8 DAY),
(UUID(), 'sp-007', 2, 3, 1, 4400.00, 0, NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 20 DAY),
(UUID(), 'sp-008', 18, 60, 42, 1530.00, 10, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 HOUR),
(UUID(), 'sp-009', 5, 15, 10, 1800.00, 3, NOW() - INTERVAL 21 DAY, NOW() - INTERVAL 3 DAY),
(UUID(), 'sp-010', 22, 50, 28, 990.00, 7, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 6 HOUR),
(UUID(), 'sp-011', 15, 100, 85, 420.00, 20, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 4 HOUR),
(UUID(), 'sp-012', 180, 500, 320, 630.00, 80, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 HOUR),
(UUID(), 'sp-013', 2, 5, 3, 840.00, 1, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 15 DAY),
(UUID(), 'sp-014', 1, 8, 7, 1280.00, 2, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 7 DAY),
(UUID(), 'sp-015', 6, 15, 9, 1680.00, 2, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 4 DAY);

-- 插入备件-设备关联
INSERT INTO spare_part_equipment (id, spare_part_id, equipment_id, install_position, usage_per_equipment, replace_instruction) VALUES
(UUID(), 'sp-001', 'eq-001', '空压机驱动端轴承', 2, '停机后更换，需加热安装'),
(UUID(), 'sp-001', 'eq-002', '空压机驱动端轴承', 2, '停机后更换'),
(UUID(), 'sp-001', 'eq-003', '电机前后端轴承', 2, '拆电机端盖更换'),
(UUID(), 'sp-002', 'eq-004', '减速机主轴承', 1, '拆减速机箱更换'),
(UUID(), 'sp-003', 'eq-004', '减速机高速轴轴承', 2, '高速轴两端'),
(UUID(), 'sp-004', 'eq-003', '主传动同步带', 1, '松开电机座张紧螺丝更换'),
(UUID(), 'sp-005', 'eq-005', '冷却塔风机传动带', 4, '4条一组同时更换'),
(UUID(), 'sp-006', 'eq-003', '主驱动电机总成', 1, '拆联轴器、吊出电机'),
(UUID(), 'sp-008', 'eq-006', '包装线计数传感器', 2, '调整检测距离1mm'),
(UUID(), 'sp-010', 'eq-001', '空压机油温传感器', 1, '关闭油滤阀后更换'),
(UUID(), 'sp-011', 'eq-004', '减速机输入轴油封', 2, '注意安装方向，唇口朝内'),
(UUID(), 'sp-013', 'eq-004', '减速机二级从动齿轮', 1, '拆箱体整体更换，需重新对齿'),
(UUID(), 'sp-014', 'eq-001', '空压机三滤', 1, '运行2000小时更换，注意排气泄压'),
(UUID(), 'sp-014', 'eq-002', '空压机三滤', 1, '同上');

-- 插入示例出入库流水
INSERT INTO stock_movements (id, order_no, spare_part_id, movement_type, quantity, stock_before, stock_after, unit_price, total_amount, equipment_id, operator, department, remark, created_by, created_at) VALUES
(UUID(), 'RK20260601083012A1B', 'sp-001', 'inbound', 50, 50, 100, 85.00, 4250.00, NULL, '王仓管', '采购部', '采购入库PO-2026-0601', 'system', NOW() - INTERVAL 30 DAY),
(UUID(), 'CK20260605142208C2D', 'sp-001', 'outbound', -15, 100, 85, 85.00, 1275.00, 'eq-001', '李维修', '维修组', '1号空压机大修更换', 'system', NOW() - INTERVAL 28 DAY),
(UUID(), 'CK20260608101533E4F', 'sp-001', 'outbound', -20, 85, 65, 85.00, 1700.00, 'eq-003', '张维修', '维修组', '主输送线电机保养', 'system', NOW() - INTERVAL 25 DAY),
(UUID(), 'CK20260610093015G5H', 'sp-001', 'outbound', -30, 65, 35, 85.00, 2550.00, 'eq-002', '王维修', '维修组', '2号空压机预防性维护', 'system', NOW() - INTERVAL 15 DAY),
(UUID(), 'RK20260602091200I6J', 'sp-004', 'inbound', 10, 0, 10, 320.00, 3200.00, NULL, '王仓管', '采购部', '采购入库PO-2026-0602', 'system', NOW() - INTERVAL 29 DAY),
(UUID(), 'CK20260615134522K7L', 'sp-004', 'outbound', -3, 10, 7, 320.00, 960.00, 'eq-003', '张维修', '维修组', '输送线传动带断裂更换', 'system', NOW() - INTERVAL 10 DAY),
(UUID(), 'CK20260618152000M8N', 'sp-004', 'outbound', -4, 7, 3, 320.00, 1280.00, 'eq-003', '李维修', '维修组', '输送线打滑，计划更换', 'system', NOW() - INTERVAL 1 DAY),
(UUID(), 'RK20260601090000O9P', 'sp-006', 'inbound', 5, 0, 5, 4800.00, 24000.00, NULL, '王仓管', '采购部', '采购入库PO-2026-0603', 'system', NOW() - INTERVAL 45 DAY),
(UUID(), 'CK20260612113000Q0R', 'sp-006', 'outbound', -1, 5, 4, 4800.00, 4800.00, 'eq-003', '王维修', '维修组', '主输送线电机烧毁更换', 'system', NOW() - INTERVAL 20 DAY),
(UUID(), 'CK20260616160000S1T', 'sp-006', 'outbound', -3, 4, 1, 4800.00, 14400.00, 'eq-005', '李维修', '维修组', '冷却塔风机电机故障更换', 'system', NOW() - INTERVAL 8 DAY),
(UUID(), 'RK20260610100000U2V', 'sp-014', 'inbound', 8, 0, 8, 1280.00, 10240.00, NULL, '王仓管', '采购部', '采购入库PO-2026-0620', 'system', NOW() - INTERVAL 14 DAY),
(UUID(), 'CK20260614083000W3X', 'sp-014', 'outbound', -2, 8, 6, 1280.00, 2560.00, 'eq-001', '张维修', '维修组', '1号空压机2000小时保养', 'system', NOW() - INTERVAL 14 DAY),
(UUID(), 'CK20260618100000Y4Z', 'sp-014', 'outbound', -2, 6, 4, 1280.00, 2560.00, 'eq-002', '王维修', '维修组', '2号空压机2000小时保养', 'system', NOW() - INTERVAL 12 DAY);

-- 插入示例维修记录
INSERT INTO maintenance_records (id, order_no, equipment_id, maintenance_type, status, fault_time, start_time, end_time, downtime_minutes, fault_description, maintenance_content, cause_analysis, preventive_measures, spare_part_cost, labor_cost, total_cost, reporter, maintainer, remark) VALUES
(UUID(), 'WX20260605001', 'eq-001', 'preventive', 'completed', NOW() - INTERVAL 29 DAY, NOW() - INTERVAL 29 DAY, NOW() - INTERVAL 29 DAY + INTERVAL 3 HOUR, 180, '计划性2000小时保养', '更换三滤、轴承润滑、整机清理检查', '正常磨损', '严格按保养计划执行', 1275.00, 300.00, 1575.00, '值班操作员', '李维修', '空压机定期保养'),
(UUID(), 'WX20260612001', 'eq-003', 'breakdown', 'completed', NOW() - INTERVAL 21 DAY, NOW() - INTERVAL 20 DAY + INTERVAL 1 HOUR, NOW() - INTERVAL 20 DAY + INTERVAL 5 HOUR, 240, '输送线异响停机，主电机烧毁', '更换主驱动电机11kW一台，重新找正联轴器', '电机绝缘老化+过载使用', '加装过载保护继电器，每月检测绝缘', 4800.00, 500.00, 5300.00, '生产线长', '王维修', '突发故障抢修'),
(UUID(), 'WX20260615001', 'eq-003', 'breakdown', 'completed', NOW() - INTERVAL 11 DAY, NOW() - INTERVAL 10 DAY + INTERVAL 8 HOUR, NOW() - INTERVAL 10 DAY + INTERVAL 2 HOUR, 120, '输送线速度不稳，同步带断裂', '更换同步齿形带HTD5M-1250', '同步带老化+张力过紧', '每月检查同步带张力，计划3个月更换', 960.00, 200.00, 1160.00, '生产线长', '张维修', '应急抢修'),
(UUID(), 'WX20260618001', 'eq-004', 'corrective', 'in_progress', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 9 HOUR, NULL, 480, '减速机漏油严重，二级齿轮磨损', '正在拆解检查，计划更换齿轮和油封', '长期超载运行+未及时换油', '严格控制负载，按期换油', 0.00, 500.00, 500.00, '巡检员', '李维修', '大修中，预计还需2天'),
(UUID(), 'WX20260610001', 'eq-005', 'breakdown', 'completed', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY + INTERVAL 2 HOUR, NOW() - INTERVAL 9 DAY + INTERVAL 7 HOUR, 300, '冷却塔风机异响，电机扫膛', '更换风机电机30kW，动平衡校准', '电机长期过载+轴承失效', '每月检查风机振动值', 14400.00, 800.00, 15200.00, '动力值班', '李维修', '耗时较长，影响循环水降温');

-- ========================================================
-- 结束
-- ========================================================
SELECT '数据库初始化完成！' AS status;
SELECT COUNT(*) AS '备件种类数' FROM spare_parts;
SELECT COUNT(*) AS '设备台数' FROM equipments;
SELECT SUM(current_stock) AS '库存总件数' FROM inventories;
SELECT COUNT(*) AS '流水记录数' FROM stock_movements;
