import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { Workflow } from '../database/entities/workflow.entity';
import { Node } from '../database/entities/node.entity';
import { Edge } from '../database/entities/edge.entity';
import { TriggersModule } from '../triggers/triggers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, Node, Edge]),
    forwardRef(() => TriggersModule),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
