import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE_AM } from "./emailTemplate.js";
import { WELCOME_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE_AM } from "./welcomeTemplate.js";
import path from "path";

// Common passwords to prevent
const COMMON_PASSWORDS = [
  "team",
  "password",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
  "admin",
  "user",
  "test",
  "guest",
  "welcome",
  "login",
  "letmein",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "shadow",
  "michael",
  "jordan",
  "superman",
  "batman",
  "spider",
  "love",
  "hate",
  "secret",
  "god",
  "sex",
  "pass",
  "demo",
];

// Check if password is common/weak
const isCommonPassword = (password) => {
  const normalizedPassword = password.toLowerCase().trim();
  return COMMON_PASSWORDS.includes(normalizedPassword);
};

export const registerUser = async (req, res) => {
  const { name, email, password, phone, departmentOrSector, lang } = req.body;

  try {
    // Check for common passwords
    if (isCommonPassword(password)) {
      return res.status(400).json({
        error: "Password is too common. Please choose a more secure password.",
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      departmentOrSector,
      role: "user", // Default role
    });
    await user.save();

    // Send welcome email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const loginUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/login`;

      // Replace placeholders in the welcome template
      let html = (lang === "am" ? WELCOME_EMAIL_TEMPLATE_AM : WELCOME_EMAIL_TEMPLATE)
        .replace(/{userName}/g, name)
        .replace(/{userEmail}/g, email)
        .replace(/{userDepartment}/g, departmentOrSector || "Not specified")
        .replace(/{loginURL}/g, loginUrl);

      const mailOptions = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: "Welcome to SSPI Letter Management System",
        html,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(process.cwd(), "uploads", "logo.png"),
            cid: "logo",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.active === false) {
      return res.status(403).json({ message: "Account deactivated. Contact admin." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        departmentOrSector: user.departmentOrSector,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, "-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deactivated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email, lang } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password/${token}`;
    const html = lang === "am"
      ? PASSWORD_RESET_REQUEST_TEMPLATE_AM.replace("{resetURL}", resetUrl)
      : PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetUrl);
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: lang === "am" ? "የይለፍ ቃል ማስተካከያ" : "Password Reset",
      html,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset link sent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check for common passwords
    if (isCommonPassword(password)) {
      return res.status(400).json({
        message:
          "Password is too common. Please choose a more secure password.",
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Create the image URL
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    // Update user with profile image
    const user = await User.findByIdAndUpdate(
      id,
      { profileImage: imageUrl },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImage: imageUrl,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadSignatureImage = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const signaturePath = req.file.path;
    const user = await User.findByIdAndUpdate(
      userId,
      { signatureImage: signaturePath },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ signatureImage: user.signatureImage });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload signature' });
  }
};

// Generate a random temporary password
const generateTemporaryPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Admin creates user with temporary password
export const createUserByAdmin = async (req, res) => {
  const { name, email, phone, departmentOrSector, role = "user", lang } = req.body;

  try {
    // Normalize departmentOrSector and role for uniqueness check
    const normalizedDept = (departmentOrSector || "").trim().toLowerCase();
    const normalizedRole = (role || "").trim().toLowerCase();

    // Only allow one person per non-'user' role per departmentOrSector
    if (normalizedRole !== "user") {
      const existingRole = await User.findOne({
        departmentOrSector: normalizedDept,
        role: normalizedRole,
      });
      if (existingRole) {
        return res.status(400).json({
          message: `There is already a person registered with the role '${role}' for this unit/department. Only one person per role is allowed per unit.`,
        });
      }
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      departmentOrSector: normalizedDept,
      role: normalizedRole,
      isFirstLogin: true, // Flag to force password change
    });
    await user.save();

    // Send welcome email with temporary password
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const loginUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/login`;

      // Create welcome email with temporary password
      let html = (lang === "am" ? WELCOME_EMAIL_TEMPLATE_AM : WELCOME_EMAIL_TEMPLATE)
        .replace(/{userName}/g, name)
        .replace(/{userEmail}/g, email)
        .replace(/{userDepartment}/g, departmentOrSector || "Not specified")
        .replace(/{loginURL}/g, loginUrl);

      // Add temporary password section to the email
      const tempPasswordSection = `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">Your Temporary Password:</h3>
          <p style="margin: 5px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #856404; background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center;">${temporaryPassword}</p>
          <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;"><strong>Important:</strong> Please change this password immediately after your first login for security reasons.</p>
        </div>
      `;

      // Insert temporary password section before the "Get Started" button
      html = html.replace(
        '<div style="text-align: center; margin: 30px 0;">',
        tempPasswordSection +
          '<div style="text-align: center; margin: 30px 0;">'
      );

      const mailOptions = {
        to: email,
        from: process.env.EMAIL_USER,
        subject:
          "Welcome to SSPI Letter Management System - Your Account Details",
        html,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(process.cwd(), "uploads", "logo.png"),
            cid: "logo",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the user creation if email fails
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        departmentOrSector: user.departmentOrSector,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password for logged-in user
export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check for common passwords
    if (isCommonPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password is too common. Please choose a more secure password.",
      });
    }

    // Check password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and set isFirstLogin to false
    user.password = hashedNewPassword;
    user.isFirstLogin = false;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { active: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User activated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
