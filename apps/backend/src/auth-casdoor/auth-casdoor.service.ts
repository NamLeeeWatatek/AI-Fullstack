import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import ms from 'ms';
import { AuthService } from '../auth/auth.service';
import { CasdoorCallbackDto } from './dto/casdoor-callback.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { AllConfigType } from '../config/config.type';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';

@Injectable()
export class AuthCasdoorService {
  private readonly logger = new Logger(AuthCasdoorService.name);
  private readonly casdoorEndpoint: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly appName: string;
  private readonly orgName: string;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
  ) {
    this.casdoorEndpoint = process.env.CASDOOR_ENDPOINT || 'http://localhost:8030';
    this.clientId = process.env.CASDOOR_CLIENT_ID || '';
    this.clientSecret = process.env.CASDOOR_CLIENT_SECRET || '';
    this.appName = process.env.CASDOOR_APP_NAME || 'wataomi-app';
    this.orgName = process.env.CASDOOR_ORG_NAME || 'wataomi';
  }

  async handleCallback(
    casdoorCallbackDto: CasdoorCallbackDto,
  ): Promise<LoginResponseDto> {
    const { code, state } = casdoorCallbackDto;

    this.logger.log(`Received Casdoor callback with code: ${code?.substring(0, 10)}...`);

    if (!code) {
      throw new UnauthorizedException('Authorization code is required');
    }

    try {
      // 1. Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      this.logger.log('Successfully exchanged code for token');

      // 2. Get user info from Casdoor
      const casdoorUser = await this.getCasdoorUserInfo(tokenResponse.access_token);
      this.logger.log(`Retrieved user info for: ${casdoorUser.name}`);

      // 3. Create or update user in database
      const user = await this.syncUser(casdoorUser);
      this.logger.log(`Synced user: ${user.email}`);

      // 4. Create session and generate JWT tokens
      const hash = crypto
        .createHash('sha256')
        .update(Math.random().toString())
        .digest('hex');

      const session = await this.sessionService.create({
        user,
        hash,
      });

      // Generate tokens manually since AuthService.getTokensData is private
      const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
        infer: true,
      });

      const tokenExpires = Date.now() + ms(tokenExpiresIn);

      const token = await this.jwtService.signAsync(
        {
          id: user.id,
          role: user.role,
          sessionId: session.id,
          hash,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        {
          sessionId: session.id,
          hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      );

      return {
        token,
        refreshToken,
        tokenExpires,
        user,
      };
    } catch (error) {
      this.logger.error(`Casdoor callback error: ${error.message}`);
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const tokenUrl = `${this.casdoorEndpoint}/api/login/oauth/access_token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Token exchange failed: ${error}`);
      throw new UnauthorizedException('Failed to exchange code for token');
    }

    return response.json();
  }

  private async getCasdoorUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = `${this.casdoorEndpoint}/api/userinfo`;

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Get user info failed: ${error}`);
      throw new UnauthorizedException('Failed to get user info');
    }

    return response.json();
  }

  private async syncUser(casdoorUser: any): Promise<any> {
    // Find or create user based on Casdoor ID or email
    // Casdoor user object structure: { id, name, displayName, email, isAdmin, ... }
    const userName = casdoorUser.name || casdoorUser.id;
    const email = casdoorUser.email || `${userName}`;
    
    this.logger.log(`Syncing user: ${email} (Casdoor ID: ${casdoorUser.id || casdoorUser.name})`);
    this.logger.log(`Casdoor user data:`, JSON.stringify(casdoorUser, null, 2));
    
    // Map Casdoor role to backend role
    // Casdoor có thể có: isAdmin, isGlobalAdmin, hoặc roles array
    const isAdmin = casdoorUser.isAdmin || 
                    casdoorUser.isGlobalAdmin || 
                    casdoorUser.type === 'admin' ||
                    (Array.isArray(casdoorUser.roles) && casdoorUser.roles.includes('admin'));
    
    const roleId = isAdmin ? 1 : 2; // 1 = admin, 2 = user (from RoleEnum)
    
    this.logger.log(`User role: ${isAdmin ? 'admin' : 'user'} (roleId: ${roleId})`);
    
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user
      user = await this.usersService.create({
        email,
        firstName: casdoorUser.displayName || casdoorUser.name,
        lastName: '',
        password: undefined, // No password for OAuth users
        provider: 'casdoor',
        socialId: casdoorUser.id || casdoorUser.name,
        role: { id: roleId },
        status: { id: 1 }, // 1 = active
      });
      this.logger.log(`Created new user: ${email} with role: ${isAdmin ? 'admin' : 'user'}`);
    } else {
      // Update existing user role if changed
      if (user.role?.id !== roleId) {
        user = await this.usersService.update(user.id, {
          role: { id: roleId },
        });
        this.logger.log(`Updated user role to: ${isAdmin ? 'admin' : 'user'}`);
      } else {
        this.logger.log(`User already exists: ${email} with correct role`);
      }
    }

    return user;
  }
}
