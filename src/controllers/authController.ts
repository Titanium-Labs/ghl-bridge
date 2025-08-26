import { Request, Response } from "express";
import { GHL } from "../ghl";

const ghl = new GHL();

export const authController = {
  /**
   * Handle authorization callback from OAuth flow
   */
  async handleAuthorization(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      await ghl.authorizationHandler(code as string);
      res.redirect("https://app.gohighlevel.com/");
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ error: "Authorization failed" });
    }
  },

  /**
   * Decrypt SSO data using provided key
   */
  async decryptSSO(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.body || {};
      if (!key) {
        res.status(400).send("Please send valid key");
        return;
      }

      const data = ghl.decryptSSOData(key);
      res.send(data);
    } catch (error) {
      console.error("SSO decryption error:", error);
      res.status(400).send("Invalid Key");
    }
  },
};
