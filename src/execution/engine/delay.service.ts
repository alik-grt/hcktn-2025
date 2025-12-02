import { Injectable, Logger } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';
import { WorkflowGateway } from '../../websocket/workflow.gateway';

@Injectable()
export class DelayService {
  private readonly logger = new Logger(DelayService.name);

  constructor(private readonly workflowGateway: WorkflowGateway) {}

  async execute(
    node: Node,
    input: Record<string, any>,
    workflowId: string,
  ): Promise<Record<string, any>> {
    const config = node.config || {};
    const delayMs = config.delayMs;
    const until = config.until;

    if (delayMs && typeof delayMs === 'number' && delayMs > 0) {
      this.logger.log(`Delaying for ${delayMs}ms`);
      this.workflowGateway.emitNodeStatusChanged(workflowId, node.id, 'progress');
      await this.delay(delayMs);
      this.logger.log(`Delay completed after ${delayMs}ms`);
      return input;
    }

    if (until && typeof until === 'string') {
      const targetDate = new Date(until);
      const now = new Date();
      const delayMs = targetDate.getTime() - now.getTime();

      if (delayMs > 0) {
        this.logger.log(`Waiting until ${until} (${delayMs}ms)`);
        this.workflowGateway.emitNodeStatusChanged(workflowId, node.id, 'progress');
        await this.delay(delayMs);
        this.logger.log(`Wait completed at ${new Date().toISOString()}`);
        return input;
      } else {
        this.logger.warn(`Target time ${until} is in the past, skipping delay`);
        return input;
      }
    }

    this.logger.warn('No valid delay configuration found, returning input unchanged');
    return input;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
