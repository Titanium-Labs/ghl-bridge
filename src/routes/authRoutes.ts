import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

// Authorization callback route
router.get("/authorize-handler", authController.handleAuthorization);

// SSO decryption route
router.post("/decrypt-sso", authController.decryptSSO);

export default router;
