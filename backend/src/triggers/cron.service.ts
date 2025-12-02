import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import { Node } from '../database/entities/node.entity';
import { ExecutionService } from '../execution/execution.service';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronService.name);
  private readonly cronJobs = new Map<string, CronJob>();

  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @Inject(forwardRef(() => ExecutionService))
    private readonly executionService: ExecutionService,
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflowsService: WorkflowsService,
  ) {}

  onModuleInit() {
    this.loadCronJobs();
  }

  onModuleDestroy() {
    this.stopAllCronJobs();
  }

  private async loadCronJobs() {
    try {
      const cronNodes = await this.nodeRepository.find({
        where: { type: 'trigger', subtype: 'cron' },
        relations: ['workflow'],
      });
      for (const node of cronNodes) {
        if (node.config?.cronExpression && node.config?.cronActive === true) {
          await this.registerCronJob(node, true);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load cron jobs:', error);
    }
  }

  private async registerCronJob(node: Node, startImmediately: boolean = false): Promise<void> {
    if (node.type !== 'trigger' || node.subtype !== 'cron') {
      this.logger.warn(`Node ${node.id} is not a cron trigger node`);
      return;
    }

    const cronExpression = node.config?.cronExpression;
    if (!cronExpression) {
      this.logger.warn(`Node ${node.id} does not have cronExpression in config`);
      return;
    }

    if (!node.workflowId) {
      this.logger.error(`Node ${node.id} does not have workflowId`);
      return;
    }

    const jobId = `cron-${node.id}`;

    if (this.cronJobs.has(jobId)) {
      this.stopCronJob(jobId);
    }

    try {
      const job = new CronJob(
        cronExpression,
        async () => {
          this.logger.log(`Executing cron job for workflow ${node.workflowId}`);
          try {
            const workflow = await this.workflowsService.findOne(node.workflowId);
            if (workflow.status !== 'active') {
              this.logger.warn(
                `Cron job for workflow ${node.workflowId} skipped - workflow is not active (status: ${workflow.status})`,
              );
              return;
            }
            await this.executionService.executeWorkflow(node.workflowId, {
              triggeredBy: 'cron',
              triggeredAt: new Date().toISOString(),
            });
          } catch (error) {
            this.logger.error(`Cron job execution failed: ${error.message}`);
          }
        },
        null,
        startImmediately,
      );

      this.cronJobs.set(jobId, job);
      this.logger.log(
        `Registered cron job: ${jobId} with expression: ${cronExpression} for workflow ${node.workflowId}, started: ${startImmediately}`,
      );
    } catch (error) {
      this.logger.error(`Failed to register cron job: ${error.message}`);
      throw error;
    }
  }

  async scheduleCronJob(node: Node): Promise<void> {
    await this.registerCronJob(node, true);
  }

  async unscheduleCronJob(nodeId: string): Promise<void> {
    const jobId = `cron-${nodeId}`;
    this.stopCronJob(jobId);
  }

  async stopAllCronJobsForWorkflow(workflowId: string): Promise<void> {
    this.logger.log(`Stopping all cron jobs for workflow ${workflowId}`);
    try {
      const cronNodes = await this.nodeRepository.find({
        where: { type: 'trigger', subtype: 'cron', workflowId },
      });
      for (const node of cronNodes) {
        const jobId = `cron-${node.id}`;
        if (this.cronJobs.has(jobId)) {
          this.stopCronJob(jobId);
          if (node.config) {
            node.config.cronActive = false;
            await this.nodeRepository.save(node);
          }
        }
      }
      this.logger.log(`Stopped ${cronNodes.length} cron jobs for workflow ${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to stop cron jobs for workflow ${workflowId}: ${error.message}`);
    }
  }

  private stopCronJob(jobId: string): void {
    if (this.cronJobs.has(jobId)) {
      const job = this.cronJobs.get(jobId);
      if (job) {
        job.stop();
        this.cronJobs.delete(jobId);
        this.logger.log(`Stopped cron job: ${jobId}`);
      }
    }
  }

  private stopAllCronJobs(): void {
    for (const jobId of this.cronJobs.keys()) {
      this.stopCronJob(jobId);
    }
  }
}
