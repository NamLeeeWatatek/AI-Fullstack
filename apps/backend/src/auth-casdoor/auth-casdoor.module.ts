import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthCasdoorController } from './auth-casdoor.controller';
import { AuthCasdoorService } from './auth-casdoor.service';
import { AuthModule } from '../auth/auth.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, SessionModule, UsersModule, JwtModule],
  controllers: [AuthCasdoorController],
  providers: [AuthCasdoorService],
  exports: [AuthCasdoorService],
})
export class AuthCasdoorModule {}
