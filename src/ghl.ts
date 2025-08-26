import qs from "qs";
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { createDecipheriv, createHash } from "node:crypto";

import { Model } from "./model";
import { TokenType } from "./types";

/* The GHL class is responsible for handling authorization, making API requests, and managing access
tokens and refresh tokens for a specific resource. */
export class GHL {
  public model: Model;

  constructor() {
    this.model = new Model();
  }

  /**
   * The `authorizationHandler` function handles the authorization process by generating an access token
   * and refresh token pair.
   * @param {string} code - The code parameter is a string that represents the authorization code
   * obtained from the authorization server. It is used to exchange for an access token and refresh token
   * pair.
   */
  async authorizationHandler(code: string) {
    if (!code) {
      console.warn(
        "Please provide code when making call to authorization Handler"
      );
    }
    await this.generateAccessTokenRefreshTokenPair(code);
  }

  decryptSSOData(key: string) {
    try {
      const blockSize = 16;
      const keySize = 32;
      const ivSize = 16;
      const saltSize = 8;

      const rawEncryptedData = Buffer.from(key, "base64");
      const salt = rawEncryptedData.subarray(saltSize, blockSize);
      const cipherText = rawEncryptedData.subarray(blockSize);

      let result = Buffer.alloc(0, 0);
      while (result.length < keySize + ivSize) {
        const hasher = createHash("md5");
        result = Buffer.concat([
          result,
          hasher
            .update(
              Buffer.concat([
                result.subarray(-ivSize),
                Buffer.from(process.env.GHL_APP_SSO_KEY as string, "utf-8"),
                salt,
              ])
            )
            .digest(),
        ]);
      }

      const decipher = createDecipheriv(
        "aes-256-cbc",
        result.subarray(0, keySize),
        result.subarray(keySize, keySize + ivSize)
      );

      const decrypted = decipher.update(cipherText);
      const finalDecrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(finalDecrypted.toString());
    } catch (error) {
      console.error("Error decrypting SSO data:", error);
      throw error;
    }
  }

  /**
   * The function creates an instance of Axios with a base URL and interceptors for handling
   * authorization and refreshing access tokens.
   * @param {string} resourceId - The `resourceId` parameter is a string that represents the locationId or companyId you want
   * to make api call for.
   * @returns an instance of the Axios library with some custom request and response interceptors.
   */
  async requests(resourceId: string) {
    const baseUrl = process.env.GHL_API_DOMAIN;

    const accessToken = await this.model.getAccessToken(resourceId);
    if (!accessToken) {
      throw new Error("Installation not found for the following resource");
    }

    const axiosInstance = axios.create({
      baseURL: baseUrl,
    });

    axiosInstance.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        try {
          const token = await this.model.getAccessToken(resourceId);
          requestConfig.headers[
            "Authorization"
          ] = `${TokenType.Bearer} ${token}`;
        } catch (e) {
          console.error(e);
        }
        return requestConfig;
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          return this.refreshAccessToken(resourceId).then(async () => {
            const newToken = await this.model.getAccessToken(resourceId);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          });
        }

        return Promise.reject(error);
      }
    );

    return axiosInstance;
  }

  /**
   * The function checks if an installation exists for a given resource ID i.e locationId or companyId.
   * @param {string} resourceId - The `resourceId` parameter is a string that represents the ID of a
   * resource.
   * @returns a boolean value.
   */
  async checkInstallationExists(resourceId: string) {
    return await this.model.checkInstallationExists(resourceId);
  }

  /**
   * The function `getLocationTokenFromCompanyToken` retrieves a location token from a company token and
   * saves the installation information.
   * @param {string} companyId - A string representing the ID of the company.
   * @param {string} locationId - The `locationId` parameter is a string that represents the unique
   * identifier of a location within a company.
   */
  async getLocationTokenFromCompanyToken(
    companyId: string,
    locationId: string
  ) {
    const axiosInstance = await this.requests(companyId);
    const res = await axiosInstance.post(
      "/oauth/locationToken",
      {
        companyId,
        locationId,
      },
      {
        headers: {
          Version: "2021-07-28",
        },
      }
    );
    await this.model.saveInstallationInfo(res.data);
  }

  private async refreshAccessToken(resourceId: string) {
    try {
      const refreshToken = await this.model.getRefreshToken(resourceId);
      if (!refreshToken) {
        throw new Error("No refresh token found for resource");
      }

      const resp = await axios.post(
        `${process.env.GHL_API_DOMAIN}/oauth/token`,
        qs.stringify({
          client_id: process.env.GHL_APP_CLIENT_ID,
          client_secret: process.env.GHL_APP_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        { headers: { "content-type": "application/x-www-form-urlencoded" } }
      );
      await this.model.setAccessToken(resourceId, resp.data.access_token);
      await this.model.setRefreshToken(resourceId, resp.data.refresh_token);
    } catch (error: any) {
      console.error(error?.response?.data);
    }
  }

  private async generateAccessTokenRefreshTokenPair(code: string) {
    try {
      const resp = await axios.post(
        `${process.env.GHL_API_DOMAIN}/oauth/token`,
        qs.stringify({
          client_id: process.env.GHL_APP_CLIENT_ID,
          client_secret: process.env.GHL_APP_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
        }),
        { headers: { "content-type": "application/x-www-form-urlencoded" } }
      );
      await this.model.saveInstallationInfo(resp.data);
    } catch (error: any) {
      console.error(error?.response?.data);
    }
  }
}
