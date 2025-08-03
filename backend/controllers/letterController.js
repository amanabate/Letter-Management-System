import Letter from "../models/Letter.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CREATE LETTER
export const createLetter = async (req, res) => {
  try {
    console.log("Received letter creation request:", req.body);

    // Validate required fields
    if (!req.body.subject || !req.body.content || !req.body.to) {
      return res.status(400).json({
        error: "Subject, content, and recipient are required",
      });
    }

    // Find sender
    const sender = await User.findById(req.body.from);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Find recipient
    const recipient = await User.findOne({ name: req.body.to });
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Handle file upload
    let attachmentsArr = [];
    if (req.file) {
      attachmentsArr.push({
        filename: req.file.originalname,
        data: req.file.buffer,
        mimetype: req.file.mimetype,
      });
    }

    // Handle CC employees
    let ccEmployees = {};
    if (req.body.ccEmployees) {
      try {
        ccEmployees =
          typeof req.body.ccEmployees === "string"
            ? JSON.parse(req.body.ccEmployees)
            : req.body.ccEmployees;
      } catch (error) {
        console.error("Error parsing ccEmployees:", error);
        ccEmployees = {};
      }
    }

    // Resolve CC emails
    let ccEmails = [];
    if (ccEmployees && typeof ccEmployees === "object") {
      for (const dept in ccEmployees) {
        const names = ccEmployees[dept];
        if (Array.isArray(names)) {
          const users = await User.find({ name: { $in: names } });
          ccEmails.push(...users.map((u) => u.email));
        }
      }
    }

    console.log("CC Emails resolved:", ccEmails);

    // Determine if recipient is high-level
    const highLevelRoles = [
      "executive_head",
      "director_general",
      "deputy_director_general",
      "executive_advisor",
    ];
    const senderIsRegular = sender.role === "user";
    const recipientIsHighLevel = highLevelRoles.includes(recipient.role);

    // Only include fields that exist in the schema (NO "reference" field)
    const isHighPriority =
      req.body.priority &&
      ["high", "urgent"].includes(req.body.priority.toLowerCase());

    // If a regular user sends to a high-level user, set status to 'pending'
    let letterStatus = "sent";
    if (senderIsRegular && recipientIsHighLevel) {
      letterStatus = "pending";
    } else if (isHighPriority) {
      letterStatus = "pending";
    }

    const letterData = {
      subject: req.body.subject,
      from: sender._id,
      fromName: sender.name,
      fromEmail: sender.email,
      to: req.body.to,
      toEmail: recipient.email,
      department: req.body.department,
      priority: req.body.priority || "normal",
      content: req.body.content,
      attachments: attachmentsArr,
      cc: req.body.cc || [],
      ccEmployees: ccEmployees,
      unread: true,
      starred: false,
      status: letterStatus,
    };

    const letter = new Letter(letterData);
    await letter.save();
    console.log("Letter saved to DB:", letter);

    if (isHighPriority) {
      // For high/urgent priority letters, don't create recipient entries or send emails
      // Only save the letter data for admin approval
      console.log("High/urgent priority letter saved for admin approval");
      return res.status(201).json({
        message: "High/urgent priority letter pending admin approval.",
        letter,
      });
    }

    // For normal priority letters, proceed with normal flow
    // Create notification for the main recipient
    const notification = new Notification({
      recipient: recipient._id,
      type: "new_letter",
      title: "New Letter Received",
      message: `You have received a new letter from ${sender.name} regarding "${req.body.subject}"`,
      relatedLetter: letter._id,
      priority: req.body.priority === "urgent" ? "high" : "medium",
    });
    await notification.save();

    // Create separate letter entries and notifications for CC recipients
    const ccLetters = [];
    const ccNotifications = [];

    for (const ccEmail of ccEmails) {
      try {
        // Find the CC user by email
        const ccUser = await User.findOne({ email: ccEmail });
        if (ccUser) {
          // Create a copy of the letter for the CC recipient
          const ccLetterData = {
            ...letterData,
            to: ccUser.name, // Change recipient to CC user
            toEmail: ccEmail,
            from: sender._id,
            fromName: sender.name,
            fromEmail: sender.email,
            isCC: true, // Mark as CC letter
            originalLetter: letter._id, // Reference to original letter
            unread: true,
            starred: false,
            status: "sent",
          };

          const ccLetter = new Letter(ccLetterData);
          await ccLetter.save();
          ccLetters.push(ccLetter);

          // Create notification for CC recipient
          const ccNotification = new Notification({
            recipient: ccUser._id,
            type: "new_letter",
            title: "Letter Copy Received (CC)",
            message: `You have received a copy of a letter from ${sender.name} regarding "${req.body.subject}"`,
            relatedLetter: ccLetter._id,
            priority: req.body.priority === "urgent" ? "high" : "medium",
          });
          await ccNotification.save();
          ccNotifications.push(ccNotification);

          console.log(
            `Created CC letter and notification for: ${ccUser.name} (${ccEmail})`
          );
        } else {
          console.log(`CC user not found for email: ${ccEmail}`);
        }
      } catch (error) {
        console.error(`Error creating CC letter for ${ccEmail}:`, error);
      }
    }

    console.log(
      `Created ${ccLetters.length} CC letters and ${ccNotifications.length} notifications`
    );

    // Send email to recipient and cc, with attachment if present
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enhanced headers to prevent forwarding and ensure confidentiality
    const emailHeaders = {
      "X-No-Forward": "true",
      "X-Confidential": "true",
      "X-Sensitivity": "Confidential",
      "X-Priority": req.body.priority === "urgent" ? "1" : "3",
      "X-MSMail-Priority": req.body.priority === "urgent" ? "High" : "Normal",
      Importance: req.body.priority === "urgent" ? "high" : "normal",
      "Disposition-Notification-To": sender.email,
      "Return-Receipt-To": sender.email,
      "X-Confirm-Reading-To": sender.email,
      "X-Mailer": "Letter Management System - Confidential",
    };

    // Create confidentiality notice for CC recipients
    const confidentialityNotice = `
CONFIDENTIAL COMMUNICATION - DO NOT FORWARD

This email contains confidential information intended only for the named recipient(s). 
If you are not the intended recipient, please delete this email immediately and notify the sender.

FORWARDING RESTRICTIONS:
- This email may not be forwarded to any other party without explicit written permission
- Do not copy, distribute, or share the contents of this email
- Any unauthorized disclosure may result in disciplinary action

By receiving this email, you acknowledge that you understand and will comply with these confidentiality requirements.
    `;

    const mailOptions = {
      from: `"${sender.name} (${req.body.department})" <${sender.email}>`,
      to: recipient.email,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: `[CONFIDENTIAL] ${req.body.subject}`,
      headers: emailHeaders,
      text:
        `${confidentialityNotice}\n\n` +
        `From: ${sender.name} <${sender.email}>\n` +
        `Department: ${req.body.department}\n` +
        `Date: ${new Date().toLocaleDateString()}\n` +
        `Priority: ${req.body.priority.toUpperCase()}\n\n` +
        `Subject: ${req.body.subject}\n\n` +
        `${req.body.content}\n\n` +
        `---\n` +
        `${confidentialityNotice}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc3545; border-radius: 8px; padding: 20px;">
        <div style="background-color: #dc3545; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 6px 6px 0 0; text-align: center;">
          <strong style="font-size: 16px;">⚠️ CONFIDENTIAL COMMUNICATION - DO NOT FORWARD ⚠️</strong>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; margin-bottom: 20px; border-radius: 5px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>CONFIDENTIALITY NOTICE:</strong> This email contains confidential information intended only for the named recipient(s). 
            Forwarding, copying, or distributing this email without explicit permission is strictly prohibited.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #007bff;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${sender.name} &lt;${
        sender.email
      }&gt;</p>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${
            req.body.department
          }</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="color: ${
            req.body.priority === "urgent"
              ? "#dc3545"
              : req.body.priority === "high"
              ? "#fd7e14"
              : "#28a745"
          }; font-weight: bold;">${req.body.priority.toUpperCase()}</span></p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${
            req.body.subject
          }</p>
          ${
            ccEmails.length > 0
              ? `<p style="margin: 5px 0;"><strong>CC:</strong> ${ccEmails.join(
                  ", "
                )}</p>`
              : ""
          }
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 20px;">
          <p style="line-height: 1.6; color: #333; margin: 0;">${req.body.content.replace(
            /\n/g,
            "<br>"
          )}</p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; font-size: 12px; color: #6c757d; border-left: 4px solid #dc3545;">
          <p style="margin: 0 0 10px 0;"><strong>CONFIDENTIALITY REQUIREMENTS:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Do not forward this email without explicit written permission</li>
            <li>Do not copy or distribute the contents</li>
            <li>Maintain the confidentiality of all information contained herein</li>
            <li>Any unauthorized disclosure may result in disciplinary action</li>
          </ul>
          <p style="margin: 10px 0 0 0; font-style: italic;">
            By receiving this email, you acknowledge that you understand and will comply with these confidentiality requirements.
          </p>
        </div>
      </div>
    `,
      attachments:
        attachmentsArr.length > 0
          ? attachmentsArr.map((att) => ({
              filename: att.filename,
              content: att.data,
            }))
          : [],
    };

    console.log("Sending email with CC:", ccEmails);
    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", recipient.email, "CC:", ccEmails);

    res.status(201).json({
      message: "Letter sent successfully",
      letter,
      ccLetters,
      ccNotifications,
    });
  } catch (error) {
    console.error("Error in createLetter:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL LETTERS
export const getLetters = async (req, res) => {
  try {
    // Get user email from query parameter or headers
    const userEmail = req.query.userEmail || req.headers["user-email"];
    const fetchAll = req.query.all === "true";

    // If fetchAll is true and no userEmail is provided, return all letters (for admin panel)
    if (fetchAll && !userEmail) {
      const allLetters = await Letter.find({}).sort({ createdAt: -1 });
      console.log(`Found ${allLetters.length} letters for admin panel`);
      return res.status(200).json(allLetters);
    }

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }

    // Find the user to check their role
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const highLevelRoles = [
      "executive_head",
      "director_general",
      "deputy_director_general",
      "executive_advisor",
    ];
    const isHighLevel = highLevelRoles.includes(user.role);

    let letterQuery;
    if (isHighLevel) {
      // High-level users: include pending letters addressed to them
      letterQuery = {
        $and: [
          {
            $or: [{ toEmail: userEmail }, { isCC: true, toEmail: userEmail }],
          },
          // No status filter: include pending
        ],
      };
    } else {
      // Regular users: exclude pending
      letterQuery = {
        $and: [
          {
            $or: [{ toEmail: userEmail }, { isCC: true, toEmail: userEmail }],
          },
          { status: { $ne: "pending" } },
        ],
      };
    }

    const letters = await Letter.find(letterQuery).sort({ createdAt: -1 });

    console.log(
      `Found ${letters.length} letters for user ${userEmail} (excluding pending letters)`
    );
    res.status(200).json(letters);
  } catch (error) {
    console.error("Error in getLetters:", error);
    res.status(500).json({ error: error.message });
  }
};

// FILE DOWNLOAD
export const downloadFile = async (req, res) => {
  try {
    const { letterId, filename } = req.params;

    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    const attachment = letter.attachments.find(
      (att) => att.filename === filename
    );

    if (!attachment) {
      return res.status(404).json({ error: "File not found" });
    }

    // Fallback for missing contentType
    let contentType = attachment.contentType;
    if (!contentType) {
      const ext = attachment.filename.split(".").pop()?.toLowerCase();
      if (ext === "pdf") contentType = "application/pdf";
      else if (["jpg", "jpeg"].includes(ext)) contentType = "image/jpeg";
      else if (ext === "png") contentType = "image/png";
      else if (ext === "docx")
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === "doc") contentType = "application/msword";
      else contentType = "application/octet-stream";
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.filename}"`
    );
    res.send(attachment.data);
  } catch (error) {
    console.error("Error in downloadFile:", error);
    res.status(500).json({ error: error.message });
  }
};

