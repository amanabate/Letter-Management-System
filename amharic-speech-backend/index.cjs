require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());

const PORT = process.env.PORT || 5005;
const client = new SpeechClient();

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }
  try {
    // Detect file type by extension
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let encoding = 'WEBM_OPUS';
    let sampleRateHertz = 48000;
    if (ext === 'wav') {
      encoding = 'LINEAR16';
      sampleRateHertz = 16000;
    } else if (ext === 'flac') {
      encoding = 'FLAC';
      sampleRateHertz = 16000;
    }
    console.log(`Received file: ${req.file.originalname}, using encoding: ${encoding}, sampleRateHertz: ${sampleRateHertz}`);

    const audioBytes = fs.readFileSync(req.file.path).toString('base64');
    const request = {
      audio: { content: audioBytes },
      config: {
        encoding,
        sampleRateHertz,
        languageCode: 'am-ET',
        enableAutomaticPunctuation: true,
      },
    };
    const [response] = await client.recognize(request);
    const transcription = response.results.map(r => r.alternatives[0].transcript).join(' ');
    res.json({ transcription });
  } catch (err) {
    console.error('Google API error:', err);
    res.status(500).json({ error: 'Transcription failed.' });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.get('/', (req, res) => {
  res.send('Amharic Speech-to-Text API is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 