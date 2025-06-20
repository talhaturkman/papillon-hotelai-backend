import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Sadece izinli domainlere izin ver (Netlify, kendi domainin ve local)
const allowedOrigins = [
  'https://papillonai-frontend.netlify.app',
  'https://talhaturkman.com', // kullanıcının kendi domaini
  'https://papillon-hotelai-backend.onrender.com',
  'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Bu origin izinli değil: ' + origin));
    }
  }
}));
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const { prompt, outputFormat = 'text' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini API key missing.' });

  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  if (outputFormat === 'json') {
    payload.generationConfig = { responseMimeType: 'application/json' };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error?.message || 'Gemini API error.' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Maps Places API endpointi
app.post('/api/maps', async (req, res) => {
  const { query, type } = req.body;
  const hotelLat = 36.8556, hotelLng = 31.0931; // Otel konumu
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${hotelLat},${hotelLng}&radius=3000&type=${encodeURIComponent(type || query)}&keyword=${encodeURIComponent(query)}&key=AIzaSyBiqxFAooCoJX1y-_IgDbVAtoaZ2SVKmxk`;
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`PapillonAI backend running on port ${PORT}`);
}); 