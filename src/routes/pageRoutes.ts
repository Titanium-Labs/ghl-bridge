import { Router } from "express";
import { pageController } from "../controllers/pageController";

const router = Router();

// Serve main application page
router.get("/", pageController.serveMainPage);

export default router;
