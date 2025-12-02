import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';
import { Node } from '../database/entities/node.entity';
import { Edge } from '../database/entities/edge.entity';
import { WorkflowsModule } from '../workflows/workflows.module';
import { TriggersModule } from '../triggers/triggers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Node, Edge]), WorkflowsModule, TriggersModule],
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService],
})
export class NodesModule {}
