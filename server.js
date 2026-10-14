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

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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