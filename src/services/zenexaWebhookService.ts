import { Request } from "express";

// Type definitions for Zenexa webhook events
export type ZenexaWebhookEvent =
  | "ContactCreate"
  | "ContactUpdate"
  | "ContactDelete";

export interface ZenexaWebhookData {
  type: ZenexaWebhookEvent;
  payload: any;
  timestamp?: string;
  source?: string;
}

// Utility functions
export const logZenexaWebhookEvent = (
  type: ZenexaWebhookEvent,
  payload: any
): void => {
  console.log(`[${new Date().toISOString()}] Zenexa Webhook Event: ${type}`);
  console.log(
    `[${new Date().toISOString()}] Payload:`,
    JSON.stringify(payload, null, 2)
  );
};

// Webhook handlers for Zenexa events
export const handleZenexaContactCreate = async (
  payload: any
): Promise<void> => {
  logZenexaWebhookEvent("ContactCreate", payload);
  console.log("Processing Zenexa ContactCreate event...");
  // For now, just print the payload as requested
  console.log("ContactCreate payload received:", payload);
};

export const handleZenexaContactUpdate = async (
  payload: any
): Promise<void> => {
  logZenexaWebhookEvent("ContactUpdate", payload);
  console.log("Processing Zenexa ContactUpdate event...");
  // For now, just print the payload as requested
  console.log("ContactUpdate payload received:", payload);
};

export const handleZenexaContactDelete = async (
  payload: any
): Promise<void> => {
  logZenexaWebhookEvent("ContactDelete", payload);
  console.log("Processing Zenexa ContactDelete event...");
  // For now, just print the payload as requested
  console.log("ContactDelete payload received:", payload);
};

// Webhook handler mapping
export const zenexaWebhookHandlers: Record<
  ZenexaWebhookEvent,
  (payload: any) => Promise<void>
> = {
  ContactCreate: handleZenexaContactCreate,
  ContactUpdate: handleZenexaContactUpdate,
  ContactDelete: handleZenexaContactDelete,
};

// Main webhook processing function
export const processZenexaWebhook = async (
  webhookData: ZenexaWebhookData
): Promise<void> => {
  const handler = zenexaWebhookHandlers[webhookData.type];

  if (!handler) {
    throw new Error(`Unsupported Zenexa webhook type: ${webhookData.type}`);
  }

  await handler(webhookData.payload);
};

// Validation function
export const validateZenexaWebhookData = (
  data: any
): data is ZenexaWebhookData => {
  const supportedTypes: ZenexaWebhookEvent[] = [
    "ContactCreate",
    "ContactUpdate",
    "ContactDelete",
  ];

  return (
    data &&
    typeof data.type === "string" &&
    supportedTypes.includes(data.type as ZenexaWebhookEvent) &&
    data.payload !== undefined
  );
};
