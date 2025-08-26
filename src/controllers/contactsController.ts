import { Request, Response } from "express";
import { GHL } from "../ghl";
import { ensureLocationClient } from "../helpers/tokenInstallation";

const ghl = new GHL();

export const contactsController = {
  /**
   * Get contacts with search functionality
   */
  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const locationId = String(req.query.locationId || "");
      const companyId = String(req.query.companyId || "");

      if (!locationId) {
        res.status(400).json({ error: "locationId is required" });
        return;
      }

      if (!companyId) {
        res.status(400).json({ error: "companyId is required" });
        return;
      }

      const body = {
        filters: [],
        locationId,
        query: "",
        page: 1,
        pageLimit: 10,
      };

      let client = await ensureLocationClient(companyId, locationId);

      // Single execution path; retry once on 401 to auto-recover expired/rotated tokens
      try {
        const response = await client.post("/contacts/search", body);
        res.send(response.data);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await ghl.getLocationTokenFromCompanyToken(companyId, locationId);
          client = await ensureLocationClient(companyId, locationId);
          const response = await client.post("/contacts/search", body);
          res.send(response.data);
        } else {
          const status = err?.response?.status || 500;
          res.status(status).json({
            error: "Error fetching contacts",
            detail: err?.message || err,
          });
        }
      }
    } catch (error: any) {
      res.status(500).json({
        error: "Unexpected server error",
        detail: error?.message,
      });
    }
  },

  /**
   * Example API call for location-based contact retrieval
   */
  async getContactsByLocation(req: Request, res: Response): Promise<void> {
    try {
      const locationId = req.params.locationId;
      const queryLocationId = req.query.locationId as string;
      const companyId = req.query.companyId as string;

      if (await ghl.checkInstallationExists(locationId)) {
        const axiosInstance = await ghl.requests(queryLocationId);
        const request = await axiosInstance.get(
          `/contacts/?locationId=${queryLocationId}`,
          {
            headers: {
              Version: "2021-07-28",
            },
          }
        );
        res.send(request.data);
      } else {
        // NOTE: This flow would only work if you have a distribution type of both Location & Company & OAuth read-write scopes are configured.
        await ghl.getLocationTokenFromCompanyToken(companyId, queryLocationId);
        const axiosInstance = await ghl.requests(queryLocationId);
        const request = await axiosInstance.get(
          `/contacts/?locationId=${queryLocationId}`,
          {
            headers: {
              Version: "2021-07-28",
            },
          }
        );
        res.send(request.data);
      }
    } catch (error) {
      console.error("Location contacts error:", error);
      res.status(400).send(error);
    }
  },
};
