import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotEntity, FlowVersionEntity } from './infrastructure/persistence/relational/entities/bot.entity';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BotEntity, FlowVersionEntity])],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
