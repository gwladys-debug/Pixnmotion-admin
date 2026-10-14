import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default async function handler(req, res) {
  // Gérer la requête GET (pour récupérer les photos)
  if (req.method === 'GET') {
    try {
      const photos = await prisma.photo.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(photos);
    } catch (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }
  }

  // Gérer la requête POST (pour ajouter des photos)
  if (req.method === 'POST') {
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
      return res.status(201).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}