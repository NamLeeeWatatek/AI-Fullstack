import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Channels')
@Controller({ path: 'channels', version: '1' })
export class ChannelsController {
  @Get()
  @ApiOperation({ summary: 'Get all channels' })
  findAll() {
    // Mock data for now
    return [
      {
        id: 1,
        name: 'General',
        type: 'text',
        platform: 'internal',
      },
      {
        id: 2,
        name: 'Support',
        type: 'text',
        platform: 'internal',
      },
    ];
  }
}
