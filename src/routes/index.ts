import { Router } from "express";
import authRoutes from "./authRoutes";
import contactsRoutes from "./contactsRoutes";
import webhookRoutes from "./webhookRoutes";
import pageRoutes from "./pageRoutes";

const router = Router();

// Mount route modules
router.use("/", pageRoutes);
router.use("/", authRoutes);
router.use("/", contactsRoutes);
router.use("/", webhookRoutes);

export default router;
