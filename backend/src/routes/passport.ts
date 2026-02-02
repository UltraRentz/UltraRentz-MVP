import { Router } from "express";
import { PassportController } from "../controllers/passportController";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @route POST /api/deposits/:depositId/passport
 * @desc Passport a deposit to a new scheme/platform
 * @access Private (tenant only)
 */
router.post("/deposits/:depositId/passport", authenticate, PassportController.passportDeposit);

export default router;
