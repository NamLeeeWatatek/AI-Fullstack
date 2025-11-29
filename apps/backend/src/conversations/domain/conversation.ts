import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Conversation {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  botId: number;

  @ApiPropertyOptional({ type: Number })
  channelId?: number | null;

  @ApiProperty({ type: String })
  externalId: string;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class Message {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  conversationId: number;

  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ type: String, enum: ['user', 'bot', 'system'] })
  sender: string;

  @ApiProperty({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;
}
