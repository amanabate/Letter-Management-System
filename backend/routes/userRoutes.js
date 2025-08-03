import express from "express";
import multer from "multer";
import path from "path";
import {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  uploadProfileImage,
  createUserByAdmin,
  changePassword,
  uploadSignatureImage,
  deactivateUser,
  activateUser,
} from "../controllers/userController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post("/register", registerUser);
router.post("/admin/create-user", createUserByAdmin);
router.post("/login", loginUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:id/change-password", changePassword);
router.delete("/:id", deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/:id/profile-image", upload.single('profileImage'), uploadProfileImage);
router.post("/:id/signature", upload.single('signatureImage'), uploadSignatureImage);
router.patch("/deactivate/:id", deactivateUser);
router.patch("/activate/:id", activateUser);

export default router;