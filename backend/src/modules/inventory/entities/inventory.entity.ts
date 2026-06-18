import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SparePart } from '../../spare-part/entities/spare-part.entity';

@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', comment: '备件ID' })
  sparePartId: string;

  @Column({ type: 'int', default: 0, comment: '当前库存数量' })
  currentStock: number;

  @Column({ type: 'int', default: 0, comment: '已分配数量(待出库)' })
  allocatedStock: number;

  @Column({ type: 'int', default: 0, comment: '在途数量(采购中)' })
  inTransitStock: number;

  @Column({ type: 'int', default: 0, comment: '月平均消耗量' })
  monthlyConsumption: number;

  @Column({ type: 'int', default: 0, comment: '累计入库数量' })
  totalInbound: number;

  @Column({ type: 'int', default: 0, comment: '累计出库数量' })
  totalOutbound: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, comment: '库存金额' })
  inventoryValue: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后入库时间' })
  lastInboundAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '最后出库时间' })
  lastOutboundAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '最后盘点时间' })
  lastStocktakeAt: Date;

  @Column({ length: 50, default: 'system', comment: '更新人' })
  updatedBy: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  @OneToOne(() => SparePart, (sp) => sp.inventories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sparePartId' })
  sparePart: SparePart;
}
