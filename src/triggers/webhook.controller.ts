import { Controller, All, Param, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

@Controller()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @All('webhook/:workflowId/:nodeId/:token')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('workflowId') workflowId: string,
    @Param('nodeId') nodeId: string,
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const webhookPath = `webhook/${workflowId}/${nodeId}/${token}`;
    try {
      const requestData = {
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const execution = await this.webhookService.triggerWebhook(webhookPath, requestData);

      res.status(HttpStatus.OK).json({
        success: true,
        executionId: execution.id,
        message: 'Workflow triggered successfully',
      });
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        error: error.message || 'Webhook not found',
      });
    }
  }
}
