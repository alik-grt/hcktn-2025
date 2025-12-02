import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NodesService, CreateNodeDto, UpdateNodeDto, CreateEdgeDto } from './nodes.service';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNodeDto: CreateNodeDto) {
    return await this.nodesService.create(createNodeDto);
  }

  @Get('workflow/:workflowId')
  async findAll(@Param('workflowId') workflowId: string) {
    return await this.nodesService.findAll(workflowId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.nodesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNodeDto: UpdateNodeDto) {
    return await this.nodesService.update(id, updateNodeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.nodesService.remove(id);
  }

  @Post('edges')
  @HttpCode(HttpStatus.CREATED)
  async createEdge(@Body() createEdgeDto: CreateEdgeDto) {
    return await this.nodesService.createEdge(createEdgeDto);
  }

  @Get('edges/workflow/:workflowId')
  async getEdges(@Param('workflowId') workflowId: string) {
    return await this.nodesService.getEdges(workflowId);
  }

  @Delete('edges/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEdge(@Param('id') id: string) {
    await this.nodesService.removeEdge(id);
  }

  @Get(':id/webhook-info')
  async getWebhookInfo(@Param('id') id: string) {
    return await this.nodesService.getWebhookInfo(id);
  }
}
