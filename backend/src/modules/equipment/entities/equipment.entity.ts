import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SparePartEquipment } from '../../spare-part/entities/spare-part-equipment.entity';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance-record.entity';

export enum EquipmentStatus {
  RUNNING = 'running',
  STANDBY = 'standby',
  MAINTENANCE = 'maintenance',
  FAULT = 'fault',
  SCRAPPED = 'scrapped',
}

@Entity('equipments')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 50, unique: true, comment: '设备编号' })
  code: string;

  @Index()
  @Column({ length: 100, comment: '设备名称' })
  name: string;

  @Column({ length: 100, nullable: true, comment: '设备型号' })
  model: string;

  @Column({ length: 50, nullable: true, comment: '设备类别' })
  category: string;

  @Column({ length: 50, nullable: true, comment: '所属车间/产线' })
  workshop: string;

  @Column({ length: 100, nullable: true, comment: '安装位置' })
  location: string;

  @Column({ type: 'date', nullable: true, comment: '投产日期' })
  commissionDate: Date;

  @Column({ type: 'int', default: 0, comment: '累计维修次数' })
  maintenanceCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '累计备件消耗金额' })
  totalSparePartCost: number;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.RUNNING,
    comment: '设备状态',
  })
  status: EquipmentStatus;

  @Column({ length: 50, nullable: true, comment: '负责人' })
  responsiblePerson: string;

  @Column({ length: 20, nullable: true, comment: '联系电话' })
  contactPhone: string;

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

  @OneToMany(() => SparePartEquipment, (spe) => spe.equipment)
  sparePartRelations: SparePartEquipment[];

  @OneToMany(() => MaintenanceRecord, (mr) => mr.equipment)
  maintenanceRecords: MaintenanceRecord[];
}
