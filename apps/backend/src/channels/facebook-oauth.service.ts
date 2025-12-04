import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ChannelCredentialEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-credential.entity';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

interface FacebookUserPages {
  data: FacebookPage[];
}

@Injectable()
export class FacebookOAuthService {
  private readonly logger = new Logger(FacebookOAuthService.name);
  private readonly baseUrl = 'https://graph.facebook.com';
  private readonly apiVersion = 'v24.0';

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ChannelCredentialEntity)
    private credentialRepository: Repository<ChannelCredentialEntity>,
  ) {}

  /**
   * Get OAuth URL for user to login and grant permissions
   */
  getOAuthUrl(appId: string, redirectUri: string, state?: string): string {
    if (!appId) {
      throw new HttpException(
        'Facebook App ID not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const url = new URL('https://www.facebook.com/v24.0/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement');
    url.searchParams.set('response_type', 'code');
    
    if (state) {
      url.searchParams.set('state', state);
    }

    return url.toString();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    appId: string,
    appSecret: string,
  ): Promise<string> {
    if (!appId || !appSecret) {
      throw new HttpException(
        'Facebook credentials not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tokenUrl = new URL(`${this.baseUrl}/${this.apiVersion}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    try {
      const response = await fetch(tokenUrl.toString());
      
      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Token exchange failed:', error);
        throw new HttpException(
          error.error?.message || 'Failed to exchange code for token',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      this.logger.error('Token exchange error:', error);
      throw new HttpException(
        'Failed to exchange code for token',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get user's Facebook Pages with access tokens
   */
  async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    const pagesUrl = new URL(`${this.baseUrl}/${this.apiVersion}/me/accounts`);
    pagesUrl.searchParams.set('access_token', userAccessToken);
    pagesUrl.searchParams.set('fields', 'id,name,access_token,category,tasks');

    try {
      const response = await fetch(pagesUrl.toString());
      
      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Get pages failed:', error);
        throw new HttpException(
          error.error?.message || 'Failed to get Facebook pages',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data: FacebookUserPages = await response.json();
      return data.data || [];
    } catch (error) {
      this.logger.error('Get pages error:', error);
      throw new HttpException(
        'Failed to get Facebook pages',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get user info from Facebook (PSID to name and avatar)
   */
  async getUserInfo(userId: string, pageAccessToken: string): Promise<{
    name?: string;
    profile_pic?: string;
    first_name?: string;
    last_name?: string;
  }> {
    const userUrl = new URL(`${this.baseUrl}/${this.apiVersion}/${userId}`);
    userUrl.searchParams.set('access_token', pageAccessToken);
    userUrl.searchParams.set('fields', 'name,first_name,last_name,profile_pic');

    try {
      const response = await fetch(userUrl.toString());
      
      if (!response.ok) {
        const error = await response.json();
        this.logger.warn(`Get user info failed for ${userId}:`, error);
        return {};
      }

      return await response.json();
    } catch (error) {
      this.logger.warn(`Get user info error for ${userId}:`, error);
      return {};
    }
  }

  /**
   * Connect a Facebook Page to the system
   */
  async connectPage(
    pageId: string,
    pageName: string,
    pageAccessToken: string,
    workspaceId: string,
    userId: string,
    metadata?: any,
  ): Promise<ChannelConnectionEntity> {
    try {
      // Check if page already connected
      const existing = await this.connectionRepository.findOne({
        where: {
          type: 'facebook',
          workspaceId: workspaceId,
          metadata: { pageId } as any,
        },
      });

      if (existing) {
        // Update existing connection
        existing.accessToken = pageAccessToken;
        existing.status = 'active';
        existing.connectedAt = new Date();
        existing.metadata = {
          ...existing.metadata,
          ...metadata,
          pageId,
          pageName,
        };
        
        return this.connectionRepository.save(existing);
      }

      // Create new connection
      const connection = this.connectionRepository.create({
        name: `${pageName} - Facebook`,
        type: 'facebook',
        workspaceId: workspaceId,
        accessToken: pageAccessToken,
        status: 'active',
        connectedAt: new Date(),
        metadata: {
          pageId,
          pageName,
          ...metadata,
          connectedBy: userId,
        },
      });

      return this.connectionRepository.save(connection);
    } catch (error) {
      this.logger.error('Connect page error:', error);
      throw new HttpException(
        'Failed to connect Facebook page',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Disconnect a Facebook Page
   */
  async disconnectPage(connectionId: string, workspaceId: string): Promise<void> {
    try {
      await this.connectionRepository.delete({
        id: connectionId,
        workspaceId: workspaceId,
      });
    } catch (error) {
      this.logger.error('Disconnect page error:', error);
      throw new HttpException(
        'Failed to disconnect Facebook page',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all connected Facebook pages for a workspace
   */
  async getConnectedPages(workspaceId: string): Promise<ChannelConnectionEntity[]> {
    return this.connectionRepository.find({
      where: {
        type: 'facebook',
        workspaceId: workspaceId,
        status: 'active',
      },
      order: {
        connectedAt: 'DESC',
      },
    });
  }

  /**
   * Get or create Facebook credential for workspace
   */
  async getOrCreateCredential(
    workspaceId: string,
    appId?: string,
    appSecret?: string,
    verifyToken?: string,
  ): Promise<ChannelCredentialEntity> {
    // Try to find existing credential
    let credential = await this.credentialRepository.findOne({
      where: {
        provider: 'facebook',
        workspaceId: workspaceId,
        isActive: true,
      },
    });

    // If not found and credentials provided, create new
    if (!credential && appId && appSecret) {
      credential = this.credentialRepository.create({
        provider: 'facebook',
        workspaceId: workspaceId,
        name: 'Facebook App',
        clientId: appId,
        clientSecret: appSecret,
        isActive: true,
        metadata: {
          verifyToken: verifyToken || 'wataomi_verify_token',
          apiVersion: 'v24.0',
        },
      });
      await this.credentialRepository.save(credential);
    }

    if (!credential) {
      throw new HttpException(
        'Facebook App not configured. Please setup your Facebook App first.',
        HttpStatus.NOT_FOUND,
      );
    }

    return credential;
  }

  /**
   * Update Facebook credential
   */
  async updateCredential(
    workspaceId: string,
    appId: string,
    appSecret: string,
    verifyToken?: string,
  ): Promise<ChannelCredentialEntity> {
    let credential = await this.credentialRepository.findOne({
      where: {
        provider: 'facebook',
        workspaceId: workspaceId,
      },
    });

    if (credential) {
      credential.clientId = appId;
      credential.clientSecret = appSecret;
      credential.isActive = true;
      credential.metadata = {
        ...credential.metadata,
        verifyToken: verifyToken || credential.metadata?.verifyToken || 'wataomi_verify_token',
        apiVersion: 'v24.0',
      };
    } else {
      credential = this.credentialRepository.create({
        provider: 'facebook',
        workspaceId: workspaceId,
        name: 'Facebook App',
        clientId: appId,
        clientSecret: appSecret,
        isActive: true,
        metadata: {
          verifyToken: verifyToken || 'wataomi_verify_token',
          apiVersion: 'v24.0',
        },
      });
    }

    return this.credentialRepository.save(credential);
  }

  /**
   * Get Facebook credential for workspace
   */
  async getCredential(workspaceId: string): Promise<ChannelCredentialEntity | null> {
    return this.credentialRepository.findOne({
      where: {
        provider: 'facebook',
        workspaceId: workspaceId,
        isActive: true,
      },
    });
  }

  /**
   * Subscribe app to page webhooks
   */
  async subscribePageWebhooks(pageId: string, pageAccessToken: string): Promise<boolean> {
    const subscribeUrl = new URL(`${this.baseUrl}/${this.apiVersion}/${pageId}/subscribed_apps`);
    subscribeUrl.searchParams.set('access_token', pageAccessToken);
    subscribeUrl.searchParams.set('subscribed_fields', 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads');

    try {
      const response = await fetch(subscribeUrl.toString(), {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Subscribe webhooks failed:', error);
        return false;
      }

      const data = await response.json();
      this.logger.log(`Subscribed to webhooks for page ${pageId}:`, data);
      return data.success === true;
    } catch (error) {
      this.logger.error('Subscribe webhooks error:', error);
      return false;
    }
  }
}
