import { Injectable } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';

@Injectable()
export class TransformService {
  async execute(node: Node, input: Record<string, any>): Promise<any> {
    if (!node.template) {
      return input;
    }

    const output: Record<string, any> = {};

    for (const [key, template] of Object.entries(node.template)) {
      output[key] = this.evaluateTemplate(template, input);
    }

    return output;
  }

  private evaluateTemplate(template: string, data: Record<string, any>): any {
    if (typeof template !== 'string') {
      return template;
    }

    const expressionMatch = template.match(/^\{\{([^}]+)\}\}$/);
    if (!expressionMatch) {
      return template;
    }

    const expression = expressionMatch[1].trim();

    if (expression.includes('>') || expression.includes('<')) {
      const parts = expression.split(/\s*(>|<|>=|<=|==|!=)\s*/);
      if (parts.length === 3) {
        const left = this.getValue(parts[0], data);
        const operator = parts[1];
        const right = this.getValue(parts[2], data);

        switch (operator) {
          case '>':
            return left > right;
          case '<':
            return left < right;
          case '>=':
            return left >= right;
          case '<=':
            return left <= right;
          case '==':
            return left == right;
          case '!=':
            return left != right;
        }
      }
    }

    return this.getValue(expression, data);
  }

  private getValue(key: string, data: Record<string, any>): any {
    const trimmed = key.trim();
    if (trimmed in data) {
      return data[trimmed];
    }
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }
    return trimmed;
  }
}
