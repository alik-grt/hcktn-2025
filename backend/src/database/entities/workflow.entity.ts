import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Node } from './node.entity';
import { Edge } from './edge.entity';
import { Execution } from './execution.entity';

export type WorkflowStatus = 'active' | 'inactive';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'inactive',
  })
  status: WorkflowStatus;

  @OneToMany(() => Node, (node) => node.workflow, { cascade: true })
  nodes: Node[];

  @OneToMany(() => Edge, (edge) => edge.workflow, { cascade: true })
  edges: Edge[];

  @OneToMany(() => Execution, (execution) => execution.workflow)
  executions: Execution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
