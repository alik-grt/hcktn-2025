import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  @Get('test')
  getTest(@Query() query: Record<string, any>): any {
    return this.appService.getTest(query);
  }

  @Post('test')
  postTest(@Body() body: any, @Query() query: Record<string, any>): any {
    return this.appService.postTest(body, query);
  }

  @Get('test/:id')
  getTestById(@Param('id') id: string, @Query() query: Record<string, any>): any {
    return this.appService.getTestById(id, query);
  }
}
