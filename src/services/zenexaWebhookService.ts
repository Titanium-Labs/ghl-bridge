import { Request } from "express";
import { GHL } from "../ghl";

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
export const handleZenexaContactCreate = async (payload: any): Promise<any> => {
  logZenexaWebhookEvent("ContactCreate", payload);
  console.log("Processing Zenexa ContactCreate event...");

  try {
    // Extract contact data from Zenexa payload
    const contactData = {
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      name:
        payload.name ||
        `${payload.firstName || ""} ${payload.lastName || ""}`.trim(),
      email: payload.email || "",
      locationId: payload.locationId || process.env.DEFAULT_LOCATION_ID,
    };

    // Validate required fields
    if (!contactData.locationId) {
      throw new Error("locationId is required to create a contact");
    }

    if (!contactData.email && !contactData.name) {
      throw new Error("Either email or name is required to create a contact");
    }

    console.log("Creating contact in HighLevel with data:", contactData);

    // Initialize GHL instance
    const ghl = new GHL();

    // Check if installation exists for the location
    const installationExists = await ghl.checkInstallationExists(
      contactData.locationId
    );
    if (!installationExists) {
      throw new Error(
        `No installation found for locationId: ${contactData.locationId}`
      );
    }

    // Get authenticated axios instance
    const axiosInstance = await ghl.requests(contactData.locationId);

    // Make API call to create contact
    const createResponse = await axiosInstance.post("/contacts/", contactData, {
      headers: {
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
    });

    console.log(
      "Contact created successfully in HighLevel:",
      createResponse.data
    );

    // Check if the contact was created successfully and has an ID
    if (
      !createResponse.data ||
      !createResponse.data.contact ||
      !createResponse.data.contact.id
    ) {
      throw new Error(
        "Failed to create contact - no ID returned from HighLevel"
      );
    }

    const contactId = createResponse.data.contact.id;
    console.log("Retrieving contact details for ID:", contactId);

    // Step 2: Fetch the contact by ID using the GET contacts API
    const getResponse = await axiosInstance.get(`/contacts/${contactId}`, {
      headers: {
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
    });

    if (!getResponse.data) {
      throw new Error("Failed to retrieve contact details from HighLevel");
    }

    console.log(
      "Contact details retrieved successfully from GET API:",
      getResponse.data
    );

    // Return the contact data fetched from the GET API
    return getResponse.data;
  } catch (error: any) {
    console.error("Error creating contact in HighLevel:", error);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
    }
    throw error;
  }
};

export const handleZenexaContactUpdate = async (
  payload: any
): Promise<void> => {
  logZenexaWebhookEvent("ContactUpdate", payload);
  console.log("Processing Zenexa ContactUpdate event...");
  // For now, just print the payload as requested
  console.log("ContactUpdate payload received:", payload);
};

export const handleZenexaContactDelete = async (payload: any): Promise<any> => {
  logZenexaWebhookEvent("ContactDelete", payload);
  console.log("Processing Zenexa ContactDelete event...");

  try {
    // Extract contact ID and locationId from the payload
    const contactId = payload.id;
    const locationId = payload.locationId;

    if (!contactId) {
      throw new Error("Contact ID is required to delete a contact");
    }

    if (!locationId) {
      throw new Error("Location ID is required to delete a contact");
    }

    console.log(
      "Deleting contact with ID:",
      contactId,
      "from location:",
      locationId
    );

    // Initialize GHL instance
    const ghl = new GHL();

    // Check if installation exists for the location
    const installationExists = await ghl.checkInstallationExists(locationId);
    if (!installationExists) {
      throw new Error(`No installation found for locationId: ${locationId}`);
    }

    // Get authenticated axios instance
    const axiosInstance = await ghl.requests(locationId);

    // Make DELETE API call to delete the contact
    const deleteResponse = await axiosInstance.delete(
      `/contacts/${contactId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
      }
    );

    console.log(
      "Contact deleted successfully from HighLevel:",
      deleteResponse.data
    );

    // Return the delete API response
    return deleteResponse.data;
  } catch (error: any) {
    console.error("Error deleting contact in HighLevel:", error);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
    }
    throw error;
  }
};

// Webhook handler mapping
export const zenexaWebhookHandlers: Record<
  ZenexaWebhookEvent,
  (payload: any) => Promise<any>
> = {
  ContactCreate: handleZenexaContactCreate,
  ContactUpdate: handleZenexaContactUpdate,
  ContactDelete: handleZenexaContactDelete,
};

// Main webhook processing function
export const processZenexaWebhook = async (
  webhookData: ZenexaWebhookData
): Promise<any> => {
  const handler = zenexaWebhookHandlers[webhookData.type];

  if (!handler) {
    throw new Error(`Unsupported Zenexa webhook type: ${webhookData.type}`);
  }

  return await handler(webhookData.payload);
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
