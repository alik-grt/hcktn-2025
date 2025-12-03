import { Injectable, Logger } from '@nestjs/common';
import * as jexl from 'jexl';

@Injectable()
export class ExpressionService {
  private readonly logger = new Logger(ExpressionService.name);

  /**
   * Evaluates a template expression like {{ status == 404 }}
   * @param template - Template string with {{ expression }} format
   * @param data - Data context for evaluation
   * @returns Evaluated result
   */
  async evaluateTemplate(template: string | any, data: Record<string, any>): Promise<any> {
    if (typeof template !== 'string') {
      return template;
    }

    const expressionMatch = template.match(/^\{\{([^}]+)\}\}$/);
    if (!expressionMatch) {
      return template;
    }

    const expression = expressionMatch[1].trim();
    return await this.evaluateExpression(expression, data);
  }

  /**
   * Evaluates a JEXL expression
   * @param expression - JEXL expression string
   * @param data - Data context for evaluation
   * @returns Evaluated result
   */
  async evaluateExpression(expression: string, data: Record<string, any>): Promise<any> {
    try {
      this.logger.debug(
        `Evaluating expression: "${expression}" with data: ${JSON.stringify(data)}`,
      );
      const result = await jexl.eval(expression, data);
      this.logger.debug(`Expression result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error evaluating expression "${expression}": ${error.message}`);
      throw error;
    }
  }

  /**
   * Evaluates a condition expression and returns boolean
   * @param condition - Condition string (with or without {{ }})
   * @param data - Data context for evaluation
   * @returns Boolean result
   */
  async evaluateCondition(condition: string, data: Record<string, any>): Promise<boolean> {
    if (typeof condition !== 'string') {
      return false;
    }

    let expression = condition.trim();

    // Remove {{ }} if present
    const expressionMatch = expression.match(/^\{\{([^}]+)\}\}$/);
    if (expressionMatch) {
      expression = expressionMatch[1].trim();
    }

    try {
      const result = await this.evaluateExpression(expression, data);
      return Boolean(result);
    } catch (error) {
      this.logger.warn(
        `Error evaluating condition "${condition}": ${error.message}. Treating as false.`,
      );
      return false;
    }
  }
}
