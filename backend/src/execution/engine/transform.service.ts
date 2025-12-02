import { Injectable, Logger } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';

@Injectable()
export class TransformService {
  private readonly logger = new Logger(TransformService.name);
  async execute(node: Node, input: Record<string, any>): Promise<any> {
    if (!node.template) {
      return input;
    }

    this.logger.debug(`Transform node ${node.id} input: ${JSON.stringify(input)}`);
    this.logger.debug(`Transform node ${node.id} template: ${JSON.stringify(node.template)}`);

    const output: Record<string, any> = {};

    for (const [key, template] of Object.entries(node.template)) {
      output[key] = this.evaluateTemplate(template, input);
      this.logger.debug(`Transform node ${node.id} output[${key}]: ${JSON.stringify(output[key])}`);
    }

    this.logger.debug(`Transform node ${node.id} final output: ${JSON.stringify(output)}`);
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

    // Try direct access first
    if (trimmed in data) {
      this.logger.debug(`Direct access: ${trimmed} = ${JSON.stringify(data[trimmed])}`);
      return data[trimmed];
    }

    // Try nested path access (e.g., "body.data.items[0].value")
    try {
      const parts = this.parsePath(trimmed);
      this.logger.debug(`Parsed path "${trimmed}" into parts: ${JSON.stringify(parts)}`);

      if (parts.length === 0) {
        // Empty path, return data itself
        return data;
      }

      let value = data;

      for (const part of parts) {
        if (value === null || value === undefined) {
          this.logger.debug(`Path "${trimmed}" stopped at undefined/null value`);
          return undefined;
        }

        if (typeof part === 'number') {
          // Array index access
          if (Array.isArray(value)) {
            value = value[part];
            this.logger.debug(`Array access [${part}]: ${JSON.stringify(value)}`);
          } else {
            this.logger.debug(`Path "${trimmed}": expected array but got ${typeof value}`);
            return undefined;
          }
        } else {
          // Object property access
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
      // If path parsing fails, try as number
      if (!isNaN(Number(trimmed))) {
        return Number(trimmed);
      }
      // Return the key as-is if nothing matches
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
        // Parse array index
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
