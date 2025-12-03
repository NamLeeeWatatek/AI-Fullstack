import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceHelperService } from './workspace-helper.service';

import { WorkspaceAccessGuard } from './guards/workspace-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity, WorkspaceMemberEntity])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceHelperService, WorkspaceAccessGuard],
  exports: [WorkspacesService, WorkspaceHelperService, WorkspaceAccessGuard],
})
export class WorkspacesModule {}
