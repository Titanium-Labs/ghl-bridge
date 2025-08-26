import { Request, Response } from "express";
import {
  processWebhook,
  validateWebhookData,
} from "../services/webhookService";

export const webhookController = {
  /**
   * Handle webhook events from external services
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log("Webhook received:", req.body);

      // Validate webhook data
      if (!validateWebhookData(req.body)) {
        console.log("Invalid webhook data format");
        res.status(400).json({ error: "Invalid webhook data format" });
        return;
      }

      // Process the webhook
      await processWebhook(req.body);

      console.log("Webhook processed successfully, sending response");
      res.status(200).json({
        message: "Webhook processed successfully",
        webhookType: req.body.type,
        contactId: req.body.id,
      });
    } catch (error) {
      console.error("Webhook processing error:", error);

      // Ensure we always send a response
      if (!res.headersSent) {
        res.status(500).json({
          error: "Webhook processing failed",
          detail: error instanceof Error ? error.message : "Unknown error",
          webhookType: req.body?.type || "unknown",
          contactId: req.body?.id || "unknown",
        });
      }
    }
  },
};
