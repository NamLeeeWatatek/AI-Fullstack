import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class Workspace {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: Number })
  ownerId: number;

  @ApiProperty({ type: () => User })
  owner?: User;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WorkspaceMember {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  workspaceId: number;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String, enum: ['owner', 'admin', 'member'] })
  role: string;

  @ApiProperty({ type: () => Workspace })
  workspace?: Workspace;

  @ApiProperty({ type: () => User })
  user?: User;

  @ApiProperty()
  createdAt: Date;
}
