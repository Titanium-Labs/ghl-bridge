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
