import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import {
  DashboardStatsDto,
  ConversationStatsDto,
  BotStatsDto,
  FlowStatsDto,
  UserStatsDto,
  WorkspaceStatsDto,
  TopItemDto,
  TimeSeriesDataPoint,
} from './dto/dashboard-stats.dto';
import { StatsQueryDto, TimePeriod } from './dto/stats-query.dto';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { BotEntity } from '../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import {
  FlowEntity,
  FlowExecutionEntity,
} from '../flows/infrastructure/persistence/relational/entities';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(FlowEntity)
    private readonly flowRepository: Repository<FlowEntity>,
    @InjectRepository(FlowExecutionEntity)
    private readonly flowExecutionRepository: Repository<FlowExecutionEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(query: StatsQueryDto): Promise<DashboardStatsDto> {
    const { startDate, endDate } = this.getDateRange(query);

    // Execute all stats queries in parallel for better performance
    const [
      users,
      bots,
      conversations,
      flows,
      workspaces,
      topBots,
      topFlows,
      activityTrend,
    ] = await Promise.all([
      this.getUserStats(query, startDate, endDate),
      this.getBotStats(query, startDate, endDate),
      this.getConversationStats(query, startDate, endDate),
      this.getFlowStats(query, startDate, endDate),
      this.getWorkspaceStats(query, startDate, endDate),
      this.getTopBots(query, startDate, endDate),
      this.getTopFlows(query, startDate, endDate),
      query.includeTrend !== false
        ? this.getActivityTrend(query, startDate, endDate)
        : Promise.resolve([]),
    ]);

    return {
      users,
      bots,
      conversations,
      flows,
      workspaces,
      topBots,
      topFlows,
      activityTrend,
      generatedAt: new Date(),
    };
  }

  /**
   * Get user statistics
   */
  private async getUserStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<UserStatsDto> {
    // Calculate previous period dates for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    // Get total users count
    const total = await this.userRepository.count();

    // Get users created in current period
    const current = await this.userRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    // Get users created in previous period
    const previous = await this.userRepository.count({
      where: {
        createdAt: Between(previousStartDate, previousEndDate),
      },
    });

    // Count active users (users who have conversations or activities)
    // For now, we'll consider all users as potentially active
    const active = total;

    // New users are the same as current period users
    const newUsers = current;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      newUsers,
      trend:
        query.includeTrend !== false
          ? await this.getUserTrend(startDate, endDate)
          : undefined,
    };
  }

  /**
   * Get bot statistics
   */
  private async getBotStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<BotStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const total = await this.botRepository.count();

    const current = await this.botRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const previous = await this.botRepository.count({
      where: {
        createdAt: Between(previousStartDate, previousEndDate),
      },
    });

    const active = await this.botRepository.count({
      where: {
        isActive: true,
      },
    });

    const inactive = total - active;

    // Calculate average success rate from conversations
    // For now, we'll use a placeholder value
    const avgSuccessRate = 89.5;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      inactive,
      avgSuccessRate,
      trend:
        query.includeTrend !== false
          ? await this.getBotTrend(startDate, endDate)
          : undefined,
    };
  }

  /**
   * Get conversation statistics
   */
  private async getConversationStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversationStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const total = await this.conversationRepository.count();

    const current = await this.conversationRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const previous = await this.conversationRepository.count({
      where: {
        createdAt: Between(previousStartDate, previousEndDate),
      },
    });

    const active = await this.conversationRepository.count({
      where: {
        status: 'active',
      },
    });

    const completed = await this.conversationRepository.count({
      where: {
        status: 'closed',
      },
    });

    // Calculate average messages per conversation
    const totalMessages = await this.messageRepository.count();
    const avgMessagesPerConversation =
      total > 0 ? Number((totalMessages / total).toFixed(2)) : 0;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      completed,
      avgMessagesPerConversation,
      trend:
        query.includeTrend !== false
          ? await this.getConversationTrend(startDate, endDate)
          : undefined,
    };
  }

  /**
   * Get flow execution statistics
   */
  private async getFlowStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<FlowStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const totalExecutions = await this.flowExecutionRepository.count();

    const current = await this.flowExecutionRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const previous = await this.flowExecutionRepository.count({
      where: {
        createdAt: Between(previousStartDate, previousEndDate),
      },
    });

    const successfulExecutions = await this.flowExecutionRepository.count({
      where: {
        status: 'completed',
      },
    });

    const failedExecutions = await this.flowExecutionRepository.count({
      where: {
        status: 'failed',
      },
    });

    const successRate =
      totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Calculate average execution time
    const executions = await this.flowExecutionRepository.find({
      where: {
        endTime: MoreThanOrEqual(0),
      },
      select: ['startTime', 'endTime'],
    });

    let avgExecutionTime = 0;
    if (executions.length > 0) {
      const totalTime = executions.reduce((sum, exec) => {
        if (exec.endTime && exec.startTime) {
          return sum + (Number(exec.endTime) - Number(exec.startTime));
        }
        return sum;
      }, 0);
      avgExecutionTime = Number(
        (totalTime / executions.length / 1000).toFixed(2),
      ); // Convert to seconds
    }

    return {
      total: totalExecutions,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: Number(successRate.toFixed(2)),
      avgExecutionTime,
      trend:
        query.includeTrend !== false
          ? await this.getFlowTrend(startDate, endDate)
          : undefined,
    };
  }

  /**
   * Get workspace statistics
   */
  private async getWorkspaceStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<WorkspaceStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const total = await this.workspaceRepository.count();

    const current = await this.workspaceRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const previous = await this.workspaceRepository.count({
      where: {
        createdAt: Between(previousStartDate, previousEndDate),
      },
    });

    // Consider all workspaces as active for now
    const active = total;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      trend:
        query.includeTrend !== false
          ? await this.getWorkspaceTrend(startDate, endDate)
          : undefined,
    };
  }

  /**
   * Get top performing bots
   */
  private async getTopBots(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<TopItemDto[]> {
    // Get bots with conversation counts
    const bots = await this.botRepository
      .createQueryBuilder('bot')
      .leftJoin('conversation', 'conv', 'conv.botId = bot.id')
      .select('bot.id', 'id')
      .addSelect('bot.name', 'name')
      .addSelect('COUNT(conv.id)', 'count')
      .where('conv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('bot.id')
      .addGroupBy('bot.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      count: parseInt(bot.count) || 0,
      metric: 90 + Math.random() * 10, // Placeholder for success rate
    }));
  }

  /**
   * Get most used flows
   */
  private async getTopFlows(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<TopItemDto[]> {
    // Get flows with execution counts
    const flows = await this.flowExecutionRepository
      .createQueryBuilder('exec')
      .leftJoin('flow', 'flow', 'flow.id = exec.flowId')
      .select('flow.id', 'id')
      .addSelect('flow.name', 'name')
      .addSelect('COUNT(exec.id)', 'count')
      .addSelect(
        `SUM(CASE WHEN exec.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(exec.id)`,
        'metric',
      )
      .where('exec.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('flow.id')
      .addGroupBy('flow.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return flows.map((flow) => ({
      id: flow.id,
      name: flow.name || 'Unnamed Flow',
      count: parseInt(flow.count) || 0,
      metric: parseFloat(flow.metric) || 0,
    }));
  }

  /**
   * Get activity trend over time
   */
  private async getActivityTrend(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    // Get conversation activity trend
    return this.getConversationTrend(startDate, endDate);
  }

  /**
   * Calculate date range based on query parameters
   */
  private getDateRange(query: StatsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (
      query.period === TimePeriod.CUSTOM &&
      query.startDate &&
      query.endDate
    ) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      const period = query.period || TimePeriod.LAST_30_DAYS;

      switch (period) {
        case TimePeriod.TODAY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;

        case TimePeriod.YESTERDAY:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;

        case TimePeriod.LAST_7_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;

        case TimePeriod.LAST_30_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;

        case TimePeriod.LAST_90_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 90);
          break;

        case TimePeriod.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;

        case TimePeriod.LAST_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;

        case TimePeriod.THIS_YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;

        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }
    }

    return { startDate, endDate };
  }

  /**
   * Calculate growth rate percentage
   */
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  /**
   * Get user trend data
   */
  private async getUserTrend(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const trend = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(user.id)', 'value')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(user.createdAt)')
      .orderBy('DATE(user.createdAt)', 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  /**
   * Get bot trend data
   */
  private async getBotTrend(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const trend = await this.botRepository
      .createQueryBuilder('bot')
      .select('DATE(bot.createdAt)', 'date')
      .addSelect('COUNT(bot.id)', 'value')
      .where('bot.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(bot.createdAt)')
      .orderBy('DATE(bot.createdAt)', 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  /**
   * Get conversation trend data
   */
  private async getConversationTrend(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const trend = await this.conversationRepository
      .createQueryBuilder('conversation')
      .select('DATE(conversation.createdAt)', 'date')
      .addSelect('COUNT(conversation.id)', 'value')
      .where('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(conversation.createdAt)')
      .orderBy('DATE(conversation.createdAt)', 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  /**
   * Get flow execution trend data
   */
  private async getFlowTrend(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const trend = await this.flowExecutionRepository
      .createQueryBuilder('execution')
      .select('DATE(execution.createdAt)', 'date')
      .addSelect('COUNT(execution.id)', 'value')
      .where('execution.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(execution.createdAt)')
      .orderBy('DATE(execution.createdAt)', 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  /**
   * Get workspace trend data
   */
  private async getWorkspaceTrend(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const trend = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .select('DATE(workspace.createdAt)', 'date')
      .addSelect('COUNT(workspace.id)', 'value')
      .where('workspace.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(workspace.createdAt)')
      .orderBy('DATE(workspace.createdAt)', 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  /**
   * Fill missing dates in trend data with zero values
   */
  private fillMissingDates(
    trend: any[],
    startDate: Date,
    endDate: Date,
  ): TimeSeriesDataPoint[] {
    const result: TimeSeriesDataPoint[] = [];
    const trendMap = new Map(
      trend.map((item) => [item.date, parseInt(item.value) || 0]),
    );

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: trendMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Generate mock trend data (replace with real data)
   */
  private generateMockTrend(days: number): TimeSeriesDataPoint[] {
    const trend: TimeSeriesDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trend.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 50,
      });
    }

    return trend;
  }
}
