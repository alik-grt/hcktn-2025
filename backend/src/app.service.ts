import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getTest(query: Record<string, any>): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return {
      message: 'Test GET endpoint',
      method: 'GET',
      query,
      timestamp: new Date().toISOString(),
      data: {
        success: true,
        items: [
          { id: 1, name: 'Item 1', value: 100 },
          { id: 2, name: 'Item 2', value: 200 },
        ],
      },
    };
  }

  async postTest(body: any, query: Record<string, any>): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return {
      message: 'Test POST endpoint',
      method: 'POST',
      receivedBody: body,
      query,
      timestamp: new Date().toISOString(),
      response: {
        success: true,
        created: true,
        id: Math.floor(Math.random() * 1000),
        data: body,
      },
    };
  }

  async getTestById(id: string, query: Record<string, any>): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return {
      message: 'Test GET by ID endpoint',
      method: 'GET',
      id,
      query,
      timestamp: new Date().toISOString(),
      data: {
        id,
        name: `Item ${id}`,
        value: parseInt(id) * 10,
        description: `This is item with ID ${id}`,
      },
    };
  }
}
