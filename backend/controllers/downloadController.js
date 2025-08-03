import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(404).json({ error: "File not found" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
