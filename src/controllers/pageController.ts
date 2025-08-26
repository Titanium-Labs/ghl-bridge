import { Request, Response } from "express";
import path from "path";

export const pageController = {
  /**
   * Serve the main application page
   */
  serveMainPage(req: Request, res: Response): void {
    const uiPath = path.join(__dirname, "../ui/dist/index.html");
    res.sendFile(uiPath);
  },
};
