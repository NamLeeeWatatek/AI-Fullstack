import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthCasdoorService } from './auth-casdoor.service';
import { CasdoorCallbackDto } from './dto/casdoor-callback.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';

@ApiTags('Casdoor Auth')
@Controller({
  path: 'auth/casdoor',
  version: '1',
})
export class AuthCasdoorController {
  constructor(private readonly authCasdoorService: AuthCasdoorService) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Casdoor OAuth callback' })
  async callback(
    @Body() casdoorCallbackDto: CasdoorCallbackDto,
  ): Promise<LoginResponseDto> {
    return this.authCasdoorService.handleCallback(casdoorCallbackDto);
  }
}
