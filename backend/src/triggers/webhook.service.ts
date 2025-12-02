import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node } from '../database/entities/node.entity';
import { ExecutionService } from '../execution/execution.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookMap = new Map<string, { workflowId: string; nodeId: string }>();

  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @Inject(forwardRef(() => ExecutionService))
    private readonly executionService: ExecutionService,
    private readonly workflowsService: WorkflowsService,
  ) {}

  onModuleInit() {
    this.loadWebhooks();
  }

  onModuleDestroy() {
    this.webhookMap.clear();
  }

  private async loadWebhooks() {
    try {
      const webhookNodes = await this.nodeRepository.find({
        where: { type: 'trigger', subtype: 'webhook' },
        relations: ['workflow'],
      });
      for (const node of webhookNodes) {
        const webhookPath = this.getWebhookPath(node);
        if (webhookPath) {
          this.webhookMap.set(webhookPath, {
            workflowId: node.workflowId,
            nodeId: node.id,
          });
          this.logger.log(`Loaded webhook: ${webhookPath} -> workflow ${node.workflowId}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load webhooks:', error);
    }
  }

  generateWebhookPath(workflowId: string, nodeId: string): string {
    const shortId = uuidv4().split('-')[0];
    return `webhook/${workflowId}/${nodeId}/${shortId}`;
  }

  getWebhookPath(node: Node): string | null {
    if (node.type !== 'trigger' || node.subtype !== 'webhook') {
      return null;
    }
    if (node.config?.webhookPath) {
      return node.config.webhookPath;
    }
    return this.generateWebhookPath(node.workflowId, node.id);
  }

  async registerWebhook(node: Node): Promise<string> {
    if (node.type !== 'trigger' || node.subtype !== 'webhook') {
      throw new Error('Node must be a webhook trigger');
    }

    let webhookPath = this.getWebhookPath(node);
    if (!webhookPath) {
      webhookPath = this.generateWebhookPath(node.workflowId, node.id);
    }

    if (!node.config) {
      node.config = {};
    }
    node.config.webhookPath = webhookPath;

    await this.nodeRepository.save(node);
    this.webhookMap.set(webhookPath, {
      workflowId: node.workflowId,
      nodeId: node.id,
    });

    this.logger.log(`Registered webhook: ${webhookPath} -> workflow ${node.workflowId}`);
    return webhookPath;
  }

  async unregisterWebhook(node: Node): Promise<void> {
    if (node.type !== 'trigger' || node.subtype !== 'webhook') {
      return;
    }

    const webhookPath = this.getWebhookPath(node);
    if (webhookPath) {
      this.webhookMap.delete(webhookPath);
      this.logger.log(`Unregistered webhook: ${webhookPath}`);
    }

    if (node.config) {
      delete node.config.webhookPath;
      await this.nodeRepository.save(node);
    }
  }

  async triggerWebhook(webhookPath: string, requestData: any): Promise<any> {
    const webhook = this.webhookMap.get(webhookPath);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookPath}`);
    }

    const workflow = await this.workflowsService.findOne(webhook.workflowId);
    if (workflow.status !== 'active') {
      this.logger.warn(
        `Webhook ${webhookPath} triggered but workflow ${webhook.workflowId} is not active (status: ${workflow.status})`,
      );
      throw new BadRequestException(
        `Workflow is not active. Current status: ${workflow.status}. Please activate the workflow first.`,
      );
    }

    this.logger.log(`Triggering webhook: ${webhookPath} -> workflow ${webhook.workflowId}`);

    const input = {
      method: requestData.method || 'POST',
      headers: requestData.headers || {},
      body: requestData.body || {},
      query: requestData.query || {},
      params: requestData.params || {},
    };

    return await this.executionService.executeWorkflow(webhook.workflowId, input);
  }

  getWebhookInfo(node: Node): { path: string; url: string } | null {
    if (node.type !== 'trigger' || node.subtype !== 'webhook') {
      return null;
    }
    const webhookPath = this.getWebhookPath(node);
    if (!webhookPath) {
      return null;
    }
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return {
      path: webhookPath,
      url: `${baseUrl}/${webhookPath}`,
    };
  }
}
