import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Execution } from './execution.entity';

export type ExecutionNodeStatus = 'idle' | 'progress' | 'passed' | 'error';

@Entity('execution_nodes')
export class ExecutionNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  executionId: string;

  @ManyToOne(() => Execution, (execution) => execution.executionNodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'executionId' })
  execution: Execution;

  @Column({ type: 'uuid' })
  nodeId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'idle',
  })
  status: ExecutionNodeStatus;

  @Column({ type: 'simple-json', nullable: true })
  input: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  output: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'integer', nullable: true })
  duration: number;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  finishedAt: Date;
}
