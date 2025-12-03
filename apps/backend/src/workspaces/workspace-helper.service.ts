import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';

/**
 * Workspace Helper Service
 * Provides utility methods for workspace operations
 */
@Injectable()
export class WorkspaceHelperService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private memberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  /**
   * Get user's default workspace (first joined)
   */
  async getUserDefaultWorkspace(userId: string) {
    const membership = await this.memberRepository.findOne({
      where: { userId },
      relations: ['workspace'],
      order: { joinedAt: 'ASC' },
    });

    return membership?.workspace || null;
  }

  /**
   * Get all workspaces for user
   */
  async getUserWorkspaces(userId: string) {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['workspace'],
      order: { joinedAt: 'ASC' },
    });

    return memberships
      .map((m) => m.workspace)
      .filter((w): w is WorkspaceEntity => !!w && !w.deletedAt);
  }

  /**
   * Ensure user has at least one workspace
   * Creates a default workspace if none exists
   */
  async ensureUserHasWorkspace(userId: string, userName?: string) {
    let workspace = await this.getUserDefaultWorkspace(userId);

    if (!workspace) {
      // Create default workspace for user
      workspace = await this.createDefaultWorkspace(userId, userName);
    }

    return workspace;
  }

  /**
   * Create default workspace for user
   */
  async createDefaultWorkspace(userId: string, userName?: string) {
    const workspaceName = userName ? `${userName}'s Workspace` : 'My Workspace';
    const slug = `workspace-${userId.substring(0, 8)}-${Date.now()}`;

    const workspace = this.workspaceRepository.create({
      name: workspaceName,
      slug,
      ownerId: userId,
      plan: 'free',
    });

    const saved = await this.workspaceRepository.save(workspace);

    // Add user as owner member
    await this.memberRepository.save({
      workspaceId: saved.id,
      userId,
      role: 'owner',
    });

    return saved;
  }

  /**
   * Check if user is member of workspace
   */
  async isUserMemberOfWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { userId, workspaceId },
    });
    return !!member;
  }

  /**
   * Get user's role in workspace
   */
  async getUserRoleInWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<'owner' | 'admin' | 'member' | null> {
    const member = await this.memberRepository.findOne({
      where: { userId, workspaceId },
    });
    return member?.role || null;
  }

  /**
   * Validate user has access to workspace
   */
  async validateUserWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const isMember = await this.isUserMemberOfWorkspace(userId, workspaceId);
    if (!isMember) {
      throw new BadRequestException('You do not have access to this workspace');
    }
  }
}
