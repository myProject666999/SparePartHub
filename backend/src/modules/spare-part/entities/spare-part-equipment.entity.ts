import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { SparePart } from './spare-part.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Entity('spare_part_equipment')
@Unique(['sparePartId', 'equipmentId'])
export class SparePartEquipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', comment: '备件ID' })
  sparePartId: string;

  @Index()
  @Column({ type: 'uuid', comment: '设备ID' })
  equipmentId: string;

  @Column({ length: 100, nullable: true, comment: '安装位置描述' })
  installPosition: string;

  @Column({ type: 'int', default: 1, comment: '单台设备用量' })
  usagePerEquipment: number;

  @Column({ length: 500, nullable: true, comment: '更换说明' })
  replaceInstruction: string;

  @CreateDateColumn({ type: 'datetime', comment: '关联时间' })
  createdAt: Date;

  @ManyToOne(() => SparePart, (sp) => sp.equipmentRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sparePartId' })
  sparePart: SparePart;

  @ManyToOne(() => Equipment, (eq) => eq.sparePartRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;
}
