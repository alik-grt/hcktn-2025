import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution } from '../../database/entities/execution.entity';
import { ExecutionNode } from '../../database/entities/execution-node.entity';
import { Node } from '../../database/entities/node.entity';
import { Edge } from '../../database/entities/edge.entity';
import { TriggerService } from './trigger.service';
import { HttpService } from './http.service';
import { TransformService } from './transform.service';
import { AgentService } from './agent.service';
import { DelayService } from './delay.service';
import { WorkflowGateway } from '../../websocket/workflow.gateway';

export type ExecutionContext = {
  executionId: string;
  workflowId: string;
  data: Record<string, any>;
  nodeOutputs: Map<string, any>;
};

@Injectable()
export class Executor {
  private readonly logger = new Logger(Executor.name);

  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(ExecutionNode)
    private readonly executionNodeRepository: Repository<ExecutionNode>,
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(Edge)
    private readonly edgeRepository: Repository<Edge>,
    private readonly triggerService: TriggerService,
    private readonly httpService: HttpService,
    private readonly transformService: TransformService,
    private readonly agentService: AgentService,
    private readonly delayService: DelayService,
    private readonly workflowGateway: WorkflowGateway,
  ) {}

  async executeWorkflow(workflowId: string, input: Record<string, any> = {}): Promise<Execution> {
    const execution = this.executionRepository.create({
      workflowId,
      status: 'running',
      input,
    });
    await this.executionRepository.save(execution);
    const savedExecution = await this.executionRepository.findOne({
      where: { id: execution.id },
      relations: ['executionNodes'],
    });
    if (savedExecution) {
      this.workflowGateway.emitExecutionCreated(workflowId, savedExecution);
    }

    const context: ExecutionContext = {
      executionId: execution.id,
      workflowId,
      data: input,
      nodeOutputs: new Map(),
    };

    try {
      const nodes = await this.nodeRepository.find({ where: { workflowId } });
      const edges = await this.edgeRepository.find({ where: { workflowId } });

      const triggerNode = nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow must have at least one trigger node');
      }

      const sortedNodes = this.topologicalSort(nodes, edges, triggerNode.id);

      this.workflowGateway.emitExecutionStarted(workflowId, execution.id);

      for (const node of sortedNodes) {
        const nodeInput = this.getNodeInput(node, edges, context);
        const result = await this.executeNode(node, nodeInput, context);

        context.nodeOutputs.set(node.id, result);
        execution.output = Object.fromEntries(context.nodeOutputs);
        await this.executionRepository.save(execution);
        const updatedExecution = await this.executionRepository.findOne({
          where: { id: execution.id },
          relations: ['executionNodes'],
        });
        if (updatedExecution) {
          this.workflowGateway.emitExecutionUpdated(workflowId, updatedExecution);
        }
      }

      execution.status = 'completed';
      execution.finishedAt = new Date();
      await this.executionRepository.save(execution);
      const completedExecution = await this.executionRepository.findOne({
        where: { id: execution.id },
        relations: ['executionNodes'],
      });
      if (completedExecution) {
        this.workflowGateway.emitExecutionUpdated(workflowId, completedExecution);
      }

      this.workflowGateway.emitExecutionFinished(workflowId, execution.id, execution.output);
    } catch (error) {
      this.logger.error(`Execution failed: ${error.message}`, error.stack);
      execution.status = 'failed';
      execution.error = error.message;
      execution.finishedAt = new Date();
      await this.executionRepository.save(execution);
      const failedExecution = await this.executionRepository.findOne({
        where: { id: execution.id },
        relations: ['executionNodes'],
      });
      if (failedExecution) {
        this.workflowGateway.emitExecutionUpdated(workflowId, failedExecution);
      }

      this.workflowGateway.emitExecutionError(workflowId, execution.id, error.message);
    }

    return execution;
  }

  private async executeNode(
    node: Node,
    input: Record<string, any>,
    context: ExecutionContext,
  ): Promise<any> {
    const executionNode = this.executionNodeRepository.create({
      executionId: context.executionId,
      nodeId: node.id,
      status: 'progress',
      input,
      startedAt: new Date(),
    });
    await this.executionNodeRepository.save(executionNode);

    this.workflowGateway.emitNodeStatusChanged(context.workflowId, node.id, 'progress');

    const startTime = Date.now();

    try {
      let output: any;

      switch (node.type) {
        case 'trigger':
          output = await this.triggerService.execute(node, input);
          break;
        case 'http':
          output = await this.httpService.execute(node, input);
          break;
        case 'transform':
          output = await this.transformService.execute(node, input);
          break;
        case 'agent':
          output = await this.agentService.execute(node, input);
          break;
        case 'delay':
          output = await this.delayService.execute(node, input, context.workflowId);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      const duration = Date.now() - startTime;
      executionNode.status = 'passed';
      executionNode.output = output;
      executionNode.duration = duration;
      executionNode.finishedAt = new Date();
      await this.executionNodeRepository.save(executionNode);

      this.workflowGateway.emitNodeStatusChanged(context.workflowId, node.id, 'passed');

      return output;
    } catch (error) {
      const duration = Date.now() - startTime;
      executionNode.status = 'error';
      executionNode.error = error.message;
      executionNode.duration = duration;
      executionNode.finishedAt = new Date();
      await this.executionNodeRepository.save(executionNode);

      this.workflowGateway.emitNodeStatusChanged(context.workflowId, node.id, 'error');

      throw error;
    }
  }

  private getNodeInput(node: Node, edges: Edge[], context: ExecutionContext): Record<string, any> {
    if (node.type === 'trigger') {
      return context.data;
    }

    const incomingEdges = edges.filter((e) => e.targetNodeId === node.id);
    if (incomingEdges.length === 0) {
      return {};
    }

    const inputs: Record<string, any> = {};
    for (const edge of incomingEdges) {
      const sourceOutput = context.nodeOutputs.get(edge.sourceNodeId);
      if (sourceOutput) {
        Object.assign(inputs, sourceOutput);
      }
    }

    return inputs;
  }

  private topologicalSort(nodes: Node[], edges: Edge[], startNodeId: string): Node[] {
    const sorted: Node[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error('Circular dependency detected in workflow');
      }
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        visiting.delete(nodeId);
        return;
      }

      const incomingEdges = edges.filter((e) => e.targetNodeId === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.sourceNodeId);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      sorted.push(node);
    };

    visit(startNodeId);

    return sorted;
  }
}
