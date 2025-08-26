import { Token, IToken } from "./schemas/Token";
import { AppUserType, TokenType, InstallationDetails } from "./types";

/* The Model class is responsible for saving and retrieving installation details, access tokens, and
refresh tokens using MongoDB for persistence. */
export class Model {
  /**
   * The function saves installation information to MongoDB based on either the location ID or the company ID.
   * @param {InstallationDetails} details - The `details` parameter is an object of type
   * `InstallationDetails`.
   */
  async saveInstallationInfo(details: InstallationDetails) {
    console.log(details);
    try {
      const filter = details.locationId
        ? { locationId: details.locationId, userType: details.userType }
        : { companyId: details.companyId, userType: details.userType };

      await Token.findOneAndUpdate(filter, details, {
        upsert: true,
        new: true,
      });
    } catch (error) {
      console.error("Error saving installation info:", error);
      throw error;
    }
  }

  /**
   * The function `getAccessToken` returns the access token associated with a given resource ID i.e companyId or locationId from MongoDB.
   * @param {string} resourceId - The `resourceId` parameter is a string that represents either locationId or companyId
   * It is used to retrieve the access token associated with that resource.
   * @returns The access token associated with the given resourceId.
   */
  async getAccessToken(resourceId: string): Promise<string | null> {
    try {
      const token = await Token.findOne({
        $or: [{ companyId: resourceId }, { locationId: resourceId }],
      });
      return token?.access_token || null;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  /**
   * The function sets an access token for a specific resource ID in MongoDB.
   * @param {string} resourceId - The resourceId parameter is a string that represents the unique
   * identifier of a resource. It is used to identify a specific installation object in the database.
   * @param {string} token - The "token" parameter is a string that represents the access token that you
   * want to set for a specific resource.
   */
  async setAccessToken(resourceId: string, token: string) {
    try {
      await Token.findOneAndUpdate(
        {
          $or: [{ companyId: resourceId }, { locationId: resourceId }],
        },
        { access_token: token },
        { new: true }
      );
    } catch (error) {
      console.error("Error setting access token:", error);
      throw error;
    }
  }

  /**
   * The function `getRefreshToken` returns the refresh_token associated with a given location or company from MongoDB.
   * @param {string} resourceId - The resourceId parameter is a string that represents the unique
   * identifier of a resource.
   * @returns The refresh token associated with the installation object for the given resourceId.
   */
  async getRefreshToken(resourceId: string): Promise<string | null> {
    try {
      const token = await Token.findOne({
        $or: [{ companyId: resourceId }, { locationId: resourceId }],
      });
      return token?.refresh_token || null;
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  /**
   * The function saves the refresh token for a specific resource i.e. location or company in MongoDB.
   * @param {string} resourceId - The resourceId parameter is a string that represents the unique
   * identifier of a resource. It is used to identify a specific installation object in the database.
   * @param {string} token - The "token" parameter is a string that represents the refresh token. A
   * refresh token is a credential used to obtain a new access token when the current access token
   * expires. It is typically used in authentication systems to maintain a user's session without
   * requiring them to re-enter their credentials.
   */
  async setRefreshToken(resourceId: string, token: string) {
    try {
      await Token.findOneAndUpdate(
        {
          $or: [{ companyId: resourceId }, { locationId: resourceId }],
        },
        { refresh_token: token },
        { new: true }
      );
    } catch (error) {
      console.error("Error setting refresh token:", error);
      throw error;
    }
  }

  /**
   * The function checks if an installation exists for a given resource ID i.e locationId or companyId.
   * @param {string} resourceId - The `resourceId` parameter is a string that represents the ID of a
   * resource.
   * @returns a boolean value indicating whether the installation exists.
   */
  async checkInstallationExists(resourceId: string): Promise<boolean> {
    try {
      const token = await Token.findOne({
        $or: [{ companyId: resourceId }, { locationId: resourceId }],
      });
      return !!token;
    } catch (error) {
      console.error("Error checking installation exists:", error);
      return false;
    }
  }
}

// Re-export types for backward compatibility
export { AppUserType, TokenType, InstallationDetails };
