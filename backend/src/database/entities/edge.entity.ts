import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('edges')
export class Edge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.edges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ type: 'uuid' })
  sourceNodeId: string;

  @Column({ type: 'uuid' })
  targetNodeId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sourceHandle: string;

  @CreateDateColumn()
  createdAt: Date;
}
