import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Gestion des en-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-pin'
  );

  // 2. Répondre immédiatement aux requêtes OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Sécurité : Vérification du code PIN administrateur
  const adminPin = req.headers['x-admin-pin'];
  const expectedPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN;

  if (!adminPin || adminPin !== expectedPin) {
    return res.status(401).json({ error: 'Code PIN administrateur incorrect' });
  }

  // 4. Enregistrement des photos (POST)
  if (req.method === 'POST') {
    try {
      const { title, category, location, description, photos } = req.body;

      if (!title || !category || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ error: 'Données manquantes ou incomplètes' });
      }

      // Enregistrement dans Neon via Prisma avec correction du type string pour imageUrl
      await prisma.photo.createMany({
        data: photos.map((img: { url?: string; imageUrl?: string; publicId: string }) => ({
          title,
          category,
          location: location || null,
          description: description || null,
          imageUrl: img.url || img.imageUrl || '',
          publicId: img.publicId,
        })),
      });

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('Erreur Prisma:', error);
      return res.status(500).json({ error: 'Erreur lors de l’enregistrement en base de données' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}