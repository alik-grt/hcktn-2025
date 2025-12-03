import { Injectable, Logger } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';
import { ExpressionService } from './expression.service';

@Injectable()
export class IfService {
  private readonly logger = new Logger(IfService.name);

  constructor(private readonly expressionService: ExpressionService) {}

  async execute(node: Node, input: Record<string, any>): Promise<Record<string, any>> {
    const config = node.config || {};
    let condition1 = config.condition1;
    let condition2 = config.condition2;

    if (!condition1 && !condition2 && config.condition) {
      condition1 = config.condition;
      this.logger.debug(`If node ${node.id} using legacy condition as condition1`);
    }

    this.logger.debug(`If node ${node.id} input: ${JSON.stringify(input)}`);
    this.logger.debug(`If node ${node.id} condition1: ${condition1}, condition2: ${condition2}`);

    let result: 'condition1' | 'condition2' | 'else' = 'else';

    if (condition1) {
      const condition1Result = await this.expressionService.evaluateCondition(condition1, input);
      this.logger.debug(`If node ${node.id} condition1 result: ${condition1Result}`);
      if (condition1Result) {
        result = 'condition1';
        this.logger.debug(`If node ${node.id} condition1 satisfied, returning condition1`);
        return { ...input, __ifResult: result };
      }
    }

    if (condition2) {
      const condition2Result = await this.expressionService.evaluateCondition(condition2, input);
      this.logger.debug(`If node ${node.id} condition2 result: ${condition2Result}`);
      if (condition2Result) {
        result = 'condition2';
        this.logger.debug(`If node ${node.id} condition2 satisfied, returning condition2`);
        return { ...input, __ifResult: result };
      }
    }

    if (!condition1 && !condition2) {
      this.logger.warn(`If node ${node.id} has no conditions configured, defaulting to else`);
    }

    this.logger.debug(`If node ${node.id} no conditions satisfied, returning else`);
    return { ...input, __ifResult: result };
  }
}
