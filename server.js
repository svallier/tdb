import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const API_KEY = '1681e87844b818a6f178d668fed57fb46477bc1133d4e8dc006939c142f20af2';
const BASE_URL = 'https://moteurimmo.fr/api/ads';

app.get('/api/properties', async (req, res) => {
  try {
    // Construction de l'URL avec les paramètres
    const params = new URLSearchParams(req.query);
    params.append('apiKey', API_KEY);
    
    const response = await axios.get(`${BASE_URL}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});