import mongoose from "mongoose";
import Letter from "../models/Letter.js"; // Adjust the path as necessary
import dotenv from "dotenv";

dotenv.config();

const deleteAllLetters = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Team:Team%40123@cluster0.odofrik.mongodb.net/letterManagementSystem?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await Letter.deleteMany({});
    console.log(`Deleted ${result.deletedCount} letters`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error deleting letters:", error);
  }
};

deleteAllLetters();