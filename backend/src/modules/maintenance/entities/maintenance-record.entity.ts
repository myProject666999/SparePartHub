import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { StockMovement } from '../../stock-movement/entities/stock-movement.entity';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  BREAKDOWN = 'breakdown',
  OVERHAUL = 'overhaul',
}

export enum MaintenanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('maintenance_records')
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 30, unique: true, comment: '维修单号' })
  orderNo: string;

  @Index()
  @Column({ type: 'uuid', comment: '设备ID' })
  equipmentId: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.CORRECTIVE,
    comment: '维修类型',
  })
  maintenanceType: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
    comment: '维修状态',
  })
  status: MaintenanceStatus;

  @Column({ type: 'datetime', nullable: true, comment: '故障发生时间' })
  faultTime: Date;

  @Column({ type: 'datetime', nullable: true, comment: '维修开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, comment: '维修完成时间' })
  endTime: Date;

  @Column({ type: 'int', default: 0, comment: '停机时长(分钟)' })
  downtimeMinutes: number;

  @Column({ length: 500, nullable: true, comment: '故障描述' })
  faultDescription: string;

  @Column({ length: 1000, nullable: true, comment: '维修内容/过程' })
  maintenanceContent: string;

  @Column({ length: 500, nullable: true, comment: '故障原因分析' })
  causeAnalysis: string;

  @Column({ length: 500, nullable: true, comment: '预防措施' })
  preventiveMeasures: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, comment: '备件费用合计' })
  sparePartCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '人工费用' })
  laborCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, comment: '维修总费用' })
  totalCost: number;

  @Column({ length: 50, nullable: true, comment: '报修人' })
  reporter: string;

  @Column({ length: 50, nullable: true, comment: '维修负责人' })
  maintainer: string;

  @Column({ length: 500, nullable: true, comment: '备注' })
  remark: string;

  @Column({ length: 50, default: 'system', comment: '创建人' })
  createdBy: string;

  @Column({ length: 50, default: 'system', comment: '更新人' })
  updatedBy: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => Equipment, (eq) => eq.maintenanceRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @OneToMany(() => StockMovement, (sm) => sm.maintenanceRecord)
  stockMovements: StockMovement[];
}
