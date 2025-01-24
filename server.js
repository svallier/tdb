import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3000;

const corsOptions = {
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

const API_KEY = '1681e87844b818a6f178d668fed57fb46477bc1133d4e8dc006939c142f20af2';
const BASE_URL = 'https://moteurimmo.fr/api/ads';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    // Construction de l'URL avec les paramètres
    const params = new URLSearchParams();
    params.append('apiKey', API_KEY);
    
    // Add query parameters
    if (req.query.city) params.append('ville', req.query.city);
    if (req.query.minPrice) params.append('prix_min', req.query.minPrice);
    if (req.query.maxPrice) params.append('prix_max', req.query.maxPrice);
    if (req.query.minArea) params.append('surface_min', req.query.minArea);
    if (req.query.maxArea) params.append('surface_max', req.query.maxArea);
    if (req.query.minRooms) params.append('pieces_min', req.query.minRooms);
    if (req.query.propertyType) {
      const types = req.query.propertyType.split(',').map(type => {
        switch (type) {
          case 'house': return 'maison';
          case 'apartment': return 'appartement';
          case 'building': return 'immeuble';
          case 'land': return 'terrain';
          default: return type;
        }
      });
      params.append('type', types.join(','));
    }

    try {
      // Try to get data from the real API first
      const response = await api.get(`?${params.toString()}`);
      if (response.data && Array.isArray(response.data.properties)) {
        return res.json(response.data);
      }
    } catch (apiError) {
      console.log('API request failed, falling back to mock data');
    }

    // Fall back to mock data if API fails or returns invalid data
    const { mockProperties } = await import('./src/data/mockProperties.js');
    
    // Filter mock data based on search parameters
    let filteredProperties = mockProperties;
    
    if (req.query.city) {
      filteredProperties = filteredProperties.filter(p => 
        p.location.city.toLowerCase().includes(req.query.city.toLowerCase())
      );
    }
    
    if (req.query.minPrice) {
      filteredProperties = filteredProperties.filter(p => 
        p.price >= Number(req.query.minPrice)
      );
    }
    
    if (req.query.maxPrice) {
      filteredProperties = filteredProperties.filter(p => 
        p.price <= Number(req.query.maxPrice)
      );
    }
    
    if (req.query.minArea) {
      filteredProperties = filteredProperties.filter(p => 
        p.area >= Number(req.query.minArea)
      );
    }
    
    if (req.query.maxArea) {
      filteredProperties = filteredProperties.filter(p => 
        p.area <= Number(req.query.maxArea)
      );
    }
    
    if (req.query.minRooms) {
      filteredProperties = filteredProperties.filter(p => 
        p.rooms >= Number(req.query.minRooms)
      );
    }
    
    if (req.query.propertyType) {
      const types = req.query.propertyType.split(',');
      filteredProperties = filteredProperties.filter(p => 
        types.includes(p.type)
      );
    }

    res.json({ properties: filteredProperties });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});