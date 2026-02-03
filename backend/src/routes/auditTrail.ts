import { Router } from "express";
import { AuditTrailController } from "../controllers/auditTrailController";

const router = Router();

/**
 * @route GET /api/audit-trail/:depositId
 * @desc Get on-chain audit trail for a deposit
 * @access Public
 */
router.get("/:depositId", AuditTrailController.getDepositAuditTrail);

export default router;
