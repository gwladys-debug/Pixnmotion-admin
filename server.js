import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Charge les variables d'environnement (pour récupérer DATABASE_URL)
dotenv.config();

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Autoriser CORS pour Vite (dev server sur 5173)
app.use(cors({ 
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 1. Route racine pour tester le serveur
app.get('/', (req, res) => {
  res.send('API Pix\'n Motion fonctionnelle !');
});

// 2. Route GET pour récupérer les photos depuis Neon via Prisma
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(photos);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

// 3. Route POST pour enregistrer un événement avec ses photos
app.post('/api/photos', async (req, res) => {
  const { title, category, location, description, images } = req.body;

  if (!title || !category || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  try {
    await prisma.photo.createMany({
      data: images.map((img) => ({
        title,
        category,
        location,
        description,
        imageUrl: img.url,
        publicId: img.publicId,
      })),
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

app.listen(3001, () => {
  // eslint-disable-next-line no-console
  console.log('API sur http://localhost:3001');
});