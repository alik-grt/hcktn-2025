import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { Executor } from './engine/executor';
import { TriggerService } from './engine/trigger.service';
import { HttpService } from './engine/http.service';
import { TransformService } from './engine/transform.service';
import { AgentService } from './engine/agent.service';
import { DelayService } from './engine/delay.service';
import { Execution } from '../database/entities/execution.entity';
import { ExecutionNode } from '../database/entities/execution-node.entity';
import { Node } from '../database/entities/node.entity';
import { Edge } from '../database/entities/edge.entity';
import { WorkflowsModule } from '../workflows/workflows.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution, ExecutionNode, Node, Edge]),
    forwardRef(() => WorkflowsModule),
    WebSocketModule,
  ],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    Executor,
    TriggerService,
    HttpService,
    TransformService,
    AgentService,
    DelayService,
  ],
  exports: [ExecutionService, Executor],
})
export class ExecutionModule {}
