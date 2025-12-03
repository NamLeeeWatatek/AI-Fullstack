import { Command, CommandRunner, Option } from 'nest-commander';
import { KBSyncService } from '../services/kb-sync.service';
import { Logger } from '@nestjs/common';

interface SyncCommandOptions {
  kbId: string;
  action: 'verify' | 'sync' | 'rebuild';
}

@Command({
  name: 'kb:sync',
  description: 'Sync knowledge base vectors with Qdrant',
})
export class KBSyncCommand extends CommandRunner {
  private readonly logger = new Logger(KBSyncCommand.name);

  constructor(private readonly syncService: KBSyncService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: SyncCommandOptions,
  ): Promise<void> {
    if (!options?.kbId) {
      this.logger.error('❌ Knowledge base ID is required (--kb-id)');
      return;
    }

    const action = options.action || 'verify';

    try {
      switch (action) {
        case 'verify':
          await this.verify(options.kbId);
          break;
        case 'sync':
          await this.sync(options.kbId);
          break;
        case 'rebuild':
          await this.rebuild(options.kbId);
          break;
        default:
          this.logger.error(`❌ Unknown action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  private async verify(kbId: string) {
    this.logger.log(`🔍 Verifying collection for KB: ${kbId}`);
    const result = await this.syncService.verifyCollection(kbId);

    this.logger.log(`📊 Total chunks: ${result.totalChunks}`);
    this.logger.log(`⚠️  Missing vectors: ${result.missingVectors}`);
    this.logger.log(`❌ Failed embeddings: ${result.failedEmbeddings}`);

    if (result.missingVectors === 0 && result.failedEmbeddings === 0) {
      this.logger.log('✅ Collection is healthy!');
    } else {
      this.logger.warn(
        '⚠️  Collection has issues. Run with --action=sync or --action=rebuild',
      );
    }
  }

  private async sync(kbId: string) {
    this.logger.log(`🔄 Syncing missing vectors for KB: ${kbId}`);
    const result = await this.syncService.syncMissingVectors(kbId);

    this.logger.log(`✅ Synced: ${result.synced}`);
    this.logger.log(`❌ Errors: ${result.errors}`);
  }

  private async rebuild(kbId: string) {
    this.logger.log(`🔄 Rebuilding entire collection for KB: ${kbId}`);
    this.logger.warn('⚠️  This will regenerate ALL embeddings!');

    const result = await this.syncService.rebuildCollection(kbId);

    this.logger.log(`✅ Processed: ${result.chunksProcessed}`);
    this.logger.log(`❌ Errors: ${result.errors}`);
  }

  @Option({
    flags: '--kb-id <kbId>',
    description: 'Knowledge base ID',
    required: true,
  })
  parseKbId(val: string): string {
    return val;
  }

  @Option({
    flags: '--action <action>',
    description: 'Action to perform: verify, sync, or rebuild',
    defaultValue: 'verify',
  })
  parseAction(val: string): 'verify' | 'sync' | 'rebuild' {
    if (!['verify', 'sync', 'rebuild'].includes(val)) {
      throw new Error('Action must be verify, sync, or rebuild');
    }
    return val as 'verify' | 'sync' | 'rebuild';
  }
}
