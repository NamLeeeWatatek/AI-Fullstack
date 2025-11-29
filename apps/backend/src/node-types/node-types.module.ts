import { Module } from '@nestjs/common';
import { NodeTypesController } from './node-types.controller';
import { NodeTypesService } from './node-types.service';

@Module({
  controllers: [NodeTypesController],
  providers: [NodeTypesService]
})
export class NodeTypesModule {}
