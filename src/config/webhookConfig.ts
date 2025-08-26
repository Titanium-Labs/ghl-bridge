// Webhook configuration
export const webhookConfig = {
  // Supported webhook types
  supportedTypes: ["ContactCreate", "ContactUpdate", "ContactDelete"] as const,

  // Logging configuration
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || "info",
  },

  // GHL API configuration
  ghl: {
    apiVersion: "2021-07-28",
    timeout: 30000, // 30 seconds
  },

  // Webhook processing configuration
  processing: {
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
} as const;

export type SupportedWebhookType =
  (typeof webhookConfig.supportedTypes)[number];