// FILE VIEW
export const viewFile = async (req, res) => {
  try {
    const { letterId, filename } = req.params;

    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    const attachment = letter.attachments.find(
      (att) => att.filename === filename
    );

    if (!attachment) {
      return res.status(404).json({ error: "File not found" });
    }

    // Fallback for missing contentType
    let contentType = attachment.contentType;
    if (!contentType) {
      const ext = attachment.filename.split(".").pop()?.toLowerCase();
      if (ext === "pdf") contentType = "application/pdf";
      else if (["jpg", "jpeg"].includes(ext)) contentType = "image/jpeg";
      else if (ext === "png") contentType = "image/png";
      else if (ext === "docx")
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === "doc") contentType = "application/msword";
      else contentType = "application/octet-stream";
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.send(attachment.data);
  } catch (error) {
    console.error("Error in viewFile:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE LETTER STATUS
export const updateLetterStatus = async (req, res) => {
  try {
    const { letterId, unread, starred, status, archived } = req.body;

    const updateFields = {};
    if (unread !== undefined) updateFields.unread = unread;
    if (starred !== undefined) updateFields.starred = starred;
    if (status !== undefined) updateFields.status = status;
    if (archived !== undefined) updateFields.archived = archived;

    const updatedLetter = await Letter.findByIdAndUpdate(
      letterId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedLetter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    // Create notification for letter status changes
    if (unread === false) {
      const notification = new Notification({
        recipient: updatedLetter.from,
        type: "letter_read",
        title: "Letter Read",
        message: `${updatedLetter.to} has read your letter regarding "${updatedLetter.subject}"`,
        relatedLetter: updatedLetter._id,
        priority: "low",
      });
      await notification.save();
    }

    if (starred === true) {
      const notification = new Notification({
        recipient: updatedLetter.from,
        type: "letter_starred",
        title: "Letter Starred",
        message: `${updatedLetter.to} has starred your letter regarding "${updatedLetter.subject}"`,
        relatedLetter: updatedLetter._id,
        priority: "low",
      });
      await notification.save();
    }

    res.json(updatedLetter);
  } catch (error) {
    console.error("Error updating letter status:", error);
    res.status(500).json({ message: "Error updating letter status" });
  }
};

// GET SENT LETTERS
export const getSentLetters = async (req, res) => {
  try {
    // Get user email from query parameter or headers
    const userEmail = req.query.userEmail || req.headers["user-email"];

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }

    // Filter letters by the current user's email and include sent, pending, approved, rejected, and assigned status
    const sentLetters = await Letter.find({
      fromEmail: userEmail,
      status: { $in: ["sent", "pending", "approved", "rejected", "assigned"] },
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(sentLetters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE LETTER
export const deleteLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLetter = await Letter.findByIdAndDelete(id);

    if (!deletedLetter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    res.status(200).json({ message: "Letter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting letter", error });
  }
};

// ADMIN: Approve a pending letter and send it
export const approveLetter = async (req, res) => {
  try {
    const { letterId, approvalComment } = req.body;
    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }
    if (letter.status !== "pending") {
      return res.status(400).json({ error: "Letter is not pending approval" });
    }

    // Find sender and recipient
    const sender = await User.findById(letter.from);
    const recipient = await User.findOne({ name: letter.to });
    if (!sender || !recipient) {
      return res.status(404).json({ error: "Sender or recipient not found" });
    }

    // Resolve CC emails
    let ccEmails = [];
    if (Array.isArray(letter.ccEmployees)) {
      ccEmails = letter.ccEmployees;
    } else if (letter.ccEmployees && typeof letter.ccEmployees === "object") {
      for (const dept in letter.ccEmployees) {
        const names = letter.ccEmployees[dept];
        if (Array.isArray(names)) {
          const users = await User.find({ name: { $in: names } });
          ccEmails.push(...users.map((u) => u.email));
        }
      }
    }

    console.log("CC Emails resolved (approve):", ccEmails);

    // Create notification for the main recipient
    const notification = new Notification({
      recipient: recipient._id,
      type: "new_letter",
      title: "New Letter Received",
      message: `You have received a new letter from ${sender.name} regarding "${letter.subject}"`,
      relatedLetter: letter._id,
      priority: letter.priority === "urgent" ? "high" : "medium",
    });
    await notification.save();

    // Create separate letter entries and notifications for CC recipients
    const ccLetters = [];
    const ccNotifications = [];

    for (const ccEmail of ccEmails) {
      try {
        // Find the CC user by email
        const ccUser = await User.findOne({ email: ccEmail });
        if (ccUser) {
          // Create a copy of the letter for the CC recipient
          const ccLetterData = {
            subject: letter.subject,
            from: sender._id,
            fromName: sender.name,
            fromEmail: sender.email,
            to: ccUser.name,
            toEmail: ccEmail,
            department: letter.department,
            priority: letter.priority,
            content: letter.content,
            attachments: letter.attachments,
            cc: letter.cc,
            ccEmployees: letter.ccEmployees,
            isCC: true,
            originalLetter: letter._id,
            unread: true,
            starred: false,
            status: "sent",
          };

          const ccLetter = new Letter(ccLetterData);
          await ccLetter.save();
          ccLetters.push(ccLetter);

          // Create notification for CC recipient
          const ccNotification = new Notification({
            recipient: ccUser._id,
            type: "new_letter",
            title: "Letter Copy Received (CC)",
            message: `You have received a copy of a letter from ${sender.name} regarding "${letter.subject}"`,
            relatedLetter: ccLetter._id,
            priority: letter.priority === "urgent" ? "high" : "medium",
          });
          await ccNotification.save();
          ccNotifications.push(ccNotification);

          console.log(
            `Created CC letter and notification for: ${ccUser.name} (${ccEmail})`
          );
        } else {
          console.log(`CC user not found for email: ${ccEmail}`);
        }
      } catch (error) {
        console.error(`Error creating CC letter for ${ccEmail}:`, error);
      }
    }

    console.log(
      `Created ${ccLetters.length} CC letters and ${ccNotifications.length} notifications`
    );

    // Send email to recipient and cc, with attachment if present
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enhanced headers to prevent forwarding and ensure confidentiality
    const emailHeaders = {
      "X-No-Forward": "true",
      "X-Confidential": "true",
      "X-Sensitivity": "Confidential",
      "X-Priority": letter.priority === "urgent" ? "1" : "3",
      "X-MSMail-Priority": letter.priority === "urgent" ? "High" : "Normal",
      Importance: letter.priority === "urgent" ? "high" : "normal",
      "Disposition-Notification-To": sender.email,
      "Return-Receipt-To": sender.email,
      "X-Confirm-Reading-To": sender.email,
      "X-Mailer": "Letter Management System - Confidential",
    };

    // Create confidentiality notice for CC recipients
    const confidentialityNotice = `
CONFIDENTIAL COMMUNICATION - DO NOT FORWARD

This email contains confidential information intended only for the named recipient(s). 
If you are not the intended recipient, please delete this email immediately and notify the sender.

FORWARDING RESTRICTIONS:
- This email may not be forwarded to any other party without explicit written permission
- Do not copy, distribute, or share the contents of this email
- Any unauthorized disclosure may result in disciplinary action

By receiving this email, you acknowledge that you understand and will comply with these confidentiality requirements.
    `;

    const mailOptions = {
      from: `"${sender.name} (${letter.department})" <${sender.email}>`,
      to: recipient.email,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: `[CONFIDENTIAL] ${letter.subject}`,
      headers: emailHeaders,
      text:
        `${confidentialityNotice}\n\n` +
        `From: ${sender.name} <${sender.email}>\n` +
        `Department: ${letter.department}\n` +
        `Date: ${new Date().toLocaleDateString()}\n` +
        `Priority: ${letter.priority.toUpperCase()}\n\n` +
        `Subject: ${letter.subject}\n\n` +
        `${letter.content}\n\n` +
        `---\n` +
        `${confidentialityNotice}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc3545; border-radius: 8px; padding: 20px;">
        <div style="background-color: #dc3545; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 6px 6px 0 0; text-align: center;">
          <strong style="font-size: 16px;">⚠️ CONFIDENTIAL COMMUNICATION - DO NOT FORWARD ⚠️</strong>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; margin-bottom: 20px; border-radius: 5px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>CONFIDENTIALITY NOTICE:</strong> This email contains confidential information intended only for the named recipient(s). 
            Forwarding, copying, or distributing this email without explicit permission is strictly prohibited.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #007bff;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${sender.name} &lt;${
        sender.email
      }&gt;</p>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${
            letter.department
          }</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="color: ${
            letter.priority === "urgent"
              ? "#dc3545"
              : letter.priority === "high"
              ? "#fd7e14"
              : "#28a745"
          }; font-weight: bold;">${letter.priority.toUpperCase()}</span></p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${
            letter.subject
          }</p>
          ${
            ccEmails.length > 0
              ? `<p style="margin: 5px 0;"><strong>CC:</strong> ${ccEmails.join(
                  ", "
                )}</p>`
              : ""
          }
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 20px;">
          <p style="line-height: 1.6; color: #333; margin: 0;">${letter.content.replace(
            /\n/g,
            "<br>"
          )}</p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; font-size: 12px; color: #6c757d; border-left: 4px solid #dc3545;">
          <p style="margin: 0 0 10px 0;"><strong>CONFIDENTIALITY REQUIREMENTS:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Do not forward this email without explicit written permission</li>
            <li>Do not copy or distribute the contents</li>
            <li>Maintain the confidentiality of all information contained herein</li>
            <li>Any unauthorized disclosure may result in disciplinary action</li>
          </ul>
          <p style="margin: 10px 0 0 0; font-style: italic;">
            By receiving this email, you acknowledge that you understand and will comply with these confidentiality requirements.
          </p>
        </div>
      </div>
    `,
      attachments:
        letter.attachments && letter.attachments.length > 0
          ? letter.attachments.map((att) => ({
              filename: att.filename,
              content: att.data,
            }))
          : [],
    };

    console.log("Sending approved email with CC:", ccEmails);
    await transporter.sendMail(mailOptions);
    console.log("Approved email sent to:", recipient.email, "CC:", ccEmails);

    // Update the original letter status to approved
    letter.status = "approved";
    if (approvalComment) {
      letter.approvalComment = approvalComment;
    }
    await letter.save();

    res.status(200).json({
      message: "Letter approved and sent",
      letter,
      ccLetters,
      ccNotifications,
    });
  } catch (error) {
    console.error("Error in approveLetter:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL PENDING LETTERS (for admin)
export const getPendingLetters = async (req, res) => {
  try {
    const pendingLetters = await Letter.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.status(200).json(pendingLetters);
  } catch (error) {
    console.error("Error in getPendingLetters:", error);
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: Reject a pending letter
// export const rejectLetter = async (req, res) => {
//   try {
//     const { letterId, rejectionReason } = req.body;

//     if (!letterId) {
//       return res.status(400).json({ error: "Letter ID is required" });
//     }

//     if (!rejectionReason || rejectionReason.trim() === "") {
//       return res.status(400).json({ error: "Rejection reason is required" });
//     }

//     const letter = await Letter.findById(letterId);
//     if (!letter) {
//       return res.status(404).json({ error: "Letter not found" });
//     }

//     if (letter.status !== "pending") {
//       return res.status(400).json({ error: "Letter is not pending approval" });
//     }

//     // Update letter status to rejected and add rejection details
//     letter.status = "rejected";
//     letter.rejectionReason = rejectionReason.trim();
//     letter.rejectedAt = new Date();

//     await letter.save();

//     // Create notification for the sender about the rejection
//     const notification = new Notification({
//       recipient: letter.from,
//       type: "letter_rejected",
//       title: "Letter Rejected",
//       message: `Your letter "${letter.subject}" has been rejected by admin. Reason: ${rejectionReason}`,
//       relatedLetter: letter._id,
//       priority: "high",
//     });
//     await notification.save();

//     console.log(`Letter ${letterId} rejected with reason: ${rejectionReason}`);

//     res.status(200).json({
//       message: "Letter rejected successfully",
//       letter,
//       notification: "Rejection notification sent to sender",
//     });
//   } catch (error) {
//     console.error("Error in rejectLetter:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// Check for new letters
export const checkNewLetters = async (req, res) => {
  try {
    const { lastChecked, userEmail } = req.query;
    if (!lastChecked || !userEmail) {
      return res
        .status(400)
        .json({ error: "Missing lastChecked or userEmail" });
    }
    const since = new Date(lastChecked);
    // Find letters where user is recipient or CC, created after lastChecked
    // EXCLUDE pending letters - they should not trigger notifications until approved
    const newLetters = await Letter.find({
      $and: [
        { createdAt: { $gt: since } },
        { status: { $ne: "pending" } }, // Exclude pending letters
        {
          $or: [
            { toEmail: userEmail },
            { cc: { $elemMatch: { $eq: userEmail } } },
          ],
        },
      ],
    });
    res.json({ hasNewLetters: newLetters.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// If you have a forwardLetter controller, update it to accept an array of recipients and create a letter for each. If not, add a new function:
export const forwardLetter = async (req, res) => {
  try {
    const { subject, from, recipients, priority, content, department } =
      req.body;
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "No recipients provided" });
    }
    // Look up sender by email
    const sender = await User.findOne({ email: from });
    if (!sender) {
      return res.status(404).json({ error: "Sender user not found" });
    }
    const letters = await Promise.all(
      recipients.map(async (recipient) => {
        const letter = new Letter({
          subject,
          from: sender._id,
          fromName: sender.name,
          fromEmail: sender.email,
          to: recipient.name,
          toEmail: recipient.email,
          department: recipient.department || department,
          priority,
          content,
          status: "sent",
        });
        return letter.save();
      })
    );
    res.status(201).json({ message: "Letters forwarded", letters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// REJECT LETTER (admin)
export const rejectLetter = async (req, res) => {
  try {
    const { letterId, rejectionReason } = req.body;

    if (!letterId) {
      return res.status(400).json({ error: "Letter ID is required" });
    }

    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    // Update letter status to rejected
    letter.status = "rejected";
    letter.rejectionReason = rejectionReason || "No reason provided";
    letter.rejectedAt = new Date();
    await letter.save();

    // Create notification for the original sender
    const notification = new Notification({
      recipient: letter.from,
      type: "new_letter",
      title: "Letter Rejected",
      message: `Your letter "${letter.subject}" has been rejected. Reason: ${letter.rejectionReason}`,
      relatedLetter: letter._id,
      priority: "high",
    });
    await notification.save();

    res.status(200).json({
      message: "Letter rejected successfully",
      letter,
    });
  } catch (error) {
    console.error("Error in rejectLetter:", error);
    res.status(500).json({ error: error.message });
  }
};

export const assignTask = async (req, res) => {
  try {
    const { letterId, recipientId, comment, assignerId } = req.body;
    if (!letterId || !recipientId || !assignerId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Find the recipient user
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found." });
    }

    // Find the assigner user
    const assigner = await User.findById(assignerId);
    if (!assigner) {
      return res.status(404).json({ error: "Assigner not found." });
    }

    // Find and update the letter
    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found." });
    }

    // Set originalLetter if not already set
    if (!letter.originalLetter) {
      letter.originalLetter = letter._id;
    }

    // Update letter with assignment details
    letter.to = recipient.name;
    letter.toEmail = recipient.email;
    letter.status = "assigned";
    letter.assignerId = assignerId;
    letter.assignerName = assigner.name;
    letter.assignerDepartment =
      assigner.departmentOrSector ||
      assigner.department ||
      "Unknown Department";
    letter.assignComment = comment;
    letter.unread = true;
    await letter.save();

    // Create notification for the new recipient
    const notification = new Notification({
      recipient: recipient._id,
      type: "assigned_task",
      title: "New Task Assigned",
      message: `You have been assigned a new letter/task: "${letter.subject}" by ${assigner.name}`,
      relatedLetter: letter._id,
      priority: "medium",
    });
    await notification.save();

    // Send email to the recipient
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `New Task Assigned: ${letter.subject}`,
        text: `You have been assigned a new letter/task: "${
          letter.subject
        }".\n\nAssigned by: ${assigner.name} (${
          assigner.departmentOrSector ||
          assigner.department ||
          "Unknown Department"
        })\nComment: ${comment}\n\nPlease log in to the system to view and take action.`,
      });
    } catch (emailError) {
      console.error("Failed to send assignment email:", emailError);
    }

    res.json({ message: "Task assigned successfully.", letter });
  } catch (error) {
    console.error("Error in assignTask:", error);
    res.status(500).json({ error: "Failed to assign task." });
  }
};

export const getAssignedTasks = async (req, res) => {
  try {
    const { assignerId, assignedToId } = req.query;

    // If assignedToId is provided, get tasks assigned TO this user
    if (assignedToId) {
      const tasks = await Letter.find({
        toEmail: { $exists: true },
        status: "assigned",
        $or: [
          { toEmail: assignedToId },
          { toEmail: { $regex: assignedToId, $options: "i" } },
        ],
      }).sort({ createdAt: -1 });
      return res.json(tasks);
    }

    // If assignerId is provided, get tasks assigned BY this user (for admin view)
    if (assignerId) {
      const tasks = await Letter.find({ assignerId }).sort({ createdAt: -1 });
      return res.json(tasks);
    }

    return res
      .status(400)
      .json({ error: "Either assignerId or assignedToId is required" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assigned tasks" });
  }
};

// Get tasks assigned BY the current user (for admin view)
export const getTasksAssignedByUser = async (req, res) => {
  try {
    const { assignerId } = req.query;
    if (!assignerId) {
      return res.status(400).json({ error: "assignerId is required" });
    }
    const tasks = await Letter.find({ assignerId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assigned tasks" });
  }
};

// Add progress update to a letter
export const addLetterProgress = async (req, res) => {
  try {
    const { letterId, userId, comment, status } = req.body;
    if (!letterId || !userId || !comment || !status) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found." });
    }
    letter.progress.push({ user: userId, comment, status, date: new Date() });
    letter.status = status; // Optionally update main status
    await letter.save();
    res.json({
      message: "Progress added successfully.",
      progress: letter.progress,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to add progress." });
  }
};

// Get progress history for a letter
export const getLetterProgress = async (req, res) => {
  try {
    const { letterId } = req.params;
    const letter = await Letter.findById(letterId).populate(
      "progress.user",
      "name email role"
    );
    if (!letter) {
      return res.status(404).json({ error: "Letter not found." });
    }
    res.json({ progress: letter.progress });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress." });
  }
};

// Get a letter by ID
export const getLetterById = async (req, res) => {
  try {
    const { letterId } = req.params;
    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({ error: "Letter not found." });
    }
    res.json(letter);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch letter." });
  }
};
