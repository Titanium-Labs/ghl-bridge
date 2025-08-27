import { Router } from "express";
import { webhookController } from "../controllers/webhookController";

const router = Router();

// GHL webhook handler route
router.post("/webhook-handler", webhookController.handleWebhook);

// Zenexa webhook handler route
router.post("/zenexa-webhook", webhookController.handleZenexaWebhook);

export default router;
