import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sécurité : Vérification du code PIN administrateur
  const adminPin = req.headers['x-admin-pin'];
  if (adminPin !== process.env.ADMIN_PIN && adminPin !== process.env.VITE_ADMIN_PIN) {
    return res.status(401).json({ error: 'Code PIN administrateur incorrect' });
  }

  // Si on envoie des photos (POST)
  if (req.method === 'POST') {
    try {
      const { title, category, location, description, photos } = req.body;

      if (!title || !category || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ error: 'Données manquantes ou incomplètes' });
      }

      // Enregistrement dans la base de données Neon via Prisma
      await prisma.photo.createMany({
        data: photos.map((img: { imageUrl: string; publicId: string }) => ({
          title,
          category,
          location,
          description,
          imageUrl: img.imageUrl,
          publicId: img.publicId,
        })),
      });

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erreur lors de l’enregistrement en base de données' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}