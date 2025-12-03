import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersService } from './ai-providers.service';
import {
  UserAiProviderEntity,
  WorkspaceAiProviderEntity,
  AiUsageLogEntity,
} from './infrastructure/persistence/relational/entities/ai-provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAiProviderEntity,
      WorkspaceAiProviderEntity,
      AiUsageLogEntity,
    ]),
  ],
  controllers: [AiProvidersController],
  providers: [AiProvidersService],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}
