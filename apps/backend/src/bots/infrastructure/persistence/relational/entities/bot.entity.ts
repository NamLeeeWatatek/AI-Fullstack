import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Entity({ name: 'bot' })
export class BotEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  workspaceId?: number | null;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: String, default: 'FiMessageSquare' })
  icon: string;

  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  flowId?: number | null;

  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.bots)
  workspace?: WorkspaceEntity;

  @OneToMany(() => FlowVersionEntity, (version) => version.bot)
  flowVersions?: FlowVersionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'flow_version' })
export class FlowVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  botId: number;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb' })
  flow: Record<string, any>;

  @Column({ type: Boolean, default: false })
  isPublished: boolean;

  @ManyToOne(() => BotEntity, (bot) => bot.flowVersions)
  bot?: BotEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
