import { Injectable } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';

@Injectable()
export class TriggerService {
  async execute(node: Node, input: Record<string, any>): Promise<any> {
    switch (node.subtype) {
      case 'manual':
        return { status: 'ok', input };
      case 'webhook':
        return { status: 'ok', input };
      case 'cron':
        return { status: 'ok', input, triggeredAt: new Date().toISOString() };
      default:
        return { status: 'ok', input };
    }
  }
}
