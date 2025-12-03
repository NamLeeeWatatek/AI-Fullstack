import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import facebookConfig from './auth-facebook/config/facebook.config';
import googleConfig from './auth-google/config/google.config';
import appleConfig from './auth-apple/config/apple.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAppleModule } from './auth-apple/auth-apple.module';
import { AuthFacebookModule } from './auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { AuthCasdoorModule } from './auth-casdoor/auth-casdoor.module';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './database/mongoose-config.service';
import { DatabaseConfig } from './database/config/database-config.type';
// Core modules
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';
// Bot & Flow modules
import { BotsModule } from './bots/bots.module';
import { FlowsModule } from './flows/flows.module';
import { NodeTypesModule } from './node-types/node-types.module';
// Communication modules
import { ConversationsModule } from './conversations/conversations.module';
import { ChannelsModule } from './channels/channels.module';
// Knowledge & AI modules
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
// Other modules
import { TemplatesModule } from './templates/templates.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { StatsModule } from './stats/stats.module';
// New modules
import { WebhooksModule } from './webhooks/webhooks.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
// Legacy modules (to be removed/merged later)
import { PermissionsModule } from './permissions/permissions.module';

// <database-block>
const infrastructureDatabaseModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    })
  : TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    });
// </database-block>

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        facebookConfig,
        googleConfig,
        appleConfig,
      ],
      envFilePath: ['.env'],
    }),
    EventEmitterModule.forRoot(),
    // Cache Module (Global)
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
    }),
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),

    // Core modules
    UsersModule,
    FilesModule,
    WorkspacesModule,
    AiProvidersModule,

    // Auth modules
    AuthModule,
    AuthFacebookModule,
    AuthGoogleModule,
    AuthAppleModule,
    AuthCasdoorModule,
    SessionModule,

    // Communication
    MailModule,
    MailerModule,

    // Bot & Flow
    BotsModule,
    FlowsModule,
    NodeTypesModule,

    // Conversations & Channels
    ConversationsModule,
    ChannelsModule,

    // Knowledge & AI
    // KnowledgeBaseModule,

    // Other
    HomeModule,
    TemplatesModule,
    IntegrationsModule,
    StatsModule,

    // New modules
    WebhooksModule,
    SubscriptionsModule,
    AuditModule,
    NotificationsModule,

    // Legacy (to be removed/merged)
    PermissionsModule,
  ],
})
export class AppModule {}
