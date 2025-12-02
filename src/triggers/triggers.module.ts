import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { CronService } from './cron.service';
import { WebhookController } from './webhook.controller';
import { Node } from '../database/entities/node.entity';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [TypeOrmModule.forFeature([Node]), forwardRef(() => ExecutionModule)],
  controllers: [WebhookController],
  providers: [WebhookService, CronService],
  exports: [WebhookService, CronService],
})
export class TriggersModule {}
