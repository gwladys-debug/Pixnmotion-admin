import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const header = req.headers['x-admin-pin'];
  const adminPin = (Array.isArray(header) ? header[0] : header)?.trim();
  const expectedPin = process.env.ADMIN_SECRET_PASSWORD?.trim();

  if (!expectedPin || !adminPin || adminPin !== expectedPin) {
    return res.status(401).json({ error: 'Code PIN administrateur incorrect' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL manquante' });
  }

  try {
    const { title, category, location, description, photos } = req.body;

    if (!title || !category || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Données manquantes (titre, catégorie ou photos)' });
    }

    const sql = neon(process.env.DATABASE_URL);

    await sql.transaction(
      photos.map(
        (img: { url?: string; imageUrl?: string; publicId: string }) => sql`
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
        `
      )
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur Neon:', error);
    return res.status(500).json({
      error: 'Erreur lors de l’enregistrement en base de données',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}