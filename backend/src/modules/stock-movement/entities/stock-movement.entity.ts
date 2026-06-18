import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SparePart } from '../../spare-part/entities/spare-part.entity';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance-record.entity';

export enum StockMovementType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  ADJUSTMENT_PLUS = 'adjustment_plus',
  ADJUSTMENT_MINUS = 'adjustment_minus',
  STOCKTAKE = 'stocktake',
  RETURN = 'return',
}

export enum StockMovementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 30, unique: true, comment: '流水单号' })
  orderNo: string;

  @Index()
  @Column({ type: 'uuid', comment: '备件ID' })
  sparePartId: string;

  @Column({
    type: 'enum',
    enum: StockMovementType,
    comment: '出入库类型',
  })
  movementType: StockMovementType;

  @Column({ type: 'int', comment: '变动数量(正数入库,负数出库)' })
  quantity: number;

  @Column({ type: 'int', default: 0, comment: '变动前库存' })
  stockBefore: number;

  @Column({ type: 'int', default: 0, comment: '变动后库存' })
  stockAfter: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '总金额' })
  totalAmount: number;

  @Column({ length: 100, nullable: true, comment: '采购单号/关联单号' })
  relatedOrderNo: string;

  @Column({ type: 'uuid', nullable: true, comment: '关联维修记录ID' })
  maintenanceRecordId: string;

  @Column({ type: 'uuid', nullable: true, comment: '关联设备ID' })
  equipmentId: string;

  @Column({ length: 50, nullable: true, comment: '供应商名称' })
  supplierName: string;

  @Column({ length: 50, nullable: true, comment: '领料人/入库经办人' })
  operator: string;

  @Column({ length: 50, nullable: true, comment: '领用部门' })
  department: string;

  @Column({
    type: 'enum',
    enum: StockMovementStatus,
    default: StockMovementStatus.COMPLETED,
    comment: '状态',
  })
  status: StockMovementStatus;

  @Column({ length: 500, nullable: true, comment: '备注' })
  remark: string;

  @Column({ length: 50, default: 'system', comment: '创建人' })
  createdBy: string;

  @Index()
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ManyToOne(() => SparePart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sparePartId' })
  sparePart: SparePart;

  @ManyToOne(() => MaintenanceRecord, (mr) => mr.stockMovements, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'maintenanceRecordId' })
  maintenanceRecord: MaintenanceRecord;
}
