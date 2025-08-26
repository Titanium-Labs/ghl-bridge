import { Router } from "express";
import { webhookController } from "../controllers/webhookController";

const router = Router();

// Webhook handler route
router.post("/webhook-handler", webhookController.handleWebhook);

// /example-webhook-handler

export default router;
