import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract workspaceId from request
 * Can be from params, query, or body
 */
export const WorkspaceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    // Try to get from params first (e.g., /workspaces/:workspaceId/bots)
    if (request.params?.workspaceId) {
      return request.params.workspaceId;
    }

    // Try to get from query (e.g., ?workspaceId=xxx)
    if (request.query?.workspaceId) {
      return request.query.workspaceId;
    }

    // Try to get from body
    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }

    return undefined;
  },
);
