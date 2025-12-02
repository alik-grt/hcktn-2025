import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

export type NodeType =
  | 'parent'
  | 'trigger'
  | 'http'
  | 'transform'
  | 'agent'
  | 'delay'
  | 'note'
  | 'if';
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

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => Node, (node) => node.children, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Node;

  @OneToMany(() => Node, (node) => node.parent)
  children: Node[];

  @Column({ type: 'simple-json', nullable: true })
  position: { x: number; y: number };

  @Column({ type: 'float', nullable: true })
  width: number;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ type: 'simple-json', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'varchar', length: 20, nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'simple-json', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  bodyTemplate: string;

  @Column({ type: 'simple-json', nullable: true })
  template: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
