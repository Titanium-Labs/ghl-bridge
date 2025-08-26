export enum AppUserType {
  Company = "Company",
  Location = "Location",
}

export enum TokenType {
  Bearer = "Bearer",
}

export interface InstallationDetails {
  access_token: string;
  token_type: TokenType.Bearer;
  expires_in: number;
  refresh_token: string;
  scope: string;
  userType: AppUserType;
  companyId?: string;
  locationId?: string;
}

// Webhook Types
export interface AttributionSource {
  medium: string;
  mediumId: string | null;
  sessionSource: string;
}

export interface ContactWebhookData {
  type: "ContactCreate" | "ContactUpdate" | "ContactDelete";
  locationId: string;
  versionId: string;
  appId: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  additionalEmails: string[];
  additionalPhones: string[];
  dnd: boolean;
  tags: string[];
  country: string;
  dateAdded: string;
  customFields: any[];
  attributionSource: AttributionSource;
  timestamp: string;
  webhookId: string;
}

export interface GHLContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Add other fields as needed based on GHL API response
  [key: string]: any;
}
