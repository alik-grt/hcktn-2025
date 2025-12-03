import { Injectable, Logger } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';
import { ExpressionService } from './expression.service';

@Injectable()
export class TransformService {
  private readonly logger = new Logger(TransformService.name);

  constructor(private readonly expressionService: ExpressionService) {}
  async execute(node: Node, input: Record<string, any>): Promise<any> {
    if (!node.template) {
      return input;
    }

    this.logger.debug(`Transform node ${node.id} input: ${JSON.stringify(input)}`);
    this.logger.debug(`Transform node ${node.id} template: ${JSON.stringify(node.template)}`);

    const output: Record<string, any> = {};

    for (const [key, template] of Object.entries(node.template)) {
      output[key] = await this.expressionService.evaluateTemplate(template, input);
      this.logger.debug(`Transform node ${node.id} output[${key}]: ${JSON.stringify(output[key])}`);
    }

    this.logger.debug(`Transform node ${node.id} final output: ${JSON.stringify(output)}`);
    return output;
  }
}
