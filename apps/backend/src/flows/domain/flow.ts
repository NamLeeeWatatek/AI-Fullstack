import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class Flow {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiProperty({ type: String, default: 'draft' })
  status: string;

  @ApiProperty({ type: Number, default: 1 })
  version: number;

  @ApiPropertyOptional({ type: Number })
  templateId?: number | null;

  @ApiProperty({ type: Object })
  data: Record<string, any>;

  @ApiPropertyOptional({ type: String })
  userId?: string | null;

  @ApiPropertyOptional({ type: Number })
  channelId?: number | null;

  @ApiPropertyOptional({ type: Number })
  ownerId?: number | null;

  @ApiPropertyOptional({ type: Number })
  teamId?: number | null;

  @ApiProperty({ type: String, default: 'private' })
  visibility: string;

  @ApiProperty({ type: () => User })
  owner?: User;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
