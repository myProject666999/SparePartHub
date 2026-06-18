import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SparePartEquipment } from './spare-part-equipment.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';

export enum SparePartStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OBSOLETE = 'obsolete',
}

export enum SparePartCategory {
  BEARING = 'bearing',
  BELT = 'belt',
  MOTOR = 'motor',
  SENSOR = 'sensor',
  SEAL = 'seal',
  GEAR = 'gear',
  OTHER = 'other',
}

@Entity('spare_parts')
export class SparePart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 50, unique: true, comment: '备件编码' })
  code: string;

  @Index()
  @Column({ length: 100, comment: '备件名称' })
  name: string;

  @Column({
    type: 'enum',
    enum: SparePartCategory,
    default: SparePartCategory.OTHER,
    comment: '备件分类',
  })
  category: SparePartCategory;

  @Column({ length: 200, comment: '规格型号' })
  specification: string;

  @Column({ length: 50, nullable: true, comment: '品牌' })
  brand: string;

  @Column({ length: 50, nullable: true, comment: '生产厂商' })
  manufacturer: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '单价(元)' })
  unitPrice: number;

  @Column({ length: 20, default: '件', comment: '计量单位' })
  unit: string;

  @Column({ length: 50, comment: '存放货位' })
  storageLocation: string;

  @Column({ type: 'int', default: 0, comment: '安全库存下限' })
  safetyStock: number;

  @Column({ type: 'int', default: 10, comment: '请购推荐数量' })
  purchaseQuantity: number;

  @Column({ length: 500, nullable: true, comment: '技术参数' })
  technicalParams: string;

  @Column({ length: 500, nullable: true, comment: '备注说明' })
  remark: string;

  @Column({ type: 'boolean', default: false, comment: '是否常用备件(Redis缓存)' })
  isHot: boolean;

  @Column({ length: 200, nullable: true, comment: '二维码/条码内容' })
  barcode: string;

  @Column({
    type: 'enum',
    enum: SparePartStatus,
    default: SparePartStatus.ACTIVE,
    comment: '状态',
  })
  status: SparePartStatus;

  @Column({ length: 50, default: 'system', comment: '创建人' })
  createdBy: string;

  @Column({ length: 50, default: 'system', comment: '更新人' })
  updatedBy: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => SparePartEquipment, (spe) => spe.sparePart)
  equipmentRelations: SparePartEquipment[];

  @OneToMany(() => Inventory, (inv) => inv.sparePart)
  inventories: Inventory[];
}
