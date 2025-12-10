import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * UserAiProvider domain entity - theo schema má»›i
 * Table: user_ai_providers
 */
export class UserAiProvider {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({
    type: String,
    enum: ['openai', 'anthropic', 'google', 'azure', 'custom'],
  })
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

  @ApiProperty({ type: String, example: 'My OpenAI Key' })
  displayName: string;

  @ApiPropertyOptional({ type: String, description: 'Encrypted API key' })
  apiKeyEncrypted?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Available models for this provider',
  })
  modelList?: string[];

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: Boolean, default: false })
  isVerified: boolean;

  @ApiPropertyOptional({ type: Date })
  verifiedAt?: Date | null;

  @ApiProperty({ type: Number, default: 0 })
  quotaUsed: number;

  @ApiPropertyOptional({ type: Date })
  lastUsedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

/**
 * WorkspaceAiProvider domain entity - theo schema má»›i
 * Table: workspace_ai_providers
 */
export class WorkspaceAiProvider {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({
    type: String,
    enum: ['openai', 'anthropic', 'google', 'azure', 'custom'],
  })
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

  @ApiProperty({ type: String })
  displayName: string;

  @ApiPropertyOptional({ type: String })
  apiKeyEncrypted?: string;

  @ApiPropertyOptional({ type: [String] })
  modelList?: string[];

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: Number, default: 0 })
  quotaUsed: number;

  @ApiProperty()
  createdAt: Date;
}

/**
 * AiUsageLog domain entity - theo schema má»›i
 * Table: ai_usage_logs
 */
export class AiUsageLog {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  provider: string;

  @ApiProperty({ type: String })
  model: string;

  @ApiProperty({ type: Number })
  inputTokens: number;

  @ApiProperty({ type: Number })
  outputTokens: number;

  @ApiProperty({ type: Number, description: 'Cost in USD' })
  cost: number;

  @ApiProperty()
  requestedAt: Date;
}

