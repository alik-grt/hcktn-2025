import { Injectable, Logger } from '@nestjs/common';
import { Node } from '../../database/entities/node.entity';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { NonFatalError } from './non-fatal-error';

@Injectable()
export class HttpService {
  private readonly logger = new Logger(HttpService.name);

  async execute(node: Node, input: Record<string, any>): Promise<any> {
    if (!node.url) {
      throw new Error('HTTP node must have a URL');
    }

    const url = this.interpolateTemplate(node.url, input);
    const method = (node.method || 'GET').toUpperCase();
    const headers = this.interpolateObject(node.headers || {}, input);
    const body = node.bodyTemplate ? this.interpolateTemplate(node.bodyTemplate, input) : undefined;

    const config: AxiosRequestConfig = {
      method: method as any,
      url,
      headers,
      data: body,
      timeout: 30000,
    };

    try {
      const response: AxiosResponse = await axios(config);
      if (response.status >= 400) {
        this.logger.error(`HTTP request failed with status ${response.status}`);
        throw new NonFatalError(`HTTP request failed with status ${response.status}`, {
          status: response.status,
          body: response.data,
          headers: response.headers,
        });
      }
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorMessage =
          typeof response.data.error === 'string'
            ? response.data.error
            : JSON.stringify(response.data.error);
        this.logger.error(`HTTP response contains error field: ${errorMessage}`);
        throw new NonFatalError(`HTTP response error: ${errorMessage}`, {
          status: response.status,
          body: response.data,
          headers: response.headers,
        });
      }
      return {
        status: response.status,
        body: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      this.logger.error(`HTTP request failed: ${error.message}`);
      if (error instanceof NonFatalError) {
        throw error;
      }
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText || 'Unknown';
        throw new NonFatalError(
          `HTTP request failed with status ${status} ${statusText}: ${error.message}`,
          {
            status,
            body: error.response.data,
            headers: error.response.headers,
          },
        );
      }
      throw new NonFatalError(`HTTP request failed: ${error.message}`, {
        error: error.message,
        code: error.code,
      });
    }
  }

  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  private interpolateObject(
    obj: Record<string, string>,
    data: Record<string, any>,
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.interpolateTemplate(value, data);
    }
    return result;
  }
}
