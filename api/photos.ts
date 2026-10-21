import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuration des en-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-pin'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // 1. Vérification du code PIN administrateur
  const adminPin = req.headers['x-admin-pin'];
  const expectedPin = process.env.ADMIN_SECRET_PASSWORD || process.env.ADMIN_PIN;

  if (!adminPin || adminPin !== expectedPin) {
    return res.status(401).json({ error: 'Code PIN administrateur incorrect' });
  }

  const { title, category, location, description, photos } = req.body;

  if (!title || !category || !photos || !Array.isArray(photos) || photos.length === 0) {
    return res.status(400).json({ error: 'Données manquantes (titre, catégorie ou photos)' });
  }

  try {
    // 2. Connexion directe à Neon via le client serverless
    const sql = neon(process.env.DATABASE_URL!);

    // 3. Insertion de l'événement et de ses photos dans la base de données
    for (const img of photos) {
      await sql`
        INSERT INTO "Photo" (id, title, description, "imageUrl", "publicId", category, location)
        VALUES (
          gen_random_uuid()::text, 
          ${title}, 
          ${description || null}, 
          ${img.url || img.imageUrl || ''}, 
          ${img.publicId}, 
          ${category}, 
          ${location || null}
        )
      `;
    }

    return res.status(200).json({ success: true, message: 'Photos enregistrées avec succès !' });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Erreur lors de l’enregistrement dans Neon :', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur interne du serveur',
    });
  }
}