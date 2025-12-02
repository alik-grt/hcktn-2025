import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import { ExecutionService } from './execution.service';

@Controller('executions')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('workflow/:workflowId')
  @HttpCode(HttpStatus.CREATED)
  async executeWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() body: { input?: Record<string, any> },
  ) {
    return await this.executionService.executeWorkflow(workflowId, body.input || {});
  }

  @Get()
  async findAll(@Query('workflowId') workflowId?: string) {
    return await this.executionService.findAll(workflowId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.executionService.findOne(id);
  }

  @Get(':id/nodes')
  async getExecutionNodes(@Param('id') id: string) {
    return await this.executionService.getExecutionNodes(id);
  }

  @Get(':id/nodes/:nodeId')
  async getExecutionNodeByNodeId(@Param('id') id: string, @Param('nodeId') nodeId: string) {
    return await this.executionService.getExecutionNodeByNodeId(id, nodeId);
  }

  @Get('workflow/:workflowId/latest')
  async getLatestExecution(@Param('workflowId') workflowId: string) {
    return await this.executionService.getLatestExecution(workflowId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteByWorkflowId(@Query('workflowId') workflowId: string) {
    await this.executionService.deleteByWorkflowId(workflowId);
  }
}
