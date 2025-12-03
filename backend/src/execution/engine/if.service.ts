import { Injectable, Logger } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';

@Injectable()
export class IfService {
  private readonly logger = new Logger(IfService.name);

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
      const condition1Result = this.evaluateCondition(condition1, input);
      this.logger.debug(`If node ${node.id} condition1 result: ${condition1Result}`);
      if (condition1Result) {
        result = 'condition1';
        this.logger.debug(`If node ${node.id} condition1 satisfied, returning condition1`);
        return { ...input, __ifResult: result };
      }
    }

    if (condition2) {
      const condition2Result = this.evaluateCondition(condition2, input);
      this.logger.debug(`If node ${node.id} condition2 result: ${condition2Result}`);
      if (condition2Result) {
        result = 'condition2';
        this.logger.debug(`If node ${node.id} condition2 satisfied, returning condition2`);
        return { ...input, __ifResult: result };
      }
    }
    console.log('condition1', condition1);
    console.log('condition2', condition2);

    if (!condition1 && !condition2) {
      this.logger.warn(`If node ${node.id} has no conditions configured, defaulting to else`);
    }

    this.logger.debug(`If node ${node.id} no conditions satisfied, returning else`);
    return { ...input, __ifResult: result };
  }

  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    if (typeof condition !== 'string') {
      return false;
    }

    const expressionMatch = condition.match(/^\{\{([^}]+)\}\}$/);
    if (!expressionMatch) {
      this.logger.warn(
        `If node condition "${condition}" is not in template format, treating as boolean`,
      );
      return Boolean(condition);
    }

    const expression = expressionMatch[1].trim();

    if (
      expression.includes('>') ||
      expression.includes('<') ||
      expression.includes('==') ||
      expression.includes('!=')
    ) {
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

    const value = this.getValue(expression, data);
    return Boolean(value);
  }

  private getValue(key: string, data: Record<string, any>): any {
    const trimmed = key.trim();

    if (trimmed in data) {
      this.logger.debug(`Direct access: ${trimmed} = ${JSON.stringify(data[trimmed])}`);
      return data[trimmed];
    }

    try {
      const parts = this.parsePath(trimmed);
      this.logger.debug(`Parsed path "${trimmed}" into parts: ${JSON.stringify(parts)}`);

      if (parts.length === 0) {
        return data;
      }

      let value = data;

      for (const part of parts) {
        if (value === null || value === undefined) {
          this.logger.debug(`Path "${trimmed}" stopped at undefined/null value`);
          return undefined;
        }

        if (typeof part === 'number') {
          if (Array.isArray(value)) {
            value = value[part];
            this.logger.debug(`Array access [${part}]: ${JSON.stringify(value)}`);
          } else {
            this.logger.debug(`Path "${trimmed}": expected array but got ${typeof value}`);
            return undefined;
          }
        } else {
          if (typeof value === 'object' && value !== null) {
            value = value[part];
            this.logger.debug(`Property access .${part}: ${JSON.stringify(value)}`);
          } else {
            this.logger.debug(`Path "${trimmed}": expected object but got ${typeof value}`);
            return undefined;
          }
        }
      }

      this.logger.debug(`Path "${trimmed}" resolved to: ${JSON.stringify(value)}`);
      return value;
    } catch (error) {
      this.logger.warn(`Error parsing path "${trimmed}": ${error.message}`);
      if (!isNaN(Number(trimmed))) {
        return Number(trimmed);
      }
      return trimmed;
    }
  }

  private parsePath(path: string): (string | number)[] {
    const parts: (string | number)[] = [];
    let current = '';
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === '.') {
        if (current) {
          parts.push(current);
          current = '';
        }
        i++;
      } else if (char === '[') {
        if (current) {
          parts.push(current);
          current = '';
        }
        i++;
        let indexStr = '';
        while (i < path.length && path[i] !== ']') {
          indexStr += path[i];
          i++;
        }
        if (path[i] === ']') {
          const index = parseInt(indexStr, 10);
          if (!isNaN(index)) {
            parts.push(index);
          }
          i++;
        }
      } else {
        current += char;
        i++;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }
}
