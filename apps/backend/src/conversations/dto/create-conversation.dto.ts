import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  botId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  channelId?: number;

  @ApiProperty({ example: 'user-123' })
  @IsNotEmpty()
  @IsString()
  externalId: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'user' })
  @IsNotEmpty()
  @IsString()
  sender: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
