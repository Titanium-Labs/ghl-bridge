import { GHL } from "../ghl";

const ghl = new GHL();

export const ensureLocationClient = async (
  companyId: string,
  locationId: string
) => {
  // If we don't have a stored token for this location, mint one from the company token
  const hasToken = await ghl.checkInstallationExists(locationId);
  if (!hasToken) {
    await ghl.getLocationTokenFromCompanyToken(companyId, locationId);
  }
  const client = await ghl.requests(locationId);
  // Pin API version once
  client.defaults.headers = client.defaults.headers || {};
  client.defaults.headers["Version"] = "2021-07-28";
  return client;
};
