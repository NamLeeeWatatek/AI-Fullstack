import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { StatsQueryDto } from './dto/stats-query.dto';

@ApiTags('Stats')
@ApiBearerAuth()
// @UseGuards(AuthGuard('jwt')) // TODO: Uncomment for production
@Controller({ path: 'stats', version: '1' })
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve comprehensive statistics for the dashboard including users, bots, conversations, flows, and workspaces',
  })
  @ApiOkResponse({
    type: DashboardStatsDto,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @Query() query: StatsQueryDto,
  ): Promise<DashboardStatsDto> {
    return this.statsService.getDashboardStats(query);
  }
}
