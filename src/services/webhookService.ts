import { ContactWebhookData, GHLContactResponse } from "../types";
import { ensureLocationClient } from "../helpers/tokenInstallation";
import { webhookConfig } from "../config/webhookConfig";
import { Token } from "../schemas/Token";
import axios from "axios";

// Type definitions
export type WebhookHandler = (data: ContactWebhookData) => Promise<void>;
export type WebhookHandlerMap = Record<string, WebhookHandler>;

// Utility functions
export const logWebhookEvent = (
  type: string,
  data: ContactWebhookData
): void => {
  if (webhookConfig.logging.enabled) {
    console.log(
      `[${new Date().toISOString()}] Processing ${type} webhook for contact: ${
        data.id
      }`
    );
  }
};

export const logError = (operation: string, error: any): void => {
  if (webhookConfig.logging.enabled) {
    console.error(
      `[${new Date().toISOString()}] Error in ${operation}:`,
      error
    );
  }
};

export const logSuccess = (operation: string, data: any): void => {
  if (webhookConfig.logging.enabled) {
    console.log(
      `[${new Date().toISOString()}] Successfully completed ${operation}:`,
      data
    );
  }
};

// Retry utility function
const retryWithDelay = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = webhookConfig.processing.retryAttempts,
  delay: number = webhookConfig.processing.retryDelay
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        logError(`Attempt ${attempt} failed`, error);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

// Database functions
export const getCompanyIdFromLocationId = async (
  locationId: string
): Promise<string> => {
  try {
    const token = await Token.findOne({
      locationId: locationId,
      userType: "Location",
    }).exec();

    if (!token || !token.companyId) {
      throw new Error(`No company ID found for location: ${locationId}`);
    }

    console.log(
      `[${new Date().toISOString()}] Found company ID: ${
        token.companyId
      } for location: ${locationId}`
    );
    return token.companyId;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching company ID for location ${locationId}:`,
      error
    );
    throw error;
  }
};

// GHL API functions
export const getContactFromGHL = async (
  locationId: string,
  contactId: string
): Promise<GHLContactResponse> => {
  const operation = async (): Promise<GHLContactResponse> => {
    const companyId = await getCompanyIdFromLocationId(locationId);
    const client = await ensureLocationClient(companyId, locationId);

    const response = await client.get(`/contacts/${contactId}`, {
      timeout: webhookConfig.ghl.timeout,
    });
    return response.data;
  };

  return retryWithDelay(operation);
};

// Zenexa API function
const callZenexaBackend = async (
  webhookType: string,
  data: any
): Promise<void> => {
  const zenexaBackendUrl = process.env.ZENEXA_BACKEND_URL;

  if (!zenexaBackendUrl) {
    console.error(
      `[${new Date().toISOString()}] ZENEXA_BACKEND_URL environment variable is not configured`
    );
    throw new Error(
      "ZENEXA_BACKEND_URL environment variable is not configured"
    );
  }

  console.log(
    `[${new Date().toISOString()}] Calling Zenexa backend at: ${zenexaBackendUrl}/api/webhook/ghl`
  );

  const url = `${zenexaBackendUrl}/api/webhook/ghl`;

  try {
    const response = await axios.post(
      url,
      {
        type: webhookType,
        data: data,
      },
      {
        timeout: webhookConfig.ghl.timeout || 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(
      "Response from Zenexa API call for ",
      webhookType,
      ":",
      response
    );

    logSuccess(`Zenexa API call for ${webhookType}`, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error: any) {
    // Provide more detailed error information
    const errorDetails = {
      message: error.message || "Unknown error",
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: url,
      webhookType: webhookType,
    };

    logError(`Zenexa API call for ${webhookType}`, errorDetails);
    throw error;
  }
};

// Webhook handlers
export const handleContactCreate: WebhookHandler = async (
  data: ContactWebhookData
): Promise<void> => {
  logWebhookEvent("ContactCreate", data);

  try {
    const contactData = await getContactFromGHL(data.locationId, data.id);
    logSuccess("Contact Create - GHL API Response", contactData);

    // Call Zenexa backend with retry logic
    await retryWithDelay(async () => {
      await callZenexaBackend("ContactCreate", contactData);
    });
  } catch (error) {
    logError("Contact Create handler", error);
    // Don't throw error, just log it and continue
    // This ensures the webhook response is still sent
    console.log(
      `[${new Date().toISOString()}] Contact Create completed with API error for contact: ${
        data.id
      }`
    );
  }
};

export const handleContactUpdate: WebhookHandler = async (
  data: ContactWebhookData
): Promise<void> => {
  logWebhookEvent("ContactUpdate", data);

  try {
    const contactData = await getContactFromGHL(data.locationId, data.id);
    logSuccess("Contact Update - GHL API Response", contactData);

    // Call Zenexa backend with retry logic
    await retryWithDelay(async () => {
      await callZenexaBackend("ContactUpdate", contactData);
    });
  } catch (error) {
    logError("Contact Update handler", error);
    // Don't throw error, just log it and continue
    // This ensures the webhook response is still sent
    console.log(
      `[${new Date().toISOString()}] Contact Update completed with API error for contact: ${
        data.id
      }`
    );
  }
};

export const handleContactDelete: WebhookHandler = async (
  data: ContactWebhookData
): Promise<void> => {
  logWebhookEvent("ContactDelete", data);
  console.log(
    `[${new Date().toISOString()}] Reached Deletion for contact: ${data.id}`
  );

  try {
    // For deletion, we send the contact ID and basic data wrapped in a contact object
    // to match the Zenexa backend expectation: data.contact
    const deleteData = {
      contact: {
        id: data.id,
        locationId: data.locationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
    };

    // Call Zenexa backend with retry logic
    await retryWithDelay(async () => {
      await callZenexaBackend("ContactDelete", deleteData);
    });
  } catch (error) {
    logError("Contact Delete handler", error);
    // Don't throw error, just log it and continue
    // This ensures the webhook response is still sent
    console.log(
      `[${new Date().toISOString()}] Contact Delete completed with API error for contact: ${
        data.id
      }`
    );
  }
};

// Webhook handler mapping
export const webhookHandlers: WebhookHandlerMap = {
  ContactCreate: handleContactCreate,
  ContactUpdate: handleContactUpdate,
  ContactDelete: handleContactDelete,
};

// Main webhook processing function
export const processWebhook = async (
  webhookData: ContactWebhookData
): Promise<void> => {
  const handler = webhookHandlers[webhookData.type];

  if (!handler) {
    throw new Error(`Unsupported webhook type: ${webhookData.type}`);
  }

  await handler(webhookData);
};

// Validation function
export const validateWebhookData = (data: any): data is ContactWebhookData => {
  return (
    data &&
    typeof data.type === "string" &&
    typeof data.locationId === "string" &&
    typeof data.id === "string" &&
    webhookConfig.supportedTypes.includes(data.type as any)
  );
};
