import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceHelperService } from '../workspace-helper.service';

/**
 * Guard to validate user has access to workspace
 * Use with @UseGuards(WorkspaceAccessGuard)
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private workspaceHelper: WorkspaceHelperService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get workspaceId from params, query, or body
    const workspaceId =
      request.params?.workspaceId ||
      request.query?.workspaceId ||
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    // Check if user is member of workspace
    const isMember = await this.workspaceHelper.isUserMemberOfWorkspace(
      user.id,
      workspaceId,
    );

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach workspace info to request for later use
    request.workspaceId = workspaceId;

    return true;
  }
}
