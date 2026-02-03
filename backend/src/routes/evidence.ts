import { Router } from "express";
import { EvidenceController } from "../controllers/evidenceController";
import { authenticate } from "../middleware/auth";
// import multer from "multer";

const router = Router();

// Configure multer for file uploads (local disk for now)
/*
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, "uploads/");
  },
  filename: function (req: any, file: any, cb: any) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });
*/
const upload = { single: (name: string) => (req: any, res: any, next: any) => next() };

/**
 * @route POST /api/evidence/:disputeId
 * @desc Upload evidence file for a dispute
 * @access Private (party to dispute)
 */
router.post(
  "/:disputeId",
  authenticate,
  upload.single("file"),
  EvidenceController.uploadEvidence
);

/**
 * @route GET /api/evidence/:disputeId
 * @desc Get all evidence for a dispute
 * @access Public
 */
router.get(
  "/:disputeId",
  EvidenceController.getEvidenceForDispute
);

export default router;
