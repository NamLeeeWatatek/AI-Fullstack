import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowEntity } from './infrastructure/persistence/relational/entities/flow.entity';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';
import { FlowsGateway } from './flows.gateway';
import { ExecutionGateway } from './execution.gateway';
import { ExecutionService } from './execution.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlowEntity])],
  controllers: [FlowsController],
  providers: [FlowsService, FlowsGateway, ExecutionGateway, ExecutionService],
  exports: [FlowsService, ExecutionGateway],
})
export class FlowsModule {}
