import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateFlowDto {
  @ApiProperty({ example: 'Welcome Flow' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Greets new users' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  templateId?: number;

  @ApiProperty({ example: {} })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  channelId?: number;

  @ApiPropertyOptional({ example: 'private' })
  @IsOptional()
  @IsString()
  visibility?: string;
}
