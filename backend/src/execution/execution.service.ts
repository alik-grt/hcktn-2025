import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution } from '../database/entities/execution.entity';
import { ExecutionNode } from '../database/entities/execution-node.entity';
import { Executor } from './engine/executor';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class ExecutionService {
  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(ExecutionNode)
    private readonly executionNodeRepository: Repository<ExecutionNode>,
    private readonly executor: Executor,
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflowsService: WorkflowsService,
  ) {}

  async executeWorkflow(workflowId: string, input: Record<string, any> = {}): Promise<Execution> {
    const workflow = await this.workflowsService.findOne(workflowId);
    if (workflow.status !== 'active') {
      throw new BadRequestException(
        `Workflow is not active. Current status: ${workflow.status}. Please activate the workflow first.`,
      );
    }
    return await this.executor.executeWorkflow(workflowId, input);
  }

  async findAll(workflowId?: string): Promise<Execution[]> {
    const where = workflowId ? { workflowId } : {};
    return await this.executionRepository.find({
      where,
      relations: ['executionNodes', 'workflow'],
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Execution> {
    const execution = await this.executionRepository.findOne({
      where: { id },
      relations: ['executionNodes', 'workflow'],
    });
    if (!execution) {
      throw new NotFoundException(`Execution with ID ${id} not found`);
    }
    return execution;
  }

  async getExecutionNodes(executionId: string): Promise<ExecutionNode[]> {
    return await this.executionNodeRepository.find({
      where: { executionId },
      order: { startedAt: 'ASC' },
    });
  }

  async getExecutionNodeByNodeId(
    executionId: string,
    nodeId: string,
  ): Promise<ExecutionNode | null> {
    return await this.executionNodeRepository.findOne({
      where: { executionId, nodeId },
    });
  }

  async getLatestExecution(workflowId: string): Promise<Execution | null> {
    return await this.executionRepository.findOne({
      where: { workflowId },
      relations: ['executionNodes'],
      order: { startedAt: 'DESC' },
    });
  }

  async deleteByWorkflowId(workflowId: string): Promise<void> {
    await this.executionRepository.delete({ workflowId });
  }
}
