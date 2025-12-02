import { Injectable } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';

@Injectable()
export class AgentService {
  async execute(node: Node, input: Record<string, any>): Promise<any> {
    return {
      status: 'ok',
      config: node.config || {},
      input,
    };
  }
}
