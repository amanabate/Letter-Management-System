import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  departmentOrSector: { type: String },
  profileImage: { type: String },
  signatureImage: { type: String },
  role: { type: String, enum: [
    "user",
    "executive_head",
    "director_general",
    "deputy_director_general",
    "executive_advisor",
    "director_office"
  ], default: "user" },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  active: { type: Boolean, default: true },
});

const User = mongoose.model("User", userSchema);
export default User;
