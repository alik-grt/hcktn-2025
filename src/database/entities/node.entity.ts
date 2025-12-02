import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

export type NodeType = 'trigger' | 'http' | 'transform' | 'agent' | 'delay';
export type TriggerSubtype = 'manual' | 'webhook' | 'cron';
export type NodeStatus = 'idle' | 'progress' | 'passed' | 'error';

@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: NodeType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  subtype: TriggerSubtype;

  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ type: 'jsonb', nullable: true })
  position: { x: number; y: number };

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'varchar', length: 20, nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  bodyTemplate: string;

  @Column({ type: 'jsonb', nullable: true })
  template: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
