import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { ExecutionNode } from './execution-node.entity';

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'stopped';

@Entity('executions')
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'running',
  })
  status: ExecutionStatus;

  @Column({ type: 'simple-json', nullable: true })
  input: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  output: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error: string;

  @OneToMany(() => ExecutionNode, (executionNode) => executionNode.execution, {
    cascade: true,
  })
  executionNodes: ExecutionNode[];

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  finishedAt: Date;
}
