import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'flow' })
export class FlowEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: String, default: 'draft' })
  status: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'int', nullable: true })
  templateId?: number | null;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @Column({ type: String, nullable: true })
  userId?: string | null;

  @Column({ type: 'int', nullable: true })
  channelId?: number | null;

  @Column({ type: 'int', nullable: true })
  ownerId?: number | null;

  @Column({ type: 'int', nullable: true })
  teamId?: number | null;

  @Column({ type: String, default: 'private' })
  visibility: string;

  @ManyToOne(() => UserEntity)
  owner?: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
