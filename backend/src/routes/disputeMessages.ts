import { Router } from "express";
import { DisputeMessageController } from "../controllers/disputeMessageController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Get all messages for a dispute
router.get("/:disputeId", authenticate, DisputeMessageController.getMessages);
// Post a new message to a dispute
router.post("/:disputeId", authenticate, DisputeMessageController.postMessage);

export default router;
