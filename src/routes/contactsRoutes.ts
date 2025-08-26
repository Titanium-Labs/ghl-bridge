import { Router } from "express";
import { contactsController } from "../controllers/contactsController";

const router = Router();

// Get contacts with search functionality
router.get("/get-contacts", contactsController.getContacts);

// Example API call for location-based contact retrieval
router.get(
  "/example-api-call-location/:locationId",
  contactsController.getContactsByLocation
);

export default router;
