import mongoose from "mongoose";
import { Buffer } from "buffer";

const letterSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    // reference: { type: String, required: true }, // REMOVE this line
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromName: { type: String, required: true },
    fromEmail: {
      type: String,
      required: true,
      index: true, // Add index for better query performance
    },
    to: { type: String, required: true },
    department: { type: String, required: true },
    priority: { type: String, default: "normal" },
    content: { type: String, required: true },
    unread: { type: Boolean, default: true },
    starred: { type: Boolean, default: false },
    attachments: [
      {
        filename: String,
        contentType: String,
        data: Buffer,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    cc: [String],
    ccEmployees: { type: Map, of: [String] },
    toEmail: { type: String, required: true },
    // New fields for CC letters
    isCC: { type: Boolean, default: false }, // Indicates if this is a CC copy
    originalLetter: { type: mongoose.Schema.Types.ObjectId, ref: "Letter" }, // Reference to original letter
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "sent",
        "delivered",
        "read",
        "rejected",
        "assigned", // <-- added
      ],
      default: "draft",
    },
    rejectionReason: { type: String },
    rejectedAt: { type: Date },
    rejectorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalComment: { type: String }, // Optional comment for approval
    approvedAt: { type: Date },
    // Assignment fields
    assignerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignerName: { type: String }, // Name of the person who assigned the letter
    assignerDepartment: { type: String }, // Department of the person who assigned the letter
    assignComment: { type: String },
    // Progress tracking for assigned letters
    progress: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: { type: String },
        status: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    archived: { type: Boolean, default: false }, // Add archived property
  },
  { timestamps: true }
);

// Add a compound index for status and fromEmail
letterSchema.index({ status: 1, fromEmail: 1 });

const Letter = mongoose.model("Letter", letterSchema);
export default Letter;
