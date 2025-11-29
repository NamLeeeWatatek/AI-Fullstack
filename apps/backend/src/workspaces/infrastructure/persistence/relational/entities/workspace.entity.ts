import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BotEntity } from '../../../../../bots/infrastructure/persistence/relational/entities/bot.entity';

@Entity({ name: 'workspace' })
export class WorkspaceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: String, unique: true })
  slug: string;

  @Column({ type: 'int' })
  ownerId: number;

  @ManyToOne(() => UserEntity)
  owner?: UserEntity;

  @OneToMany(() => BotEntity, (bot) => bot.workspace)
  bots?: BotEntity[];

  @OneToMany(() => WorkspaceMemberEntity, (member) => member.workspace)
  members?: WorkspaceMemberEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'workspace_member' })
export class WorkspaceMemberEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  workspaceId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: String, default: 'member' })
  role: string;

  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.members)
  workspace?: WorkspaceEntity;

  @ManyToOne(() => UserEntity)
  user?: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
