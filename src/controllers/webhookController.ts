import { Request, Response } from "express";
import {
  processWebhook,
  validateWebhookData,
} from "../services/webhookService";
import {
  processZenexaWebhook,
  validateZenexaWebhookData,
} from "../services/zenexaWebhookService";

export const webhookController = {
  /**
   * Handle webhook events from GHL (Go High Level)
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log("GHL webhook received:", req.body);

      // Validate webhook data
      if (!validateWebhookData(req.body)) {
        console.log("Invalid GHL webhook data format");
        res.status(400).json({ error: "Invalid GHL webhook data format" });
        return;
      }

      // Process the webhook
      await processWebhook(req.body);

      console.log("GHL webhook processed successfully, sending response");
      res.status(200).json({
        message: "GHL webhook processed successfully",
        webhookType: req.body.type,
        contactId: req.body.id,
      });
    } catch (error) {
      console.error("GHL webhook processing error:", error);

      // Ensure we always send a response
      if (!res.headersSent) {
        res.status(500).json({
          error: "GHL webhook processing failed",
          detail: error instanceof Error ? error.message : "Unknown error",
          webhookType: req.body?.type || "unknown",
          contactId: req.body?.id || "unknown",
        });
      }
    }
  },

  /**
   * Handle webhook events from Zenexa application
   */
  async handleZenexaWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log("Zenexa webhook received:", req.body);

      // Validate webhook data
      if (!validateZenexaWebhookData(req.body)) {
        console.log("Invalid Zenexa webhook data format");
        res.status(400).json({ error: "Invalid Zenexa webhook data format" });
        return;
      }

      // Process the webhook
      await processZenexaWebhook(req.body);

      console.log("Zenexa webhook processed successfully, sending response");
      res.status(200).json({
        message: "Zenexa webhook processed successfully",
        webhookType: req.body.type,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Zenexa webhook processing error:", error);

      // Ensure we always send a response
      if (!res.headersSent) {
        res.status(500).json({
          error: "Zenexa webhook processing failed",
          detail: error instanceof Error ? error.message : "Unknown error",
          webhookType: req.body?.type || "unknown",
          timestamp: new Date().toISOString(),
        });
      }
    }
  },
};
