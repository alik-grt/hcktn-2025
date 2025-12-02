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
import { IfService } from './if.service';
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
    private readonly ifService: IfService,
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

      this.logger.log(
        `Loading workflow ${workflowId}: ${nodes.length} nodes, ${edges.length} edges`,
      );
      this.logger.debug(
        `Nodes: ${nodes.map((n) => `${n.id}(${n.type}${n.subtype ? `/${n.subtype}` : ''})`).join(', ')}`,
      );
      this.logger.debug(
        `Edges: ${edges.map((e) => `${e.sourceNodeId}->${e.targetNodeId}`).join(', ')}`,
      );

      const triggerNode = nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow must have at least one trigger node');
      }

      this.logger.log(`Trigger node: ${triggerNode.id} (${triggerNode.subtype || 'manual'})`);

      const sortedNodes = this.topologicalSort(nodes, edges, triggerNode.id);

      this.resetAllNodeStatuses(workflowId, sortedNodes);

      this.workflowGateway.emitExecutionStarted(workflowId, execution.id);

      this.logger.log(`Executing ${sortedNodes.length} nodes in order`);
      for (const node of sortedNodes) {
        if (!this.shouldExecuteNode(node, edges, context, nodes)) {
          this.logger.log(`Skipping node ${node.id} (${node.type}) due to conditional logic`);
          continue;
        }
        this.logger.log(`Executing node ${node.id} (${node.type})`);
        const nodeInput = this.getNodeInput(node, edges, context);
        this.logger.debug(`Node ${node.id} input: ${JSON.stringify(nodeInput)}`);
        const result = await this.executeNode(node, nodeInput, context);
        this.logger.debug(`Node ${node.id} output: ${JSON.stringify(result)}`);

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
        case 'if':
          output = await this.ifService.execute(node, input);
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
      this.logger.debug(`Trigger node ${node.id} input: ${JSON.stringify(context.data)}`);
      return context.data;
    }

    const incomingEdges = edges.filter((e) => e.targetNodeId === node.id);
    this.logger.debug(`Node ${node.id} (${node.type}) has ${incomingEdges.length} incoming edges`);
    if (incomingEdges.length === 0) {
      this.logger.warn(
        `Node ${node.id} (${node.type}) has no incoming edges, returning empty input`,
      );
      return {};
    }

    const inputs: Record<string, any> = {};
    for (const edge of incomingEdges) {
      const sourceOutput = context.nodeOutputs.get(edge.sourceNodeId);
      this.logger.debug(
        `Node ${node.id} getting input from ${edge.sourceNodeId}: ${JSON.stringify(sourceOutput)}`,
      );
      if (sourceOutput) {
        Object.assign(inputs, sourceOutput);
      } else {
        this.logger.warn(
          `Node ${node.id} has incoming edge from ${edge.sourceNodeId} but source output is not available`,
        );
      }
    }

    this.logger.debug(`Node ${node.id} final input: ${JSON.stringify(inputs)}`);
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
        this.logger.warn(`Node ${nodeId} not found in nodes array`);
        visiting.delete(nodeId);
        return;
      }

      const incomingEdges = edges.filter((e) => e.targetNodeId === nodeId);
      this.logger.debug(
        `Visiting node ${nodeId} (${node.type}), has ${incomingEdges.length} incoming edges`,
      );
      for (const edge of incomingEdges) {
        this.logger.debug(`  - incoming edge from ${edge.sourceNodeId}`);
        visit(edge.sourceNodeId);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      sorted.push(node);
      this.logger.debug(
        `Added node ${nodeId} (${node.type}) to sorted list. Total: ${sorted.length}`,
      );

      const outgoingEdges = edges.filter((e) => e.sourceNodeId === nodeId);
      this.logger.debug(`  - has ${outgoingEdges.length} outgoing edges`);
      for (const edge of outgoingEdges) {
        this.logger.debug(`  - outgoing edge to ${edge.targetNodeId}`);
        if (!visited.has(edge.targetNodeId)) {
          visit(edge.targetNodeId);
        }
      }
    };

    visit(startNodeId);

    if (sorted.length < nodes.length) {
      const sortedIds = new Set(sorted.map((n) => n.id));
      const unsortedNodes = nodes.filter((n) => !sortedIds.has(n.id));
      this.logger.warn(
        `Some nodes were not included in topological sort: ${unsortedNodes.map((n) => `${n.id}(${n.type})`).join(', ')}`,
      );
      for (const unsortedNode of unsortedNodes) {
        const outgoingEdges = edges.filter((e) => e.sourceNodeId === unsortedNode.id);
        const incomingEdges = edges.filter((e) => e.targetNodeId === unsortedNode.id);
        this.logger.warn(
          `  Node ${unsortedNode.id} (${unsortedNode.type}): ${incomingEdges.length} incoming, ${outgoingEdges.length} outgoing edges`,
        );
      }
    }

    this.logger.log(
      `Topological sort completed: ${sorted.length} nodes sorted from ${nodes.length} total nodes`,
    );
    this.logger.debug(`Sorted nodes: ${sorted.map((n) => `${n.id}(${n.type})`).join(' -> ')}`);

    return sorted;
  }

  private resetAllNodeStatuses(workflowId: string, nodes: Node[]): void {
    this.logger.log(`Resetting statuses for ${nodes.length} nodes in workflow ${workflowId}`);
    for (const node of nodes) {
      this.workflowGateway.emitNodeStatusChanged(workflowId, node.id, 'idle');
    }
  }

  private shouldExecuteNode(
    node: Node,
    edges: Edge[],
    context: ExecutionContext,
    allNodes: Node[],
  ): boolean {
    if (node.type === 'trigger') {
      return true;
    }

    const incomingEdges = edges.filter((e) => e.targetNodeId === node.id);
    if (incomingEdges.length === 0) {
      return false;
    }

    for (const edge of incomingEdges) {
      const sourceOutput = context.nodeOutputs.get(edge.sourceNodeId);
      if (!sourceOutput) {
        continue;
      }

      const sourceNode = allNodes.find((n) => n.id === edge.sourceNodeId);
      if (sourceNode?.type === 'if' && edge.sourceHandle) {
        const ifResult = sourceOutput.__ifResult;
        if (ifResult === undefined) {
          continue;
        }

        const expectedHandle = ifResult === true ? 'true' : ifResult === false ? 'false' : ifResult;
        if (edge.sourceHandle !== expectedHandle) {
          this.logger.debug(
            `Edge ${edge.id} from ${edge.sourceNodeId} has sourceHandle ${edge.sourceHandle}, but if result is ${ifResult}, skipping`,
          );
          continue;
        }
      }

      return true;
    }

    return false;
  }
}
