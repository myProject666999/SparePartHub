import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PurchaseSuggestionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  COMPLETED = 'completed',
}

@Entity('purchase_suggestions')
export class PurchaseSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 30, unique: true, comment: '请购单号' })
  suggestionNo: string;

  @Index()
  @Column({ type: 'uuid', comment: '备件ID' })
  sparePartId: string;

  @Column({ type: 'int', comment: '当前库存' })
  currentStock: number;

  @Column({ type: 'int', comment: '安全库存' })
  safetyStock: number;

  @Column({ type: 'int', comment: '建议采购数量' })
  suggestedQuantity: number;

  @Column({ type: 'int', default: 0, comment: '已采购数量' })
  orderedQuantity: number;

  @Column({ type: 'int', comment: '缺口数量' })
  gapQuantity: number;

  @Column({ type: 'int', nullable: true, comment: '月均消耗量' })
  monthlyConsumption: number;

  @Column({ type: 'int', nullable: true, comment: '预计可用天数' })
  estimatedDaysLeft: number;

  @Column({ type: 'boolean', default: false, comment: '是否紧急采购' })
  isUrgent: boolean;

  @Column({
    type: 'enum',
    enum: PurchaseSuggestionStatus,
    default: PurchaseSuggestionStatus.PENDING,
    comment: '请购状态',
  })
  status: PurchaseSuggestionStatus;

  @Column({ type: 'datetime', nullable: true, comment: '预计到库时间' })
  expectedDeliveryDate: Date;

  @Column({ length: 100, nullable: true, comment: '采购单号' })
  purchaseOrderNo: string;

  @Column({ length: 50, nullable: true, comment: '审批人' })
  approver: string;

  @Column({ type: 'datetime', nullable: true, comment: '审批时间' })
  approvalTime: Date;

  @Column({ length: 500, nullable: true, comment: '审批意见' })
  approvalRemark: string;

  @Column({ length: 500, nullable: true, comment: '备注' })
  remark: string;

  @Column({ length: 50, default: 'system', comment: '创建人' })
  createdBy: string;

  @Column({ length: 50, default: 'system', comment: '更新人' })
  updatedBy: string;

  @Index()
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
