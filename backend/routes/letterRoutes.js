import express from "express";
import multer from "multer";
import {
  createLetter,
  getLetters,
  downloadFile,
  viewFile,
  updateLetterStatus,
  getSentLetters,
  deleteLetter,
  approveLetter,
  getPendingLetters,
  checkNewLetters,
  forwardLetter,
  rejectLetter,
  assignTask,
  getAssignedTasks,
  getTasksAssignedByUser,
  addLetterProgress,
  getLetterProgress,
  getLetterById,
} from "../controllers/letterController.js";

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG files are allowed."
        ),
        false
      );
    }
  },
});

// Routes
router.post("/", upload.single("attachment"), createLetter);
router.get("/", getLetters);
router.get("/sent", getSentLetters);
router.get("/download/:letterId/:filename", downloadFile);
router.get("/view/:letterId/:filename", viewFile);
// The /status endpoint now supports updating the 'archived' property for archiving/restoring letters
router.post("/status", updateLetterStatus);
router.delete("/:id", deleteLetter);
router.post("/approve", approveLetter);
router.post("/reject", rejectLetter);
router.get("/pending", getPendingLetters);
router.get("/check-new", checkNewLetters);
router.post("/forward", forwardLetter);
router.post("/assign-task", assignTask);
router.get("/assigned", getAssignedTasks);
router.get("/assigned-by", getTasksAssignedByUser);
router.post("/progress", addLetterProgress);
router.get("/progress/:letterId", getLetterProgress);
router.get("/:letterId", getLetterById);

export default router;
