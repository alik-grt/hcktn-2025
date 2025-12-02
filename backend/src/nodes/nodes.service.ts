import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node } from '../database/entities/node.entity';
import { Edge } from '../database/entities/edge.entity';
import { WorkflowsService } from '../workflows/workflows.service';
import { WebhookService } from '../triggers/webhook.service';
import { CronService } from '../triggers/cron.service';

export type CreateNodeDto = {
  type: 'parent' | 'trigger' | 'http' | 'transform' | 'agent' | 'delay' | 'note' | 'if';
  subtype?: 'manual' | 'webhook' | 'cron';
  workflowId: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  config?: Record<string, any>;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  template?: Record<string, any>;
  name?: string;
  parentId?: string;
};

export type UpdateNodeDto = Partial<CreateNodeDto>;

export type CreateEdgeDto = {
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
};

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);

  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(Edge)
    private readonly edgeRepository: Repository<Edge>,
    private readonly workflowsService: WorkflowsService,
    private readonly webhookService: WebhookService,
    private readonly cronService: CronService,
  ) {}

  async create(createNodeDto: CreateNodeDto): Promise<Node> {
    await this.workflowsService.findOne(createNodeDto.workflowId);
    const node = this.nodeRepository.create(createNodeDto);
    const savedNode = await this.nodeRepository.save(node);

    if (savedNode.type === 'trigger' && savedNode.subtype === 'webhook') {
      await this.webhookService.registerWebhook(savedNode);
    }

    return savedNode;
  }

  async findAll(workflowId: string): Promise<Node[]> {
    return await this.nodeRepository.find({
      where: { workflowId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Node> {
    const node = await this.nodeRepository.findOne({ where: { id } });
    if (!node) {
      throw new NotFoundException(`Node with ID ${id} not found`);
    }
    return node;
  }

  async update(id: string, updateNodeDto: UpdateNodeDto): Promise<Node> {
    const node = await this.findOne(id);
    const oldSubtype = node.subtype;
    const oldCronExpression = node.config?.cronExpression;
    const oldCronActive = node.config?.cronActive;

    this.logger.debug('NodesService.update called:', {
      id,
      updateNodeDto,
      currentPosition: node.position,
      newPosition: updateNodeDto.position,
    });

    if (updateNodeDto.position !== undefined) {
      node.position = updateNodeDto.position;
    }

    if (updateNodeDto.config !== undefined) {
      node.config = updateNodeDto.config;
    }
    if (updateNodeDto.method !== undefined) {
      node.method = updateNodeDto.method;
    }
    if (updateNodeDto.url !== undefined) {
      node.url = updateNodeDto.url;
    }
    if (updateNodeDto.headers !== undefined) {
      node.headers = updateNodeDto.headers;
    }
    if (updateNodeDto.bodyTemplate !== undefined) {
      node.bodyTemplate = updateNodeDto.bodyTemplate;
    }
    if (updateNodeDto.template !== undefined) {
      node.template = updateNodeDto.template;
    }
    if (updateNodeDto.subtype !== undefined) {
      node.subtype = updateNodeDto.subtype;
    }
    if (updateNodeDto.type !== undefined) {
      node.type = updateNodeDto.type;
    }
    if (updateNodeDto.name !== undefined) {
      node.name = updateNodeDto.name;
    }
    if (updateNodeDto.width !== undefined) {
      node.width = updateNodeDto.width;
    }
    if (updateNodeDto.height !== undefined) {
      node.height = updateNodeDto.height;
    }
    if (updateNodeDto.parentId !== undefined) {
      node.parentId = updateNodeDto.parentId;
    }

    this.logger.debug('NodesService.update after assign:', { id, position: node.position });
    const savedNode = await this.nodeRepository.save(node);
    this.logger.debug('NodesService.update after save:', { id, savedPosition: savedNode.position });

    if (savedNode.type === 'trigger') {
      if (savedNode.subtype === 'webhook') {
        if (oldSubtype !== 'webhook') {
          await this.webhookService.registerWebhook(savedNode);
        } else {
          await this.webhookService.registerWebhook(savedNode);
        }
      } else if (oldSubtype === 'webhook') {
        await this.webhookService.unregisterWebhook(node);
      }

      if (oldSubtype === 'cron' && savedNode.subtype !== 'cron') {
        await this.cronService.unscheduleCronJob(node.id);
      }
      if (savedNode.subtype === 'cron') {
        const newCronExpression = savedNode.config?.cronExpression;
        const newCronActive = savedNode.config?.cronActive;

        if (oldCronExpression !== newCronExpression) {
          await this.cronService.unscheduleCronJob(node.id);
          if (savedNode.config) {
            savedNode.config.cronActive = false;
            await this.nodeRepository.save(savedNode);
          }
        } else if (oldCronActive !== newCronActive) {
          if (newCronActive === true) {
            await this.cronService.scheduleCronJob(savedNode);
          } else {
            await this.cronService.unscheduleCronJob(node.id);
          }
        }
      }
    }

    return savedNode;
  }

  async remove(id: string): Promise<void> {
    const node = await this.findOne(id);

    if (node.type === 'trigger' && node.subtype === 'webhook') {
      await this.webhookService.unregisterWebhook(node);
    } else if (node.type === 'trigger' && node.subtype === 'cron') {
      await this.cronService.unscheduleCronJob(node.id);
    }

    await this.nodeRepository.remove(node);
  }

  async createEdge(createEdgeDto: CreateEdgeDto): Promise<Edge> {
    this.logger.log(
      `Creating edge: ${createEdgeDto.sourceNodeId} -> ${createEdgeDto.targetNodeId} in workflow ${createEdgeDto.workflowId}${createEdgeDto.sourceHandle ? ` (handle: ${createEdgeDto.sourceHandle})` : ''}`,
    );
    await this.workflowsService.findOne(createEdgeDto.workflowId);
    const sourceNode = await this.findOne(createEdgeDto.sourceNodeId);
    const targetNode = await this.findOne(createEdgeDto.targetNodeId);
    this.logger.debug(
      `Source node: ${sourceNode.id} (${sourceNode.type}), Target node: ${targetNode.id} (${targetNode.type})`,
    );
    const edge = this.edgeRepository.create(createEdgeDto);
    const savedEdge = await this.edgeRepository.save(edge);
    this.logger.log(`Edge created successfully: ${savedEdge.id}`);
    return savedEdge;
  }

  async getEdges(workflowId: string): Promise<Edge[]> {
    return await this.edgeRepository.find({
      where: { workflowId },
    });
  }

  async removeEdge(id: string): Promise<void> {
    this.logger.log(`Removing edge: ${id}`);
    const edge = await this.edgeRepository.findOne({ where: { id } });
    if (!edge) {
      this.logger.warn(`Edge with ID ${id} not found`);
      throw new NotFoundException(`Edge with ID ${id} not found`);
    }
    this.logger.debug(
      `Edge found: ${edge.sourceNodeId} -> ${edge.targetNodeId} in workflow ${edge.workflowId}`,
    );
    await this.edgeRepository.remove(edge);
    this.logger.log(`Edge ${id} removed successfully`);
  }

  async getWebhookInfo(nodeId: string): Promise<{ path: string; url: string } | null> {
    const node = await this.findOne(nodeId);
    return this.webhookService.getWebhookInfo(node);
  }

  async startCron(id: string): Promise<{ message: string }> {
    const node = await this.findOne(id);
    if (node.type !== 'trigger' || node.subtype !== 'cron') {
      throw new BadRequestException('Node is not a cron trigger');
    }
    const workflow = await this.workflowsService.findOne(node.workflowId);
    if (workflow.status !== 'active') {
      throw new BadRequestException(
        'Workflow must be active before starting cron job. Please activate the workflow first.',
      );
    }
    const cronExpression = node.config?.cronExpression;
    if (!cronExpression) {
      throw new BadRequestException('Cron expression is not set');
    }
    await this.cronService.scheduleCronJob(node);
    if (!node.config) {
      node.config = {};
    }
    node.config.cronActive = true;
    await this.nodeRepository.save(node);
    return { message: 'Cron job scheduled' };
  }

  async stopCron(id: string): Promise<{ message: string }> {
    const node = await this.findOne(id);
    if (node.type !== 'trigger' || node.subtype !== 'cron') {
      throw new BadRequestException('Node is not a cron trigger');
    }
    await this.cronService.unscheduleCronJob(node.id);
    if (node.config) {
      node.config.cronActive = false;
      await this.nodeRepository.save(node);
    }
    return { message: 'Cron job stopped' };
  }
}
